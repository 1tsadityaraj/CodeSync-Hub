import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_ICE_SERVERS = [
  { urls: import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

if (import.meta.env.VITE_TURN_SERVER) {
  DEFAULT_ICE_SERVERS.push({
    urls: import.meta.env.VITE_TURN_SERVER,
    username: import.meta.env.VITE_TURN_USERNAME || '',
    credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
  });
}

/**
 * Custom hook managing WebRTC audio & video calling using browser-native APIs
 * and Socket.IO for authenticated peer-to-peer mesh signaling.
 */
export function useWebRTC({ socket, roomId, user: _user, isRoomActive = true }) {
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'requesting-permission' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState(new Map()); // socketId -> { peerId, user, stream, audio, video, connectionState }
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState(null); // { type, message }

  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const candidateQueuesRef = useRef(new Map()); // socketId -> RTCIceCandidate[]
  const localStreamRef = useRef(null);

  /**
   * Helper: create a new RTCPeerConnection for a remote peer
   */
  const createPeerConnection = useCallback(
    (peerId, peerUser) => {
      // If connection already exists, return it
      if (peerConnectionsRef.current.has(peerId)) {
        return peerConnectionsRef.current.get(peerId);
      }

      const pc = new RTCPeerConnection({
        iceServers: DEFAULT_ICE_SERVERS,
      });

      peerConnectionsRef.current.set(peerId, pc);
      candidateQueuesRef.current.set(peerId, []);

      // Add local stream tracks to this peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && socket.connected) {
          socket.emit('call:signal', {
            roomId,
            targetSocketId: peerId,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate,
            },
          });
        }
      };

      // Handle remote incoming audio/video tracks
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(peerId) || {
            peerId,
            user: peerUser || { id: 'peer', name: 'Participant' },
            audio: true,
            video: true,
          };
          next.set(peerId, {
            ...existing,
            stream,
            connectionState: pc.connectionState || 'connected',
          });
          return next;
        });
      };

      // Track connection state
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'failed') {
          // If direct connection failed without TURN
          if (!import.meta.env.VITE_TURN_SERVER) {
            setError({
              type: 'connection-failed',
              message:
                'Direct peer-to-peer connection failed. A TURN relay server may be required on restrictive networks.',
            });
          }
        }

        setRemotePeers((prev) => {
          if (!prev.has(peerId)) return prev;
          const next = new Map(prev);
          const existing = next.get(peerId);
          next.set(peerId, {
            ...existing,
            connectionState: state,
          });
          return next;
        });
      };

      return pc;
    },
    [socket, roomId]
  );

  /**
   * Helper: flush buffered ICE candidates once remoteDescription is set
   */
  const flushCandidateQueue = async (peerId, pc) => {
    const queue = candidateQueuesRef.current.get(peerId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`[WebRTC] Failed to add queued ICE candidate for ${peerId}:`, err);
      }
    }
  };

  /**
   * Close a specific peer connection cleanly
   */
  const closePeerConnection = useCallback((peerId) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      try {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
      } catch (err) {
        console.warn(`[WebRTC] Error closing peer connection ${peerId}:`, err);
      }
      peerConnectionsRef.current.delete(peerId);
    }
    candidateQueuesRef.current.delete(peerId);

    setRemotePeers((prev) => {
      if (!prev.has(peerId)) return prev;
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  /**
   * Clean up all active peer connections and local media tracks
   */
  const cleanupAll = useCallback(() => {
    // 1. Close all peer connections
    for (const peerId of peerConnectionsRef.current.keys()) {
      closePeerConnection(peerId);
    }
    peerConnectionsRef.current.clear();
    candidateQueuesRef.current.clear();
    setRemotePeers(new Map());

    // 2. Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setIsInCall(false);
    setCallStatus('idle');
  }, [closePeerConnection]);

  /**
   * Explicitly Join Call (requests mic/camera and signals room)
   */
  const joinCall = useCallback(async () => {
    if (!socket || !roomId || !isRoomActive) {
      setError({
        type: 'room-inaccessible',
        message: 'Cannot join call: room is not accessible or has ended.',
      });
      return;
    }

    setError(null);
    setCallStatus('requesting-permission');

    let stream = null;
    try {
      // Request camera and microphone
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
    } catch (mediaErr) {
      // Fallback: try audio-only if camera is unavailable or denied
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setIsVideoOff(true);
      } catch (audioErr) {
        // Both failed: report friendly permission/device error
        const isDenied =
          mediaErr.name === 'NotAllowedError' ||
          mediaErr.name === 'PermissionDeniedError' ||
          audioErr.name === 'NotAllowedError';

        setError({
          type: isDenied ? 'permission-denied' : 'no-device',
          message: isDenied
            ? 'Microphone/camera access was denied. Please allow permissions in your browser address bar to participate in the call.'
            : 'No working microphone or camera found on your device.',
        });
        setCallStatus('idle');
        return;
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsInCall(true);
    setCallStatus('connecting');

    // Notify room server of call participation
    socket.emit('call:join', {
      roomId,
      mediaState: {
        audio: !isAudioMuted,
        video: !isVideoOff && stream.getVideoTracks().length > 0,
      },
    });
  }, [socket, roomId, isRoomActive, isAudioMuted, isVideoOff]);

  /**
   * Leave Call (preserves Monaco editor and whiteboard sessions)
   */
  const leaveCall = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('call:leave', { roomId });
    }
    cleanupAll();
  }, [socket, roomId, cleanupAll]);

  /**
   * Toggle local microphone mute
   */
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      const muted = !nextState;
      setIsAudioMuted(muted);

      if (socket && socket.connected) {
        socket.emit('call:media-toggle', {
          roomId,
          audio: !muted,
          video: !isVideoOff,
        });
      }
    }
  }, [socket, roomId, isVideoOff]);

  /**
   * Toggle local camera video on/off
   */
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      const off = !nextState;
      setIsVideoOff(off);

      if (socket && socket.connected) {
        socket.emit('call:media-toggle', {
          roomId,
          audio: !isAudioMuted,
          video: !off,
        });
      }
    }
  }, [socket, roomId, isAudioMuted]);

  // Socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket || !isInCall) return;

    // 1. Existing peers list received by newly joined client -> initiate offers
    const handleActivePeers = async ({ peers }) => {
      if (!Array.isArray(peers)) return;

      for (const peer of peers) {
        try {
          const pc = createPeerConnection(peer.socketId, {
            id: peer.userId,
            name: peer.userName,
          });

          // Register initial peer media state
          setRemotePeers((prev) => {
            const next = new Map(prev);
            next.set(peer.socketId, {
              peerId: peer.socketId,
              user: { id: peer.userId, name: peer.userName },
              audio: peer.audio !== false,
              video: peer.video !== false,
              stream: null,
              connectionState: 'connecting',
            });
            return next;
          });

          // Designated initiator: Newcomer creates and sends Offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('call:signal', {
            roomId,
            targetSocketId: peer.socketId,
            signal: {
              type: 'offer',
              sdp: offer.sdp,
            },
          });
        } catch (err) {
          console.error(`[WebRTC] Failed to initiate call to peer ${peer.socketId}:`, err);
        }
      }
    };

    // 2. Another peer joined the call -> prepare receiver connection
    const handlePeerJoined = ({ peer }) => {
      if (!peer || !peer.socketId) return;
      createPeerConnection(peer.socketId, {
        id: peer.userId,
        name: peer.userName,
      });

      setRemotePeers((prev) => {
        const next = new Map(prev);
        next.set(peer.socketId, {
          peerId: peer.socketId,
          user: { id: peer.userId, name: peer.userName },
          audio: peer.audio !== false,
          video: peer.video !== false,
          stream: null,
          connectionState: 'connecting',
        });
        return next;
      });
    };

    // 3. Signaling message received: Offer, Answer, or ICE Candidate
    const handleSignal = async ({ fromSocketId, fromUser, signal }) => {
      if (!fromSocketId || !signal) return;
      const pc = createPeerConnection(fromSocketId, fromUser);

      try {
        if (signal.type === 'offer') {
          // Received Offer -> setRemoteDescription, flush ICE candidates, create Answer
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          await flushCandidateQueue(fromSocketId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('call:signal', {
            roomId,
            targetSocketId: fromSocketId,
            signal: {
              type: 'answer',
              sdp: answer.sdp,
            },
          });
        } else if (signal.type === 'answer') {
          // Received Answer -> setRemoteDescription, flush ICE candidates
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
          await flushCandidateQueue(fromSocketId, pc);
        } else if (signal.type === 'ice-candidate') {
          // Received ICE candidate
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            // Buffer candidate until remote description is set
            const queue = candidateQueuesRef.current.get(fromSocketId) || [];
            queue.push(signal.candidate);
            candidateQueuesRef.current.set(fromSocketId, queue);
          }
        }
      } catch (err) {
        console.warn(`[WebRTC] Error handling signal '${signal.type}' from ${fromSocketId}:`, err);
      }
    };

    // 4. Remote peer media toggle (mute/camera)
    const handlePeerMediaToggle = ({ peerId, audio, video }) => {
      setRemotePeers((prev) => {
        if (!prev.has(peerId)) return prev;
        const next = new Map(prev);
        const existing = next.get(peerId);
        next.set(peerId, {
          ...existing,
          audio: typeof audio === 'boolean' ? audio : existing.audio,
          video: typeof video === 'boolean' ? video : existing.video,
        });
        return next;
      });
    };

    // 5. Remote peer left the call
    const handlePeerLeft = ({ peerId }) => {
      closePeerConnection(peerId);
    };

    // 6. Call error (e.g. ended room)
    const handleCallError = ({ message }) => {
      setError({
        type: 'call-error',
        message: message || 'Failed to connect to video call',
      });
      cleanupAll();
    };

    socket.on('call:active-peers', handleActivePeers);
    socket.on('call:peer-joined', handlePeerJoined);
    socket.on('call:signal', handleSignal);
    socket.on('call:peer-media-toggle', handlePeerMediaToggle);
    socket.on('call:peer-left', handlePeerLeft);
    socket.on('call:error', handleCallError);

    return () => {
      socket.off('call:active-peers', handleActivePeers);
      socket.off('call:peer-joined', handlePeerJoined);
      socket.off('call:signal', handleSignal);
      socket.off('call:peer-media-toggle', handlePeerMediaToggle);
      socket.off('call:peer-left', handlePeerLeft);
      socket.off('call:error', handleCallError);
    };
  }, [socket, isInCall, roomId, createPeerConnection, closePeerConnection, cleanupAll]);

  // Clean up when room becomes inactive or component unmounts
  useEffect(() => {
    if (!isRoomActive && isInCall) {
      cleanupAll();
    }
  }, [isRoomActive, isInCall, cleanupAll]);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return {
    isInCall,
    callStatus,
    localStream,
    remotePeers: Array.from(remotePeers.values()),
    isAudioMuted,
    isVideoOff,
    error,
    clearError: () => setError(null),
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
  };
}

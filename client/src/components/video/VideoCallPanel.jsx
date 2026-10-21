import { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

/**
 * Individual Video Card for either Local or Remote participant stream
 */
function VideoTile({
  name,
  isLocal = false,
  stream,
  isAudioMuted,
  isVideoOff,
  connectionState,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = (name || 'User')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-dark border border-white/[0.08] flex items-center justify-center group shadow-lg">
      {/* Video Element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video playback to prevent audio feedback
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Camera Off Avatar Placeholder */
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-light font-bold text-base shadow-inner">
            {initials}
          </div>
          <span className="text-xs text-text-muted font-medium">
            Camera Disabled
          </span>
        </div>
      )}

      {/* Top Left Badge: Name & You indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/[0.08] text-[11px] text-white font-medium">
        <span>{name}</span>
        {isLocal && (
          <span className="text-[10px] text-primary-light font-semibold">(You)</span>
        )}
      </div>

      {/* Top Right: Connection State for remote peers */}
      {!isLocal && connectionState && (
        <div className="absolute top-2 right-2 z-10">
          {connectionState === 'connected' ? (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" title="Connected" />
          ) : connectionState === 'connecting' ? (
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" title="Connecting" />
          ) : (
            <span className="flex h-2 w-2 rounded-full bg-rose-400" title={connectionState} />
          )}
        </div>
      )}

      {/* Bottom Right: Microphone & Video Status Icons */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
        <div
          className={`h-6 w-6 rounded-md flex items-center justify-center backdrop-blur-md border ${
            isAudioMuted
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-black/60 border-white/[0.08] text-emerald-400'
          }`}
          title={isAudioMuted ? 'Muted' : 'Microphone Active'}
        >
          {isAudioMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
        </div>
        {isVideoOff && (
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center backdrop-blur-md border bg-rose-500/20 border-rose-500/40 text-rose-400"
            title="Camera Off"
          >
            <VideoOff className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Video Call Panel: Can be docked alongside editor/whiteboard or minimized
 */
export default function VideoCallPanel({
  webrtc,
  user,
  roomId: _roomId,
  isCollapsed = false,
  onToggleCollapse,
  copiedLink,
  onCopyLink,
}) {
  const {
    isInCall,
    callStatus,
    localStream,
    remotePeers,
    isAudioMuted,
    isVideoOff,
    error,
    clearError,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
  } = webrtc;

  const totalCallCount = isInCall ? 1 + remotePeers.length : 0;

  // ── Minimized Floating Pill ──────────────────────────────────────────────
  if (isCollapsed) {
    if (!isInCall) return null;
    return (
      <aside
        aria-label="Active Call Controls"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 p-2 rounded-2xl bg-[#0e131f]/95 border border-white/[0.12] backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="flex items-center gap-2 px-2 text-xs font-medium text-text">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Call ({totalCallCount})</span>
        </div>

        <button
          type="button"
          onClick={toggleAudio}
          className={`h-8 w-8 rounded-xl flex items-center justify-center transition border ${
            isAudioMuted
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
              : 'bg-white/[0.06] border-white/[0.08] text-text hover:bg-white/[0.1]'
          }`}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          className={`h-8 w-8 rounded-xl flex items-center justify-center transition border ${
            isVideoOff
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
              : 'bg-white/[0.06] border-white/[0.08] text-text hover:bg-white/[0.1]'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 text-primary-light hover:bg-primary/30 flex items-center justify-center transition"
          title="Expand Video Call Panel"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={leaveCall}
          className="h-8 w-8 rounded-xl bg-rose-500 text-white hover:bg-rose-600 flex items-center justify-center shadow-md transition"
          title="Leave Call (does not affect code editor)"
        >
          <PhoneOff className="h-3.5 w-3.5" />
        </button>
      </aside>
    );
  }

  // ── Full Video Panel (Docked or Floating) ─────────────────────────────────
  return (
    <aside
      aria-label="Video Call Panel"
      className="w-80 xl:w-96 shrink-0 h-full bg-[#0b0e17] border-l border-white/[0.08] flex flex-col justify-between overflow-hidden relative select-none shadow-2xl"
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="h-12 shrink-0 border-b border-white/[0.08] bg-[#0e131f]/90 backdrop-blur-xl px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary-light">
            <Video className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text">Interview Call</span>
              {isInCall && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded-full border border-emerald-400/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live ({totalCallCount})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isInCall && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="h-7 w-7 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] flex items-center justify-center transition"
              title="Minimize Call to Bottom Bar"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Body Content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Permission Denied or Device Error Alert */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-rose-400 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {error.type === 'permission-denied'
                  ? 'Camera & Microphone Blocked'
                  : error.type === 'no-device'
                  ? 'No Media Device Detected'
                  : 'Connection Alert'}
              </span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed pl-6">
              {error.message}
            </p>
            <div className="pl-6 pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={joinCall}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-semibold text-[11px] transition"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={clearError}
                className="text-text-muted hover:text-text text-[11px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Not in call: Join Call Prompt */}
        {!isInCall && (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-lg">
              <Sparkles className="h-7 w-7 text-primary-light animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-text">Face-to-Face Calling</h4>
              <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
                Connect audio & video for real-time coding interviews and system design discussions.
              </p>
            </div>
            <button
              type="button"
              onClick={joinCall}
              disabled={callStatus === 'requesting-permission'}
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-primary-dark transition disabled:opacity-50"
            >
              <Video className="h-4 w-4" />
              {callStatus === 'requesting-permission'
                ? 'Requesting Permissions...'
                : 'Join Video & Audio Call'}
            </button>
            <p className="text-[10px] text-text-muted/60">
              Camera access requested only after joining. You can turn video off anytime.
            </p>
          </div>
        )}

        {/* In Call: Video Grid */}
        {isInCall && (
          <div className="space-y-3">
            {/* Local Video Card */}
            <VideoTile
              name={user?.name || 'You'}
              isLocal={true}
              stream={localStream}
              isAudioMuted={isAudioMuted}
              isVideoOff={isVideoOff}
            />

            {/* Remote Peer Video Cards */}
            {remotePeers.map((peer) => (
              <VideoTile
                key={peer.peerId}
                name={peer.user?.name || 'Candidate'}
                isLocal={false}
                stream={peer.stream}
                isAudioMuted={!peer.audio}
                isVideoOff={!peer.video}
                connectionState={peer.connectionState}
              />
            ))}

            {/* Empty State: Only user in call */}
            {remotePeers.length === 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-surface-dark/60 p-4 text-center space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-text-muted mx-auto">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-text">
                    Waiting for others to join...
                  </h5>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Share the interview room link with your peer or interviewer to start talking.
                  </p>
                </div>
                {onCopyLink && (
                  <button
                    type="button"
                    onClick={onCopyLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium text-text hover:bg-white/[0.08] transition w-full"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Room Invite Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Control Bar (when in call) ─────────────────────────── */}
      {isInCall && (
        <div className="h-16 shrink-0 border-t border-white/[0.08] bg-[#0e131f]/95 backdrop-blur-xl px-4 flex items-center justify-around gap-2">
          {/* Mute Microphone Button */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-xl transition border ${
              isAudioMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                : 'bg-white/[0.06] border-white/[0.08] text-text hover:bg-white/[0.1]'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span className="text-[9px] font-medium mt-0.5">
              {isAudioMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Toggle Camera Button */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center h-11 w-11 rounded-xl transition border ${
              isVideoOff
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                : 'bg-white/[0.06] border-white/[0.08] text-text hover:bg-white/[0.1]'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            <span className="text-[9px] font-medium mt-0.5">
              {isVideoOff ? 'Start' : 'Stop'}
            </span>
          </button>

          {/* Leave Call Button */}
          <button
            type="button"
            onClick={leaveCall}
            className="flex flex-col items-center justify-center h-11 w-14 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition"
            title="Leave Call (does not affect code editor or whiteboard)"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="text-[9px] font-semibold mt-0.5">Leave</span>
          </button>
        </div>
      )}
    </aside>
  );
}

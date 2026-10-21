import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileCode,
  Users,
  ArrowUpRight,
  FolderOpen,
  RotateCw,
  AlertCircle,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { roomApi } from '../../lib/api';

const LANGUAGE_BADGES = {
  javascript: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  typescript: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  python: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
  cpp: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  java: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
  go: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20',
  rust: 'bg-red-400/10 text-red-300 border-red-400/20',
};

export default function RecentSessions({ refreshKey = 0, onRoomsLoaded }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await roomApi.getRooms({ limit: 20 });
      const fetchedRooms = data.rooms || [];
      setRooms(fetchedRooms);
      if (onRoomsLoaded) {
        onRoomsLoaded(fetchedRooms);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch interview rooms');
    } finally {
      setLoading(false);
    }
  }, [onRoomsLoaded]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms, refreshKey]);

  const handleCopyLink = async (roomId, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/room/${roomId}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedId(roomId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text">Your Interview Rooms</h3>
            <span className="text-[10px] font-medium text-primary-light bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              Live Database
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Rooms you have created or joined. Access the lobby to invite candidates or continue collaboration.
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchRooms}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text border border-white/[0.08] hover:border-white/[0.16] bg-surface-light/40 hover:bg-surface-light px-3 py-1.5 rounded-lg transition disabled:opacity-60 shadow-sm"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary-light' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-3.5 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {loading && rooms.length === 0 ? (
        /* Loading skeleton */
        <div className="rounded-2xl border border-white/[0.08] bg-surface/75 p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-white/[0.06] rounded w-1/3" />
          <div className="h-14 bg-white/[0.04] rounded-xl" />
          <div className="h-14 bg-white/[0.04] rounded-xl" />
        </div>
      ) : rooms.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface/40 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-text-muted ring-1 ring-white/[0.06]">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-text">No Interview Rooms Yet</h4>
          <p className="text-xs text-text-muted max-w-sm leading-relaxed">
            You have not created or joined any collaborative sessions yet. Use the action card above to spin up a new room in seconds.
          </p>
        </div>
      ) : (
        /* Real Rooms List */
        <div className="rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="divide-y divide-white/[0.06]">
            {rooms.map((room) => {
              const langBadge =
                LANGUAGE_BADGES[room.language?.toLowerCase()] ||
                'bg-white/[0.06] text-text-muted border-white/[0.1]';

              const isActive = room.status === 'active';
              const isCopied = copiedId === room.roomId;

              return (
                <div
                  key={room.id || room.roomId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-white/[0.02]"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-text truncate max-w-md">
                        {room.title}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                            : 'bg-white/[0.04] text-text-muted/80 border-white/[0.08]'
                        }`}
                      >
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        {isActive ? 'Active' : 'Ended'}
                      </span>

                      {/* Language badge */}
                      <span
                        className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border capitalize ${langBadge}`}
                      >
                        {room.language}
                      </span>

                      {/* Owner badge */}
                      {room.isOwner && (
                        <span className="text-[10px] font-medium bg-primary/10 text-primary-light border border-primary/20 px-2 py-0.5 rounded-full">
                          Host
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
                        <FileCode className="h-3.5 w-3.5 text-accent/70" />
                        {room.roomId}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-text-muted/60" />
                        {room.participantCount || 1} participant
                        {(room.participantCount || 1) > 1 ? 's' : ''}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-text-muted/60" />
                        {room.createdAt
                          ? new Date(room.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </span>

                      {room.creator?.name && (
                        <span className="flex items-center gap-1.5 text-text-muted/70">
                          <Tag className="h-3 w-3" />
                          Host: {room.creator.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(room.roomId, e)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text border border-white/[0.08] hover:border-white/[0.16] bg-surface-light/40 hover:bg-surface-light px-2.5 py-1.5 rounded-lg transition"
                      title="Copy Room Invitation Link"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-[11px]">Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/room/${room.roomId}`)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition ${
                        isActive
                          ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/25'
                          : 'bg-white/[0.06] hover:bg-white/[0.1] text-text border border-white/[0.08]'
                      }`}
                    >
                      <span>{isActive ? 'Enter Room' : 'View Session'}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

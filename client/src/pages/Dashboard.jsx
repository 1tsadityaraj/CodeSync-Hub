import { useState } from 'react';
import { Sparkles, Shield, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import StatsCards from '../components/dashboard/StatsCards';
import QuickActionCards from '../components/dashboard/QuickActionCards';
import RecentSessions from '../components/dashboard/RecentSessions';
import GettingStartedGuide from '../components/dashboard/GettingStartedGuide';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [rooms, setRooms] = useState([]);
  const { user } = useAuth();

  const handleRoomCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Welcome Banner */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-surface/75 p-6 sm:p-8 backdrop-blur-xl overflow-hidden shadow-xl">
            {/* Ambient lighting glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.08] blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/[0.04] blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary-light mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                Live Collaborative Platform
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-primary-light via-indigo-300 to-accent bg-clip-text text-transparent">
                  {user?.name ? user.name.split(' ')[0] : 'Developer'}!
                </span>
              </h1>

              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                Create an interview room or join your team to start collaborating in real time with code synchronization, interactive whiteboard, and video calling.
              </p>
            </div>
          </div>

          {/* Quick Action Cards (Create Room & Join Room) */}
          <QuickActionCards onRoomCreated={handleRoomCreated} />

          {/* Real Dynamic Stats Cards */}
          <StatsCards rooms={rooms} />

          {/* Getting Started Guide */}
          <GettingStartedGuide />

          {/* Real Rooms / Recent Sessions */}
          <RecentSessions refreshKey={refreshKey} onRoomsLoaded={setRooms} />
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Interview Rooms</h1>
            <p className="mt-1 text-sm text-text-muted">
              Create and manage private collaborative interview sessions.
            </p>
          </div>
          <QuickActionCards onRoomCreated={handleRoomCreated} />
          <RecentSessions refreshKey={refreshKey} />
          <GettingStartedGuide />
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Session History</h1>
            <p className="mt-1 text-sm text-text-muted">
              Review prior interview notes, shared code transcripts, and duration.
            </p>
          </div>
          <RecentSessions refreshKey={refreshKey} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl animate-fadeIn">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Workspace Settings</h1>
            <p className="mt-1 text-sm text-text-muted">
              Configure your profile display and interview preferences.
            </p>
          </div>

          {/* Profile Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface/75 p-6 space-y-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-light" />
              Account Profile
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="text-text-muted/70 block mb-1">Display Name</label>
                <div className="bg-surface-light px-3.5 py-2.5 rounded-xl border border-white/[0.06] text-text font-medium truncate">
                  {user?.name || 'Developer'}
                </div>
              </div>

              <div>
                <label className="text-text-muted/70 block mb-1">Email Address</label>
                <div className="bg-surface-light px-3.5 py-2.5 rounded-xl border border-white/[0.06] text-text font-medium truncate">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted/70 pt-2 border-t border-white/[0.06]">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recent'}. Account authenticated with JWT.
            </p>
          </div>

          {/* Appearance Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-surface/75 p-6 space-y-3 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Moon className="h-4 w-4 text-accent" />
              Appearance &amp; Theme
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              CodeSync Hub is configured with a high-contrast dark developer theme tailored for long coding sessions and low eye fatigue.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

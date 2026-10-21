import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2,
  LayoutDashboard,
  Video,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  User,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'rooms', label: 'Interview Rooms', icon: Video },
  { id: 'sessions', label: 'Recent Sessions', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children, activeTab = 'overview', onTabChange }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleTabClick = (tabId) => {
    if (onTabChange) onTabChange(tabId);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* ── Mobile Sidebar Overlay ────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop & Mobile Drawer) ────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-white/[0.08] bg-surface/95 backdrop-blur-xl flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="CodeSync Hub home">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 transition group-hover:ring-primary/40">
              <Code2 className="h-4 w-4 text-primary" strokeWidth={2.5} />
              <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </div>
            <span className="text-base font-bold tracking-tight text-text">
              Code<span className="text-primary">Sync</span>{' '}
              <span className="text-text-muted font-medium text-xs">Workspace</span>
            </span>
          </Link>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-white/[0.06]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Demo Mode Badge */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 rounded-xl bg-primary/[0.07] border border-primary/20 px-3 py-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary-light shrink-0" />
            <div className="flex-1 truncate">
              <p className="font-semibold text-primary-light">Demo Workspace</p>
              <p className="text-[11px] text-text-muted truncate">Guest Mode Enabled</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-text-muted hover:text-text hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-text-muted'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Links / Return Home */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-white/[0.04] transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Landing Page
            </span>
            <span className="text-[10px] text-text-muted/60">Public</span>
          </Link>

          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.08] transition text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit Workspace
          </button>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-surface/75 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-text-muted hover:text-text rounded-xl hover:bg-white/[0.06]"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-text capitalize">
                {NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Overview'}
              </h2>
              <p className="text-[11px] text-text-muted/60 hidden sm:block">
                Real-Time Technical Interview Platform
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-white/[0.08] bg-surface-light/50 hover:bg-surface-light hover:border-white/[0.14] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="User profile menu"
              aria-expanded={profileOpen}
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-sm">
                AR
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-text leading-tight">Aditya Raj</p>
                <p className="text-[10px] text-primary-light">demo_user</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-surface/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-semibold text-text">Aditya Raj</p>
                    <p className="text-[11px] text-text-muted truncate">aditya@example.com</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="h-3 w-3" /> Demo Account
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      handleTabClick('settings');
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-text-muted hover:text-text hover:bg-white/[0.04] transition text-left"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Account Settings
                  </button>

                  <Link
                    to="/"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-text-muted hover:text-text hover:bg-white/[0.04] transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Public Homepage
                  </Link>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.08] transition text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out (Demo)
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Code2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
          <Code2 className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
          <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save current location so after login user can be returned here
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

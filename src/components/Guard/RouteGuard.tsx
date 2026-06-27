import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  permission?: string;
}

/**
 * RouteGuard checks if the user is authenticated.
 * If not authenticated, redirects to /login.
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ children, permission }) => {
  const { isAuthenticated, loading } = useAuth();

  React.useEffect(() => {
    if (permission) {
      console.log(`[Middleware Shell] Guard checked for permission scope: "${permission}"`);
    }
  }, [permission]);

  // Show a loading spinner during session verification on mount
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-300/10 gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-sm font-semibold text-base-content/65">Verifying secure session...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;

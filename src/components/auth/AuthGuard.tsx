import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isGuest, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-muted">Checking authentication...</span>
      </div>
    );
  }

  const isAllowed = Boolean(user) || isGuest;

  if (!isAllowed) {
    const returnTo = location.pathname + location.search + location.hash;
    const targetUrl =
      returnTo && returnTo !== '/' && returnTo !== '/auth'
        ? `/auth?returnTo=${encodeURIComponent(returnTo)}`
        : '/auth';
    return <Navigate to={targetUrl} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;

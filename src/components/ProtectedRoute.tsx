import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Require a specific role to access this route */
  requiredRole?: "admin" | "volunteer";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isVolunteer } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) (window as any).__dismissSplash?.();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <p className="text-lg font-semibold text-foreground mb-2">Access Denied</p>
        <p className="text-sm text-muted-foreground">System Admin access required</p>
      </div>
    );
  }

  if (requiredRole === "volunteer" && !isVolunteer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <p className="text-lg font-semibold text-foreground mb-2">Access Denied</p>
        <p className="text-sm text-muted-foreground">Volunteer access required</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { isAdminRole } from "../types/domain";

export default function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: "admin" | "surveyor" | "superadmin";
}) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading…</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profile?.role === "pending") {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Account approval pending</h1>
        <p className="mt-2 text-sm text-slate-600">
          An administrator must approve your account before you can access survey cases.
        </p>
      </div>
    );
  }

  const hasRequiredRole =
    requireRole === "admin"
      ? isAdminRole(profile?.role)
      : requireRole === "superadmin"
        ? profile?.role === "superadmin"
        : requireRole === "surveyor"
          ? profile?.role === "surveyor"
          : true;

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

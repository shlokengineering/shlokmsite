import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import LoginPage from "../features/auth/LoginPage";

export default function Layout() {
  const { session, profile, loading, signOut } = useAuth();
  const accountPending = session && (loading || !profile || profile.role === "pending");

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex w-full max-w-none flex-wrap items-center gap-1 px-[clamp(1.5rem,6vw,6rem)] py-3">
          <NavLink to="/about" className="mr-4 text-base font-semibold text-slate-900 hover:text-slate-700">
            Shlok Engineering Pvt. Ltd.
          </NavLink>
          {session && !accountPending && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {session && !accountPending && (
            <NavLink to="/cases" className={linkClass}>
              Cases
            </NavLink>
          )}
          {profile?.role === "superadmin" && !accountPending && (
            <NavLink to="/admin/surveyors" className={linkClass}>
              Surveyors
            </NavLink>
          )}
          <span className="flex-1" />
          {session ? (
            <>
              {profile && !accountPending && (
                <Link to="/profile" className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                  {profile.fullName || session.user.email || "User"} ·{" "}
                  {profile.role === "superadmin"
                    ? "Super Admin"
                    : profile.role === "admin"
                      ? "Admin"
                      : profile.role === "pending"
                        ? "Awaiting approval"
                        : profile.role}
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-none px-[clamp(1.5rem,6vw,6rem)] py-6">
        {accountPending ? (
          loading ? (
            <div className="p-6 text-center text-slate-500">Loading account…</div>
          ) : (
            <LoginPage />
          )
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { session, profile, loading, signInWithPassword, signOut } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session && loading) {
    return <div className="p-6 text-center text-slate-500">Checking account approval…</div>;
  }

  if (session && profile?.role === "pending") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Permission pending</h1>
          <p className="text-sm text-slate-600">
            Your email is verified. An administrator must approve your account before you can
            access the survey management portal.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (session && profile) {
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  if (session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Unable to verify access</h1>
          <p className="text-sm text-slate-600">
            Your account approval could not be checked. Sign out and try again, or contact an
            administrator.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (error) setError(error);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-slate-500">Survey management portal</p>

        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-base font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-slate-900 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

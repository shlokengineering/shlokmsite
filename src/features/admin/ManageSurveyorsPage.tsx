import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Profile, ProfileRole } from "../../types/domain";
import { listProfiles, updateProfile } from "./api";
import { useAuth } from "../auth/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";

interface ProfileDraft {
  fullName: string;
  phone: string;
  licenseNo: string;
}

export default function ManageSurveyorsPage() {
  const { profile: currentProfile } = useAuth();
  const canManageRoles = currentProfile?.role === "superadmin";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileDrafts, setProfileDrafts] = useState<Record<string, ProfileDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const loadedProfiles = await listProfiles();
      setProfiles(loadedProfiles);
      setProfileDrafts(
        Object.fromEntries(
          loadedProfiles.map((profile) => [
            profile.id,
            {
              fullName: profile.fullName,
              phone: profile.phone ?? "",
              licenseNo: profile.licenseNo ?? "",
            },
          ]),
        ),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load surveyors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRoleChange(id: string, role: ProfileRole) {
    setSavingId(id);
    try {
      await updateProfile(id, { role });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  }

  function updateProfileDraft(id: string, field: keyof ProfileDraft, value: string) {
    setProfileDrafts((drafts) => ({
      ...drafts,
      [id]: {
        ...drafts[id],
        [field]: value,
      },
    }));
  }

  async function handleProfileSave(profile: Profile) {
    const draft = profileDrafts[profile.id];
    const fullName = draft.fullName.trim();
    if (!fullName) {
      setError("A user name is required.");
      return;
    }

    setSavingId(profile.id);
    try {
      await updateProfile(profile.id, {
        fullName,
        phone: draft.phone.trim() || null,
        licenseNo: draft.licenseNo.trim() || null,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <LoadingSpinner label="Loading users…" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Manage users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Only the Super Admin can approve new accounts, promote surveyors, or demote admins.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {profiles.length === 0 ? (
        <EmptyState message="No users yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">License No.</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Profile</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <label className="sr-only" htmlFor={`profile-name-${p.id}`}>
                      Name
                    </label>
                    <input
                      id={`profile-name-${p.id}`}
                      type="text"
                      value={profileDrafts[p.id]?.fullName ?? ""}
                      onChange={(e) => updateProfileDraft(p.id, "fullName", e.target.value)}
                      disabled={savingId === p.id}
                      className="min-w-40 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <label className="sr-only" htmlFor={`profile-phone-${p.id}`}>
                      Phone number
                    </label>
                    <input
                      id={`profile-phone-${p.id}`}
                      type="tel"
                      value={profileDrafts[p.id]?.phone ?? ""}
                      onChange={(e) => updateProfileDraft(p.id, "phone", e.target.value)}
                      disabled={savingId === p.id}
                      className="min-w-32 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <label className="sr-only" htmlFor={`profile-license-${p.id}`}>
                      Surveyor license number
                    </label>
                    <input
                      id={`profile-license-${p.id}`}
                      type="text"
                      value={profileDrafts[p.id]?.licenseNo ?? ""}
                      onChange={(e) => updateProfileDraft(p.id, "licenseNo", e.target.value)}
                      disabled={savingId === p.id}
                      className="min-w-32 rounded-md border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {p.role === "pending" && canManageRoles ? (
                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => handleRoleChange(p.id, "surveyor")}
                        className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {savingId === p.id ? "Approving…" : "Approve as surveyor"}
                      </button>
                    ) : p.role === "surveyor" && canManageRoles ? (
                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => handleRoleChange(p.id, "admin")}
                        className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 disabled:opacity-50"
                      >
                        {savingId === p.id ? "Promoting…" : "Promote to admin"}
                      </button>
                    ) : p.role === "admin" && canManageRoles ? (
                      <button
                        type="button"
                        disabled={savingId === p.id}
                        onClick={() => handleRoleChange(p.id, "surveyor")}
                        className="rounded-md border border-amber-300 px-3 py-1 text-sm font-medium text-amber-800 disabled:opacity-50"
                      >
                        {savingId === p.id ? "Demoting…" : "Demote to surveyor"}
                      </button>
                    ) : (
                      <span className="font-medium text-slate-700">
                        {p.role === "superadmin"
                          ? "Super Admin"
                          : p.role === "admin"
                            ? "Admin"
                            : p.role === "pending"
                              ? "Pending"
                              : "Surveyor"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      disabled={savingId === p.id}
                      onClick={() => handleProfileSave(p)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50"
                    >
                      {savingId === p.id ? "Saving…" : "Save profile"}
                    </button>
                    <Link
                      to={`/profiles/${p.id}`}
                      className="ml-3 text-sm font-medium text-slate-700 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getProfileDetails, updateProfileDetails, uploadProfileImage } from "./profileApi";
import type { Profile } from "../../types/domain";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { profile: currentProfile } = useAuth();
  const profileId = id ?? currentProfile?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignedCaseCount, setAssignedCaseCount] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!profileId) return;
    setLoading(true);
    try {
      const details = await getProfileDetails(profileId);
      setProfile(details.profile);
      setAssignedCaseCount(details.assignedCaseCount);
      setImageUrl(details.imageUrl);
      setFullName(details.profile.fullName);
      setPhone(details.profile.phone ?? "");
      setLicenseNo(details.profile.licenseNo ?? "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!profile || !fullName.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      await updateProfileDetails(profile.id, {
        fullName,
        phone: phone.trim() || null,
        licenseNo: licenseNo.trim() || null,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      setError("Select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile images must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const path = await uploadProfileImage(profile.id, file);
      await updateProfileDetails(profile.id, {
        fullName: profile.fullName,
        phone: profile.phone,
        licenseNo: profile.licenseNo,
        profileImage: path,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload profile image");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (loading) return <LoadingSpinner label="Loading profile…" />;
  if (error && !profile) return <ErrorMessage message={error} />;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          {imageUrl ? (
            <img src={imageUrl} alt={`${profile.fullName}'s profile`} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold text-slate-600">
              {profile.fullName.slice(0, 1).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{profile.fullName}</h1>
            <p className="text-sm capitalize text-slate-500">{profile.role}</p>
            <p className="mt-1 text-sm text-slate-600">
              {assignedCaseCount} assigned {assignedCaseCount === 1 ? "case" : "cases"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-medium text-slate-900">Profile details</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={profile.email ?? ""}
            readOnly
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-base text-slate-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="profile-phone">
            Phone number
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="profile-license">
            Surveyor license number
          </label>
          <input
            id="profile-license"
            type="text"
            value={licenseNo}
            onChange={(event) => setLicenseNo(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="profile-image">
            Profile image
          </label>
          <input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="block w-full text-sm text-slate-600"
          />
          <p className="mt-1 text-xs text-slate-500">Maximum file size: 5 MB.</p>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}

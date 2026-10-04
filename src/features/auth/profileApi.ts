import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/domain";

function mapProfile(row: {
  id: string;
  full_name: string;
  role: Profile["role"];
  email: string | null;
  phone: string | null;
  license_no: string | null;
  profile_image: string | null;
}): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    licenseNo: row.license_no,
    profileImage: row.profile_image,
  };
}

export async function getProfileDetails(profileId: string): Promise<{
  profile: Profile;
  assignedCaseCount: number;
  imageUrl: string | null;
}> {
  const [profileRes, casesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, email, phone, license_no, profile_image")
      .eq("id", profileId)
      .single(),
    supabase.from("cases").select("id", { count: "exact", head: true }).eq("assigned_surveyor_id", profileId),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (casesRes.error) throw new Error(casesRes.error.message);

  const profile = mapProfile(profileRes.data);
  if (!profile.profileImage) {
    return { profile, assignedCaseCount: casesRes.count ?? 0, imageUrl: null };
  }

  const { data, error } = await supabase.storage.from("profile-images").createSignedUrl(profile.profileImage, 3600);
  if (error) throw new Error(error.message);

  return { profile, assignedCaseCount: casesRes.count ?? 0, imageUrl: data.signedUrl };
}

export async function updateProfileDetails(
  profileId: string,
  updates: { fullName: string; phone: string | null; licenseNo: string | null; profileImage?: string },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: updates.fullName.trim(),
      phone: updates.phone,
      license_no: updates.licenseNo,
      ...(updates.profileImage !== undefined && { profile_image: updates.profileImage }),
    })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
}

export async function uploadProfileImage(profileId: string, file: File): Promise<string> {
  const { error } = await supabase.storage.from("profile-images").upload(`${profileId}/avatar`, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return `${profileId}/avatar`;
}

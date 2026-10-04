import { supabase } from "../../lib/supabase";
import type { Profile, ProfileRole } from "../../types/domain";

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, email, phone, license_no, profile_image")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
    email: p.email,
    phone: p.phone,
    licenseNo: p.license_no,
    profileImage: p.profile_image,
  }));
}

export async function listSurveyors(): Promise<Profile[]> {
  const all = await listProfiles();
  return all.filter((p) => p.role === "surveyor");
}

export async function updateProfile(
  id: string,
  updates: Partial<{ fullName: string; role: ProfileRole; phone: string | null; licenseNo: string | null }>,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(updates.fullName !== undefined && { full_name: updates.fullName }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
      ...(updates.licenseNo !== undefined && { license_no: updates.licenseNo }),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

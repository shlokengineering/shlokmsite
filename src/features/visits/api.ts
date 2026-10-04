import { supabase } from "../../lib/supabase";

export async function addVisit(
  caseId: string,
  visitDate: string,
  siteAddress: string,
  remarks: string,
  surveyorId: string | null,
): Promise<void> {
  const { error } = await supabase.from("visits").insert({
    case_id: caseId,
    visit_date: visitDate,
    site_address: siteAddress || null,
    remarks: remarks || null,
    surveyor_id: surveyorId,
  });
  if (error) throw new Error(error.message);
}

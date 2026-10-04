import { supabase } from "../../lib/supabase";
import type { StatusStage } from "../../types/domain";

export async function addStatus(
  caseId: string,
  stage: StatusStage,
  remarks: string,
  surveyorId: string | null,
): Promise<void> {
  const { error } = await supabase.from("statuses").insert({
    case_id: caseId,
    stage,
    status_date: new Date().toISOString().slice(0, 10),
    status_remarks: remarks || null,
    surveyor_id: surveyorId,
  });
  if (error) throw new Error(error.message);
}

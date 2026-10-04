import { supabase } from "../../lib/supabase";

export interface ActivityEventCounts {
  /** Number of intimation and case-closed events on each ISO (YYYY-MM-DD) date. */
  activityCounts: Map<string, number>;
}

/** Counts intimation and case-closed events per day. RLS scopes results to the caller. */
export async function getActivityEventCounts(): Promise<ActivityEventCounts> {
  const [casesRes, closedRes] = await Promise.all([
    supabase.from("cases").select("intimation_date"),
    supabase.from("statuses").select("status_date").eq("stage", "closed"),
  ]);
  if (casesRes.error) throw new Error(casesRes.error.message);
  if (closedRes.error) throw new Error(closedRes.error.message);

  const activityCounts = new Map<string, number>();
  function addActivity(date: string) {
    activityCounts.set(date, (activityCounts.get(date) ?? 0) + 1);
  }

  for (const row of casesRes.data ?? []) {
    if (row.intimation_date) {
      addActivity(row.intimation_date);
    }
  }
  for (const row of closedRes.data ?? []) {
    addActivity(row.status_date);
  }

  return { activityCounts };
}

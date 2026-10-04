import { useMemo, type CSSProperties } from "react";

interface StreakHeatmapProps {
  activityCounts: Map<string, number>;
}

const WEEKS_TO_SHOW = 53;
const EMPTY_COLOR = "#e2e8f0";
const ACTIVITY_SHADES = ["#dcfce7", "#4ade80", "#15803d"];

function countShade(count: number, shades: string[]): string {
  const level = count >= 4 ? 2 : count >= 2 ? 1 : 0;
  return shades[level];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** GitHub-style contribution grid: green intensity reflects daily intimation and case-closed activity. */
export default function StreakHeatmap({ activityCounts }: StreakHeatmapProps) {
  const { weeks, today } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(now);
    start.setDate(start.getDate() - (WEEKS_TO_SHOW - 1) * 7);
    const cursor = startOfWeek(start);
    const built: Date[][] = [];
    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      built.push(week);
    }
    return { weeks: built, today: now };
  }, []);

  const monthLabels = useMemo(() => {
    let lastMonth = -1;
    return weeks.map((week) => {
      const month = week[0].getMonth();
      if (month !== lastMonth) {
        lastMonth = month;
        return week[0].toLocaleDateString("en-US", { month: "short" });
      }
      return "";
    });
  }, [weeks]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-1">
          {monthLabels.map((label, idx) => (
            <div key={idx} className="w-3 shrink-0 text-[11px] text-slate-500">
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => {
                if (day > today) {
                  return <div key={day.getTime()} className="h-3 w-3 rounded-sm" />;
                }
                const iso = toISODate(day);
                const activityCount = activityCounts.get(iso) ?? 0;
                let style: CSSProperties = { backgroundColor: EMPTY_COLOR };
                if (activityCount > 0) {
                  style = { backgroundColor: countShade(activityCount, ACTIVITY_SHADES) };
                }
                const label =
                  activityCount > 0
                    ? `${iso} · ${activityCount} activit${activityCount === 1 ? "y" : "ies"}`
                    : `${iso} · No activity`;
                return <div key={iso} title={label} className="h-3 w-3 rounded-sm" style={style} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

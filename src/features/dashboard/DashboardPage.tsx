import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCases, type CaseListItem } from "../cases/api";
import { getActivityEventCounts } from "./api";
import { useAuth } from "../auth/AuthContext";
import StreakHeatmap from "./StreakHeatmap";
import { emptyCaseFilters, filterCases, getDaysSince } from "../cases/filterCases";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import type { StatusStage } from "../../types/domain";
import { isAdminRole } from "../../types/domain";

const COMPLETED_STAGES = new Set<StatusStage>(["submitted", "closed"]);

const DELAYED_DAYS_PRESETS = [
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "15 days", days: 15 },
  { label: "21 days", days: 21 },
  { label: "1 month", days: 30 },
  { label: "2 months", days: 60 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "9 months", days: 270 },
  { label: "1 year", days: 365 },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface FollowUpReminder {
  id: string;
  caseId: string;
  caseReferenceNo: string;
  dueDate: string;
  message: string;
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  return Math.floor(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_IN_MS,
  );
}

function formatReminderDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ordinal(value: number): string {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function getFollowUpReminders(cases: CaseListItem[], today: string): FollowUpReminder[] {
  const reminders: FollowUpReminder[] = [];

  for (const caseItem of cases) {
    if (!caseItem.deputedDate || (caseItem.latestStage && COMPLETED_STAGES.has(caseItem.latestStage))) {
      continue;
    }

    const daysSinceDeputation = daysBetween(caseItem.deputedDate, today);
    if (daysSinceDeputation < 0) continue;

    if (daysSinceDeputation >= 4 && !caseItem.statusStages.includes("status_report_sent")) {
      reminders.push({
        id: `${caseItem.id}-status-report`,
        caseId: caseItem.id,
        caseReferenceNo: caseItem.caseReferenceNo,
        dueDate: addDays(caseItem.deputedDate, 4),
        message: `4th day of ${caseItem.caseReferenceNo}: Send status report`,
      });
    } else if (
      daysSinceDeputation >= 7 &&
      !caseItem.statusStages.includes("call_for_document") &&
      !caseItem.statusStages.includes("documents_pending")
    ) {
      reminders.push({
        id: `${caseItem.id}-documents`,
        caseId: caseItem.id,
        caseReferenceNo: caseItem.caseReferenceNo,
        dueDate: addDays(caseItem.deputedDate, 7),
        message: `7th day of ${caseItem.caseReferenceNo}: Call for documents`,
      });
    } else if (daysSinceDeputation >= 14) {
      const weeksAfterDeputation = 2 + Math.floor((daysSinceDeputation - 14) / 7);
      const dueDay = weeksAfterDeputation * 7;
      reminders.push({
        id: `${caseItem.id}-draft-progress`,
        caseId: caseItem.id,
        caseReferenceNo: caseItem.caseReferenceNo,
        dueDate: addDays(caseItem.deputedDate, dueDay),
        message: `${ordinal(weeksAfterDeputation)} week of ${caseItem.caseReferenceNo}: Progress on draft report`,
      });
    }
  }

  return reminders.sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.caseReferenceNo.localeCompare(b.caseReferenceNo),
  );
}

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-300">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [activityCounts, setActivityCounts] = useState<Map<string, number>>(new Map());
  const [delayedDays, setDelayedDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listCases(), getActivityEventCounts()])
      .then(([caseRows, events]) => {
        setCases(caseRows);
        setActivityCounts(events.activityCounts);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let thisMonth = 0;
    let thisYear = 0;
    let ongoing = 0;
    let completed = 0;
    for (const c of cases) {
      const created = new Date(c.createdAt);
      if (created.getFullYear() === now.getFullYear()) {
        thisYear += 1;
        if (created.getMonth() === now.getMonth()) thisMonth += 1;
      }
      if (c.latestStage && COMPLETED_STAGES.has(c.latestStage)) completed += 1;
      else ongoing += 1;
    }
    return { thisMonth, thisYear, ongoing, completed };
  }, [cases]);

  const delayedCases = useMemo(
    () => filterCases(cases, { ...emptyCaseFilters, status: "ongoing", pendingDays: delayedDays }),
    [cases, delayedDays],
  );
  const reminders = useMemo(
    () => getFollowUpReminders(cases, toIsoDate(new Date())),
    [cases],
  );

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,2fr)]">
      <aside
        aria-labelledby="follow-up-title"
        aria-live="polite"
        className="rounded-md border border-amber-300 bg-amber-50 p-3"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 motion-safe:animate-pulse" />
          <h2 id="follow-up-title" className="font-semibold text-amber-950">
            Case follow-up reminders
          </h2>
        </div>
        <p className="mb-4 text-sm text-amber-900">
          Follow-ups are scheduled from each case’s deputation date.
        </p>
        {reminders.length === 0 ? (
          <p className="text-sm text-slate-600">No case follow-ups are due.</p>
        ) : (
          <ul className="space-y-2">
            {reminders.map((reminder) => {
              const overdueDays = daysBetween(reminder.dueDate, toIsoDate(new Date()));
              return (
                <li key={reminder.id} className="rounded-md border border-amber-200 bg-white p-2">
                  <Link
                    to={`/cases/${reminder.caseId}`}
                    className="font-medium text-slate-900 underline decoration-amber-400 underline-offset-2"
                  >
                    {reminder.message}
                  </Link>
                  <p className="mt-1 text-xs text-slate-600">
                    Due {formatReminderDate(reminder.dueDate)}
                    {overdueDays === 0
                      ? " · Today"
                      : ` · ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          {isAdminRole(profile?.role) && (
            <Link to="/cases/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              New case
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered this month" value={stats.thisMonth} to="/cases?registered=month" />
          <StatCard label="Registered this year" value={stats.thisYear} to="/cases?registered=year" />
          <StatCard label="Ongoing cases" value={stats.ongoing} to="/cases?status=ongoing" />
          <StatCard label="Completed cases" value={stats.completed} to="/cases?status=completed" />
        </div>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-slate-900">Delayed cases</h2>
              <p className="text-sm text-slate-500">
                Ongoing cases deputed for at least {delayedDays} days.
              </p>
            </div>
            <Link
              to={`/cases?status=ongoing&pendingDays=${delayedDays}`}
              className="text-sm font-medium text-slate-700 underline"
            >
              View all ({delayedCases.length})
            </Link>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {DELAYED_DAYS_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setDelayedDays(preset.days)}
                aria-pressed={delayedDays === preset.days}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  delayedDays === preset.days
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="delayed-days">
              Pending for at least {delayedDays} day{delayedDays === 1 ? "" : "s"}
            </label>
            <div className="flex max-w-xl items-center gap-2">
              <button
                type="button"
                aria-label="Decrease delayed-case days"
                onClick={() => setDelayedDays((days) => Math.max(0, days - 1))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                −
              </button>
              <input
                id="delayed-days"
                type="range"
                min="0"
                max="365"
                step="1"
                value={delayedDays}
                onChange={(e) => setDelayedDays(Number(e.target.value))}
                className="min-w-0 flex-1 accent-slate-900"
              />
              <button
                type="button"
                aria-label="Increase delayed-case days"
                onClick={() => setDelayedDays((days) => Math.min(365, days + 1))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                +
              </button>
              <output className="w-10 text-right text-sm text-slate-600">{delayedDays}</output>
            </div>
          </div>
          {delayedCases.length === 0 ? (
            <p className="text-sm text-slate-500">No delayed cases for the selected period.</p>
          ) : (
            <ul className="space-y-2">
              {delayedCases
                .sort((a, b) => getDaysSince(b.deputedDate!) - getDaysSince(a.deputedDate!))
                .slice(0, 5)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/cases/${c.id}`} className="font-medium text-slate-900 underline">
                      {c.caseReferenceNo}
                    </Link>
                    <span className="text-slate-600">
                      {getDaysSince(c.deputedDate!)} days since deputation
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-medium text-slate-900">Activity streak</h2>
          <p className="mb-3 text-sm text-slate-500">
            Green shades show daily intimation and case-closed activity.
          </p>
          <StreakHeatmap activityCounts={activityCounts} />
        </section>
      </section>
    </div>
  );
}

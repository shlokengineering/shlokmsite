import type { CaseStatus } from "../../types/domain";
import { stageLabel } from "../../types/domain";

export default function StatusTimeline({ statuses }: { statuses: CaseStatus[] }) {
  if (statuses.length === 0) {
    return <p className="text-sm text-slate-500">No status history yet.</p>;
  }

  const ordered = [...statuses].sort((a, b) => b.statusNo - a.statusNo);

  return (
    <ol className="space-y-3">
      {ordered.map((s) => (
        <li key={s.statusNo} className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{stageLabel(s.stage)}</span>
            <span className="text-xs text-slate-500">{s.statusDate}</span>
          </div>
          {s.statusRemarks && <p className="mt-1 text-sm text-slate-600">{s.statusRemarks}</p>}
        </li>
      ))}
    </ol>
  );
}

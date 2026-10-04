import { useState, type FormEvent } from "react";
import { STATUS_STAGES } from "../../types/domain";
import type { StatusStage } from "../../types/domain";
import { addStatus } from "./api";

export default function UpdateStatusForm({
  caseId,
  surveyorId,
  onAdded,
}: {
  caseId: string;
  surveyorId: string | null;
  onAdded: () => void;
}) {
  const [stage, setStage] = useState<StatusStage>(STATUS_STAGES[0].value);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addStatus(caseId, stage, remarks, surveyorId);
      setRemarks("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="font-medium text-slate-900">Update status</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="status-stage">
          Stage
        </label>
        <select
          id="status-stage"
          value={stage}
          onChange={(e) => setStage(e.target.value as StatusStage)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        >
          {STATUS_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="status-remarks">
          Remarks
        </label>
        <textarea
          id="status-remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}

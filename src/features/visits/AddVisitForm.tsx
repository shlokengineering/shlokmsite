import { useState, type FormEvent } from "react";
import { addVisit } from "./api";

export default function AddVisitForm({
  caseId,
  surveyorId,
  onAdded,
}: {
  caseId: string;
  surveyorId: string | null;
  onAdded: () => void;
}) {
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [siteAddress, setSiteAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addVisit(caseId, visitDate, siteAddress, remarks, surveyorId);
      setSiteAddress("");
      setRemarks("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add visit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="font-medium text-slate-900">Add visit</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="visit-date">
          Visit date
        </label>
        <input
          id="visit-date"
          type="date"
          required
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="visit-site-address">
          Site address
        </label>
        <input
          id="visit-site-address"
          type="text"
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="visit-remarks">
          Remarks
        </label>
        <textarea
          id="visit-remarks"
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
        {submitting ? "Saving…" : "Add visit"}
      </button>
    </form>
  );
}

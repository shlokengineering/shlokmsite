import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listCases, type CaseListItem } from "./api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import { stageLabel } from "../../types/domain";
import CaseFilterBar from "./CaseFilterBar";
import { emptyCaseFilters, filterCases, type CaseFilters } from "./filterCases";

export default function CaseListPage() {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [filters, setFilters] = useState<CaseFilters>(() => {
    const pendingDays = Number(searchParams.get("pendingDays"));
    const status = searchParams.get("status");
    const registered = searchParams.get("registered");
    return {
      ...emptyCaseFilters,
      pendingDays: Number.isInteger(pendingDays) ? Math.min(365, Math.max(0, pendingDays)) : 0,
      status: status === "ongoing" || status === "completed" ? status : "",
      registered: registered === "month" || registered === "year" ? registered : "",
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCases()
      .then(setCases)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load cases"))
      .finally(() => setLoading(false));
  }, []);

  const filteredCases = useMemo(() => filterCases(cases, filters), [cases, filters]);

  if (loading) return <LoadingSpinner label="Loading cases…" />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Cases</h1>
        <Link
          to="/cases/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          New case
        </Link>
      </div>

      <CaseFilterBar filters={filters} onChange={setFilters} />

      {filteredCases.length === 0 ? (
        <EmptyState
          message={cases.length === 0 ? "No cases yet. Create the first one." : "No cases match the current filters."}
        />
      ) : (
        <ul className="space-y-2">
          {filteredCases.map((c) => (
            <li key={c.id}>
              <Link
                to={`/cases/${c.id}`}
                className="block rounded-md border border-slate-200 bg-white p-4 hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{c.caseReferenceNo}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {c.latestStage ? stageLabel(c.latestStage) : "—"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {c.insurerName} · Claim {c.claimNo} · Policy {c.policyNo}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { CaseFilters } from "./filterCases";
import { COVERAGE_TYPES, MOTOR_VEHICLE_TYPES } from "../../constants/options";

interface CaseFilterBarProps {
  filters: CaseFilters;
  onChange: (filters: CaseFilters) => void;
}

/** Shared filter controls (insurer, vehicle/coverage type, and date range) used by the dashboard and cases list. */
export default function CaseFilterBar({ filters, onChange }: CaseFilterBarProps) {
  function set<K extends keyof CaseFilters>(key: K, value: CaseFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-insurer">
          Insurer
        </label>
        <input
          id="filter-insurer"
          type="text"
          value={filters.insurer}
          onChange={(e) => set("insurer", e.target.value)}
          placeholder="Filter by insurer…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-motor-vehicle-type">
          Motor vehicle type
        </label>
        <select
          id="filter-motor-vehicle-type"
          value={filters.motorVehicleType}
          onChange={(e) => set("motorVehicleType", e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        >
          <option value="">All</option>
          {MOTOR_VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-policy-type">
          Policy coverage type
        </label>
        <select
          id="filter-policy-type"
          value={filters.policyType}
          onChange={(e) => set("policyType", e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        >
          <option value="">All</option>
          {COVERAGE_TYPES.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-date-from">
          Date From
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={filters.dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="filter-date-to">
          Date To
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={filters.dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

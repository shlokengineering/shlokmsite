import type { CaseListItem } from "./api";
import type { StatusStage } from "../../types/domain";

export interface CaseFilters {
  insurer: string;
  motorVehicleType: string;
  policyType: string;
  dateFrom: string;
  dateTo: string;
  pendingDays: number;
  status: "ongoing" | "completed" | "";
  registered: "month" | "year" | "";
}

export const emptyCaseFilters: CaseFilters = {
  insurer: "",
  motorVehicleType: "",
  policyType: "",
  dateFrom: "",
  dateTo: "",
  pendingDays: 0,
  status: "",
  registered: "",
};

/** Client-side filter by insurer (substring), motor vehicle/policy coverage type (exact), and date range. */
export function filterCases(cases: CaseListItem[], filters: CaseFilters): CaseListItem[] {
  const insurerQuery = filters.insurer.trim().toLowerCase();
  const today = new Date();
  const completedStages = new Set<StatusStage>(["submitted", "closed"]);
  return cases.filter((c) => {
    if (insurerQuery && !c.insurerName.toLowerCase().includes(insurerQuery)) return false;
    if (filters.motorVehicleType && c.insuranceType !== filters.motorVehicleType) return false;
    if (filters.policyType && c.policyCategory !== filters.policyType) return false;
    if (filters.dateFrom && c.dateOfAccident < filters.dateFrom) return false;
    if (filters.dateTo && c.dateOfAccident > filters.dateTo) return false;
    const isCompleted = c.latestStage !== null && completedStages.has(c.latestStage);
    if (filters.status === "ongoing" && isCompleted) return false;
    if (filters.status === "completed" && !isCompleted) return false;
    if (filters.pendingDays > 0) {
      if (isCompleted || !c.deputedDate || getDaysSince(c.deputedDate, today) < filters.pendingDays) return false;
    }
    if (filters.registered) {
      const created = new Date(c.createdAt);
      if (created.getFullYear() !== today.getFullYear()) return false;
      if (filters.registered === "month" && created.getMonth() !== today.getMonth()) return false;
    }
    return true;
  });
}

export function getDaysSince(date: string, today = new Date()): number {
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((current.getTime() - start.getTime()) / 86_400_000));
}

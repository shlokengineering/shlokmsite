import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createCase, type NewCasePayload } from "./api";
import { createEmptyVehicle } from "./vehicleForm";
import VehicleFieldsEditor from "./VehicleFieldsEditor";
import InsurerAutocomplete from "../../components/InsurerAutocomplete";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import { MOTOR_VEHICLE_TYPES, COVERAGE_TYPES } from "../../constants/options";

function todayDate(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
}

function emptyForm(): NewCasePayload {
  return {
    insurerName: "",
    insuranceType: "",
    policyCategory: "",
    policyNo: "",
    claimNo: "",
    dateOfAccident: "",
    caseReferenceNo: "",
    intimationDate: todayDate(),
    insuredName: "",
    insuredCompany: "",
    vehicles: [createEmptyVehicle()],
  };
}

export default function CaseFormPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<NewCasePayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof NewCasePayload>(key: K, value: NewCasePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateVehicle(index: number, patch: Partial<NewCasePayload["vehicles"][number]>) {
    setForm((f) => ({
      ...f,
      vehicles: f.vehicles.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function addVehicle() {
    setForm((f) => ({ ...f, vehicles: [...f.vehicles, createEmptyVehicle()] }));
  }

  function removeVehicle(index: number) {
    setForm((f) => ({ ...f, vehicles: f.vehicles.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      const caseId = await createCase(
        { ...form, insurerName: form.insurerName.trim(), caseReferenceNo: form.caseReferenceNo.trim() },
        session.user.id,
      );
      navigate(`/cases/${caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">New case</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold text-slate-700">Case</legend>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="insurer-name">
              Insurer
            </label>
            <InsurerAutocomplete
              id="insurer-name"
              value={form.insurerName}
              onChange={(v) => set("insurerName", v)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="insurance-type">
              Motor vehicle type
            </label>
            <select
              id="insurance-type"
              required
              value={form.insuranceType}
              onChange={(e) => set("insuranceType", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select…</option>
              {MOTOR_VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="policy-category">
              Policy coverage type
            </label>
            <select
              id="policy-category"
              required
              value={form.policyCategory}
              onChange={(e) => set("policyCategory", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select…</option>
              {COVERAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <FormField label="Policy no." id="policy-no" value={form.policyNo} onChange={(v) => set("policyNo", v)} required />
          <FormField label="Claim no." id="claim-no" value={form.claimNo} onChange={(v) => set("claimNo", v)} required />
          <FormField label="Date of accident" id="date-of-accident" type="date" value={form.dateOfAccident} onChange={(v) => set("dateOfAccident", v)} required />
          <FormField label="Intimation date" id="intimation-date" type="date" value={form.intimationDate} onChange={(v) => set("intimationDate", v)} required />
          <FormField label="Case reference no." id="case-reference-no" value={form.caseReferenceNo} onChange={(v) => set("caseReferenceNo", v)} required />
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold text-slate-700">Insured</legend>
          <FormField label="Insured name" id="insured-name" value={form.insuredName} onChange={(v) => set("insuredName", v)} required />
          <FormField label="Insured company (optional)" id="insured-company" value={form.insuredCompany} onChange={(v) => set("insuredCompany", v)} />
        </fieldset>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Vehicles</h2>
          <VehicleFieldsEditor
            vehicles={form.vehicles}
            onChange={updateVehicle}
            onAdd={addVehicle}
            onRemove={removeVehicle}
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-base font-medium text-white disabled:opacity-50 sm:w-auto"
        >
          {submitting ? "Creating…" : "Create case"}
        </button>
      </form>
    </div>
  );
}

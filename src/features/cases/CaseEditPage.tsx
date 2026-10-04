import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCaseDetail, updateCase, type UpdateCasePayload } from "./api";
import { createEmptyVehicle, type VehicleFormItem } from "./vehicleForm";
import VehicleFieldsEditor from "./VehicleFieldsEditor";
import InsurerAutocomplete from "../../components/InsurerAutocomplete";
import FormField from "../../components/FormField";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { MOTOR_VEHICLE_TYPES, COVERAGE_TYPES } from "../../constants/options";

export default function CaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<UpdateCasePayload | null>(null);
  const [originalVehicleIds, setOriginalVehicleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCaseDetail(id)
      .then((detail) => {
        const insured = detail.insureds[0];
        const vehicles: VehicleFormItem[] = detail.vehicles.map((v) => {
          const driver = detail.drivers.find((d) => d.vehicleId === v.id);
          return {
            id: v.id,
            driverId: driver?.id,
            vehicleNo: v.vehicleNo,
            vehicleRegistrationDate: v.vehicleRegistrationDate ?? "",
            vehicleType: v.vehicleType ?? "",
            vehicleCategory: v.vehicleCategory ?? "",
            vehicleOwner: v.vehicleOwner ?? "",
            driverName: driver?.driverName ?? "",
            drivingLicense: driver?.drivingLicense ?? "",
          };
        });

        setOriginalVehicleIds(detail.vehicles.map((v) => v.id));
        setForm({
          insurerName: detail.case.insurerName,
          insuranceType: detail.case.insuranceType,
          policyCategory: detail.case.policyCategory,
          policyNo: detail.case.policyNo,
          claimNo: detail.case.claimNo,
          dateOfAccident: detail.case.dateOfAccident,
          caseReferenceNo: detail.case.caseReferenceNo,
          intimationDate: detail.case.intimationDate,
          insuredId: insured?.id,
          insuredName: insured?.insuredName ?? "",
          insuredCompany: insured?.insuredCompany ?? "",
          vehicles: vehicles.length ? vehicles : [createEmptyVehicle()],
        });
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load case"))
      .finally(() => setLoading(false));
  }, [id]);

  function set<K extends keyof UpdateCasePayload>(key: K, value: UpdateCasePayload[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function updateVehicle(index: number, patch: Partial<VehicleFormItem>) {
    setForm((f) => (f ? { ...f, vehicles: f.vehicles.map((v, i) => (i === index ? { ...v, ...patch } : v)) } : f));
  }

  function addVehicle() {
    setForm((f) => (f ? { ...f, vehicles: [...f.vehicles, createEmptyVehicle()] } : f));
  }

  function removeVehicle(index: number) {
    setForm((f) => (f ? { ...f, vehicles: f.vehicles.filter((_, i) => i !== index) } : f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !form) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateCase(
        id,
        { ...form, insurerName: form.insurerName.trim(), caseReferenceNo: form.caseReferenceNo.trim() },
        originalVehicleIds,
      );
      navigate(`/cases/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update case");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading case…" />;
  if (error && !form) return <ErrorMessage message={error} />;
  if (!form) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Edit case</h1>

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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-base font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/cases/${id}`)}
            className="rounded-md border border-slate-300 px-4 py-2 text-base font-medium text-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

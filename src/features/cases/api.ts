import { supabase } from "../../lib/supabase";
import type { Case, CaseStatus, Driver, Insured, Payment, Vehicle, Visit } from "../../types/domain";
import type { VehicleFormItem } from "./vehicleForm";

export interface CaseListItem extends Case {
  latestStage: CaseStatus["stage"] | null;
  statusStages: CaseStatus["stage"][];
}

export async function listCases(): Promise<CaseListItem[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const { data: statusRows, error: statusErr } = await supabase
    .from("statuses")
    .select("case_id, stage, status_no");
  if (statusErr) throw new Error(statusErr.message);

  const latestStageByCase = new Map<string, CaseStatus["stage"]>();
  const latestNoByCase = new Map<string, number>();
  const statusStagesByCase = new Map<string, Set<CaseStatus["stage"]>>();
  for (const row of statusRows ?? []) {
    const stages = statusStagesByCase.get(row.case_id) ?? new Set<CaseStatus["stage"]>();
    stages.add(row.stage);
    statusStagesByCase.set(row.case_id, stages);

    const currentNo = latestNoByCase.get(row.case_id) ?? -1;
    if (row.status_no > currentNo) {
      latestNoByCase.set(row.case_id, row.status_no);
      latestStageByCase.set(row.case_id, row.stage);
    }
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    insurerName: row.insurer_name,
    insuranceType: row.insurance_type,
    policyCategory: row.policy_category,
    policyNo: row.policy_no,
    claimNo: row.claim_no,
    dateOfAccident: row.date_of_accident,
    caseReferenceNo: row.case_reference_no,
    intimationDate: row.intimation_date,
    assignedSurveyorId: row.assigned_surveyor_id,
    deputedDate: row.deputed_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latestStage: latestStageByCase.get(row.id) ?? null,
    statusStages: [...(statusStagesByCase.get(row.id) ?? [])],
  }));
}

export interface CaseDetail {
  case: Case;
  insureds: Insured[];
  vehicles: Vehicle[];
  drivers: Driver[];
  visits: Visit[];
  statuses: CaseStatus[];
  payment: Payment | null;
}

export async function getCaseDetail(caseId: string): Promise<CaseDetail> {
  const [caseRes, insuredsRes, vehiclesRes, visitsRes, statusesRes, paymentsRes] = await Promise.all([
    supabase.from("cases").select("*").eq("id", caseId).single(),
    supabase.from("insureds").select("*").eq("case_id", caseId),
    supabase.from("vehicles").select("*").eq("case_id", caseId),
    supabase.from("visits").select("*").eq("case_id", caseId).order("visit_no", { ascending: true }),
    supabase.from("statuses").select("*").eq("case_id", caseId).order("status_no", { ascending: true }),
    supabase.from("payments").select("*").eq("case_id", caseId).maybeSingle(),
  ]);

  if (caseRes.error) throw new Error(caseRes.error.message);
  if (insuredsRes.error) throw new Error(insuredsRes.error.message);
  if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
  if (visitsRes.error) throw new Error(visitsRes.error.message);
  if (statusesRes.error) throw new Error(statusesRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);

  const vehicleIds = (vehiclesRes.data ?? []).map((v) => v.id);
  const driversRes = vehicleIds.length
    ? await supabase.from("drivers").select("*").in("vehicle_id", vehicleIds)
    : { data: [], error: null };
  if (driversRes.error) throw new Error(driversRes.error.message);

  const c = caseRes.data;

  return {
    case: {
      id: c.id,
      insurerName: c.insurer_name,
      insuranceType: c.insurance_type,
      policyCategory: c.policy_category,
      policyNo: c.policy_no,
      claimNo: c.claim_no,
      dateOfAccident: c.date_of_accident,
      caseReferenceNo: c.case_reference_no,
      intimationDate: c.intimation_date,
      assignedSurveyorId: c.assigned_surveyor_id,
      deputedDate: c.deputed_date,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    },
    insureds: (insuredsRes.data ?? []).map((i) => ({
      id: i.id,
      insuredName: i.insured_name,
      insuredCompany: i.insured_company,
      caseId: i.case_id,
    })),
    vehicles: (vehiclesRes.data ?? []).map((v) => ({
      id: v.id,
      vehicleNo: v.vehicle_no,
      vehicleRegistrationDate: v.vehicle_registration_date,
      vehicleType: v.vehicle_type,
      vehicleCategory: v.vehicle_category,
      vehicleOwner: v.vehicle_owner,
      caseId: v.case_id,
    })),
    drivers: (driversRes.data ?? []).map((d) => ({
      id: d.id,
      driverName: d.driver_name,
      vehicleId: d.vehicle_id,
      drivingLicense: d.driving_license,
    })),
    visits: (visitsRes.data ?? []).map((v) => ({
      caseId: v.case_id,
      visitNo: v.visit_no,
      visitDate: v.visit_date,
      surveyorId: v.surveyor_id,
      siteAddress: v.site_address,
      remarks: v.remarks,
      createdAt: v.created_at,
    })),
    statuses: (statusesRes.data ?? []).map((s) => ({
      caseId: s.case_id,
      statusNo: s.status_no,
      stage: s.stage,
      statusDate: s.status_date,
      surveyorId: s.surveyor_id,
      statusRemarks: s.status_remarks,
      createdAt: s.created_at,
    })),
    payment: paymentsRes.data
      ? {
          id: paymentsRes.data.id,
          caseId: paymentsRes.data.case_id,
          amount: paymentsRes.data.amount,
          paymentStatus: paymentsRes.data.payment_status,
        }
      : null,
  };
}

export interface NewCasePayload {
  insurerName: string;
  insuranceType: string;
  policyCategory: string;
  policyNo: string;
  claimNo: string;
  dateOfAccident: string;
  caseReferenceNo: string;
  intimationDate: string;
  insuredName: string;
  insuredCompany: string;
  vehicles: VehicleFormItem[];
}

/** Creates the case and its first-level related rows. Not atomic (client-side sequence); a Postgres function is a future improvement. */
export async function createCase(payload: NewCasePayload, createdBy: string): Promise<string> {
  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .insert({
      insurer_name: payload.insurerName.trim(),
      insurance_type: payload.insuranceType,
      policy_category: payload.policyCategory,
      policy_no: payload.policyNo,
      claim_no: payload.claimNo,
      date_of_accident: payload.dateOfAccident,
      case_reference_no: payload.caseReferenceNo,
      intimation_date: payload.intimationDate,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (caseErr) throw new Error(caseErr.message);

  const caseId = caseRow.id as string;

  const { error: insuredErr } = await supabase.from("insureds").insert({
    insured_name: payload.insuredName,
    insured_company: payload.insuredCompany || null,
    case_id: caseId,
  });
  if (insuredErr) throw new Error(insuredErr.message);

  for (const vehicle of payload.vehicles) {
    const { data: vehicleRow, error: vehicleErr } = await supabase
      .from("vehicles")
      .insert({
        vehicle_no: vehicle.vehicleNo,
        vehicle_registration_date: vehicle.vehicleRegistrationDate || null,
        vehicle_type: vehicle.vehicleType || null,
        vehicle_category: vehicle.vehicleCategory || null,
        vehicle_owner: vehicle.vehicleOwner || null,
        case_id: caseId,
      })
      .select("id")
      .single();
    if (vehicleErr) throw new Error(vehicleErr.message);

    if (vehicle.driverName) {
      const { error: driverErr } = await supabase.from("drivers").insert({
        driver_name: vehicle.driverName,
        vehicle_id: vehicleRow.id,
        driving_license: vehicle.drivingLicense || null,
      });
      if (driverErr) throw new Error(driverErr.message);
    }
  }

  const { error: intimationStatusErr } = await supabase.from("statuses").insert({
    case_id: caseId,
    stage: "intimated",
    status_date: payload.intimationDate,
    status_remarks: "Case intimated",
  });
  if (intimationStatusErr) throw new Error(intimationStatusErr.message);

  const { error: statusErr } = await supabase.from("statuses").insert({
    case_id: caseId,
    stage: "case_created",
    status_date: payload.intimationDate,
    status_remarks: "Case registered",
  });
  if (statusErr) throw new Error(statusErr.message);

  return caseId;
}

export interface UpdateCasePayload {
  insurerName: string;
  insuranceType: string;
  policyCategory: string;
  policyNo: string;
  claimNo: string;
  dateOfAccident: string;
  caseReferenceNo: string;
  intimationDate: string;
  insuredId?: string;
  insuredName: string;
  insuredCompany: string;
  vehicles: VehicleFormItem[];
}

/**
 * Updates the case, its (single) insured record, and its vehicles/drivers.
 * Vehicles present in `originalVehicleIds` but missing from `payload.vehicles` are deleted
 * (their driver row cascades). Not atomic (client-side sequence), matching `createCase` above.
 */
export async function updateCase(
  caseId: string,
  payload: UpdateCasePayload,
  originalVehicleIds: string[],
): Promise<void> {
  const { error: caseErr } = await supabase
    .from("cases")
    .update({
      insurer_name: payload.insurerName.trim(),
      insurance_type: payload.insuranceType,
      policy_category: payload.policyCategory,
      policy_no: payload.policyNo,
      claim_no: payload.claimNo,
      date_of_accident: payload.dateOfAccident,
      case_reference_no: payload.caseReferenceNo,
      intimation_date: payload.intimationDate,
    })
    .eq("id", caseId);
  if (caseErr) throw new Error(caseErr.message);

  if (payload.insuredId) {
    const { error: insuredErr } = await supabase
      .from("insureds")
      .update({
        insured_name: payload.insuredName,
        insured_company: payload.insuredCompany || null,
      })
      .eq("id", payload.insuredId);
    if (insuredErr) throw new Error(insuredErr.message);
  } else if (payload.insuredName) {
    const { error: insuredErr } = await supabase.from("insureds").insert({
      insured_name: payload.insuredName,
      insured_company: payload.insuredCompany || null,
      case_id: caseId,
    });
    if (insuredErr) throw new Error(insuredErr.message);
  }

  const keptVehicleIds = new Set(payload.vehicles.filter((v) => v.id).map((v) => v.id as string));
  const removedVehicleIds = originalVehicleIds.filter((id) => !keptVehicleIds.has(id));
  for (const vehicleId of removedVehicleIds) {
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
    if (error) throw new Error(error.message);
  }

  for (const vehicle of payload.vehicles) {
    let vehicleId = vehicle.id;
    if (vehicleId) {
      const { error } = await supabase
        .from("vehicles")
        .update({
          vehicle_no: vehicle.vehicleNo,
          vehicle_registration_date: vehicle.vehicleRegistrationDate || null,
          vehicle_type: vehicle.vehicleType || null,
          vehicle_category: vehicle.vehicleCategory || null,
          vehicle_owner: vehicle.vehicleOwner || null,
        })
        .eq("id", vehicleId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          vehicle_no: vehicle.vehicleNo,
          vehicle_registration_date: vehicle.vehicleRegistrationDate || null,
          vehicle_type: vehicle.vehicleType || null,
          vehicle_category: vehicle.vehicleCategory || null,
          vehicle_owner: vehicle.vehicleOwner || null,
          case_id: caseId,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      vehicleId = data.id as string;
    }

    if (vehicle.driverId) {
      if (vehicle.driverName) {
        const { error } = await supabase
          .from("drivers")
          .update({
            driver_name: vehicle.driverName,
            driving_license: vehicle.drivingLicense || null,
          })
          .eq("id", vehicle.driverId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("drivers").delete().eq("id", vehicle.driverId);
        if (error) throw new Error(error.message);
      }
    } else if (vehicle.driverName) {
      const { error } = await supabase.from("drivers").insert({
        driver_name: vehicle.driverName,
        vehicle_id: vehicleId,
        driving_license: vehicle.drivingLicense || null,
      });
      if (error) throw new Error(error.message);
    }
  }
}

/** Deletes a case and all dependent rows (insureds, vehicles, drivers, visits, statuses, etc. cascade). Admin-only per RLS. */
export async function deleteCase(caseId: string): Promise<void> {
  const { error } = await supabase.from("cases").delete().eq("id", caseId);
  if (error) throw new Error(error.message);
}

export async function assignSurveyor(caseId: string, surveyorId: string, deputedDate: string): Promise<void> {
  const { error } = await supabase
    .from("cases")
    .update({ assigned_surveyor_id: surveyorId, deputed_date: deputedDate })
    .eq("id", caseId);
  if (error) throw new Error(error.message);

  const { error: statusErr } = await supabase.from("statuses").insert({
    case_id: caseId,
    stage: "deputed",
    status_date: deputedDate,
    surveyor_id: surveyorId,
    status_remarks: "Surveyor deputed",
  });
  if (statusErr) throw new Error(statusErr.message);
}

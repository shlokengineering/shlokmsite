import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCaseDetail, assignSurveyor, deleteCase, type CaseDetail } from "./api";
import { useAuth } from "../auth/AuthContext";
import { listProfiles } from "../admin/api";
import { isAdminRole, type Profile } from "../../types/domain";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import StatusTimeline from "../statuses/StatusTimeline";
import UpdateStatusForm from "../statuses/UpdateStatusForm";
import AddVisitForm from "../visits/AddVisitForm";
import PaymentPanel from "../payments/PaymentPanel";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [selectedSurveyor, setSelectedSurveyor] = useState("");
  const [deputeDate, setDeputeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    if (!id) return;
    setLoading(true);
    try {
      setDetail(await getCaseDetail(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isAdminRole(profile?.role)) {
      listProfiles()
        .then(setProfiles)
        .catch((err) =>
          setProfilesError(err instanceof Error ? err.message : "Failed to load deputation users"),
        );
    }
  }, [profile]);

  useEffect(() => {
    if (!detail) return;
    setSelectedSurveyor(detail.case.assignedSurveyorId ?? "");
    setDeputeDate(detail.case.deputedDate ?? new Date().toISOString().slice(0, 10));
    // Only re-sync when a (new) case loads, so in-progress edits here survive
    // refreshes triggered by other panels (status/visit/payment saves).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.case.id]);

  async function handleAssign() {
    if (!id || !deputationUsers.some((person) => person.id === selectedSurveyor)) return;
    setAssigning(true);
    try {
      await assignSurveyor(id, selectedSurveyor, deputeDate);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign surveyor");
    } finally {
      setAssigning(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Delete this case and all its related records? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteCase(id);
      navigate("/cases");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete case");
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading case…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!detail) return null;

  const { case: c, insureds, vehicles, drivers, visits, statuses, payment } = detail;
  const assignedSurveyor = profiles.find((person) => person.id === c.assignedSurveyorId);
  const deputationUsers = profiles.filter(
    (person) => person.role === "admin" || person.role === "surveyor",
  );
  const isAdmin = isAdminRole(profile?.role);
  const isAssignedUser = profile?.id === c.assignedSurveyorId;
  const canActAsSurveyor = profile?.role === "surveyor" && isAssignedUser;
  const statusActorId = isAssignedUser ? profile.id : null;
  const assignedSurveyorName = c.assignedSurveyorId
    ? (profile?.id === c.assignedSurveyorId ? profile.fullName : assignedSurveyor?.fullName) ?? "Unknown"
    : "Unassigned";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{c.caseReferenceNo}</h1>
          <p className="text-sm text-slate-500">
            {c.insurerName} · {c.insuranceType} · Policy {c.policyNo} · Claim {c.claimNo}
          </p>
          <p className="text-sm text-slate-500">Date of accident: {c.dateOfAccident}</p>
          <p className="text-sm text-slate-500">Intimation date: {c.intimationDate}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              to={`/cases/${c.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Edit case
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:border-red-400 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete case"}
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-medium text-slate-900">Insured</h2>
          {insureds.length === 0 && <p className="text-sm text-slate-500">None recorded.</p>}
          {insureds.map((i) => (
            <p key={i.id} className="text-sm text-slate-600">
              {i.insuredName}
              {i.insuredCompany ? ` (${i.insuredCompany})` : ""}
            </p>
          ))}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-medium text-slate-900">Vehicle</h2>
          {vehicles.length === 0 && <p className="text-sm text-slate-500">None recorded.</p>}
          {vehicles.map((v) => (
            <div key={v.id} className="mb-2 text-sm text-slate-600">
              <p>
                {v.vehicleNo} · {v.vehicleType ?? "—"} · {v.vehicleCategory ?? "—"}
              </p>
              <p>Owner: {v.vehicleOwner ?? "—"}</p>
              {drivers
                .filter((d) => d.vehicleId === v.id)
                .map((d) => (
                  <p key={d.id}>
                    Driver: {d.driverName} ({d.drivingLicense ?? "no license on file"})
                  </p>
                ))}
            </div>
          ))}
        </section>
      </div>

      {isAdmin && (
        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-medium text-slate-900">Deputation</h2>
          <p className="mb-2 text-sm text-slate-600">
            Currently assigned to: <strong>{assignedSurveyor?.fullName ?? "Unassigned"}</strong>
            {assignedSurveyor ? ` (${assignedSurveyor.role === "admin" ? "Admin" : assignedSurveyor.role})` : ""}
            {c.deputedDate ? ` on ${c.deputedDate}` : ""}
          </p>
          {profilesError && <ErrorMessage message={profilesError} />}
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="deputation-user">
                Surveyor or admin
              </label>
              <select
                id="deputation-user"
                value={selectedSurveyor}
                onChange={(e) => setSelectedSurveyor(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Select user…</option>
                {deputationUsers.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName} ({person.role === "admin" ? "Admin" : "Surveyor"})
                  </option>
                ))}
              </select>
              {profiles.length > 0 && deputationUsers.length === 0 && (
                <p className="mt-1 text-sm text-slate-500">No approved users are available.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="deputation-date">
                Depute date
              </label>
              <input
                id="deputation-date"
                type="date"
                value={deputeDate}
                onChange={(e) => setDeputeDate(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <button
              onClick={handleAssign}
              disabled={!deputationUsers.some((person) => person.id === selectedSurveyor) || assigning}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {assigning ? "Saving…" : "Save"}
            </button>
          </div>
        </section>
      )}

      {(canActAsSurveyor || isAdmin) && session && (
        <div className="grid gap-4 sm:grid-cols-2">
          <UpdateStatusForm caseId={c.id} surveyorId={statusActorId} onAdded={refresh} />
          <AddVisitForm caseId={c.id} surveyorId={statusActorId} onAdded={refresh} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 font-medium text-slate-900">Status history</h2>
          <StatusTimeline statuses={statuses} />
        </section>

        <section>
          <h2 className="mb-2 font-medium text-slate-900">Visit history</h2>
          {visits.length === 0 ? (
            <p className="text-sm text-slate-500">No visits recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Visit No.</th>
                    <th className="px-4 py-2">Visit Date</th>
                    <th className="px-4 py-2">Surveyor Name</th>
                    <th className="px-4 py-2">Site Address</th>
                    <th className="px-4 py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.visitNo} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-900">{v.visitNo}</td>
                      <td className="px-4 py-2 text-slate-600">{v.visitDate}</td>
                      <td className="px-4 py-2 text-slate-600">{assignedSurveyorName}</td>
                      <td className="px-4 py-2 text-slate-600">{v.siteAddress ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{v.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isAdmin && <PaymentPanel caseId={c.id} payment={payment} onSaved={refresh} />}
    </div>
  );
}

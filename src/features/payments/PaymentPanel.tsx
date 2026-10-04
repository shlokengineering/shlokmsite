import { useState, type FormEvent } from "react";
import type { Payment, PaymentStatus } from "../../types/domain";
import { upsertPayment } from "./api";

const STATUSES: PaymentStatus[] = ["pending", "partial", "paid"];

export default function PaymentPanel({
  caseId,
  payment,
  onSaved,
}: {
  caseId: string;
  payment: Payment | null;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(payment?.amount?.toString() ?? "");
  const [status, setStatus] = useState<PaymentStatus>(payment?.paymentStatus ?? "pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await upsertPayment(caseId, Number(amount), status);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <h3 className="font-medium text-slate-900">Payment</h3>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="payment-amount">
          Amount (NPR)
        </label>
        <input
          id="payment-amount"
          type="number"
          min="0"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="payment-status">
          Status
        </label>
        <select
          id="payment-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save payment"}
      </button>
    </form>
  );
}

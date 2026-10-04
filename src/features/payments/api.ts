import { supabase } from "../../lib/supabase";
import type { PaymentStatus } from "../../types/domain";

export async function upsertPayment(caseId: string, amount: number, paymentStatus: PaymentStatus): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .upsert({ case_id: caseId, amount, payment_status: paymentStatus }, { onConflict: "case_id" });
  if (error) throw new Error(error.message);
}

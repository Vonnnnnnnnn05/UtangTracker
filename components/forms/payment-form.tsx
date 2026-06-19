"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { getCurrentBalance } from "@/lib/debt";
import { createPayment } from "@/lib/firebase/api";
import { formatPeso } from "@/lib/money";
import type { Debt } from "@/lib/types";

export function PaymentForm({
  ownerId,
  debts,
  defaultDebtId,
  onSaved,
}: {
  ownerId: string;
  debts: Debt[];
  defaultDebtId?: string;
  onSaved?: () => void;
}) {
  const unpaidDebts = debts.filter((debt) => getCurrentBalance(debt) > 0);
  const [selectedDebtId, setSelectedDebtId] = useState(defaultDebtId ?? unpaidDebts[0]?.id ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const selectedDebt = unpaidDebts.find((debt) => debt.id === selectedDebtId);
  const selectedBalance = selectedDebt ? getCurrentBalance(selectedDebt) : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    setPending(true);

    const formData = new FormData(form);
    const debtId = String(formData.get("debtId") ?? "");
    const debt = unpaidDebts.find((item) => item.id === debtId);
    const amountPaid = Number(formData.get("amountPaid") ?? 0);
    const note = String(formData.get("note") ?? "").trim();

    try {
      if (!debt) throw new Error("Choose an unpaid debt.");
      if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
        throw new Error("Payment amount must be greater than zero.");
      }

      await createPayment(ownerId, {
        debtId: debt.id,
        customerId: debt.customerId,
        amountPaid,
        note,
      });
      form.reset();
      setSuccess("Payment saved.");
      onSaved?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to record payment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="grid gap-4">
        <label className="block text-sm font-semibold text-ink" htmlFor="debtId">
          Debt
          <select
            className="focus-ring mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            id="debtId"
            name="debtId"
            onChange={(event) => setSelectedDebtId(event.target.value)}
            required
            value={selectedDebtId}
          >
            <option value="">Choose debt</option>
            {unpaidDebts.map((debt) => (
              <option key={debt.id} value={debt.id}>
                {formatPeso(getCurrentBalance(debt))} due {debt.dueDate.toDate().toLocaleDateString("en-PH")}
              </option>
            ))}
          </select>
        </label>
        <Input
          helper={selectedBalance ? `Current balance: ${formatPeso(selectedBalance)}` : undefined}
          inputMode="decimal"
          label="Amount paid"
          max={selectedBalance}
          min="1"
          name="amountPaid"
          required
          step="0.01"
          type="number"
        />
        <Textarea label="Note" name="note" />
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-clay">{error}</p> : null}
      {success ? <p className="mt-3 text-sm font-semibold text-leaf">{success}</p> : null}
      <Button className="mt-4 w-full sm:w-auto" disabled={pending || unpaidDebts.length === 0} type="submit">
        {pending ? "Saving..." : "Record payment"}
      </Button>
    </form>
  );
}

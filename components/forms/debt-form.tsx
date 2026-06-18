"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { dateInputValue } from "@/lib/date";
import { createDebt, updateDebt } from "@/lib/firebase/api";
import type { Customer, Debt, DebtInput } from "@/lib/types";

export function DebtForm({
  ownerId,
  customers,
  debt,
  onSaved,
}: {
  ownerId: string;
  customers: Customer[];
  debt?: Debt;
  onSaved?: () => void;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    setPending(true);

    const formData = new FormData(form);
    const customerId = String(formData.get("customerId") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const dueDateValue = String(formData.get("dueDate") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    try {
      if (!customerId) throw new Error("Choose a customer for this debt.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero.");
      if (!dueDateValue) throw new Error("Due date is required.");

      const input: DebtInput = {
        customerId,
        originalAmount: amount,
        dueDate: new Date(`${dueDateValue}T00:00:00`),
        note,
      };

      if (debt) {
        await updateDebt(debt.id, input);
        setSuccess("Debt updated.");
      } else {
        const debtId = await createDebt(ownerId, input);
        form.reset();
        setSuccess(`Debt saved. ID: ${debtId}`);
      }

      onSaved?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save debt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="grid gap-4">
        <label className="block text-sm font-semibold text-ink" htmlFor="customerId">
          Customer
          <select
            className="focus-ring mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            defaultValue={debt?.customerId ?? ""}
            id="customerId"
            name="customerId"
            required
          >
            <option value="">Choose customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          defaultValue={debt?.originalAmount}
          inputMode="decimal"
          label="Amount"
          min="1"
          name="amount"
          required
          step="0.01"
          type="number"
        />
        <Input
          defaultValue={debt ? dateInputValue(debt.dueDate.toDate()) : dateInputValue()}
          label="Due date"
          name="dueDate"
          required
          type="date"
        />
        <Textarea defaultValue={debt?.note} label="Note" name="note" />
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-clay">{error}</p> : null}
      {success ? <p className="mt-3 text-sm font-semibold text-leaf">{success}</p> : null}
      <Button className="mt-4 w-full sm:w-auto" disabled={pending || customers.length === 0} type="submit">
        {pending ? "Saving..." : debt ? "Save debt" : "Add debt"}
      </Button>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { dateInputValue } from "@/lib/date";
import {
  calculateDebtTotal,
  calculateInterestAmount,
  getInterestPeriod,
  getInterestRatePercent,
  getPrincipalAmount,
} from "@/lib/debt";
import { createDebt, updateDebt } from "@/lib/firebase/api";
import type { Customer, Debt, DebtInput } from "@/lib/types";
import { formatPeso } from "@/lib/money";
import type { InterestPeriodUnit } from "@/lib/types";

type InterestPeriodPreset = "20-days" | "1-month" | "custom";

function getInitialPeriod(debt?: Debt): {
  preset: InterestPeriodPreset;
  value: string;
  unit: InterestPeriodUnit;
} {
  const period = debt ? getInterestPeriod(debt) : null;

  if (!period) {
    return { preset: "1-month", value: "1", unit: "months" };
  }

  if (period.value === 20 && period.unit === "days") {
    return { preset: "20-days", value: "20", unit: "days" };
  }

  if (period.value === 1 && period.unit === "months") {
    return { preset: "1-month", value: "1", unit: "months" };
  }

  return { preset: "custom", value: String(period.value), unit: period.unit };
}

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
  const [principalAmount, setPrincipalAmount] = useState(
    debt ? String(getPrincipalAmount(debt)) : "",
  );
  const [interestRatePercent, setInterestRatePercent] = useState(
    debt ? String(getInterestRatePercent(debt)) : "10",
  );
  const initialPeriod = getInitialPeriod(debt);
  const [interestPeriodPreset, setInterestPeriodPreset] = useState<InterestPeriodPreset>(
    initialPeriod.preset,
  );
  const [interestPeriodValue, setInterestPeriodValue] = useState(initialPeriod.value);
  const [interestPeriodUnit, setInterestPeriodUnit] = useState<InterestPeriodUnit>(
    initialPeriod.unit,
  );
  const parsedPrincipal = Number(principalAmount || 0);
  const parsedRate = Number(interestRatePercent || 0);
  const previewInterest =
    Number.isFinite(parsedPrincipal) && Number.isFinite(parsedRate)
      ? calculateInterestAmount(parsedPrincipal, parsedRate)
      : 0;
  const previewTotal =
    Number.isFinite(parsedPrincipal) && Number.isFinite(parsedRate)
      ? calculateDebtTotal(parsedPrincipal, parsedRate)
      : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    setPending(true);

    const formData = new FormData(form);
    const customerId = String(formData.get("customerId") ?? "");
    const principal = Number(formData.get("principalAmount") ?? 0);
    const interestRate = Number(formData.get("interestRatePercent") ?? 0);
    const periodValue = Number(formData.get("interestPeriodValue") ?? 0);
    const periodUnit = String(formData.get("interestPeriodUnit") ?? "months") as InterestPeriodUnit;
    const dueDateValue = String(formData.get("dueDate") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    try {
      if (!customerId) throw new Error("Choose a customer for this debt.");
      if (!Number.isFinite(principal) || principal <= 0) {
        throw new Error("Principal amount must be greater than zero.");
      }
      if (!Number.isFinite(interestRate) || interestRate < 0) {
        throw new Error("Interest rate cannot be negative.");
      }
      if (!Number.isFinite(periodValue) || periodValue <= 0) {
        throw new Error("Interest period must be greater than zero.");
      }
      if (!dueDateValue) throw new Error("Due date is required.");

      const input: DebtInput = {
        customerId,
        principalAmount: principal,
        interestRatePercent: interestRate,
        interestPeriodValue: periodValue,
        interestPeriodUnit: periodUnit,
        dueDate: new Date(`${dueDateValue}T00:00:00`),
        note,
      };

      if (debt) {
        await updateDebt(debt.id, input);
        setSuccess("Debt updated.");
      } else {
        const debtId = await createDebt(ownerId, input);
        form.reset();
        setPrincipalAmount("");
        setInterestRatePercent("10");
        setInterestPeriodPreset("1-month");
        setInterestPeriodValue("1");
        setInterestPeriodUnit("months");
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
          inputMode="decimal"
          label="Principal amount"
          min="1"
          name="principalAmount"
          onChange={(event) => setPrincipalAmount(event.target.value)}
          required
          step="0.01"
          type="number"
          value={principalAmount}
        />
        <Input
          helper="Use 10 for 10%, or change it based on the agreement."
          inputMode="decimal"
          label="Interest rate (%)"
          min="0"
          name="interestRatePercent"
          onChange={(event) => setInterestRatePercent(event.target.value)}
          required
          step="0.01"
          type="number"
          value={interestRatePercent}
        />
        <fieldset className="rounded-md border border-line bg-white p-3">
          <legend className="px-1 text-sm font-semibold text-ink">When will the interest occur?</legend>
          <input name="interestPeriodValue" type="hidden" value={interestPeriodValue} />
          <input name="interestPeriodUnit" type="hidden" value={interestPeriodUnit} />
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink">
              <input
                checked={interestPeriodPreset === "20-days"}
                name="interestPeriodPreset"
                onChange={() => {
                  setInterestPeriodPreset("20-days");
                  setInterestPeriodValue("20");
                  setInterestPeriodUnit("days");
                }}
                type="radio"
              />
              20 days
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink">
              <input
                checked={interestPeriodPreset === "1-month"}
                name="interestPeriodPreset"
                onChange={() => {
                  setInterestPeriodPreset("1-month");
                  setInterestPeriodValue("1");
                  setInterestPeriodUnit("months");
                }}
                type="radio"
              />
              1 month
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink">
              <input
                checked={interestPeriodPreset === "custom"}
                name="interestPeriodPreset"
                onChange={() => setInterestPeriodPreset("custom")}
                type="radio"
              />
              Custom
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
            <Input
              disabled={interestPeriodPreset !== "custom"}
              inputMode="numeric"
              label="Period value"
              min="1"
              onChange={(event) => setInterestPeriodValue(event.target.value)}
              required
              step="1"
              type="number"
              value={interestPeriodValue}
            />
            <label className="block text-sm font-semibold text-ink" htmlFor="interestPeriodUnit">
              Period unit
              <select
                className="focus-ring mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink disabled:opacity-50"
                disabled={interestPeriodPreset !== "custom"}
                id="interestPeriodUnit"
                onChange={(event) => setInterestPeriodUnit(event.target.value as InterestPeriodUnit)}
                value={interestPeriodUnit}
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
              </select>
            </label>
          </div>
        </fieldset>
        <div className="grid gap-3 rounded-md bg-paper p-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-muted">Interest income</p>
            <p className="text-lg font-black tabular-nums text-leaf">{formatPeso(previewInterest)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted">Total to collect</p>
            <p className="text-lg font-black tabular-nums text-ink">{formatPeso(previewTotal)}</p>
          </div>
        </div>
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

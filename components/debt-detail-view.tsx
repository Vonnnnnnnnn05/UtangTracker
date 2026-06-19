"use client";

import { ArrowLeft, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DebtForm } from "@/components/forms/debt-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import {
  formatInterestPeriod,
  getAccruedInterestAmount,
  getCollectedInterest,
  getCurrentBalance,
  getCurrentDebtTotal,
  getDebtStatus,
  getInterestRatePercent,
  getPrincipalAmount,
  getOutstandingInterest,
} from "@/lib/debt";
import { deleteDebt, markDebtPaid } from "@/lib/firebase/api";
import { useOwnerData } from "@/lib/firebase/use-owner-data";
import { formatPeso } from "@/lib/money";

export function DebtDetailView({ debtId }: { debtId: string }) {
  const { ownerId, customers, debts, payments } = useOwnerData();
  const [editing, setEditing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const debt = debts.data.find((item) => item.id === debtId);
  const customer = debt ? customers.data.find((item) => item.id === debt.customerId) : null;
  const debtPayments = payments.data.filter((payment) => payment.debtId === debtId);

  async function handlePaid() {
    if (!debt) return;
    await markDebtPaid(debt);
  }

  async function handleDelete() {
    if (!debt || !window.confirm("Delete this debt record?")) return;
    await deleteDebt(debt.id);
  }

  if (!debt && !debts.loading) {
    return (
      <div className="space-y-4 md:pl-56">
        <Link className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-leaf" href="/debts">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to debts
        </Link>
        <EmptyState title="Debt not found" />
      </div>
    );
  }

  if (!debt) {
    return <p className="md:pl-56 text-sm font-semibold text-muted">Loading debt...</p>;
  }

  const dueDate = debt.dueDate.toDate();
  const status = getDebtStatus({ ...debt, dueDate });
  const principalAmount = getPrincipalAmount(debt);
  const interestRatePercent = getInterestRatePercent(debt);
  const interestAmount = getAccruedInterestAmount(debt);
  const collectedInterest = getCollectedInterest(debt);
  const outstandingInterest = getOutstandingInterest(debt);
  const currentBalance = getCurrentBalance(debt);
  const currentTotal = getCurrentDebtTotal(debt);
  const interestPeriod = formatInterestPeriod(debt);

  return (
    <div className="space-y-5 md:pl-56">
      <Link className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-leaf" href="/debts">
        <ArrowLeft aria-hidden="true" size={18} />
        Back to debts
      </Link>

      <section className="rounded-lg border border-line bg-surface p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase text-leaf">Debt record</p>
            <h1 className="text-3xl font-black text-ink">{customer?.name ?? "Customer"}</h1>
            <p className="mt-1 text-sm font-semibold text-muted">Due {dueDate.toLocaleDateString("en-PH")}</p>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs font-bold uppercase text-muted">Balance</p>
            <p className="text-2xl font-black text-ink">{formatPeso(currentBalance)}</p>
          </div>
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs font-bold uppercase text-muted">Total to collect</p>
            <p className="text-2xl font-black text-ink">{formatPeso(currentTotal)}</p>
          </div>
          <div className="rounded-md bg-mint p-3">
            <p className="text-xs font-bold uppercase text-leaf">Interest income</p>
            <p className="text-2xl font-black text-leaf">{formatPeso(interestAmount)}</p>
          </div>
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs font-bold uppercase text-muted">Principal</p>
            <p className="text-xl font-black text-ink">{formatPeso(principalAmount)}</p>
          </div>
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs font-bold uppercase text-muted">Interest rate</p>
            <p className="text-xl font-black text-ink">{interestRatePercent}%</p>
          </div>
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs font-bold uppercase text-muted">Interest occurs</p>
            <p className="text-xl font-black text-ink">Every {interestPeriod}</p>
          </div>
          <div className="rounded-md bg-paper p-3">
            <p className="text-xs font-bold uppercase text-muted">Income collected</p>
            <p className="text-xl font-black text-ink">{formatPeso(collectedInterest)}</p>
            <p className="text-xs font-semibold text-muted">Outstanding {formatPeso(outstandingInterest)}</p>
          </div>
        </div>

        {debt.note ? <p className="mt-4 rounded-md bg-paper p-3 text-sm text-ink">{debt.note}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={currentBalance <= 0} onClick={() => setShowPayment((current) => !current)} type="button">
            Record payment
          </Button>
          <Button disabled={currentBalance <= 0} onClick={handlePaid} type="button" variant="secondary">
            <CheckCircle2 aria-hidden="true" size={17} />
            Mark paid
          </Button>
          <Button onClick={() => setEditing((current) => !current)} type="button" variant="secondary">
            <Pencil aria-hidden="true" size={17} />
            Edit
          </Button>
          <Button onClick={handleDelete} type="button" variant="danger">
            <Trash2 aria-hidden="true" size={17} />
            Delete
          </Button>
        </div>
      </section>

      {showPayment && ownerId ? (
        <PaymentForm
          debts={[debt]}
          defaultDebtId={debt.id}
          ownerId={ownerId}
          onSaved={() => setShowPayment(false)}
        />
      ) : null}
      {editing && ownerId ? (
        <DebtForm
          customers={customers.data}
          debt={debt}
          ownerId={ownerId}
          onSaved={() => setEditing(false)}
        />
      ) : null}

      <section className="rounded-lg border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-lg font-black text-ink">Payments</h2>
        {debtPayments.length ? (
          <div className="mt-3 divide-y divide-line">
            {debtPayments.map((payment) => (
              <div className="flex items-center justify-between gap-3 py-3" key={payment.id}>
                <div>
                  <p className="text-sm font-bold text-ink">{payment.paidAt.toDate().toLocaleDateString("en-PH")}</p>
                  {payment.note ? <p className="text-xs font-semibold text-muted">{payment.note}</p> : null}
                </div>
                <p className="text-sm font-black text-leaf">{formatPeso(payment.amountPaid)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState title="No payments recorded yet" />
          </div>
        )}
      </section>
    </div>
  );
}

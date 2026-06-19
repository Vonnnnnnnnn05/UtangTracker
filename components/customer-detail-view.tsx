"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomerForm } from "@/components/forms/customer-form";
import { DebtForm } from "@/components/forms/debt-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import {
  formatInterestPeriod,
  getAccruedInterestAmount,
  getCurrentBalance,
  getDebtStatus,
  getInterestRatePercent,
} from "@/lib/debt";
import { deleteCustomer } from "@/lib/firebase/api";
import { useOwnerData } from "@/lib/firebase/use-owner-data";
import { formatPeso } from "@/lib/money";

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const { ownerId, customers, debts } = useOwnerData();
  const [editing, setEditing] = useState(false);
  const [addingDebt, setAddingDebt] = useState(false);
  const customer = customers.data.find((item) => item.id === customerId);
  const customerDebts = debts.data.filter((debt) => debt.customerId === customerId);
  const totalBalance = customerDebts.reduce((sum, debt) => sum + getCurrentBalance(debt), 0);

  async function handleDelete() {
    if (!customer || !window.confirm(`Delete ${customer.name}? Debt records are not deleted automatically.`)) {
      return;
    }

    await deleteCustomer(customer.id);
  }

  if (!customer && !customers.loading) {
    return (
      <div className="space-y-4 md:pl-56">
        <Link className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-leaf" href="/customers">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to customers
        </Link>
        <EmptyState title="Customer not found" />
      </div>
    );
  }

  if (!customer) {
    return <p className="md:pl-56 text-sm font-semibold text-muted">Loading customer...</p>;
  }

  return (
    <div className="space-y-5 md:pl-56">
      <Link className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-leaf" href="/customers">
        <ArrowLeft aria-hidden="true" size={18} />
        Back to customers
      </Link>

      <section className="rounded-lg border border-line bg-surface p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-ink">{customer.name}</h1>
            <p className="mt-1 text-sm font-semibold text-muted">{customer.phone || "No phone saved"}</p>
            {customer.address ? <p className="mt-1 text-sm text-muted">{customer.address}</p> : null}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-bold text-muted">Balance</p>
            <p className="text-2xl font-black text-ink">{formatPeso(totalBalance)}</p>
          </div>
        </div>
        {customer.notes ? <p className="mt-4 rounded-md bg-paper p-3 text-sm text-ink">{customer.notes}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setEditing((current) => !current)} type="button" variant="secondary">
            <Pencil aria-hidden="true" size={17} />
            Edit
          </Button>
          <Button onClick={() => setAddingDebt((current) => !current)} type="button">
            Add debt
          </Button>
          <Button onClick={handleDelete} type="button" variant="danger">
            <Trash2 aria-hidden="true" size={17} />
            Delete
          </Button>
        </div>
      </section>

      {editing && ownerId ? <CustomerForm customer={customer} ownerId={ownerId} onSaved={() => setEditing(false)} /> : null}
      {addingDebt && ownerId ? (
        <DebtForm customers={[customer]} ownerId={ownerId} onSaved={() => setAddingDebt(false)} />
      ) : null}

      <section className="rounded-lg border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-lg font-black text-ink">Debt records</h2>
        {customerDebts.length ? (
          <div className="mt-3 divide-y divide-line">
            {customerDebts.map((debt) => {
              const dueDate = debt.dueDate.toDate();
              const status = getDebtStatus({ ...debt, dueDate });
              const currentBalance = getCurrentBalance(debt);

              return (
                <Link
                  className="focus-ring flex min-h-16 items-center justify-between gap-3 rounded-md py-3 transition hover:bg-mint/60"
                  href={`/debts/${debt.id}`}
                  key={debt.id}
                >
                  <div>
                    <p className="text-sm font-black text-ink">{formatPeso(currentBalance)}</p>
                    <p className="text-xs font-semibold text-muted">
                      Due {dueDate.toLocaleDateString("en-PH")} - {getInterestRatePercent(debt)}% every{" "}
                      {formatInterestPeriod(debt)}
                    </p>
                    <p className="text-xs font-semibold text-leaf">
                      Income {formatPeso(getAccruedInterestAmount(debt))}
                    </p>
                  </div>
                  <StatusPill status={status} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState title="No debt records for this customer" />
          </div>
        )}
      </section>
    </div>
  );
}

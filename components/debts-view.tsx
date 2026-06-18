"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DebtForm } from "@/components/forms/debt-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getDebtStatus } from "@/lib/debt";
import { useOwnerData } from "@/lib/firebase/use-owner-data";
import { formatPeso } from "@/lib/money";

export function DebtsView() {
  const { ownerId, customers, debts } = useOwnerData();
  const [showForm, setShowForm] = useState(false);
  const customerMap = new Map(customers.data.map((customer) => [customer.id, customer.name]));

  return (
    <div className="space-y-5 md:pl-56">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-leaf">Ledger</p>
          <h1 className="text-3xl font-black text-ink">Debts</h1>
        </div>
        <Button onClick={() => setShowForm((current) => !current)} type="button">
          <Plus aria-hidden="true" size={18} />
          Add debt
        </Button>
      </div>

      {showForm && ownerId ? (
        <DebtForm
          customers={customers.data}
          ownerId={ownerId}
        />
      ) : null}

      {debts.data.length ? (
        <div className="grid gap-3">
          {debts.data.map((debt) => {
            const dueDate = debt.dueDate.toDate();
            const status = getDebtStatus({ ...debt, dueDate });

            return (
              <Link
                className="focus-ring rounded-lg border border-line bg-surface p-4 shadow-soft transition hover:border-leaf"
                href={`/debts/${debt.id}`}
                key={debt.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-ink">
                      {customerMap.get(debt.customerId) ?? "Customer"}
                    </p>
                    <p className="text-sm font-semibold text-muted">Due {dueDate.toLocaleDateString("en-PH")}</p>
                    {debt.note ? <p className="mt-2 text-sm text-muted">{debt.note}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-ink">{formatPeso(debt.balance)}</p>
                    <p className="text-xs font-semibold text-muted">of {formatPeso(debt.originalAmount)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <StatusPill status={status} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title={debts.loading ? "Loading debts..." : "No debt records yet"}>
          Add a customer first, then add their first utang record.
        </EmptyState>
      )}
      {debts.error ? (
        <p className="rounded-md border border-[#E5A18B] bg-[#FFE1D6] px-3 py-2 text-sm font-semibold text-[#8B351F]">
          Firebase could not load debts: {debts.error.message}
        </p>
      ) : null}
    </div>
  );
}

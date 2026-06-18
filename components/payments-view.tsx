"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { PaymentForm } from "@/components/forms/payment-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useOwnerData } from "@/lib/firebase/use-owner-data";
import { formatPeso } from "@/lib/money";

export function PaymentsView() {
  const { ownerId, customers, debts, payments } = useOwnerData();
  const [showForm, setShowForm] = useState(false);
  const customerMap = new Map(customers.data.map((customer) => [customer.id, customer.name]));

  return (
    <div className="space-y-5 md:pl-56">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-leaf">Cash flow</p>
          <h1 className="text-3xl font-black text-ink">Payments</h1>
        </div>
        <Button onClick={() => setShowForm((current) => !current)} type="button">
          <Plus aria-hidden="true" size={18} />
          Record payment
        </Button>
      </div>

      {showForm && ownerId ? (
        <PaymentForm debts={debts.data} ownerId={ownerId} />
      ) : null}

      {payments.data.length ? (
        <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
          <div className="divide-y divide-line">
            {payments.data.map((payment) => (
              <div key={payment.id} className="flex min-h-16 items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-black text-ink">
                    {customerMap.get(payment.customerId) ?? "Customer"}
                  </p>
                  <p className="text-xs font-semibold text-muted">
                    {payment.paidAt.toDate().toLocaleDateString("en-PH")}
                  </p>
                  {payment.note ? <p className="mt-1 text-sm text-muted">{payment.note}</p> : null}
                </div>
                <p className="text-base font-black text-leaf">{formatPeso(payment.amountPaid)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title={payments.loading ? "Loading payments..." : "No payments yet"}>
          Payments will appear here after partial or full payments are recorded.
        </EmptyState>
      )}
      {payments.error ? (
        <p className="rounded-md border border-[#E5A18B] bg-[#FFE1D6] px-3 py-2 text-sm font-semibold text-[#8B351F]">
          Firebase could not load payments: {payments.error.message}
        </p>
      ) : null}
    </div>
  );
}

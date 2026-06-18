"use client";

import { AlertTriangle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { CustomerForm } from "@/components/forms/customer-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCustomerDebtSummary } from "@/lib/dashboard";
import { useOwnerData } from "@/lib/firebase/use-owner-data";
import { formatPeso } from "@/lib/money";

export function CustomersView() {
  const { ownerId, customers, debts } = useOwnerData();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const debtData = debts.data.map((debt) => ({ ...debt, dueDate: debt.dueDate.toDate() }));
  const summaries = getCustomerDebtSummary(customers.data, debtData).filter(({ customer }) => {
    if (!deferredQuery) return true;
    return [customer.name, customer.phone, customer.address]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(deferredQuery));
  });

  return (
    <div className="space-y-5 md:pl-56">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-leaf">Records</p>
          <h1 className="text-3xl font-black text-ink">Customers</h1>
        </div>
        <Button onClick={() => setShowForm((current) => !current)} type="button">
          <Plus aria-hidden="true" size={18} />
          Add customer
        </Button>
      </div>

      {showForm && ownerId ? <CustomerForm ownerId={ownerId} /> : null}

      <label className="relative block" htmlFor="customer-search">
        <span className="sr-only">Search customers</span>
        <Search aria-hidden="true" className="absolute left-3 top-3.5 text-muted" size={18} />
        <input
          className="focus-ring min-h-12 w-full rounded-md border border-line bg-surface px-10 py-2 text-base text-ink"
          id="customer-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, phone, or address"
          type="search"
          value={query}
        />
      </label>

      {summaries.length ? (
        <div className="grid gap-3">
          {summaries.map(({ customer, balance, debtCount, overdueCount }) => (
            <Link
              className="focus-ring rounded-lg border border-line bg-surface p-4 shadow-soft transition hover:border-leaf"
              href={`/customers/${customer.id}`}
              key={customer.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-ink">{customer.name}</p>
                  <p className="text-sm font-semibold text-muted">{customer.phone || "No phone saved"}</p>
                  {customer.address ? <p className="mt-1 text-sm text-muted">{customer.address}</p> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-ink">{formatPeso(balance)}</p>
                  <p className="text-xs font-semibold text-muted">{debtCount} debt records</p>
                </div>
              </div>
              {overdueCount > 0 ? (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#FFE1D6] px-2.5 py-1 text-xs font-bold text-[#8B351F]">
                  <AlertTriangle aria-hidden="true" size={14} />
                  {overdueCount} overdue
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={customers.loading ? "Loading customers..." : "No customers yet"}>
          Add your first customer to start tracking utang.
        </EmptyState>
      )}
      {customers.error ? (
        <p className="rounded-md border border-[#E5A18B] bg-[#FFE1D6] px-3 py-2 text-sm font-semibold text-[#8B351F]">
          Firebase could not load customers: {customers.error.message}
        </p>
      ) : null}
      {debts.error ? (
        <p className="rounded-md border border-[#E5A18B] bg-[#FFE1D6] px-3 py-2 text-sm font-semibold text-[#8B351F]">
          Firebase could not load debts: {debts.error.message}
        </p>
      ) : null}
    </div>
  );
}

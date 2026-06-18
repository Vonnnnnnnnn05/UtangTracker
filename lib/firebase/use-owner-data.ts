"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { customersQuery, debtsQuery, paymentsQuery } from "@/lib/firebase/api";
import { useCollection } from "@/lib/firebase/hooks";
import type { Customer, Debt, Payment } from "@/lib/types";

function byCreatedAtDesc<T extends { createdAt?: { toMillis(): number } }>(items: T[]) {
  return items.toSorted((left, right) => {
    return (right.createdAt?.toMillis() ?? 0) - (left.createdAt?.toMillis() ?? 0);
  });
}

export function useOwnerData() {
  const { user } = useAuth();
  const ownerId = user?.uid ?? null;
  const customerQuery = useMemo(() => (ownerId ? customersQuery(ownerId) : null), [ownerId]);
  const debtQuery = useMemo(() => (ownerId ? debtsQuery(ownerId) : null), [ownerId]);
  const paymentQuery = useMemo(() => (ownerId ? paymentsQuery(ownerId) : null), [ownerId]);

  const customers = useCollection<Customer>(customerQuery);
  const debts = useCollection<Debt>(debtQuery);
  const payments = useCollection<Payment>(paymentQuery);

  return {
    ownerId,
    customers: {
      ...customers,
      data: byCreatedAtDesc(customers.data).filter((customer) => !customer.archivedAt),
    },
    debts: {
      ...debts,
      data: byCreatedAtDesc(debts.data),
    },
    payments: {
      ...payments,
      data: payments.data.toSorted(
        (left, right) => (right.paidAt?.toMillis() ?? 0) - (left.paidAt?.toMillis() ?? 0),
      ),
    },
  };
}

"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { converter } from "@/lib/firebase/converters";
import { calculateBalanceAfterPayment, getDebtStatus } from "@/lib/debt";
import type { Customer, CustomerInput, Debt, DebtInput, Payment, PaymentInput } from "@/lib/types";

const customerCollection = collection(db, "customers").withConverter(converter<Customer>());
const debtCollection = collection(db, "debts").withConverter(converter<Debt>());
const paymentCollection = collection(db, "payments").withConverter(converter<Payment>());

export function customersQuery(ownerId: string) {
  return query(customerCollection, where("ownerId", "==", ownerId));
}

export function debtsQuery(ownerId: string) {
  return query(debtCollection, where("ownerId", "==", ownerId));
}

export function paymentsQuery(ownerId: string) {
  return query(paymentCollection, where("ownerId", "==", ownerId));
}

export async function createCustomer(ownerId: string, input: CustomerInput) {
  const now = serverTimestamp();
  const customerRef = await addDoc(customerCollection, {
    ...input,
    ownerId,
    createdAt: now,
    updatedAt: now,
  } as Omit<Customer, "id">);
  return customerRef.id;
}

export async function updateCustomer(customerId: string, input: CustomerInput) {
  await updateDoc(doc(db, "customers", customerId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(customerId: string) {
  await deleteDoc(doc(db, "customers", customerId));
}

export async function createDebt(ownerId: string, input: DebtInput) {
  const now = serverTimestamp();
  const dueDate = Timestamp.fromDate(input.dueDate);

  const debtRef = await addDoc(debtCollection, {
    ownerId,
    customerId: input.customerId,
    originalAmount: input.originalAmount,
    balance: input.originalAmount,
    dueDate,
    status: getDebtStatus({
      originalAmount: input.originalAmount,
      balance: input.originalAmount,
      dueDate: input.dueDate,
    }),
    note: input.note,
    createdAt: now,
    updatedAt: now,
  } as Omit<Debt, "id">);
  return debtRef.id;
}

export async function updateDebt(debtId: string, input: Partial<DebtInput>) {
  const data: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.customerId) data.customerId = input.customerId;
  if (typeof input.originalAmount === "number") {
    data.originalAmount = input.originalAmount;
    data.balance = input.originalAmount;
  }
  if (input.dueDate) data.dueDate = Timestamp.fromDate(input.dueDate);
  if (typeof input.note === "string") data.note = input.note;

  await updateDoc(doc(db, "debts", debtId), data);
}

export async function markDebtPaid(debt: Debt) {
  await updateDoc(doc(db, "debts", debt.id), {
    balance: 0,
    status: "paid",
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDebt(debtId: string) {
  await deleteDoc(doc(db, "debts", debtId));
}

export async function createPayment(ownerId: string, input: PaymentInput) {
  const debtRef = doc(db, "debts", input.debtId);
  const paymentRef = collection(db, "payments");

  await runTransaction(db, async (transaction) => {
    const debtSnapshot = await transaction.get(debtRef);
    if (!debtSnapshot.exists()) {
      throw new Error("Debt record was not found.");
    }

    const debt = { id: debtSnapshot.id, ...debtSnapshot.data() } as Debt;
    const amountPaid = Math.min(input.amountPaid, Math.max(0, debt.balance));
    const balance = calculateBalanceAfterPayment(debt.balance, amountPaid);
    const paidAt = Timestamp.now();
    const status = getDebtStatus({
      originalAmount: debt.originalAmount,
      balance,
      dueDate: debt.dueDate.toDate(),
    });

    transaction.set(doc(paymentRef), {
      ownerId,
      debtId: input.debtId,
      customerId: input.customerId,
      amountPaid,
      paidAt,
      note: input.note,
    });

    transaction.update(debtRef, {
      balance,
      status,
      paidAt: balance === 0 ? paidAt : null,
      updatedAt: paidAt,
    });
  });
}

export async function getCustomer(customerId: string) {
  const snapshot = await getDoc(doc(db, "customers", customerId).withConverter(converter<Customer>()));
  return snapshot.exists() ? snapshot.data() : null;
}

import type { Timestamp } from "firebase/firestore";

export type DebtStatus = "unpaid" | "partial" | "paid" | "overdue";

export type Customer = {
  id: string;
  ownerId: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt?: Timestamp;
};

export type Debt = {
  id: string;
  ownerId: string;
  customerId: string;
  originalAmount: number;
  balance: number;
  dueDate: Timestamp;
  status: DebtStatus;
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
};

export type Payment = {
  id: string;
  ownerId: string;
  debtId: string;
  customerId: string;
  amountPaid: number;
  paidAt: Timestamp;
  note?: string;
};

export type CustomerInput = {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type DebtInput = {
  customerId: string;
  originalAmount: number;
  dueDate: Date;
  note?: string;
};

export type PaymentInput = {
  debtId: string;
  customerId: string;
  amountPaid: number;
  note?: string;
};

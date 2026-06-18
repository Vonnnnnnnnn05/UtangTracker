import type { Debt, DebtStatus } from "@/lib/types";
import { isBeforeToday, isSameLocalDay } from "@/lib/date";

type DebtLike = Pick<Debt, "balance" | "originalAmount"> & {
  dueDate: Date;
};

export function getDebtStatus(debt: DebtLike, today = new Date()): DebtStatus {
  if (debt.balance <= 0) {
    return "paid";
  }

  if (isBeforeToday(debt.dueDate, today)) {
    return "overdue";
  }

  if (debt.balance < debt.originalAmount) {
    return "partial";
  }

  return "unpaid";
}

export function calculateBalanceAfterPayment(balance: number, amountPaid: number): number {
  return Math.max(0, balance - amountPaid);
}

export function isDueToday(debt: Pick<Debt, "balance"> & { dueDate: Date }, today = new Date()): boolean {
  return debt.balance > 0 && isSameLocalDay(debt.dueDate, today);
}

export function isOverdue(debt: Pick<Debt, "balance"> & { dueDate: Date }, today = new Date()): boolean {
  return debt.balance > 0 && isBeforeToday(debt.dueDate, today);
}

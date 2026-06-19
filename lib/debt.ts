import type { Debt, DebtStatus, InterestPeriodUnit } from "@/lib/types";
import { isBeforeToday, isSameLocalDay } from "@/lib/date";

type DebtLike = Pick<Debt, "balance" | "originalAmount"> & {
  dueDate: Date;
};

type DebtAmountLike = Pick<
  Debt,
  "balance" | "originalAmount" | "principalAmount" | "interestRatePercent" | "interestAmount"
>;

export function calculateInterestAmount(principalAmount: number, interestRatePercent: number): number {
  return roundMoney(principalAmount * (interestRatePercent / 100));
}

export function calculateDebtTotal(principalAmount: number, interestRatePercent: number): number {
  return roundMoney(principalAmount + calculateInterestAmount(principalAmount, interestRatePercent));
}

export function getPrincipalAmount(debt: Pick<Debt, "originalAmount" | "principalAmount">): number {
  return debt.principalAmount ?? debt.originalAmount;
}

export function getInterestRatePercent(
  debt: Pick<Debt, "interestRatePercent">,
): number {
  return debt.interestRatePercent ?? 0;
}

export function getInterestPeriod(
  debt: Pick<Debt, "interestPeriodValue" | "interestPeriodUnit">,
): { value: number; unit: InterestPeriodUnit } | null {
  if (!debt.interestPeriodValue || !debt.interestPeriodUnit) {
    return null;
  }

  return {
    value: debt.interestPeriodValue,
    unit: debt.interestPeriodUnit,
  };
}

export function formatInterestPeriod(
  debt: Pick<Debt, "interestPeriodValue" | "interestPeriodUnit">,
): string {
  const period = getInterestPeriod(debt);
  if (!period) {
    return "per agreement";
  }

  const unit = period.value === 1 ? period.unit.slice(0, -1) : period.unit;
  return `${period.value} ${unit}`;
}

export function getInterestAmount(
  debt: Pick<Debt, "originalAmount" | "principalAmount" | "interestRatePercent" | "interestAmount">,
): number {
  if (typeof debt.interestAmount === "number") {
    return debt.interestAmount;
  }

  return calculateInterestAmount(getPrincipalAmount(debt), getInterestRatePercent(debt));
}

export function getOutstandingInterest(debt: DebtAmountLike): number {
  const interestAmount = getInterestAmount(debt);
  if (interestAmount <= 0 || debt.originalAmount <= 0 || debt.balance <= 0) {
    return 0;
  }

  return roundMoney(Math.min(interestAmount, interestAmount * (debt.balance / debt.originalAmount)));
}

export function getCollectedInterest(debt: DebtAmountLike): number {
  return roundMoney(Math.max(0, getInterestAmount(debt) - getOutstandingInterest(debt)));
}

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

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

import type { Debt, DebtStatus, InterestPeriodUnit } from "@/lib/types";
import { isBeforeToday, isSameLocalDay } from "@/lib/date";

type DebtLike = Pick<Debt, "balance" | "originalAmount"> & {
  dueDate: DateLike;
  createdAt?: DateLike;
  paidAt?: DateLike;
  principalAmount?: number;
  interestRatePercent?: number;
  interestAmount?: number;
  interestPeriodValue?: number;
  interestPeriodUnit?: InterestPeriodUnit;
};

type DebtAmountLike = Pick<
  Debt,
  | "balance"
  | "originalAmount"
  | "principalAmount"
  | "interestRatePercent"
  | "interestAmount"
  | "interestPeriodValue"
  | "interestPeriodUnit"
>;

type DateLike = Date | { toDate(): Date };

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

export function getInterestPeriodsElapsed(
  debt: Pick<Debt, "interestPeriodValue" | "interestPeriodUnit"> & { createdAt?: DateLike; dueDate?: DateLike },
  today = new Date(),
): number {
  const period = getInterestPeriod(debt);
  const dueDate = toDate(debt.dueDate);
  const createdAt = toDate(debt.createdAt);
  const dueDateHasStarted = dueDate ? startOfDay(dueDate).getTime() <= startOfDay(today).getTime() : false;
  const startedAt = dueDateHasStarted ? dueDate : createdAt;

  if (!period || !startedAt || today <= startedAt) {
    return 1;
  }

  if (period.unit === "days") {
    const dayMs = 24 * 60 * 60 * 1000;
    const elapsedDays = Math.floor((startOfDay(today).getTime() - startOfDay(startedAt).getTime()) / dayMs);
    return Math.max(1, Math.floor(elapsedDays / period.value) + (dueDateHasStarted ? 0 : 1));
  }

  const elapsedMonths =
    (today.getFullYear() - startedAt.getFullYear()) * 12 +
    (today.getMonth() - startedAt.getMonth()) -
    (today.getDate() < startedAt.getDate() ? 1 : 0);

  return Math.max(1, Math.floor(elapsedMonths / period.value) + (dueDateHasStarted ? 0 : 1));
}

export function getAccruedInterestAmount(
  debt: Pick<
    Debt,
    | "originalAmount"
    | "principalAmount"
    | "interestRatePercent"
    | "interestAmount"
    | "interestPeriodValue"
    | "interestPeriodUnit"
  > & { createdAt?: DateLike; dueDate?: DateLike; paidAt?: DateLike },
  today = new Date(),
): number {
  if (debt.paidAt) {
    return getInterestAmount(debt);
  }

  const period = getInterestPeriod(debt);
  if (!period) {
    return getInterestAmount(debt);
  }

  const interestPerPeriod = calculateInterestAmount(
    getPrincipalAmount(debt),
    getInterestRatePercent(debt),
  );

  return roundMoney(interestPerPeriod * getInterestPeriodsElapsed(debt, today));
}

export function getCurrentDebtTotal(debt: DebtAmountLike & { createdAt?: DateLike; dueDate?: DateLike; paidAt?: DateLike }, today = new Date()): number {
  return roundMoney(getPrincipalAmount(debt) + getAccruedInterestAmount(debt, today));
}

export function getCurrentBalance(debt: DebtAmountLike & { createdAt?: DateLike; dueDate?: DateLike; paidAt?: DateLike }, today = new Date()): number {
  if (debt.balance <= 0 || debt.paidAt) {
    return 0;
  }

  const additionalAccruedInterest = Math.max(0, getAccruedInterestAmount(debt, today) - getInterestAmount(debt));
  return roundMoney(Math.max(0, debt.balance + additionalAccruedInterest));
}

export function getOutstandingInterest(debt: DebtAmountLike & { createdAt?: DateLike; dueDate?: DateLike; paidAt?: DateLike }, today = new Date()): number {
  const currentTotal = getCurrentDebtTotal(debt, today);
  const currentBalance = getCurrentBalance(debt, today);
  const interestAmount = getAccruedInterestAmount(debt, today);
  if (interestAmount <= 0 || currentTotal <= 0 || currentBalance <= 0) {
    return 0;
  }

  return roundMoney(Math.min(interestAmount, interestAmount * (currentBalance / currentTotal)));
}

export function getCollectedInterest(debt: DebtAmountLike & { createdAt?: DateLike; dueDate?: DateLike; paidAt?: DateLike }, today = new Date()): number {
  return roundMoney(Math.max(0, getAccruedInterestAmount(debt, today) - getOutstandingInterest(debt, today)));
}

export function getDebtStatus(debt: DebtLike, today = new Date()): DebtStatus {
  const currentBalance = getCurrentBalance(debt, today);
  const dueDate = toDate(debt.dueDate);

  if (currentBalance <= 0) {
    return "paid";
  }

  if (dueDate && isBeforeToday(dueDate, today)) {
    return "overdue";
  }

  if (currentBalance < getCurrentDebtTotal(debt, today)) {
    return "partial";
  }

  return "unpaid";
}

export function calculateBalanceAfterPayment(balance: number, amountPaid: number): number {
  return Math.max(0, balance - amountPaid);
}

export function isDueToday(debt: DebtAmountLike & { dueDate: DateLike; createdAt?: DateLike; paidAt?: DateLike }, today = new Date()): boolean {
  const dueDate = toDate(debt.dueDate);
  if (!dueDate) {
    return false;
  }

  return getCurrentBalance(debt, today) > 0 && isSameLocalDay(dueDate, today);
}

export function isOverdue(debt: DebtAmountLike & { dueDate: DateLike; createdAt?: DateLike; paidAt?: DateLike }, today = new Date()): boolean {
  const dueDate = toDate(debt.dueDate);
  if (!dueDate) {
    return false;
  }

  return getCurrentBalance(debt, today) > 0 && isBeforeToday(dueDate, today);
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function toDate(value?: DateLike): Date | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : value.toDate();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

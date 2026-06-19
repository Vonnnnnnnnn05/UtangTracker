import type { Customer, Debt, Payment } from "@/lib/types";
import {
  getAccruedInterestAmount,
  getCollectedInterest,
  getCurrentBalance,
  getCurrentDebtTotal,
  getPrincipalAmount,
  getOutstandingInterest,
  isDueToday,
  isOverdue,
} from "@/lib/debt";

type DebtWithDate = Omit<Debt, "dueDate"> & { dueDate: Date };
type PaymentWithDate = Omit<Payment, "paidAt"> & { paidAt: Date };

export function getDashboardMetrics(
  debts: DebtWithDate[],
  payments: PaymentWithDate[],
  today = new Date(),
) {
  const outstandingDebts = debts.filter((debt) => getCurrentBalance(debt, today) > 0);

  return {
    totalUtang: outstandingDebts.reduce((sum, debt) => sum + getCurrentBalance(debt, today), 0),
    principalLent: debts.reduce((sum, debt) => sum + getPrincipalAmount(debt), 0),
    expectedInterestIncome: debts.reduce((sum, debt) => sum + getAccruedInterestAmount(debt, today), 0),
    collectedInterestIncome: debts.reduce((sum, debt) => sum + getCollectedInterest(debt, today), 0),
    outstandingInterestIncome: outstandingDebts.reduce((sum, debt) => sum + getOutstandingInterest(debt, today), 0),
    dueToday: outstandingDebts.filter((debt) => isDueToday(debt, today)),
    overdue: outstandingDebts.filter((debt) => isOverdue(debt, today)),
    paidRecords: debts.filter((debt) => debt.balance <= 0),
    partialRecords: outstandingDebts.filter(
      (debt) => getCurrentBalance(debt, today) > 0 && getCurrentBalance(debt, today) < getCurrentDebtTotal(debt, today),
    ),
    recentPayments: payments
      .toSorted((left, right) => right.paidAt.getTime() - left.paidAt.getTime())
      .slice(0, 5),
  };
}

export function getCustomerDebtSummary(customers: Customer[], debts: DebtWithDate[]) {
  return customers.map((customer) => {
    const customerDebts = debts.filter((debt) => debt.customerId === customer.id);
    const balance = customerDebts.reduce((sum, debt) => sum + getCurrentBalance(debt), 0);

    return {
      customer,
      debtCount: customerDebts.length,
      balance,
      overdueCount: customerDebts.filter((debt) => isOverdue(debt)).length,
    };
  });
}

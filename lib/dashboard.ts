import type { Customer, Debt, Payment } from "@/lib/types";
import { isDueToday, isOverdue } from "@/lib/debt";

type DebtWithDate = Omit<Debt, "dueDate"> & { dueDate: Date };
type PaymentWithDate = Omit<Payment, "paidAt"> & { paidAt: Date };

export function getDashboardMetrics(
  debts: DebtWithDate[],
  payments: PaymentWithDate[],
  today = new Date(),
) {
  const outstandingDebts = debts.filter((debt) => debt.balance > 0);

  return {
    totalUtang: outstandingDebts.reduce((sum, debt) => sum + debt.balance, 0),
    dueToday: outstandingDebts.filter((debt) => isDueToday(debt, today)),
    overdue: outstandingDebts.filter((debt) => isOverdue(debt, today)),
    paidRecords: debts.filter((debt) => debt.balance <= 0),
    partialRecords: outstandingDebts.filter(
      (debt) => debt.balance > 0 && debt.balance < debt.originalAmount,
    ),
    recentPayments: payments
      .toSorted((left, right) => right.paidAt.getTime() - left.paidAt.getTime())
      .slice(0, 5),
  };
}

export function getCustomerDebtSummary(customers: Customer[], debts: DebtWithDate[]) {
  return customers.map((customer) => {
    const customerDebts = debts.filter((debt) => debt.customerId === customer.id);
    const balance = customerDebts.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0);

    return {
      customer,
      debtCount: customerDebts.length,
      balance,
      overdueCount: customerDebts.filter((debt) => isOverdue(debt)).length,
    };
  });
}

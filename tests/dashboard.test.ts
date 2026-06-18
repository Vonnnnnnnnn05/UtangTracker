import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { getDashboardMetrics } from "@/lib/dashboard";
import type { Debt, Payment } from "@/lib/types";

function debt(partial: Partial<Debt> & Pick<Debt, "id" | "balance" | "originalAmount">, dueDate: Date) {
  return {
    ownerId: "owner",
    customerId: "customer",
    status: "unpaid",
    createdAt: Timestamp.fromDate(new Date("2026-06-01T00:00:00")),
    updatedAt: Timestamp.fromDate(new Date("2026-06-01T00:00:00")),
    ...partial,
    dueDate,
  };
}

function payment(partial: Partial<Payment> & Pick<Payment, "id" | "amountPaid">, paidAt: Date) {
  return {
    ownerId: "owner",
    debtId: "debt",
    customerId: "customer",
    note: "",
    ...partial,
    paidAt,
  };
}

describe("dashboard metrics", () => {
  it("summarizes outstanding, due, overdue, paid, partial, and recent payments", () => {
    const today = new Date("2026-06-18T12:00:00");
    const metrics = getDashboardMetrics(
      [
        debt({ id: "due", balance: 300, originalAmount: 300 }, new Date("2026-06-18T00:00:00")),
        debt({ id: "late", balance: 200, originalAmount: 500 }, new Date("2026-06-17T00:00:00")),
        debt({ id: "paid", balance: 0, originalAmount: 150 }, new Date("2026-06-16T00:00:00")),
      ],
      [
        payment({ id: "old", amountPaid: 50 }, new Date("2026-06-01T00:00:00")),
        payment({ id: "new", amountPaid: 75 }, new Date("2026-06-18T00:00:00")),
      ],
      today,
    );

    expect(metrics.totalUtang).toBe(500);
    expect(metrics.dueToday).toHaveLength(1);
    expect(metrics.overdue).toHaveLength(1);
    expect(metrics.paidRecords).toHaveLength(1);
    expect(metrics.partialRecords).toHaveLength(1);
    expect(metrics.recentPayments[0].id).toBe("new");
  });
});

import { describe, expect, it } from "vitest";
import {
  calculateBalanceAfterPayment,
  calculateDebtTotal,
  calculateInterestAmount,
  formatInterestPeriod,
  getCollectedInterest,
  getDebtStatus,
  getOutstandingInterest,
  isDueToday,
  isOverdue,
} from "@/lib/debt";

describe("debt calculations", () => {
  const today = new Date("2026-06-18T10:00:00");

  it("marks zero-balance debt as paid", () => {
    expect(
      getDebtStatus({
        originalAmount: 500,
        balance: 0,
        dueDate: new Date("2026-06-17T00:00:00"),
      }),
    ).toBe("paid");
  });

  it("marks unpaid past-due debt as overdue", () => {
    expect(
      getDebtStatus(
        {
          originalAmount: 500,
          balance: 500,
          dueDate: new Date("2026-06-17T00:00:00"),
        },
        today,
      ),
    ).toBe("overdue");
  });

  it("marks partially paid future debt as partial", () => {
    expect(
      getDebtStatus(
        {
          originalAmount: 500,
          balance: 200,
          dueDate: new Date("2026-06-19T00:00:00"),
        },
        today,
      ),
    ).toBe("partial");
  });

  it("does not allow negative balances after payment", () => {
    expect(calculateBalanceAfterPayment(200, 350)).toBe(0);
  });

  it("calculates agreed interest and total collection amount", () => {
    expect(calculateInterestAmount(1000, 10)).toBe(100);
    expect(calculateDebtTotal(1000, 10)).toBe(1100);
  });

  it("formats when the agreed interest occurs", () => {
    expect(formatInterestPeriod({ interestPeriodValue: 20, interestPeriodUnit: "days" })).toBe("20 days");
    expect(formatInterestPeriod({ interestPeriodValue: 1, interestPeriodUnit: "months" })).toBe("1 month");
    expect(formatInterestPeriod({})).toBe("per agreement");
  });

  it("calculates collected and outstanding interest proportionally", () => {
    const debt = {
      originalAmount: 1100,
      principalAmount: 1000,
      interestRatePercent: 10,
      interestAmount: 100,
      balance: 550,
    };

    expect(getOutstandingInterest(debt)).toBe(50);
    expect(getCollectedInterest(debt)).toBe(50);
  });

  it("detects due today and overdue records", () => {
    expect(isDueToday({ balance: 100, dueDate: new Date("2026-06-18T00:00:00") }, today)).toBe(true);
    expect(isOverdue({ balance: 100, dueDate: new Date("2026-06-17T00:00:00") }, today)).toBe(true);
  });
});

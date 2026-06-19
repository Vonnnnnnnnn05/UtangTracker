import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  calculateBalanceAfterPayment,
  calculateDebtTotal,
  calculateInterestAmount,
  formatInterestPeriod,
  getAccruedInterestAmount,
  getCollectedInterest,
  getCurrentBalance,
  getCurrentDebtTotal,
  getDebtStatus,
  getInterestPeriodsElapsed,
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

  it("continues interest every agreed day period until paid", () => {
    const debt = {
      originalAmount: 1100,
      principalAmount: 1000,
      interestRatePercent: 10,
      interestAmount: 100,
      interestPeriodValue: 20,
      interestPeriodUnit: "days" as const,
      balance: 1100,
      createdAt: Timestamp.fromDate(new Date("2026-06-01T00:00:00")),
    };

    expect(getInterestPeriodsElapsed(debt, new Date("2026-06-01T12:00:00"))).toBe(1);
    expect(getInterestPeriodsElapsed(debt, new Date("2026-06-21T00:00:00"))).toBe(2);
    expect(getAccruedInterestAmount(debt, new Date("2026-06-21T00:00:00"))).toBe(200);
    expect(getCurrentDebtTotal(debt, new Date("2026-06-21T00:00:00"))).toBe(1200);
    expect(getCurrentBalance(debt, new Date("2026-06-21T00:00:00"))).toBe(1200);
  });

  it("continues interest every agreed month period until paid", () => {
    const debt = {
      originalAmount: 1100,
      principalAmount: 1000,
      interestRatePercent: 10,
      interestAmount: 100,
      interestPeriodValue: 1,
      interestPeriodUnit: "months" as const,
      balance: 1100,
      createdAt: Timestamp.fromDate(new Date("2026-01-15T00:00:00")),
    };

    expect(getInterestPeriodsElapsed(debt, new Date("2026-02-14T00:00:00"))).toBe(1);
    expect(getInterestPeriodsElapsed(debt, new Date("2026-02-15T00:00:00"))).toBe(2);
    expect(getAccruedInterestAmount(debt, new Date("2026-02-15T00:00:00"))).toBe(200);
  });

  it("counts all overdue monthly periods from the due date without a limit", () => {
    const debt = {
      originalAmount: 1100,
      principalAmount: 1000,
      interestRatePercent: 10,
      interestAmount: 100,
      interestPeriodValue: 1,
      interestPeriodUnit: "months" as const,
      balance: 1100,
      createdAt: Timestamp.fromDate(new Date("2026-06-19T00:00:00")),
      dueDate: Timestamp.fromDate(new Date("2026-04-19T00:00:00")),
    };

    expect(getInterestPeriodsElapsed(debt, new Date("2026-06-19T00:00:00"))).toBe(2);
    expect(getAccruedInterestAmount(debt, new Date("2026-06-19T00:00:00"))).toBe(200);
    expect(getCurrentBalance(debt, new Date("2026-06-19T00:00:00"))).toBe(1200);
  });

  it("adds later accrued interest on top of remaining balance", () => {
    const debt = {
      originalAmount: 1100,
      principalAmount: 1000,
      interestRatePercent: 10,
      interestAmount: 100,
      interestPeriodValue: 20,
      interestPeriodUnit: "days" as const,
      balance: 900,
      createdAt: Timestamp.fromDate(new Date("2026-06-01T00:00:00")),
    };

    expect(getCurrentBalance(debt, new Date("2026-06-21T00:00:00"))).toBe(1000);
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
    expect(isDueToday({ balance: 100, originalAmount: 100, dueDate: new Date("2026-06-18T00:00:00") }, today)).toBe(true);
    expect(isOverdue({ balance: 100, originalAmount: 100, dueDate: new Date("2026-06-17T00:00:00") }, today)).toBe(true);
  });
});

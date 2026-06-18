"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Coins } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getDashboardMetrics } from "@/lib/dashboard";
import { getDebtStatus } from "@/lib/debt";
import { useOwnerData } from "@/lib/firebase/use-owner-data";
import { formatPeso } from "@/lib/money";

export function DashboardView() {
  const { customers, debts, payments } = useOwnerData();
  const customerMap = new Map(customers.data.map((customer) => [customer.id, customer.name]));
  const debtData = debts.data.map((debt) => ({ ...debt, dueDate: debt.dueDate.toDate() }));
  const paymentData = payments.data.map((payment) => ({ ...payment, paidAt: payment.paidAt.toDate() }));
  const metrics = getDashboardMetrics(debtData, paymentData);

  return (
    <div className="space-y-5 md:pl-56">
      <div>
        <p className="text-sm font-bold uppercase text-leaf">Today</p>
        <h1 className="text-3xl font-black text-ink">Dashboard</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Coins size={20} />} label="Total utang" value={formatPeso(metrics.totalUtang)} />
        <MetricCard icon={<CalendarClock size={20} />} label="Due today" value={String(metrics.dueToday.length)} />
        <MetricCard icon={<AlertTriangle size={20} />} label="Overdue" value={String(metrics.overdue.length)} />
        <MetricCard icon={<CheckCircle2 size={20} />} label="Paid records" value={String(metrics.paidRecords.length)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Due today">
          {metrics.dueToday.length ? (
            <DebtMiniList debts={metrics.dueToday} customerMap={customerMap} />
          ) : (
            <EmptyState title="No debts due today" />
          )}
        </Panel>
        <Panel title="Overdue">
          {metrics.overdue.length ? (
            <DebtMiniList debts={metrics.overdue} customerMap={customerMap} />
          ) : (
            <EmptyState title="No overdue debts" />
          )}
        </Panel>
      </section>

      <Panel title="Recent payments">
        {metrics.recentPayments.length ? (
          <div className="divide-y divide-line">
            {metrics.recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-bold text-ink">
                    {customerMap.get(payment.customerId) ?? "Customer"}
                  </p>
                  <p className="text-xs font-semibold text-muted">
                    {payment.paidAt.toLocaleDateString("en-PH")}
                  </p>
                </div>
                <p className="text-sm font-black text-leaf">{formatPeso(payment.amountPaid)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No payments yet" />
        )}
      </Panel>

      {(customers.loading || debts.loading || payments.loading) && (
        <p className="text-sm font-semibold text-muted">Loading latest records...</p>
      )}
      {(customers.error || debts.error || payments.error) && (
        <p className="text-sm font-semibold text-clay">Some records could not be loaded.</p>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted">{label}</p>
        <div className="text-leaf">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-black tabular-nums text-ink">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-soft">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DebtMiniList({
  debts,
  customerMap,
}: {
  debts: Array<{
    id: string;
    customerId: string;
    originalAmount: number;
    balance: number;
    dueDate: Date;
  }>;
  customerMap: Map<string, string>;
}) {
  return (
    <div className="divide-y divide-line">
      {debts.map((debt) => (
        <Link
          className="focus-ring flex min-h-16 items-center justify-between gap-3 rounded-md py-3 transition hover:bg-mint/60"
          href={`/debts/${debt.id}`}
          key={debt.id}
        >
          <div>
            <p className="text-sm font-bold text-ink">{customerMap.get(debt.customerId) ?? "Customer"}</p>
            <p className="text-xs font-semibold text-muted">Due {debt.dueDate.toLocaleDateString("en-PH")}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-ink">{formatPeso(debt.balance)}</p>
            <StatusPill status={getDebtStatus(debt)} />
          </div>
        </Link>
      ))}
    </div>
  );
}

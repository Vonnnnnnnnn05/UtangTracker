import type { DebtStatus } from "@/lib/types";

const labels: Record<DebtStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
};

const styles: Record<DebtStatus, string> = {
  unpaid: "bg-white text-ink border-line",
  partial: "bg-[#FFF0C7] text-[#704C00] border-[#E7C05D]",
  paid: "bg-mint text-[#24523D] border-[#9CCFB2]",
  overdue: "bg-[#FFE1D6] text-[#8B351F] border-[#E5A18B]",
};

export function StatusPill({ status }: { status: DebtStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

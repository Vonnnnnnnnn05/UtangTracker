import { DebtDetailView } from "@/components/debt-detail-view";
import { AppShell } from "@/components/layout/app-shell";

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <DebtDetailView debtId={id} />
    </AppShell>
  );
}

import { CustomerDetailView } from "@/components/customer-detail-view";
import { AppShell } from "@/components/layout/app-shell";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <CustomerDetailView customerId={id} />
    </AppShell>
  );
}

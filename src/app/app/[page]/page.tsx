import { notFound } from "next/navigation";
import { FinanceApp } from "@/components/finance-app";
import { isPage } from "@/lib/navigation";
export default async function AppPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (!isPage(page)) notFound();
  return <FinanceApp page={page} />;
}

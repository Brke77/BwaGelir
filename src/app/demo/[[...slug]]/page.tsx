import { notFound } from "next/navigation";
import { FinanceApp } from "@/components/finance-app";
import { isPage } from "@/lib/navigation";
export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = slug?.[0] ?? "overview";
  if (!isPage(page) || (slug?.length ?? 0) > 1) notFound();
  return <FinanceApp page={page} />;
}

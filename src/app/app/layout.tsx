import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { WorkspaceProvider } from "@/components/workspace-provider";

export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await serverSupabase();
  if (!supabase) redirect("/login");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return <WorkspaceProvider demo={false}>{children}</WorkspaceProvider>;
}

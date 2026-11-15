import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { serverSupabase } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function ResetPassword() {
  const supabase = await serverSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) redirect("/forgot-password");
  return (
    <Suspense>
      <AuthForm mode="reset" />
    </Suspense>
  );
}

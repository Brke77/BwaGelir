import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next =
    url.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/app/overview";
  const supabase = await serverSupabase();
  if (supabase) {
    const code = url.searchParams.get("code");
    const token_hash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, siteUrl()));
    } else if (
      token_hash &&
      (type === "email" || type === "recovery" || type === "signup")
    ) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (!error)
        return NextResponse.redirect(
          new URL(type === "recovery" ? "/reset-password" : next, siteUrl()),
        );
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", siteUrl()));
}

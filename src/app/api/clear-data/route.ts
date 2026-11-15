import { z } from "zod";
import { serverSupabase } from "@/lib/supabase/server";
import { databaseError, json, sameOrigin } from "@/lib/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: "Geçersiz istek kaynağı." }, 403);
  const supabase = await serverSupabase();
  if (!supabase) return json({ error: "Supabase yapılandırılmadı." }, 503);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return json({ error: "Oturum gerekli." }, 401);
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = z
    .object({
      password: z.string().min(1).max(128),
      confirmation: z.literal("VERİLERİ SİL"),
    })
    .safeParse(body);
  if (!parsed.success)
    return json({ error: "Şifrenizi ve onay metnini girin." }, 400);
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (loginError) return json({ error: "Şifre doğrulanamadı." }, 403);
  const { error } = await supabase.rpc("clear_financial_data");
  return error
    ? json({ error: databaseError(error) }, 400)
    : json({ ok: true });
}

import { serverSupabase } from "@/lib/supabase/server";
import { mutationSchema } from "@/lib/validation";
import { databaseError, json, sameOrigin } from "@/lib/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: "Geçersiz istek kaynağı." }, 403);
  if (Number(request.headers.get("content-length") ?? "0") > 20000)
    return json({ error: "İstek çok büyük." }, 413);
  const supabase = await serverSupabase();
  if (!supabase)
    return json({ error: "Supabase henüz yapılandırılmadı." }, 503);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Oturum süresi doldu." }, 401);
  const { data: allowed, error: limitError } = await supabase.rpc(
    "consume_write_limit",
  );
  if (limitError) return json({ error: databaseError(limitError) }, 503);
  if (!allowed)
    return json(
      { error: "Çok sık işlem yaptınız. Bir dakika sonra tekrar deneyin." },
      429,
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success)
    return json(
      { error: parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin." },
      400,
    );
  const mutation = parsed.data;
  if (mutation.entity === "preferences") {
    const { error } = await supabase.rpc("save_preferences", {
      p_name: mutation.data.name,
      p_theme: mutation.data.theme,
      p_alerts: mutation.data.budget_alerts,
    });
    return error
      ? json({ error: databaseError(error) }, 400)
      : json({ ok: true });
  }
  if (mutation.entity === "occurrence") {
    const { error } = await supabase.rpc("realize_occurrence", {
      p_rule_id: mutation.data.rule_id,
      p_date: mutation.data.date,
    });
    return error
      ? json({ error: databaseError(error) }, 400)
      : json({ ok: true });
  }
  if (mutation.entity === "delete") {
    const { error, data } = await supabase
      .from(mutation.data.table)
      .delete()
      .eq("id", mutation.data.id)
      .eq("user_id", user.id)
      .select("id");
    if (error) return json({ error: databaseError(error) }, 400);
    return data?.length
      ? json({ ok: true })
      : json({ error: "Kayıt bulunamadı." }, 404);
  }
  // Never accept a client-supplied user_id. Composite foreign keys enforce ownership too.
  const { error } = await supabase
    .from(mutation.entity)
    .upsert({ ...mutation.data, user_id: user.id }, { onConflict: "id" });
  return error
    ? json({ error: databaseError(error) }, 400)
    : json({ ok: true });
}

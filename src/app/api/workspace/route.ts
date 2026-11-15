import { serverSupabase } from "@/lib/supabase/server";
import { isDate } from "@/lib/dates";
import { databaseError, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const supabase = await serverSupabase();
  if (!supabase)
    return json({ error: "Supabase henüz yapılandırılmadı." }, 503);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return json({ error: "Oturum süresi doldu. Yeniden giriş yapın." }, 401);
  const url = new URL(request.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  if (
    !isDate(start) ||
    !isDate(end) ||
    start > end ||
    (Date.parse(end) - Date.parse(start)) / 86400000 > 1096
  )
    return json(
      { error: "En fazla üç yıllık geçerli bir tarih aralığı seçin." },
      400,
    );
  const { data, error } = await supabase.rpc("get_workspace", {
    p_start: start,
    p_end: end,
  });
  if (error) return json({ error: databaseError(error) }, 400);
  return json(data);
}

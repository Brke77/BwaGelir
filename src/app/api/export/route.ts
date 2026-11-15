import { serverSupabase } from "@/lib/supabase/server";
import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await serverSupabase();
  if (!supabase) return json({ error: "Supabase yapılandırılmadı." }, 503);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Oturum gerekli." }, 401);
  const tables = [
    "accounts",
    "categories",
    "transactions",
    "budgets",
    "recurring_rules",
    "recurring_occurrences",
    "profiles",
    "user_preferences",
  ] as const;
  const output: Record<string, unknown[]> = {};
  for (const table of tables) {
    output[table] = [];
    for (let offset = 0; ; offset += 1000) {
      const query = supabase.from(table).select("*").eq("user_id", user.id);
      const { data, error } = await query
        .order(
          table === "recurring_occurrences"
            ? "rule_id"
            : table === "profiles" || table === "user_preferences"
              ? "user_id"
              : "id",
        )
        .range(offset, offset + 999);
      if (error)
        return json(
          { error: "Dışa aktarma tamamlanamadı. Tekrar deneyin." },
          500,
        );
      output[table].push(...data);
      if (data.length < 1000) break;
    }
  }
  return new Response(
    JSON.stringify(
      { version: 1, exported_at: new Date().toISOString(), ...output },
      null,
      2,
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kasaflow-yedek.json"',
        "Cache-Control": "private, no-store",
      },
    },
  );
}

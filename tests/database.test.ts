import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Workspace } from "@/lib/types";
import { summarize } from "@/lib/finance";

// A real PostgreSQL engine in WASM. Only Supabase's auth schema and auth.uid()
// are supplied by the harness. The production migration runs unchanged.
const A = "a0000000-0000-4000-8000-000000000001";
const B = "b0000000-0000-4000-8000-000000000001";
const ACCOUNT_A = "a0000000-0000-4000-8000-000000000011";
const ACCOUNT_A2 = "a0000000-0000-4000-8000-000000000012";
const ACCOUNT_B = "b0000000-0000-4000-8000-000000000011";
let db: PGlite;
const user = async (id: string) => {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
};
async function category(kind = "expense") {
  const r = await db.query<{ id: string }>(
    "select id from public.categories where kind=$1 order by name limit 1",
    [kind],
  );
  return r.rows[0].id;
}
async function insertTx(
  kind = "expense",
  amount = 10000,
  account = ACCOUNT_A,
  categoryId?: string,
) {
  const c = categoryId ?? (await category(kind));
  return db.query<{ id: string }>(
    "insert into public.transactions(name,kind,amount,date,category_id,account_id) values('Özel işlem',$1,$2,'2024-01-15',$3,$4) returning id",
    [kind, amount, c, account],
  );
}
async function snapshot() {
  const r = await db.query<{ data: Workspace }>(
    "select public.get_workspace('2024-01-01','2024-01-31') as data",
  );
  return r.rows[0].data;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(
    readFileSync("supabase/migrations/202611150001_initial.sql", "utf8"),
  );
});
beforeEach(async () => {
  await db.exec("reset role; delete from auth.users;");
  await db.query(
    "insert into auth.users(id,email) values($1,'a@example.test'),($2,'b@example.test')",
    [A, B],
  );
  await user(A);
  await db.query(
    "insert into public.accounts(id,name,kind) values($1,'A bank','bank'),($2,'A cash','cash')",
    [ACCOUNT_A, ACCOUNT_A2],
  );
  await user(B);
  await db.query(
    "insert into public.accounts(id,name,kind) values($1,'B bank','bank')",
    [ACCOUNT_B],
  );
  await user(A);
});
afterAll(async () => {
  await db?.close();
});

describe("production migration, RLS and database integrity", () => {
  it("applies the schema, eight RLS-protected tables and four policies each", async () => {
    const r = await db.query<{ tablename: string; rowsecurity: boolean }>(
      "select tablename,rowsecurity from pg_tables where schemaname='public' order by tablename",
    );
    expect(r.rows).toHaveLength(8);
    expect(r.rows.every((t) => t.rowsecurity)).toBe(true);
    const p = await db.query<{ count: number }>(
      "select count(*)::int as count from pg_policies where schemaname='public'",
    );
    expect(p.rows[0].count).toBe(32);
  });
  it("new users receive categories and preferences but no fake transactions", async () => {
    const d = await snapshot();
    expect(d.categories).toHaveLength(10);
    expect(d.transactions).toHaveLength(0);
    expect(d.preferences.theme).toBe("system");
  });
  it("B cannot read, update or delete A's transaction even with its exact UUID", async () => {
    const id = (await insertTx()).rows[0].id;
    await user(B);
    expect(
      (await db.query("select * from public.transactions where id=$1", [id]))
        .rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "update public.transactions set amount=1 where id=$1 returning id",
          [id],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "delete from public.transactions where id=$1 returning id",
          [id],
        )
      ).rows,
    ).toHaveLength(0);
    expect((await snapshot()).transactions).toHaveLength(0);
    await user(A);
    expect((await snapshot()).transactions[0].amount).toBe(10000);
  });
  it("cannot forge user_id on insert or update", async () => {
    await expect(
      db.query(
        "insert into public.accounts(user_id,name,kind) values($1,'Forged','cash')",
        [B],
      ),
    ).rejects.toThrow();
    await expect(
      db.query("update public.accounts set user_id=$1 where id=$2", [
        B,
        ACCOUNT_A,
      ]),
    ).rejects.toThrow();
  });
  it("blocks cross-user source accounts, destination accounts and categories via composite FKs", async () => {
    const ca = await category();
    await user(B);
    const cb = await category();
    await user(A);
    await expect(insertTx("expense", 100, ACCOUNT_B, ca)).rejects.toThrow();
    await expect(insertTx("expense", 100, ACCOUNT_A, cb)).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.transactions(name,kind,amount,date,account_id,to_account_id) values('X','transfer',100,'2024-01-15',$1,$2)",
        [ACCOUNT_A, ACCOUNT_B],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.budgets(name,amount,month,category_id) values('X',100,'2024-01-01',$1)",
        [cb],
      ),
    ).rejects.toThrow();
  });
  it("rejects negative, zero, fractional, future amounts/dates and category type mismatch", async () => {
    await expect(insertTx("expense", 0)).rejects.toThrow();
    await expect(insertTx("expense", -1)).rejects.toThrow();
    await expect(insertTx("expense", 1.5)).rejects.toThrow();
    const expenseCategory = await category();
    await expect(
      insertTx("income", 100, ACCOUNT_A, expenseCategory),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.transactions(name,kind,amount,date,account_id,category_id) values('X','expense',100,'2199-01-01',$1,$2)",
        [ACCOUNT_A, expenseCategory],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into public.transactions(name,kind,amount,date,account_id,to_account_id) values('X','transfer',100,'2024-01-15',$1,$1)",
        [ACCOUNT_A],
      ),
    ).rejects.toThrow();
  });
  it("reports 10,000 income / 2,500 expense / 7,500 balance correctly from SQL", async () => {
    await insertTx("income", 1000000);
    const expense = (await insertTx("expense", 250000)).rows[0].id;
    let data = await snapshot();
    expect(
      summarize(data, { start: "2024-01-01", end: "2024-01-31" }),
    ).toMatchObject({ income: 1000000, expense: 250000, balance: 750000 });
    await db.query("update public.transactions set amount=200000 where id=$1", [
      expense,
    ]);
    data = await snapshot();
    expect(data.accounts.find((a) => a.id === ACCOUNT_A)?.balance).toBe(800000);
    await db.query("delete from public.transactions where id=$1", [expense]);
    expect(
      (await snapshot()).accounts.find((a) => a.id === ACCOUNT_A)?.balance,
    ).toBe(1000000);
  });
  it("a single transfer preserves total wealth and never counts as income/expense", async () => {
    await db.query(
      "update public.accounts set opening_balance=200000 where id=$1",
      [ACCOUNT_A],
    );
    await db.query(
      "insert into public.transactions(name,kind,amount,date,account_id,to_account_id) values('Transfer','transfer',100000,'2024-01-15',$1,$2)",
      [ACCOUNT_A, ACCOUNT_A2],
    );
    const data = await snapshot();
    expect(data.accounts.find((a) => a.id === ACCOUNT_A)?.balance).toBe(100000);
    expect(data.accounts.find((a) => a.id === ACCOUNT_A2)?.balance).toBe(
      100000,
    );
    expect(
      summarize(data, { start: "2024-01-01", end: "2024-01-31" }),
    ).toMatchObject({ balance: 200000, income: 0, expense: 0 });
  });
  it("keeps lifetime and period opening balances independent from period filtering", async () => {
    const c = await category("income");
    await db.query(
      "update public.accounts set opening_balance=100 where id=$1",
      [ACCOUNT_A],
    );
    await db.query(
      "insert into public.transactions(name,kind,amount,date,category_id,account_id) values('Old','income',10000,'2023-12-01',$1,$2)",
      [c, ACCOUNT_A],
    );
    await insertTx("expense", 1000);
    const d = await snapshot();
    expect(d.transactions).toHaveLength(1);
    expect(d.accounts.find((a) => a.id === ACCOUNT_A)).toMatchObject({
      balance: 9100,
      period_opening_balance: 10100,
    });
    expect(d.previous_summary?.income).toBe(10000);
  });
  it("prevents category deletion and type changes when in use; archive preserves records", async () => {
    const c = await category();
    await insertTx("expense", 100, ACCOUNT_A, c);
    await expect(
      db.query("delete from public.categories where id=$1", [c]),
    ).rejects.toThrow();
    await expect(
      db.query("update public.categories set kind='income' where id=$1", [c]),
    ).rejects.toThrow();
    await db.query("update public.categories set archived=true where id=$1", [
      c,
    ]);
    expect((await snapshot()).transactions).toHaveLength(1);
    await expect(insertTx("expense", 100, ACCOUNT_A, c)).rejects.toThrow();
  });
  it("realizes a scheduled occurrence atomically and never twice, even after deleting the transaction", async () => {
    const c = await category();
    const r = await db.query<{ id: string }>(
      "insert into public.recurring_rules(name,kind,amount,category_id,account_id,start_date,frequency) values('Kira','expense',10000,$1,$2,'2024-01-31','monthly') returning id",
      [c, ACCOUNT_A],
    );
    const ruleId = r.rows[0].id;
    expect((await snapshot()).transactions).toHaveLength(0);
    const paid = await db.query<{ id: string }>(
      "select public.realize_occurrence($1,'2024-02-29') as id",
      [ruleId],
    );
    await expect(
      db.query("select public.realize_occurrence($1,'2024-02-29')", [ruleId]),
    ).rejects.toThrow();
    await db.query("delete from public.transactions where id=$1", [
      paid.rows[0].id,
    ]);
    await expect(
      db.query("select public.realize_occurrence($1,'2024-02-29')", [ruleId]),
    ).rejects.toThrow();
    await expect(
      db.query("select public.realize_occurrence($1,'2024-03-30')", [ruleId]),
    ).rejects.toThrow();
    await user(B);
    await expect(
      db.query("select public.realize_occurrence($1,'2024-03-31')", [ruleId]),
    ).rejects.toThrow();
  });
  it("rolls back a failed recurrence and preserves posted history after rule removal", async () => {
    const c = await category();
    const r = await db.query<{ id: string }>(
      "insert into public.recurring_rules(name,kind,amount,category_id,account_id,start_date,frequency) values('Kira','expense',10000,$1,$2,'2024-01-01','monthly') returning id",
      [c, ACCOUNT_A],
    );
    const ruleId = r.rows[0].id;
    await db.query("update public.categories set archived=true where id=$1", [
      c,
    ]);
    await expect(
      db.query("select public.realize_occurrence($1,'2024-01-01')", [ruleId]),
    ).rejects.toThrow();
    expect((await snapshot()).recurring_occurrences).toHaveLength(0);
    await db.query("update public.categories set archived=false where id=$1", [
      c,
    ]);
    await db.query("select public.realize_occurrence($1,'2024-01-01')", [
      ruleId,
    ]);
    await db.query("delete from public.recurring_rules where id=$1", [ruleId]);
    const d = await snapshot();
    expect(d.transactions).toHaveLength(1);
    expect(d.transactions[0].recurring_rule_id).toBeNull();
  });
  it("SQL and TypeScript share leap/month-end anchoring", async () => {
    const r = await db.query<{ d: string }>(
      "select public.scheduled_date('2024-01-31','monthly',2)::text as d",
    );
    expect(r.rows[0].d).toBe("2024-03-31");
    const leap = await db.query<{ d: string }>(
      "select public.scheduled_date('2024-02-29','yearly',4)::text as d",
    );
    expect(leap.rows[0].d).toBe("2028-02-29");
  });
  it("anonymous role has no table or RPC access", async () => {
    await db.exec("reset role; set role anon");
    await expect(
      db.query("select * from public.transactions"),
    ).rejects.toThrow();
    await expect(
      db.query("select public.get_workspace('2024-01-01','2024-01-31')"),
    ).rejects.toThrow();
  });
  it("limits writes across application instances without exposing the limiter table", async () => {
    const r = await db.query<{ allowed: boolean }>(
      "select public.consume_write_limit() as allowed from generate_series(1,121)",
    );
    expect(r.rows.slice(0, 120).every((v) => v.allowed)).toBe(true);
    expect(r.rows[120].allowed).toBe(false);
    await expect(
      db.query("select * from private.write_buckets"),
    ).rejects.toThrow();
    await user(B);
    const other = await db.query<{ allowed: boolean }>(
      "select public.consume_write_limit() as allowed",
    );
    expect(other.rows[0].allowed).toBe(true);
  });
  it("save_preferences and data deletion affect only the authenticated user", async () => {
    await insertTx();
    await db.query("select public.save_preferences('Ayşe','dark',false)");
    expect((await snapshot()).preferences).toEqual({
      name: "Ayşe",
      theme: "dark",
      budget_alerts: false,
    });
    await user(B);
    await insertTx("expense", 100, ACCOUNT_B);
    await db.query("select public.clear_financial_data()");
    expect((await snapshot()).accounts).toHaveLength(0);
    await user(A);
    expect((await snapshot()).transactions).toHaveLength(1);
    expect((await snapshot()).accounts).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import { createDemo, mutateDemo } from "@/lib/demo";
import {
  accountBalance,
  balanceTrend,
  budgetStatus,
  cashflow,
  distribution,
  summarize,
} from "@/lib/finance";
import {
  addDays,
  getRange,
  isDate,
  occurrenceDate,
  occurrences,
} from "@/lib/dates";
import { money, parseMoney, sumMoney } from "@/lib/money";
import { csvCell, transactionsCsv } from "@/lib/csv";
import { transactionSchema, mutationSchema } from "@/lib/validation";
import { emptyWorkspace, type Transaction, type Workspace } from "@/lib/types";

const range = { start: "2024-01-01", end: "2024-01-31" };
const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function workspace(): Workspace {
  const data = emptyWorkspace();
  data.accounts = [
    {
      id: id(1),
      name: "Banka",
      kind: "bank",
      currency: "TRY",
      opening_balance: 0,
      color: "#648a54",
      description: "",
    },
    {
      id: id(2),
      name: "Nakit",
      kind: "cash",
      currency: "TRY",
      opening_balance: 0,
      color: "#648a54",
      description: "",
    },
  ];
  data.categories = [
    {
      id: id(3),
      name: "Özel gider",
      kind: "expense",
      color: "#648a54",
      icon: "wallet",
      archived: false,
    },
    {
      id: id(4),
      name: "Gelir",
      kind: "income",
      color: "#648a54",
      icon: "wallet",
      archived: false,
    },
  ];
  return data;
}
function tx(
  kind: Transaction["kind"],
  amount: number,
  serial = 10,
): Transaction {
  return {
    id: id(serial),
    kind,
    amount,
    name: "Kendi yazdığım işlem adı",
    date: "2024-01-15",
    category_id: kind === "transfer" ? null : id(kind === "income" ? 4 : 3),
    account_id: id(1),
    to_account_id: kind === "transfer" ? id(2) : null,
    description: "",
  };
}
describe("integer kuruş and Turkish parsing", () => {
  it.each([
    ["1.250,50 TL", 125050],
    ["25.000,00", 2500000],
    ["0,01", 1],
    ["10", 1000],
    ["1.000", 100000],
    ["1000,9", 100090],
  ])("parses %s without float math", (input, expected) =>
    expect(parseMoney(input)).toBe(expected),
  );
  it.each([
    "0",
    "0,00",
    "-10",
    "NaN",
    "Infinity",
    "1,234",
    "1.23",
    "12.34,56",
    "1e4",
    "1,2,3",
    "",
    "1.000.000.001",
  ])("rejects invalid %s", (input) =>
    expect(() => parseMoney(input)).toThrow(),
  );
  it("allows zero/negative only for opening balances", () => {
    expect(parseMoney("-10,25", true, true)).toBe(-1025);
    expect(parseMoney("0", true)).toBe(0);
  });
  it("preserves cents across 10,000 additions", () =>
    expect(sumMoney(Array(10000).fill(1) as number[])).toBe(10000));
  it("fails safely beyond the safe integer boundary", () =>
    expect(() => sumMoney([Number.MAX_SAFE_INTEGER, 1])).toThrow());
  it("formats TRY in Turkish", () =>
    expect(money(125050)).toContain("1.250,50"));
});
describe("financial invariants", () => {
  it("10,000 income and 2,500 expense yield 7,500 balance", () => {
    const d = workspace();
    d.transactions = [tx("income", 1000000), tx("expense", 250000, 11)];
    expect(summarize(d, range)).toMatchObject({
      income: 1000000,
      expense: 250000,
      balance: 750000,
      net: 750000,
      savings: 75,
    });
  });
  it("deleting a 500 TL expense updates reports and balance", () => {
    const d = workspace();
    d.transactions = [tx("income", 1000000), tx("expense", 50000, 11)];
    const next = mutateDemo(d, {
      entity: "delete",
      data: { table: "transactions", id: id(11) },
    });
    expect(summarize(next, range).expense).toBe(0);
    expect(summarize(next, range).balance - summarize(d, range).balance).toBe(
      50000,
    );
  });
  it("editing an expense recalculates all summaries", () => {
    const d = workspace();
    d.transactions = [tx("expense", 50000)];
    const next = mutateDemo(d, {
      entity: "transactions",
      data: tx("expense", 75000),
    });
    expect(summarize(next, range).expense).toBe(75000);
    expect(distribution(next, range)[0].value).toBe(75000);
    expect(cashflow(next, range)[0].expense).toBe(75000);
    expect(accountBalance(next.accounts[0], next.transactions)).toBe(-75000);
  });
  it("free-text names and new categories can be saved", () => {
    let d = workspace();
    d = mutateDemo(d, {
      entity: "categories",
      data: {
        id: id(9),
        name: "Evcil Hayvan 🐾",
        kind: "expense",
        color: "#648a54",
        icon: "paw",
        archived: false,
      },
    });
    d = mutateDemo(d, {
      entity: "transactions",
      data: {
        ...tx("expense", 15000),
        name: "Minik kedimin özel maması",
        category_id: id(9),
      },
    });
    expect(d.transactions[0].name).toBe("Minik kedimin özel maması");
    expect(distribution(d, range)[0].name).toBe("Evcil Hayvan 🐾");
  });
  it("transfer changes both balances but never income, expense or wealth", () => {
    const d = workspace();
    d.accounts[0].opening_balance = 200000;
    d.transactions = [tx("transfer", 100000)];
    expect(accountBalance(d.accounts[0], d.transactions)).toBe(100000);
    expect(accountBalance(d.accounts[1], d.transactions)).toBe(100000);
    expect(summarize(d, range)).toMatchObject({
      balance: 200000,
      income: 0,
      expense: 0,
      net: 0,
    });
  });
  it("distinguishes lifetime balance from selected-period flow", () => {
    const d = workspace();
    d.accounts[0].opening_balance = 10000;
    d.transactions = [
      { ...tx("income", 100000), date: "2023-12-01" },
      tx("expense", 1000, 11),
    ];
    expect(summarize(d, range)).toMatchObject({
      balance: 109000,
      net: -1000,
      income: 0,
      expense: 1000,
    });
    expect(balanceTrend(d, range).at(-1)?.balance).toBe(109000);
  });
  it("date filter includes boundary dates", () => {
    const d = workspace();
    d.transactions = [
      { ...tx("income", 100), date: range.start },
      { ...tx("income", 200, 11), date: range.end },
      { ...tx("income", 999, 12), date: "2024-02-01" },
    ];
    expect(summarize(d, range).income).toBe(300);
  });
  it("budget respects month, expense kind, category and account", () => {
    const d = workspace();
    d.transactions = [
      tx("expense", 500000),
      tx("income", 100000, 11),
      tx("transfer", 100000, 12),
      { ...tx("expense", 100000, 13), account_id: id(2) },
      { ...tx("expense", 100000, 14), date: "2024-02-01" },
    ];
    const b = {
      id: id(20),
      name: "Market",
      month: range.start,
      amount: 800000,
      category_id: id(3),
      account_id: id(1),
    };
    expect(budgetStatus(b, d.transactions)).toMatchObject({
      spent: 500000,
      remaining: 300000,
      usage: 62.5,
      threshold: 0,
    });
    expect(
      budgetStatus({ ...b, amount: 500000 }, d.transactions).threshold,
    ).toBe(100);
  });
  it.each([
    [750, 75],
    [900, 90],
    [1000, 100],
  ])("alerts at %s/1000", (spent, threshold) =>
    expect(
      budgetStatus(
        {
          id: id(20),
          name: "B",
          month: range.start,
          amount: 1000,
          category_id: null,
          account_id: null,
        },
        [tx("expense", spent)],
      ).threshold,
    ).toBe(threshold),
  );
  it("empty data and zero income never yield NaN or Infinity", () => {
    const d = emptyWorkspace();
    expect(summarize(d, range)).toMatchObject({ balance: 0, savings: null });
    expect(distribution(d, range)).toEqual([]);
    expect(
      balanceTrend(d, range).every((p) => Number.isFinite(p.balance)),
    ).toBe(true);
  });
  it("same transaction id is idempotent", () => {
    let d = workspace();
    d = mutateDemo(d, { entity: "transactions", data: tx("expense", 100) });
    d = mutateDemo(d, { entity: "transactions", data: tx("expense", 100) });
    expect(d.transactions).toHaveLength(1);
  });
  it("deleting a linked category is blocked; archiving preserves history", () => {
    const d = workspace();
    d.transactions = [tx("expense", 100)];
    expect(() =>
      mutateDemo(d, {
        entity: "delete",
        data: { table: "categories", id: id(3) },
      }),
    ).toThrow();
    const next = mutateDemo(d, {
      entity: "categories",
      data: { ...d.categories[0], archived: true },
    });
    expect(next.transactions).toHaveLength(1);
    expect(() =>
      mutateDemo(next, {
        entity: "transactions",
        data: tx("expense", 100, 12),
      }),
    ).toThrow();
  });
  it("rejects invalid values, wrong kind and same-account transfers", () => {
    expect(transactionSchema.safeParse(tx("income", 0)).success).toBe(false);
    expect(
      transactionSchema.safeParse({ ...tx("income", 100), date: "2024-02-30" })
        .success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse({
        ...tx("transfer", 100),
        to_account_id: id(1),
      }).success,
    ).toBe(false);
    expect(() =>
      mutateDemo(workspace(), {
        entity: "transactions",
        data: { ...tx("income", 100), category_id: id(3) },
      }),
    ).toThrow();
  });
});
describe("calendar and recurrence", () => {
  it("validates leap dates", () => {
    expect(isDate("2024-02-29")).toBe(true);
    expect(isDate("2023-02-29")).toBe(false);
    expect(isDate("2024-13-01")).toBe(false);
  });
  it("anchors month ends and leap years", () => {
    expect(occurrenceDate("2024-01-31", "monthly", 1)).toBe("2024-02-29");
    expect(occurrenceDate("2024-01-31", "monthly", 2)).toBe("2024-03-31");
    expect(occurrenceDate("2024-02-29", "yearly", 1)).toBe("2025-02-28");
    expect(occurrenceDate("2024-02-29", "yearly", 4)).toBe("2028-02-29");
  });
  it("handles Monday week boundaries and year rollover", () => {
    expect(getRange("Bu hafta", "2024-01-07").start).toBe("2024-01-01");
    expect(getRange("Geçen ay", "2024-01-15")).toEqual({
      start: "2023-12-01",
      end: "2023-12-31",
    });
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });
  it("planned payments do not change balances and realization is unique after deletion", () => {
    let d = workspace();
    const rule = {
      id: id(50),
      name: "Kira",
      kind: "expense" as const,
      amount: 50000,
      category_id: id(3),
      account_id: id(1),
      start_date: "2024-01-01",
      end_date: null,
      frequency: "monthly" as const,
      active: true,
    };
    d.recurring_rules = [rule];
    expect(summarize(d, range).balance).toBe(0);
    expect(occurrences(rule, range.start, range.end)).toEqual(["2024-01-01"]);
    d = mutateDemo(d, {
      entity: "occurrence",
      data: { rule_id: rule.id, date: "2024-01-01" },
    });
    expect(d.transactions).toHaveLength(1);
    const txId = d.transactions[0].id;
    d = mutateDemo(d, {
      entity: "delete",
      data: { table: "transactions", id: txId },
    });
    expect(() =>
      mutateDemo(d, {
        entity: "occurrence",
        data: { rule_id: rule.id, date: "2024-01-01" },
      }),
    ).toThrow();
  });
  it("rejects a future actual transaction", () =>
    expect(
      mutationSchema.safeParse({
        entity: "transactions",
        data: { ...tx("income", 100), date: "2199-01-01" },
      }).success,
    ).toBe(false));
  it("demo seed spans several months without future realized transactions", () => {
    const d = createDemo("2024-11-15");
    expect(new Set(d.transactions.map((t) => t.date.slice(0, 7))).size).toBe(6);
    expect(d.transactions.every((t) => t.date <= "2024-11-15")).toBe(true);
  });
});
describe("exports", () => {
  it("escapes quotes and formula injections", () => {
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
  });
  it("exports UTF-8 BOM, Turkish headers, semicolon and decimal comma", () => {
    const d = workspace();
    d.transactions = [tx("expense", 125050)];
    const csv = transactionsCsv(d.transactions, d);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"İşlem adı";');
    expect(csv).toContain('"1250,50"');
  });
});

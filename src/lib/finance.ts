import { addDays, monthEnd } from "./dates";
import { sumMoney } from "./money";
import type {
  Account,
  Budget,
  DateRange,
  Transaction,
  Workspace,
} from "./types";

export const inRange = (tx: Transaction, range: DateRange) =>
  tx.date >= range.start && tx.date <= range.end;
export function accountBalance(
  account: Account,
  transactions: Transaction[],
  before?: string,
): number {
  return sumMoney([
    account.opening_balance,
    ...transactions
      .filter((t) => !before || t.date < before)
      .flatMap((t) => {
        if (t.kind === "transfer")
          return [
            t.account_id === account.id ? -t.amount : 0,
            t.to_account_id === account.id ? t.amount : 0,
          ];
        return [
          t.account_id === account.id
            ? t.amount * (t.kind === "income" ? 1 : -1)
            : 0,
        ];
      }),
  ]);
}
export function summarize(data: Workspace, range: DateRange) {
  const transactions = data.transactions.filter((t) => inRange(t, range));
  const income = sumMoney(
    transactions.filter((t) => t.kind === "income").map((t) => t.amount),
  );
  const expense = sumMoney(
    transactions.filter((t) => t.kind === "expense").map((t) => t.amount),
  );
  const balance = sumMoney(
    data.accounts.map((a) => a.balance ?? accountBalance(a, data.transactions)),
  );
  return {
    income,
    expense,
    balance,
    net: sumMoney([income, -expense]),
    savings: income > 0 ? ((income - expense) / income) * 100 : null,
    count: transactions.length,
  };
}
export function budgetStatus(budget: Budget, transactions: Transaction[]) {
  const spent = sumMoney(
    transactions
      .filter(
        (t) =>
          t.kind === "expense" &&
          t.date >= budget.month &&
          t.date <= monthEnd(budget.month) &&
          (!budget.category_id || t.category_id === budget.category_id) &&
          (!budget.account_id || t.account_id === budget.account_id),
      )
      .map((t) => t.amount),
  );
  const usage = (spent / budget.amount) * 100;
  return {
    spent,
    remaining: sumMoney([budget.amount, -spent]),
    usage,
    threshold: usage >= 100 ? 100 : usage >= 90 ? 90 : usage >= 75 ? 75 : 0,
  };
}
export function distribution(data: Workspace, range: DateRange) {
  const expenses = data.transactions.filter(
    (t) => t.kind === "expense" && inRange(t, range),
  );
  const total = sumMoney(expenses.map((t) => t.amount));
  return data.categories
    .map((c) => ({
      ...c,
      value: sumMoney(
        expenses.filter((t) => t.category_id === c.id).map((t) => t.amount),
      ),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ ...c, share: total ? (c.value / total) * 100 : 0 }));
}
export function cashflow(
  data: Workspace,
  range: DateRange,
  group: "day" | "week" | "month" | "year" = "month",
) {
  const groups = new Map<
    string,
    { date: string; income: number; expense: number }
  >();
  const key = (date: string) => {
    if (group === "year") return date.slice(0, 4);
    if (group === "month") return date.slice(0, 7);
    if (group === "week") {
      const day = new Date(date + "T12:00:00Z").getUTCDay();
      return addDays(date, -(day === 0 ? 6 : day - 1));
    }
    return date;
  };
  for (let date = range.start; date <= range.end; date = addDays(date, 1)) {
    const k = key(date);
    if (!groups.has(k)) groups.set(k, { date: k, income: 0, expense: 0 });
  }
  for (const t of data.transactions.filter(
    (t) => t.kind !== "transfer" && inRange(t, range),
  )) {
    const bucket = groups.get(key(t.date));
    if (bucket && (t.kind === "income" || t.kind === "expense"))
      bucket[t.kind] = sumMoney([bucket[t.kind], t.amount]);
  }
  return [...groups.values()].map((v) => ({
    ...v,
    net: sumMoney([v.income, -v.expense]),
  }));
}
export function balanceTrend(
  data: Workspace,
  range: DateRange,
  group: "day" | "month" | "year" = "day",
) {
  let balance = sumMoney(
    data.accounts.map(
      (a) =>
        a.period_opening_balance ??
        accountBalance(a, data.transactions, range.start),
    ),
  );
  const flow = cashflow(data, range, group);
  return flow.map((row) => {
    balance = sumMoney([balance, row.net]);
    return { date: row.date, balance };
  });
}

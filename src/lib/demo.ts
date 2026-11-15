import { getRange, monthEnd, occurrences, today } from "./dates";
import { budgetSchema, mutationSchema } from "./validation";
import type { Mutation } from "./validation";
import type { Category, Workspace } from "./types";

const uuid = (number: number) =>
  `00000000-0000-4000-8000-${number.toString().padStart(12, "0")}`;
export const defaultCategories: Omit<Category, "id">[] = [
  {
    name: "Market",
    kind: "expense",
    color: "#648a54",
    icon: "shopping",
    archived: false,
  },
  {
    name: "Ev & Kira",
    kind: "expense",
    color: "#8c78c5",
    icon: "home",
    archived: false,
  },
  {
    name: "Faturalar",
    kind: "expense",
    color: "#d5a35e",
    icon: "receipt",
    archived: false,
  },
  {
    name: "Ulaşım",
    kind: "expense",
    color: "#5e91b5",
    icon: "car",
    archived: false,
  },
  {
    name: "Yeme & İçme",
    kind: "expense",
    color: "#d17a64",
    icon: "coffee",
    archived: false,
  },
  {
    name: "Alışveriş",
    kind: "expense",
    color: "#bd78a5",
    icon: "gift",
    archived: false,
  },
  {
    name: "Sağlık",
    kind: "expense",
    color: "#67a59e",
    icon: "heart",
    archived: false,
  },
  {
    name: "Seyahat",
    kind: "expense",
    color: "#8289bd",
    icon: "plane",
    archived: false,
  },
  {
    name: "Maaş",
    kind: "income",
    color: "#648a54",
    icon: "briefcase",
    archived: false,
  },
  {
    name: "Ek Gelir",
    kind: "income",
    color: "#5e91b5",
    icon: "wallet",
    archived: false,
  },
];
export function createDemo(now = today()): Workspace {
  const month = getRange("Bu ay", now).start;
  const categories = defaultCategories.map((c, i) => ({
    ...c,
    id: uuid(100 + i),
  }));
  const accounts: Workspace["accounts"] = [
    {
      id: uuid(1),
      name: "Günlük hesabım",
      kind: "bank",
      opening_balance: 1850000,
      currency: "TRY",
      color: "#648a54",
      description: "Günlük gelir ve harcamalar",
    },
    {
      id: uuid(2),
      name: "Birikim hesabım",
      kind: "savings",
      opening_balance: 4000000,
      currency: "TRY",
      color: "#8c78c5",
      description: "Geleceğim için",
    },
    {
      id: uuid(3),
      name: "Nakit cüzdanım",
      kind: "cash",
      opening_balance: 200000,
      currency: "TRY",
      color: "#d5a35e",
      description: "Yanımdaki nakit",
    },
  ];
  const transactions: Workspace["transactions"] = [];
  let serial = 1000;
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(month + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - offset);
    const m = d.toISOString().slice(0, 7);
    const rows: [string, number, number, number][] = [
      ["Aylık maaş", 6250000, 8, 1],
      ["Ev kirası", 1600000, 1, 2],
      ["Haftalık market alışverişi", 185050 + offset * 700, 0, 4],
      ["İnternet & telefon", 87500, 2, 5],
      ["Kahve molası", 19500, 4, 6],
      ["Akbil yükleme", 55000, 3, 8],
      ["Freelance tasarım projesi", 850000, 9, 10],
      ["Arkadaşlarla akşam yemeği", 145000, 4, 11],
      ["Kitap & küçük mutluluklar", 68500, 5, 13],
      ["Market alışverişi", 237525, 0, 14],
      ["Elektrik faturası", 78000, 2, 17],
      ["Hafta sonu kaçamağı", 365000, 7, 21],
      ["Eczane", 42500, 6, 24],
      ["Sebze & meyve", 62000, 0, 27],
    ];
    for (const [name, amount, category, day] of rows) {
      const date = m + "-" + String(day).padStart(2, "0");
      if (date > now) continue;
      transactions.push({
        id: uuid(serial++),
        name,
        amount,
        date,
        kind: category >= 8 ? "income" : "expense",
        category_id: categories[category].id,
        account_id: accounts[0].id,
        to_account_id: null,
        description: "Örnek veri",
      });
    }
    const date = m + "-12";
    if (date <= now)
      transactions.push({
        id: uuid(serial++),
        name: "Birikime transfer",
        amount: 1000000,
        date,
        kind: "transfer",
        category_id: null,
        account_id: accounts[0].id,
        to_account_id: accounts[1].id,
        description: "Aylık birikim",
      });
  }
  return {
    accounts,
    categories,
    transactions,
    budgets: [
      {
        id: uuid(200),
        name: "Market alışverişi",
        amount: 800000,
        month,
        category_id: categories[0].id,
        account_id: null,
      },
      {
        id: uuid(201),
        name: "Yeme & içme",
        amount: 400000,
        month,
        category_id: categories[4].id,
        account_id: null,
      },
      {
        id: uuid(202),
        name: "Ulaşım",
        amount: 200000,
        month,
        category_id: categories[3].id,
        account_id: null,
      },
    ],
    recurring_rules: [
      {
        id: uuid(300),
        name: "İnternet aboneliği",
        amount: 49990,
        kind: "expense",
        category_id: categories[2].id,
        account_id: accounts[0].id,
        start_date: month.slice(0, 7) + "-18",
        end_date: null,
        frequency: "monthly",
        active: true,
      },
      {
        id: uuid(301),
        name: "Ev kirası",
        amount: 1600000,
        kind: "expense",
        category_id: categories[1].id,
        account_id: accounts[0].id,
        start_date: monthEnd(month),
        end_date: null,
        frequency: "monthly",
        active: true,
      },
    ],
    recurring_occurrences: [],
    preferences: { name: "Deniz", theme: "system", budget_alerts: true },
  };
}

/** Demo mutations use the same validation as the server, without contacting Supabase. */
export function mutateDemo(original: Workspace, input: Mutation): Workspace {
  const mutation = mutationSchema.parse(input);
  const data = structuredClone(original);
  if (mutation.entity === "preferences") {
    data.preferences = mutation.data;
    return data;
  }
  if (mutation.entity === "occurrence") {
    const { rule_id, date } = mutation.data;
    const rule = data.recurring_rules.find((r) => r.id === rule_id);
    if (!rule || !rule.active) throw new Error("Plan bulunamadı veya pasif.");
    if (!occurrences(rule, date, date).includes(date))
      throw new Error("Bu tarih ödeme planına ait değil.");
    if (data.categories.find((c) => c.id === rule.category_id)?.archived)
      throw new Error("Kategori arşivlenmiş. Önce kategoriyi etkinleştirin.");
    if (
      data.recurring_occurrences.some(
        (o) => o.rule_id === rule_id && o.date === date,
      )
    )
      throw new Error("Bu ödeme zaten kaydedilmiş.");
    const id = crypto.randomUUID();
    data.transactions.push({
      id,
      name: rule.name,
      kind: rule.kind,
      amount: rule.amount,
      date,
      account_id: rule.account_id,
      category_id: rule.category_id,
      to_account_id: null,
      description: "Düzenli ödeme",
      recurring_rule_id: rule.id,
      occurrence_date: date,
    });
    data.recurring_occurrences.push({ rule_id, date, transaction_id: id });
    return data;
  }
  if (mutation.entity === "delete") {
    const { table, id } = mutation.data;
    if (
      table === "categories" &&
      (data.transactions.some((t) => t.category_id === id) ||
        data.recurring_rules.some((r) => r.category_id === id) ||
        data.budgets.some((b) => b.category_id === id))
    )
      throw new Error(
        "Kategori kullanılıyor. Geçmişi korumak için arşivleyin.",
      );
    if (
      table === "accounts" &&
      (data.transactions.some(
        (t) => t.account_id === id || t.to_account_id === id,
      ) ||
        data.recurring_rules.some((r) => r.account_id === id) ||
        data.budgets.some((b) => b.account_id === id))
    )
      throw new Error("Hesap kullanılıyor. Önce bağlı kayıtları düzenleyin.");
    if (table === "transactions")
      data.recurring_occurrences = data.recurring_occurrences.map((o) =>
        o.transaction_id === id ? { ...o, transaction_id: null } : o,
      );
    switch (table) {
      case "accounts":
        data.accounts = data.accounts.filter((v) => v.id !== id);
        break;
      case "categories":
        data.categories = data.categories.filter((v) => v.id !== id);
        break;
      case "transactions":
        data.transactions = data.transactions.filter((v) => v.id !== id);
        break;
      case "budgets":
        data.budgets = data.budgets.filter((v) => v.id !== id);
        break;
      case "recurring_rules":
        data.recurring_rules = data.recurring_rules.filter((v) => v.id !== id);
        data.recurring_occurrences = data.recurring_occurrences.filter(
          (o) => o.rule_id !== id,
        );
        data.transactions = data.transactions.map((t) =>
          t.recurring_rule_id === id ? { ...t, recurring_rule_id: null } : t,
        );
        break;
    }
    return data;
  }
  if (
    mutation.entity === "transactions" ||
    mutation.entity === "recurring_rules" ||
    mutation.entity === "budgets"
  ) {
    const value = mutation.data;
    if (
      mutation.entity === "transactions" &&
      mutation.data.to_account_id &&
      !data.accounts.some((a) => a.id === mutation.data.to_account_id)
    )
      throw new Error("Hedef hesap bulunamadı.");
    if (
      value.account_id &&
      !data.accounts.some((a) => a.id === value.account_id)
    )
      throw new Error("Hesap bulunamadı.");
    if (value.category_id) {
      const category = data.categories.find((c) => c.id === value.category_id);
      const expectedKind =
        mutation.entity === "budgets"
          ? "expense"
          : "kind" in value
            ? value.kind
            : "expense";
      if (
        !category ||
        category.kind !== expectedKind ||
        (category.archived &&
          !data[mutation.entity].some(
            (v) => v.id === value.id && v.category_id === category.id,
          ))
      )
        throw new Error("Uygun bir kategori seçin.");
    }
  }
  if (
    mutation.entity === "categories" &&
    data.categories.some(
      (c) =>
        c.id !== mutation.data.id &&
        c.kind === mutation.data.kind &&
        c.name.toLocaleLowerCase("tr") ===
          mutation.data.name.toLocaleLowerCase("tr"),
    )
  )
    throw new Error("Bu isimde bir kategori zaten var.");
  if (mutation.entity === "budgets") budgetSchema.parse(mutation.data);
  if (
    mutation.entity === "budgets" &&
    data.budgets.some(
      (b) =>
        b.id !== mutation.data.id &&
        b.month === mutation.data.month &&
        b.category_id === mutation.data.category_id &&
        b.account_id === mutation.data.account_id,
    )
  )
    throw new Error("Bu ay ve kapsam için zaten bir bütçe var.");
  const rows = data[mutation.entity];
  const index = rows.findIndex((v) => v.id === mutation.data.id);
  if (index < 0) rows.push(mutation.data as never);
  else rows[index] = { ...rows[index], ...mutation.data } as never;
  return data;
}

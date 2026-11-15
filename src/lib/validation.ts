import { z } from "zod";
import { isDate, today } from "./dates";
import { MAX_MONEY } from "./money";

const id = z.uuid();
const name = z
  .string()
  .trim()
  .min(1, "İsim gerekli.")
  .max(100, "İsim en fazla 100 karakter olmalı.");
const text = z.string().trim().max(500).default("");
const date = z.string().refine(isDate, "Geçerli bir tarih girin.");
const amount = z.number().int().positive().max(MAX_MONEY);
const kind = z.enum(["income", "expense"]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const transactionSchema = z
  .object({
    id,
    name,
    amount,
    date: date.refine(
      (v) => v <= today(),
      "Gelecek tarihli işlem için Düzenli Ödemeler'i kullanın.",
    ),
    kind: z.enum(["income", "expense", "transfer"]),
    account_id: id,
    category_id: id.nullable(),
    to_account_id: id.nullable(),
    description: text,
  })
  .superRefine((v, ctx) => {
    if (v.kind === "transfer") {
      if (!v.to_account_id || v.to_account_id === v.account_id || v.category_id)
        ctx.addIssue({
          code: "custom",
          message:
            "Transfer için farklı bir hedef hesap seçin; kategori boş olmalı.",
        });
    } else if (!v.category_id || v.to_account_id)
      ctx.addIssue({
        code: "custom",
        message: "Gelir/gider için kategori seçin.",
      });
  });
export const accountSchema = z.object({
  id,
  name,
  kind: z.enum(["cash", "bank", "savings", "other"]),
  opening_balance: z.number().int().min(-MAX_MONEY).max(MAX_MONEY),
  currency: z.literal("TRY"),
  description: text,
  color,
});
export const categorySchema = z.object({
  id,
  name,
  kind,
  color,
  icon: z.enum([
    "shopping",
    "home",
    "receipt",
    "car",
    "heart",
    "book",
    "coffee",
    "plane",
    "briefcase",
    "gift",
    "wallet",
    "paw",
  ]),
  archived: z.boolean(),
});
export const budgetSchema = z.object({
  id,
  name,
  amount,
  month: date.refine((v) => v.endsWith("-01")),
  category_id: id.nullable(),
  account_id: id.nullable(),
});
export const ruleSchema = z
  .object({
    id,
    name,
    kind,
    amount,
    category_id: id,
    account_id: id,
    start_date: date,
    end_date: date.nullable(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    active: z.boolean(),
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: "Bitiş tarihi başlangıçtan önce olamaz.",
  });
export const preferencesSchema = z.object({
  name: z.string().trim().max(80),
  budget_alerts: z.boolean(),
  theme: z.enum(["system", "light", "dark"]),
});
export const mutationSchema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("accounts"), data: accountSchema }),
  z.object({ entity: z.literal("categories"), data: categorySchema }),
  z.object({ entity: z.literal("transactions"), data: transactionSchema }),
  z.object({ entity: z.literal("budgets"), data: budgetSchema }),
  z.object({ entity: z.literal("recurring_rules"), data: ruleSchema }),
  z.object({ entity: z.literal("preferences"), data: preferencesSchema }),
  z.object({
    entity: z.literal("occurrence"),
    data: z.object({
      rule_id: id,
      date: date.refine((v) => v <= today(), "Ödeme günü henüz gelmedi."),
    }),
  }),
  z.object({
    entity: z.literal("delete"),
    data: z.object({
      table: z.enum([
        "accounts",
        "categories",
        "transactions",
        "budgets",
        "recurring_rules",
      ]),
      id,
    }),
  }),
]);
export type Mutation = z.infer<typeof mutationSchema>;

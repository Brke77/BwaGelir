export type TransactionKind = "income" | "expense" | "transfer";
export type CategoryKind = "income" | "expense";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";
export type Page =
  | "overview"
  | "transactions"
  | "accounts"
  | "categories"
  | "budgets"
  | "recurring"
  | "reports"
  | "settings";

export interface Account {
  id: string;
  name: string;
  kind: "cash" | "bank" | "savings" | "other";
  opening_balance: number;
  currency: "TRY";
  description: string;
  color: string;
  balance?: number;
  period_opening_balance?: number;
}
export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon:
    | "shopping"
    | "home"
    | "receipt"
    | "car"
    | "heart"
    | "book"
    | "coffee"
    | "plane"
    | "briefcase"
    | "gift"
    | "wallet"
    | "paw";
  archived: boolean;
}
export interface Transaction {
  id: string;
  name: string;
  kind: TransactionKind;
  amount: number;
  date: string;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  description: string;
  recurring_rule_id?: string | null;
  occurrence_date?: string | null;
  created_at?: string;
}
export interface Budget {
  id: string;
  name: string;
  amount: number;
  month: string;
  category_id: string | null;
  account_id: string | null;
}
export interface RecurringRule {
  id: string;
  name: string;
  kind: CategoryKind;
  amount: number;
  category_id: string;
  account_id: string;
  start_date: string;
  end_date: string | null;
  frequency: Frequency;
  active: boolean;
}
export interface Occurrence {
  rule_id: string;
  date: string;
  transaction_id: string | null;
}
export interface Preferences {
  name: string;
  budget_alerts: boolean;
  theme: "system" | "light" | "dark";
}
export interface Workspace {
  previous_summary?: { income: number; expense: number };
  previous_expenses?: { category_id: string; amount: number }[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring_rules: RecurringRule[];
  recurring_occurrences: Occurrence[];
  preferences: Preferences;
}
export interface DateRange {
  start: string;
  end: string;
}
export type Entity =
  "accounts" | "categories" | "transactions" | "budgets" | "recurring_rules";
export const emptyWorkspace = (): Workspace => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  recurring_rules: [],
  recurring_occurrences: [],
  preferences: { name: "", budget_alerts: true, theme: "system" },
});

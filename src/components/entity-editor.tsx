"use client";
import { Children, cloneElement, isValidElement, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Plus, Loader2, ArrowRightLeft } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { useWorkspace } from "./workspace-provider";
import { iconNames } from "./category-icon";
import { today } from "@/lib/dates";
import { moneyInput, parseMoney } from "@/lib/money";
import { mutationSchema } from "@/lib/validation";
import type {
  Account,
  Budget,
  Category,
  Entity,
  RecurringRule,
  Transaction,
} from "@/lib/types";

export type EditorTarget =
  | {
      entity: "transactions";
      value?: Transaction;
      kind?: "income" | "expense" | "transfer";
    }
  | { entity: "accounts"; value?: Account }
  | { entity: "categories"; value?: Category }
  | { entity: "budgets"; value?: Budget }
  | { entity: "recurring_rules"; value?: RecurringRule };
export const entityNames: Record<Entity, string> = {
  transactions: "işlem",
  accounts: "hesap",
  categories: "kategori",
  budgets: "bütçe",
  recurring_rules: "düzenli ödeme",
};
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const labelControl = (node: React.ReactNode): React.ReactNode => {
    if (
      !isValidElement<{
        children?: React.ReactNode;
        "aria-labelledby"?: string;
        "aria-describedby"?: string;
      }>(node)
    )
      return node;
    if (
      typeof node.type === "string" &&
      ["input", "select", "textarea"].includes(node.type)
    )
      return cloneElement(node, {
        "aria-labelledby": id,
        "aria-describedby": hint ? id + "-hint" : undefined,
      });
    return node.props.children
      ? cloneElement(node, {
          children: Children.map(node.props.children, labelControl),
        })
      : node;
  };
  return (
    <label className={"form-field " + className}>
      <span id={id}>{label}</span>
      {Children.map(children, labelControl)}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </label>
  );
}

export function EntityEditor({
  target,
  onClose,
}: {
  target: EditorTarget;
  onClose: () => void;
}) {
  const { data, mutate, busy, notify } = useWorkspace();
  const initial = target.value;
  const [id] = useState(() => initial?.id ?? crypto.randomUUID());
  const [error, setError] = useState("");
  const [inlineCategory, setInlineCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const values: Record<string, string> = {};
  if (initial)
    Object.entries(initial).forEach(([k, v]) => {
      if (v !== null && v !== undefined) values[k] = String(v);
    });
  if (initial && "amount" in initial)
    values.amount = moneyInput(initial.amount);
  if (initial && "opening_balance" in initial)
    values.opening_balance = moneyInput(initial.opening_balance);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues: {
      name: "",
      amount: "",
      date: today(),
      kind:
        target.entity === "transactions"
          ? (target.kind ?? "expense")
          : target.entity === "accounts"
            ? "bank"
            : "expense",
      account_id: data.accounts[0]?.id ?? "",
      category_id: "",
      to_account_id: data.accounts[1]?.id ?? "",
      description: "",
      color: "#648a54",
      icon: "wallet",
      opening_balance: "0,00",
      currency: "TRY",
      month: today().slice(0, 7),
      start_date: today(),
      end_date: "",
      frequency: "monthly",
      active: "true",
      archived: "false",
      ...values,
      ...(target.entity === "budgets" && initial && "month" in initial
        ? { month: initial.month.slice(0, 7) }
        : {}),
    },
  });
  const kind = useWatch({ control, name: "kind" });
  const categoryId = useWatch({ control, name: "category_id" });
  const busyNow = busy || isSubmitting;
  const showCategory =
    target.entity === "budgets" ||
    target.entity === "recurring_rules" ||
    (target.entity === "transactions" && kind !== "transfer");
  const categoryKind = target.entity === "budgets" ? "expense" : kind;
  const categories = data.categories.filter(
    (c) => c.kind === categoryKind && (!c.archived || c.id === categoryId),
  );
  async function createCategory() {
    if (!newCategory.trim()) {
      notify("Kategori adını yazın.", true);
      return;
    }
    const category: Category = {
      id: crypto.randomUUID(),
      name: newCategory.trim(),
      kind: categoryKind === "income" ? "income" : "expense",
      color: "#648a54",
      icon: "wallet",
      archived: false,
    };
    if (await mutate({ entity: "categories", data: category })) {
      setValue("category_id", category.id);
      setInlineCategory(false);
      setNewCategory("");
    }
  }
  async function submit(v: Record<string, string>) {
    setError("");
    try {
      let payload: unknown;
      if (target.entity === "transactions")
        payload = {
          entity: target.entity,
          data: {
            id,
            name: v.name,
            amount: parseMoney(v.amount),
            date: v.date,
            kind: v.kind,
            account_id: v.account_id,
            category_id: v.kind === "transfer" ? null : v.category_id || null,
            to_account_id: v.kind === "transfer" ? v.to_account_id : null,
            description: v.description,
          },
        };
      else if (target.entity === "accounts")
        payload = {
          entity: target.entity,
          data: {
            id,
            name: v.name,
            kind: v.kind,
            opening_balance: parseMoney(v.opening_balance, true, true),
            currency: "TRY",
            description: v.description,
            color: v.color,
          },
        };
      else if (target.entity === "categories")
        payload = {
          entity: target.entity,
          data: {
            id,
            name: v.name,
            kind: v.kind,
            color: v.color,
            icon: v.icon,
            archived: v.archived === "true",
          },
        };
      else if (target.entity === "budgets")
        payload = {
          entity: target.entity,
          data: {
            id,
            name: v.name,
            amount: parseMoney(v.amount),
            month: v.month + "-01",
            category_id: v.category_id || null,
            account_id: v.account_id || null,
          },
        };
      else
        payload = {
          entity: target.entity,
          data: {
            id,
            name: v.name,
            kind: v.kind,
            amount: parseMoney(v.amount),
            category_id: v.category_id,
            account_id: v.account_id,
            start_date: v.start_date,
            end_date: v.end_date || null,
            frequency: v.frequency,
            active: v.active === "true",
          },
        };
      const parsed = mutationSchema.safeParse(payload);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin.",
        );
      if (await mutate(parsed.data)) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilgileri kontrol edin.");
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busyNow) onClose();
      }}
      title={`${initial ? "Düzenle:" : "Yeni"} ${entityNames[target.entity]}`}
      description={
        target.entity === "transactions"
          ? "Adını sen belirle. Küçük harcamalar da büyük resmin bir parçası."
          : "Finansal alanını kendine göre düzenle."
      }
    >
      <form onSubmit={handleSubmit(submit)} className="editor-form">
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {(target.entity === "transactions" ||
          target.entity === "categories" ||
          target.entity === "recurring_rules") && (
          <Field label="İşlem türü">
            <select
              {...register("kind")}
              onChange={(e) => {
                setValue("kind", e.target.value);
                setValue("category_id", "");
              }}
              disabled={target.entity === "categories" && Boolean(initial)}
            >
              <option value="expense">Gider</option>
              <option value="income">Gelir</option>
              {target.entity === "transactions" && (
                <option value="transfer">Hesaplar arası transfer</option>
              )}
            </select>
          </Field>
        )}
        {target.entity === "transactions" && kind === "transfer" && (
          <p className="notice compact">
            <ArrowRightLeft size={17} /> Transfer toplam varlığını ve
            gelir/gider raporlarını değiştirmez.
          </p>
        )}
        <Field
          label={target.entity === "transactions" ? "İşlem adı" : "Ad"}
          hint={
            target.entity === "transactions"
              ? "İstediğin ismi özgürce yazabilirsin."
              : undefined
          }
        >
          <input
            {...register("name", { required: true })}
            placeholder={
              target.entity === "transactions"
                ? "Örn. Arkadaşlarla akşam yemeği"
                : "Bir isim ver"
            }
            maxLength={100}
            required
            autoFocus
          />
        </Field>
        {(target.entity === "transactions" ||
          target.entity === "budgets" ||
          target.entity === "recurring_rules") && (
          <Field label="Tutar (TL)" hint="Örnek: 1.250,50">
            <div className="amount-input">
              <input
                {...register("amount")}
                inputMode="decimal"
                placeholder="0,00"
                required
              />
              <span>₺</span>
            </div>
          </Field>
        )}
        {target.entity === "transactions" && (
          <Field label="Tarih">
            <input
              {...register("date")}
              type="date"
              min="1900-01-01"
              max={today()}
              required
            />
          </Field>
        )}
        {target.entity === "accounts" && (
          <>
            <Field label="Hesap türü">
              <select {...register("kind")}>
                <option value="bank">Banka hesabı</option>
                <option value="cash">Nakit</option>
                <option value="savings">Birikim hesabı</option>
                <option value="other">Diğer</option>
              </select>
            </Field>
            <Field
              label="Başlangıç bakiyesi (TL)"
              hint="Geçmiş kayıtların öncesindeki bakiyeni gir. Negatif olabilir."
            >
              <input
                {...register("opening_balance")}
                inputMode="text"
                required
              />
            </Field>
            <Field label="Para birimi">
              <input value="TRY · Türk Lirası" readOnly />
            </Field>
          </>
        )}
        {target.entity === "budgets" && (
          <Field label="Bütçe ayı">
            <input
              {...register("month")}
              type="month"
              min="1900-01"
              max="2199-12"
              required
            />
          </Field>
        )}
        {showCategory && (
          <div className="category-field">
            <Field label="Kategori">
              <select
                {...register("category_id")}
                required={target.entity !== "budgets"}
              >
                <option value="">
                  {target.entity === "budgets"
                    ? "Tüm gider kategorileri"
                    : "Kategori seç"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.archived ? " (arşiv)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              className="inline-link"
              onClick={() => setInlineCategory(!inlineCategory)}
            >
              <Plus size={14} /> Yeni kategori oluştur
            </button>
            {inlineCategory && (
              <div className="inline-category">
                <label htmlFor="inline-category-name" className="sr-only">
                  Yeni kategori adı
                </label>
                <input
                  id="inline-category-name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Örn. Evcil Hayvan"
                  maxLength={100}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void createCategory()}
                  disabled={busy}
                >
                  Ekle
                </Button>
              </div>
            )}
          </div>
        )}
        {(target.entity === "transactions" ||
          target.entity === "budgets" ||
          target.entity === "recurring_rules") && (
          <Field label={kind === "transfer" ? "Kaynak hesap" : "Hesap"}>
            <select
              {...register("account_id")}
              required={target.entity !== "budgets"}
            >
              {target.entity === "budgets" && (
                <option value="">Tüm hesaplar</option>
              )}
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {target.entity === "transactions" && kind === "transfer" && (
          <Field label="Hedef hesap">
            <select {...register("to_account_id")} required>
              <option value="">Hedef hesap seç</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {target.entity === "categories" && (
          <>
            <Field label="İkon">
              <select {...register("icon")}>
                {Object.entries(iconNames).map(([key, name]) => (
                  <option value={key} key={key}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Durum">
              <select {...register("archived")}>
                <option value="false">Aktif</option>
                <option value="true">Arşivlenmiş</option>
              </select>
            </Field>
          </>
        )}
        {(target.entity === "categories" || target.entity === "accounts") && (
          <Field label="Renk">
            <input
              {...register("color")}
              type="color"
              className="color-picker"
            />
          </Field>
        )}
        {target.entity === "recurring_rules" && (
          <>
            <div className="form-columns">
              <Field label="Başlangıç tarihi">
                <input
                  {...register("start_date")}
                  type="date"
                  min="1900-01-01"
                  max="2199-12-31"
                  required
                />
              </Field>
              <Field label="Bitiş tarihi (isteğe bağlı)">
                <input
                  {...register("end_date")}
                  type="date"
                  min="1900-01-01"
                  max="2199-12-31"
                />
              </Field>
            </div>
            <Field label="Tekrarlama sıklığı">
              <select {...register("frequency")}>
                <option value="daily">Her gün</option>
                <option value="weekly">Her hafta</option>
                <option value="monthly">Her ay</option>
                <option value="yearly">Her yıl</option>
              </select>
            </Field>
            <Field label="Durum">
              <select {...register("active")}>
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </Field>
            <p className="muted small">
              Planlanan ödeme, “Gerçekleşti” olarak işaretlenene kadar bakiyeni
              değiştirmez. Ay sonu tarihleri otomatik uyarlanır.
            </p>
          </>
        )}
        {(target.entity === "transactions" || target.entity === "accounts") && (
          <Field label="Açıklama (isteğe bağlı)">
            <textarea
              {...register("description")}
              placeholder="Daha sonra hatırlamak istediğin bir not…"
              maxLength={500}
              rows={2}
            />
          </Field>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={busyNow}>
            Vazgeç
          </Button>
          <Button type="submit" disabled={busyNow}>
            {busyNow && <Loader2 size={16} className="spin" />}
            {initial ? "Değişiklikleri kaydet" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

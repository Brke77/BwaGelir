"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarClock,
  CircleCheck,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  Wallet,
  Archive,
  Pause,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "./workspace-provider";
import { Button } from "./ui/button";
import { CategoryIcon } from "./category-icon";
import type { EditorTarget } from "./entity-editor";
import type { Account, Entity, Workspace } from "@/lib/types";
import { accountBalance, budgetStatus } from "@/lib/finance";
import { addDays, dayLabel, monthLabel, occurrences, today } from "@/lib/dates";
import { money, percent } from "@/lib/money";

export type DeleteTarget = { entity: Entity; id: string; name: string };
interface Actions {
  onEdit: (target: EditorTarget) => void;
  onDelete: (target: DeleteTarget) => void;
}
const accountIcons = {
  bank: Landmark,
  cash: Wallet,
  savings: PiggyBank,
  other: CreditCard,
};
const accountKinds: Record<Account["kind"], string> = {
  bank: "Banka hesabı",
  cash: "Nakit",
  savings: "Birikim",
  other: "Diğer",
};
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Wallet size={26} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function AccountCards({
  onEdit,
  onDelete,
  compact = false,
}: Actions & { compact?: boolean }) {
  const { data, demo } = useWorkspace();
  return (
    <section className={compact ? "account-section" : ""}>
      <div className="section-heading">
        <div>
          <h2>
            {compact ? "Hesaplarına bir bakış" : "Paranın bulunduğu yerler"}
          </h2>
          <p className="muted">Her hesap ayrı, büyük resim bir arada.</p>
        </div>
        {compact ? (
          <Link
            className="inline-link"
            href={`${demo ? "/demo" : "/app"}/accounts`}
          >
            Hesapları yönet <ArrowRight size={15} />
          </Link>
        ) : (
          <Button
            variant="secondary"
            onClick={() => onEdit({ entity: "transactions", kind: "transfer" })}
            disabled={data.accounts.length < 2}
          >
            <ArrowRightLeft size={16} /> Para transferi
          </Button>
        )}
      </div>
      <div className="account-grid">
        {data.accounts.map((a, index) => {
          const Icon = accountIcons[a.kind];
          return (
            <article
              className={
                "account-card" + (index === 0 ? " account-card-featured" : "")
              }
              key={a.id}
            >
              <div className="account-card-top">
                <span
                  className="account-symbol"
                  style={{ color: index === 0 ? undefined : a.color }}
                >
                  <Icon size={21} />
                </span>
                <span>{accountKinds[a.kind]} · TRY</span>
                {!compact && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${a.name} düzenle`}
                    onClick={() => onEdit({ entity: "accounts", value: a })}
                  >
                    <Pencil size={15} />
                  </Button>
                )}
              </div>
              <h3>{a.name}</h3>
              <strong className="account-balance">
                {money(a.balance ?? accountBalance(a, data.transactions))}
              </strong>
              <div className="account-card-bottom">
                <span>
                  {compact
                    ? "Güncel bakiye"
                    : `Başlangıç: ${money(a.opening_balance)}`}
                </span>
                {compact ? (
                  <ArrowUpRightIcon />
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${a.name} sil`}
                    onClick={() =>
                      onDelete({ entity: "accounts", id: a.id, name: a.name })
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              {!compact && a.description && (
                <p className="account-description">{a.description}</p>
              )}
            </article>
          );
        })}
        {!compact && (
          <button
            className="add-account-card"
            onClick={() => onEdit({ entity: "accounts" })}
          >
            <span>
              <Plus size={24} />
            </span>
            <strong>Yeni hesap ekle</strong>
            <small>Her amacına ayrı bir alan aç.</small>
          </button>
        )}
      </div>
    </section>
  );
}
function ArrowUpRightIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}
export function CategoriesPanel({ onEdit, onDelete }: Actions) {
  const { data, mutate, busy } = useWorkspace();
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const [archived, setArchived] = useState(false);
  const rows = data.categories.filter(
    (c) => c.kind === tab && (archived || !c.archived),
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Her harcamaya kendi adını ver.</h2>
          <p>İsimler, renkler ve ikonlar tamamen sana ait.</p>
        </div>
      </div>
      <div className="category-toolbar">
        <div className="segmented">
          <button
            aria-pressed={tab === "expense"}
            onClick={() => setTab("expense")}
          >
            Gider kategorileri
          </button>
          <button
            aria-pressed={tab === "income"}
            onClick={() => setTab("income")}
          >
            Gelir kategorileri
          </button>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />{" "}
          Arşivlenenleri göster
        </label>
      </div>
      <div className="category-grid">
        {rows.map((c) => (
          <article key={c.id} className="category-card">
            <CategoryIcon icon={c.icon} color={c.color} />
            <div>
              <h3>{c.name}</h3>
              <small>
                {c.archived
                  ? "Arşivlenmiş"
                  : tab === "income"
                    ? "Gelir"
                    : "Gider"}
              </small>
            </div>
            <div className="category-actions">
              <Button
                size="icon"
                variant="ghost"
                aria-label={`${c.name} düzenle`}
                onClick={() => onEdit({ entity: "categories", value: c })}
              >
                <Pencil size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={busy}
                aria-label={`${c.name} ${c.archived ? "arşivden çıkar" : "arşivle"}`}
                onClick={() =>
                  void mutate({
                    entity: "categories",
                    data: { ...c, archived: !c.archived },
                  })
                }
              >
                <Archive size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`${c.name} sil`}
                onClick={() =>
                  onDelete({ entity: "categories", id: c.id, name: c.name })
                }
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <EmptyState
          title="Henüz kategori yok."
          description="Kendine uygun ilk kategoriyi oluştur."
        />
      )}
    </section>
  );
}
export function visibleBudgets(data: Workspace, start: string, end: string) {
  return data.budgets.filter(
    (b) =>
      b.month.slice(0, 7) >= start.slice(0, 7) &&
      b.month.slice(0, 7) <= end.slice(0, 7),
  );
}
export function BudgetsPanel({
  onEdit,
  onDelete,
  compact = false,
}: Actions & { compact?: boolean }) {
  const { data, range, demo } = useWorkspace();
  const rows = visibleBudgets(data, range.start, range.end);
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{compact ? "Bütçen yolunda mı?" : "Bütçe planların"}</h2>
          <p>
            {compact
              ? "Hedeflerine küçük adımlarla yaklaş."
              : "Aylık limit, gerçekleşen harcama ve kalan alan."}
          </p>
        </div>
        {compact && (
          <Link
            className="icon-link"
            aria-label="Bütçelere git"
            href={`${demo ? "/demo" : "/app"}/budgets`}
          >
            <MoreHorizontal size={20} />
          </Link>
        )}
      </div>
      <div className={compact ? "budget-list" : "budget-grid"}>
        {rows.slice(0, compact ? 3 : undefined).map((b) => {
          const status = budgetStatus(b, data.transactions);
          const category = data.categories.find((c) => c.id === b.category_id);
          const severity =
            status.threshold >= 100
              ? "danger"
              : status.threshold >= 75
                ? "warning"
                : "";
          return (
            <article key={b.id} className={"budget-item " + severity}>
              <div className="budget-item-title">
                <CategoryIcon
                  icon={category?.icon}
                  color={category?.color}
                  size={17}
                />
                <div>
                  <h3>{b.name}</h3>
                  {!compact && (
                    <small>
                      {monthLabel(b.month)} ·{" "}
                      {b.account_id
                        ? data.accounts.find((a) => a.id === b.account_id)?.name
                        : "Tüm hesaplar"}
                    </small>
                  )}
                </div>
                {compact ? (
                  <strong>{percent(status.usage)}</strong>
                ) : (
                  <div className="row-actions">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`${b.name} düzenle`}
                      onClick={() => onEdit({ entity: "budgets", value: b })}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`${b.name} sil`}
                      onClick={() =>
                        onDelete({ entity: "budgets", id: b.id, name: b.name })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="budget-amounts">
                <strong>{money(status.spent, compact)}</strong>
                <span>/ {money(b.amount, compact)}</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${b.name} kullanımı`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round(status.usage))}
                aria-valuetext={percent(status.usage)}
              >
                <div
                  style={{
                    width: `${Math.min(status.usage, 100)}%`,
                    backgroundColor: severity ? undefined : category?.color,
                  }}
                />
              </div>
              <div className="budget-meta">
                <span>
                  {status.remaining < 0
                    ? `${money(-status.remaining, compact)} aşıldı`
                    : `${money(status.remaining, compact)} kaldı`}
                </span>
                {!compact && <strong>{percent(status.usage)}</strong>}
              </div>
              {status.threshold > 0 && data.preferences.budget_alerts && (
                <p className="budget-alert" role="status">
                  {status.threshold === 100
                    ? "Bütçe limitine ulaşıldı."
                    : `%${status.threshold} eşiğine ulaşıldı. Harcamalarını gözden geçir.`}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <EmptyState
          title="Biraz plan, daha çok rahatlık."
          description="Bu dönem için bir bütçe belirle."
          action={
            <Button
              variant="secondary"
              onClick={() => onEdit({ entity: "budgets" })}
            >
              <Plus size={15} /> Bütçe oluştur
            </Button>
          }
        />
      )}
      {compact && rows.length > 0 && (
        <div className="panel-footer">
          <Link
            className="inline-link"
            href={`${demo ? "/demo" : "/app"}/budgets`}
          >
            Tüm bütçelerini gör <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
export function RecurringPanel({ onEdit, onDelete }: Actions) {
  const { data, range, mutate, busy } = useWorkspace();
  const [limit, setLimit] = useState(20);
  const now = today();
  const until = range.end > addDays(now, 30) ? range.end : addDays(now, 30);
  const pending = data.recurring_rules
    .flatMap((rule) =>
      occurrences(rule, range.start, until)
        .filter(
          (date) =>
            !data.recurring_occurrences.some(
              (o) => o.rule_id === rule.id && o.date === date,
            ),
        )
        .map((date) => ({ rule, date })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="stack">
      <div className="notice">
        <CalendarClock size={22} />
        <div>
          <strong>Planlar ayrı, gerçekleşenler ayrı.</strong>
          <p>
            Seçili dönemin başlangıcından önümüzdeki 30 güne kadar olan ödemeler
            listelenir. Sadece gerçekleşti olarak işaretlediğin ödeme bakiyene
            yansır.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Yaklaşan & bekleyen ödemeler</h2>
            <p>
              {pending.length} planlanan işlem · {dayLabel(range.start, true)} –{" "}
              {dayLabel(until, true)}
            </p>
          </div>
          <span className="soft-tag">
            <CalendarClock size={14} /> Planlanan
          </span>
        </div>
        <div className="upcoming-list">
          {pending.slice(0, limit).map(({ rule, date }) => {
            const c = data.categories.find((c) => c.id === rule.category_id);
            return (
              <article key={rule.id + date} className="upcoming-row">
                <div className="date-tile">
                  <strong>{date.slice(-2)}</strong>
                  <span>{monthLabel(date).split(" ")[0].slice(0, 3)}</span>
                </div>
                <div className="upcoming-name">
                  <h3>{rule.name}</h3>
                  <small>
                    {data.accounts.find((a) => a.id === rule.account_id)?.name}{" "}
                    · {c?.name}
                  </small>
                  {date < now && (
                    <small className="expense">Kayıt bekliyor</small>
                  )}
                </div>
                <strong className={rule.kind}>
                  {rule.kind === "income" ? "+" : "−"}
                  {money(rule.amount)}
                </strong>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || date > now}
                  onClick={() =>
                    void mutate({
                      entity: "occurrence",
                      data: { rule_id: rule.id, date },
                    })
                  }
                >
                  <CircleCheck size={15} /> Gerçekleşti
                </Button>
              </article>
            );
          })}
        </div>
        {!pending.length && (
          <EmptyState
            title="Bekleyen ödeme yok."
            description="Düzenli gelir ve giderlerini planlayabilirsin."
          />
        )}
        {pending.length > limit && (
          <div className="panel-footer">
            <Button variant="secondary" onClick={() => setLimit(limit + 20)}>
              Daha fazla göster
            </Button>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Düzenli işlem kuralları</h2>
            <p>Pasifleştirmek veya silmek geçmiş işlemlerini etkilemez.</p>
          </div>
        </div>
        {data.recurring_rules.map((r) => (
          <article key={r.id} className="rule-row">
            <CategoryIcon
              icon={data.categories.find((c) => c.id === r.category_id)?.icon}
              color={data.categories.find((c) => c.id === r.category_id)?.color}
            />
            <div>
              <h3>{r.name}</h3>
              <small>
                {
                  {
                    daily: "Günlük",
                    weekly: "Haftalık",
                    monthly: "Aylık",
                    yearly: "Yıllık",
                  }[r.frequency]
                }{" "}
                · {r.active ? "Aktif" : "Pasif"} · {money(r.amount)}
              </small>
            </div>
            <div className="row-actions">
              <Button
                size="icon"
                variant="ghost"
                disabled={busy}
                aria-label={`${r.name} ${r.active ? "duraklat" : "etkinleştir"}`}
                onClick={() =>
                  void mutate({
                    entity: "recurring_rules",
                    data: { ...r, active: !r.active },
                  })
                }
              >
                {r.active ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`${r.name} düzenle`}
                onClick={() => onEdit({ entity: "recurring_rules", value: r })}
              >
                <Pencil size={15} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`${r.name} sil`}
                onClick={() =>
                  onDelete({
                    entity: "recurring_rules",
                    id: r.id,
                    name: r.name,
                  })
                }
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

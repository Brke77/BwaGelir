"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "./workspace-provider";
import { CategoryIcon } from "./category-icon";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import type { EditorTarget } from "./entity-editor";
import type { Transaction } from "@/lib/types";
import { dayLabel } from "@/lib/dates";
import { inRange } from "@/lib/finance";
import { money, parseMoney } from "@/lib/money";
import { downloadFile, transactionsCsv } from "@/lib/csv";

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  compact = false,
}: {
  transactions: Transaction[];
  onEdit: (target: EditorTarget) => void;
  onDelete: (t: Transaction) => void;
  compact?: boolean;
}) {
  const { data } = useWorkspace();
  const [detail, setDetail] = useState<Transaction | null>(null);
  if (!transactions.length)
    return (
      <div className="empty-state">
        <Search size={27} strokeWidth={1.3} />
        <h3>Burada henüz bir işlem yok.</h3>
        <p>Yeni bir işlem ekle veya filtrelerini değiştir.</p>
      </div>
    );
  return (
    <>
      <div className={"transaction-table" + (compact ? " compact-table" : "")}>
        <div className="transaction-table-heading">
          <span>İşlem</span>
          <span>Kategori</span>
          <span>Tarih</span>
          <span>Tutar</span>
          {!compact && <span className="sr-only">İşlemler</span>}
        </div>
        {transactions.map((t) => {
          const c = data.categories.find((c) => c.id === t.category_id);
          const account = data.accounts.find((a) => a.id === t.account_id);
          return (
            <div
              key={t.id}
              className="transaction-row"
              data-testid="transaction-row"
            >
              <button className="transaction-name" onClick={() => setDetail(t)}>
                {t.kind === "transfer" ? (
                  <span className="category-icon transfer-icon">
                    <ArrowRightLeft size={18} />
                  </span>
                ) : (
                  <CategoryIcon icon={c?.icon} color={c?.color} />
                )}
                <span>
                  <strong>{t.name}</strong>
                  <small>
                    {account?.name}
                    {t.kind === "transfer"
                      ? ` → ${data.accounts.find((a) => a.id === t.to_account_id)?.name ?? ""}`
                      : ""}
                  </small>
                </span>
              </button>
              <span className="transaction-category">
                <span className="category-tag">{c?.name ?? "Transfer"}</span>
              </span>
              <span className="transaction-date">{dayLabel(t.date, true)}</span>
              <span className={"transaction-amount " + t.kind}>
                {t.kind === "income" ? (
                  <ArrowDownLeft size={13} />
                ) : t.kind === "expense" ? (
                  <ArrowUpRight size={13} />
                ) : null}
                {t.kind === "income" ? "+" : t.kind === "expense" ? "−" : ""}
                {money(t.amount)}
                <small className="mobile-kind">
                  {t.kind === "income"
                    ? "Gelir"
                    : t.kind === "expense"
                      ? "Gider"
                      : "Transfer"}
                </small>
              </span>
              {!compact && (
                <div className="row-actions">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${t.name} düzenle`}
                    onClick={() => onEdit({ entity: "transactions", value: t })}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${t.name} sil`}
                    onClick={() => onDelete(t)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {detail && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDetail(null);
          }}
          title={detail.name}
          description="İşlem detayları"
        >
          <dl className="detail-list">
            <div>
              <dt>Tür</dt>
              <dd>
                {detail.kind === "income"
                  ? "Gelir"
                  : detail.kind === "expense"
                    ? "Gider"
                    : "Transfer"}
              </dd>
            </div>
            <div>
              <dt>Tutar</dt>
              <dd>{money(detail.amount)}</dd>
            </div>
            <div>
              <dt>Tarih</dt>
              <dd>{dayLabel(detail.date)}</dd>
            </div>
            <div>
              <dt>Hesap</dt>
              <dd>
                {data.accounts.find((a) => a.id === detail.account_id)?.name}
              </dd>
            </div>
            {detail.to_account_id && (
              <div>
                <dt>Hedef hesap</dt>
                <dd>
                  {
                    data.accounts.find((a) => a.id === detail.to_account_id)
                      ?.name
                  }
                </dd>
              </div>
            )}
            <div>
              <dt>Kategori</dt>
              <dd>
                {data.categories.find((c) => c.id === detail.category_id)
                  ?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt>Açıklama</dt>
              <dd>{detail.description || "Açıklama eklenmemiş."}</dd>
            </div>
          </dl>
          <div className="dialog-actions">
            <Button
              variant="secondary"
              onClick={() => {
                onDelete(detail);
                setDetail(null);
              }}
            >
              Sil
            </Button>
            <Button
              onClick={() => {
                onEdit({ entity: "transactions", value: detail });
                setDetail(null);
              }}
            >
              İşlemi düzenle
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function TransactionsPanel({
  onEdit,
  onDelete,
  recent = false,
}: {
  onEdit: (target: EditorTarget) => void;
  onDelete: (t: Transaction) => void;
  recent?: boolean;
}) {
  const { data, range, demo, notify } = useWorkspace();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [account, setAccount] = useState("");
  const [kind, setKind] = useState("");
  const [filters, setFilters] = useState(false);
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [page, setPage] = useState(1);
  let min = 0;
  let max = Number.MAX_SAFE_INTEGER;
  let amountError = "";
  try {
    if (minimum) min = parseMoney(minimum, true);
    if (maximum) max = parseMoney(maximum, true);
    if (min > max) amountError = "En düşük tutar, en yüksek tutarı aşamaz.";
  } catch {
    amountError = "Tutar aralığını 1.250,50 biçiminde girin.";
  }
  const rows = data.transactions
    .filter(
      (t) =>
        inRange(t, range) &&
        (recent ||
          ((!category || t.category_id === category) &&
            (!account ||
              t.account_id === account ||
              t.to_account_id === account) &&
            (!kind || t.kind === kind) &&
            t.amount >= min &&
            t.amount <= max &&
            (!search ||
              `${t.name} ${t.description}`
                .toLocaleLowerCase("tr")
                .includes(search.toLocaleLowerCase("tr"))))),
    )
    .sort((a, b) =>
      sort === "amount-desc"
        ? b.amount - a.amount
        : sort === "amount-asc"
          ? a.amount - b.amount
          : sort === "date-asc"
            ? a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
            : b.date.localeCompare(a.date) ||
              (b.created_at ?? "").localeCompare(a.created_at ?? "") ||
              b.id.localeCompare(a.id),
    );
  const pageCount = Math.max(1, Math.ceil(rows.length / 20));
  const safePage = Math.min(page, pageCount);
  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setAccount("");
    setKind("");
    setMinimum("");
    setMaximum("");
    setPage(1);
  };
  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <div>
          <h2>{recent ? "Son işlemler" : "Tüm işlemler"}</h2>
          <p>
            {recent
              ? "Hayatın içinden, hesabına yansıyanlar."
              : `${rows.length} işlem · Seçili tarih aralığı`}
          </p>
        </div>
        {recent ? (
          <Link
            className="inline-link"
            href={`${demo ? "/demo" : "/app"}/transactions`}
          >
            Tümünü gör <ArrowUpRight size={16} />
          </Link>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (amountError) {
                notify(amountError, true);
                return;
              }
              downloadFile(
                "kasaflow-islemler.csv",
                transactionsCsv(rows, data),
                "text/csv;charset=utf-8",
              );
            }}
          >
            <Download size={15} /> CSV indir
          </Button>
        )}
      </div>
      {!recent && (
        <>
          <div className="transaction-controls">
            <div className="search-input">
              <Search size={17} />
              <input
                aria-label="İşlemlerde ara"
                placeholder="İşlem adı veya açıklama ara…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              aria-label="İşlem türü filtresi"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tüm türler</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
              <option value="transfer">Transfer</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => setFilters(!filters)}
              aria-expanded={filters}
            >
              <SlidersHorizontal size={16} />
              <span>Filtreler</span>
            </Button>
          </div>
          {(filters || category) && (
            <div className="filter-grid">
              <label>
                Kategori
                <select
                  aria-label="Kategori"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tüm kategoriler</option>
                  {data.categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Hesap
                <select
                  aria-label="Hesap"
                  value={account}
                  onChange={(e) => {
                    setAccount(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tüm hesaplar</option>
                  {data.accounts.map((a) => (
                    <option value={a.id} key={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                En düşük tutar (TL)
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={minimum}
                  onChange={(e) => {
                    setMinimum(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label>
                En yüksek tutar (TL)
                <input
                  inputMode="decimal"
                  placeholder="Limitsiz"
                  value={maximum}
                  onChange={(e) => {
                    setMaximum(e.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label>
                Sıralama
                <select
                  aria-label="Sıralama"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="date-desc">En yeni tarih</option>
                  <option value="date-asc">En eski tarih</option>
                  <option value="amount-desc">En yüksek tutar</option>
                  <option value="amount-asc">En düşük tutar</option>
                </select>
              </label>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X size={14} /> Temizle
              </Button>
            </div>
          )}
          {amountError && (
            <p className="form-error" role="alert">
              {amountError}
            </p>
          )}
        </>
      )}
      <TransactionList
        transactions={
          amountError
            ? []
            : recent
              ? rows.slice(0, 5)
              : rows.slice((safePage - 1) * 20, safePage * 20)
        }
        onEdit={onEdit}
        onDelete={onDelete}
        compact={recent}
      />
      {!recent && (
        <div className="pagination">
          <span>
            {rows.length
              ? `${(safePage - 1) * 20 + 1}–${Math.min(safePage * 20, rows.length)}`
              : "0"}{" "}
            / {rows.length} işlem
          </span>
          <div>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Önceki sayfa"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span>
              {safePage} / {pageCount}
            </span>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Sonraki sayfa"
              disabled={safePage >= pageCount}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Tags,
  Target,
  TrendingUp,
  Wallet,
  CalendarClock,
} from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { EntityEditor, type EditorTarget } from "./entity-editor";
import {
  AccountCards,
  BudgetsPanel,
  CategoriesPanel,
  RecurringPanel,
  visibleBudgets,
  type DeleteTarget,
} from "./management-panels";
import { TransactionsPanel } from "./transactions";
import { BalanceChart, CashflowChart, DistributionChart } from "./charts";
import { ReportsPanel, SettingsPanel } from "./reports-settings";
import { pageNames } from "@/lib/navigation";
import type { DateRange, Page } from "@/lib/types";
import { dayLabel, getRange, isDate, presets } from "@/lib/dates";
import { budgetStatus, summarize } from "@/lib/finance";
import { money, percent } from "@/lib/money";
import { browserSupabase } from "@/lib/supabase/client";

const navigation = [
  { page: "overview", icon: LayoutDashboard },
  { page: "transactions", icon: ListFilter },
  { page: "accounts", icon: Wallet },
  { page: "categories", icon: Tags },
  { page: "budgets", icon: Target },
  { page: "recurring", icon: CalendarClock },
  { page: "reports", icon: ChartNoAxesCombined },
  { page: "settings", icon: Settings2 },
] as const;
const descriptions: Record<Page, string> = {
  overview: "Finansal hayatına daha geniş bir açıdan bak.",
  transactions: "Her hareketin bir hikâyesi var. Kontrol sende.",
  accounts: "Günlük harcamadan birikime, hepsi bir arada.",
  categories: "Senin hayatın, senin kategorilerin.",
  budgets: "Önceliklerine yer aç, harcamalarını dengele.",
  recurring: "Rutinlerini planla. Aklın gelecekte kalsın.",
  reports: "Verilerinden daha net bir resim çıkar.",
  settings: "KasaFlow'u kendine göre düzenle.",
};

export function FinanceApp({ page }: { page: Page }) {
  const {
    data,
    demo,
    loading,
    error,
    busy,
    range,
    setRange,
    mutate,
    refresh,
    notify,
  } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [deletion, setDeletion] = useState<DeleteTarget | null>(null);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [customDate, setCustomDate] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const base = demo ? "/demo" : "/app";
  const firstName = data.preferences.name.trim().split(" ")[0];
  const openEditor = (target: EditorTarget) => {
    if (
      (target.entity === "transactions" ||
        target.entity === "recurring_rules") &&
      !data.accounts.length
    ) {
      setEditor({ entity: "accounts" });
      notify("İlk işleminden önce bir hesap oluştur.");
      return;
    }
    setEditor(target);
  };
  const create = () =>
    openEditor(
      page === "accounts"
        ? { entity: "accounts" }
        : page === "categories"
          ? { entity: "categories" }
          : page === "budgets"
            ? { entity: "budgets" }
            : page === "recurring"
              ? { entity: "recurring_rules" }
              : { entity: "transactions" },
    );
  const createLabel =
    page === "accounts"
      ? "Yeni hesap"
      : page === "categories"
        ? "Yeni kategori"
        : page === "budgets"
          ? "Yeni bütçe"
          : page === "recurring"
            ? "Yeni plan"
            : "Yeni işlem";
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        editor ||
        menu ||
        help ||
        customDate ||
        deletion
      )
        return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        if (data.accounts.length) setEditor({ entity: "transactions" });
        else setEditor({ entity: "accounts" });
      }
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [customDate, data.accounts.length, deletion, editor, help, menu]);
  const preset =
    presets.find(
      (p) =>
        p !== "Özel aralık" &&
        getRange(p).start === range.start &&
        getRange(p).end === range.end,
    ) ?? "Özel aralık";
  async function logout() {
    if (demo) {
      router.push("/login");
      return;
    }
    try {
      const { error } = await browserSupabase().auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch {
      notify("Çıkış yapılamadı. Yeniden deneyin.", true);
    }
  }
  const deleteTransaction = (t: { id: string; name: string }) =>
    setDeletion({ entity: "transactions", ...t });
  const actions = { onEdit: openEditor, onDelete: setDeletion };
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">
        İçeriğe geç
      </a>
      <aside className="sidebar">
        <Link href={`${base}/overview`} aria-label="KasaFlow Genel Bakış">
          <Logo />
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">K</span>
          <span>
            Kişisel alanım<small>Finansın, senin kontrolünde</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="sidebar-label">ÇALIŞMA ALANI</div>
        <nav aria-label="Ana menü">
          {navigation.map(({ page: item, icon: Icon }, i) => (
            <Link
              key={item}
              href={`${base}/${item}`}
              className={
                "nav-item" +
                (item === page ? " active" : "") +
                (i === 4 ? " nav-divider" : "")
              }
              aria-current={item === page ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              {pageNames[item]}
              {item === "overview" && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">
              <Sparkles size={19} />
            </span>
            <strong>
              İyi bir yarın,
              <br />
              bugünden başlar.
            </strong>
            <p>Paranı tanımak, kendine alan açmaktır.</p>
            <button onClick={() => router.push(`${base}/reports`)}>
              Finansal resmini gör <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="sidebar-help" onClick={() => setHelp(true)}>
            <CircleHelp size={18} /> Yardım & kısayollar
          </button>
          <button
            className="profile-button"
            onClick={() => router.push(`${base}/settings`)}
          >
            <span className="avatar">
              {firstName?.[0]?.toLocaleUpperCase("tr") || "K"}
            </span>
            <span>
              <strong>{data.preferences.name || "Kişisel hesabım"}</strong>
              <small>{demo ? "Demo çalışma alanı" : "Hesap ayarları"}</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span>Kişisel alanım</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{pageNames[page]}</strong>
          </div>
          <Link href={`${base}/overview`} className="mobile-brand">
            <Logo />
          </Link>
          <div className="topbar-tools">
            <form
              className="global-search"
              onSubmit={(event) => {
                event.preventDefault();
                const q = searchRef.current?.value.trim() ?? "";
                router.push(`${base}/transactions?q=${encodeURIComponent(q)}`);
              }}
            >
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Genel işlem araması"
                placeholder="İşlemlerinde ara…"
              />
              <kbd>/</kbd>
            </form>
            <button
              className="theme-toggle"
              aria-label="Temayı değiştir"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun size={18} className="sun-icon" />
              <Moon size={18} className="moon-icon" />
            </button>
            <span className="topbar-separator" />
            <button
              className="avatar small-avatar"
              aria-label="Kullanıcı ayarları"
              onClick={() => router.push(`${base}/settings`)}
            >
              {firstName?.[0]?.toLocaleUpperCase("tr") || "K"}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void logout()}
              aria-label={demo ? "Demodan çık" : "Çıkış yap"}
            >
              <LogOut size={17} />
            </Button>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <FlaskConical size={14} />
              <strong>Demo alanı</strong>
              <span>
                Örnek veriler · Değişiklikler yalnızca bu tarayıcıda saklanır.
              </span>
            </span>
            <Link href="/register">
              Kendi alanını oluştur <ArrowRight size={13} />
            </Link>
          </div>
        )}
        <main id="main-content" className="main-content">
          <div className="page-header">
            <div>
              <span className="eyebrow">
                {page === "overview"
                  ? "DAHA NET BİR FİNANSAL HAYAT"
                  : "KİŞİSEL FİNANS ALANIN"}
              </span>
              <h1>
                {page === "overview"
                  ? `Merhaba${firstName ? `, ${firstName}` : ""}`
                  : pageNames[page]}
                {page === "overview" && <span className="greeting-dot">.</span>}
              </h1>
              <p>{descriptions[page]}</p>
            </div>
            <div className="page-actions">
              <div className="date-select">
                <CalendarDays size={16} />
                <select
                  aria-label="Tarih filtresi"
                  value={preset}
                  onChange={(event) => {
                    if (event.target.value === "Özel aralık")
                      setCustomDate(true);
                    else setRange(getRange(event.target.value));
                  }}
                >
                  {presets.map((p) => (
                    <option value={p} key={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {preset === "Özel aralık" && (
                  <button
                    aria-label="Özel tarih aralığını düzenle"
                    onClick={() => setCustomDate(true)}
                  >
                    <CalendarDays size={14} />
                  </button>
                )}
              </div>
              <Button onClick={create} className="new-entry-button">
                <Plus size={17} />
                {createLabel}
              </Button>
            </div>
          </div>
          {preset === "Özel aralık" && (
            <p className="custom-range-label">
              {dayLabel(range.start)} – {dayLabel(range.end)}
            </p>
          )}
          {loading && !data.accounts.length ? (
            <div
              className="dashboard-loading"
              role="status"
              aria-label="Finansal veriler yükleniyor"
            >
              <div className="skeleton-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
              <div className="skeleton large-skeleton" />
            </div>
          ) : error ? (
            <div className="load-error" role="alert">
              <ShieldCheck size={30} />
              <h2>Veriler yüklenemedi.</h2>
              <p>{error}</p>
              <Button onClick={() => void refresh()}>
                <RefreshCw size={16} /> Tekrar dene
              </Button>
            </div>
          ) : (
            <div aria-busy={loading} className={loading ? "refreshing" : ""}>
              {page === "overview" && (
                <Overview
                  onEdit={openEditor}
                  onDelete={setDeletion}
                  onDeleteTransaction={deleteTransaction}
                />
              )}
              {page === "transactions" && (
                <Suspense>
                  <TransactionsPanel
                    key={searchParams.toString()}
                    onEdit={openEditor}
                    onDelete={deleteTransaction}
                  />
                </Suspense>
              )}
              {page === "accounts" && <AccountCards {...actions} />}
              {page === "categories" && <CategoriesPanel {...actions} />}
              {page === "budgets" && <BudgetsPanel {...actions} />}
              {page === "recurring" && <RecurringPanel {...actions} />}
              {page === "reports" && <ReportsPanel {...actions} />}
              {page === "settings" && <SettingsPanel />}
            </div>
          )}
          <footer className="app-footer">
            <span>
              <ShieldCheck size={13} /> Senin alanın. Senin verilerin.
            </span>
            <span>KasaFlow · Daha dengeli bir yarın için.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobil menü">
        <Link
          href={`${base}/overview`}
          aria-current={page === "overview" ? "page" : undefined}
        >
          <LayoutDashboard size={21} />
          <span>Genel Bakış</span>
        </Link>
        <Link
          href={`${base}/transactions`}
          aria-current={page === "transactions" ? "page" : undefined}
        >
          <ListFilter size={21} />
          <span>İşlemler</span>
        </Link>
        <button
          className="mobile-add"
          onClick={() => openEditor({ entity: "transactions" })}
          aria-label="Yeni işlem ekle"
        >
          <Plus size={25} />
        </button>
        <Link
          href={`${base}/budgets`}
          aria-current={page === "budgets" ? "page" : undefined}
        >
          <Target size={21} />
          <span>Bütçeler</span>
        </Link>
        <button onClick={() => setMenu(true)} aria-label="Diğer sayfalar">
          <Menu size={21} />
          <span>Diğer</span>
        </button>
      </nav>
      {editor && (
        <EntityEditor
          key={`${editor.entity}-${editor.value?.id ?? "new"}`}
          target={editor}
          onClose={() => setEditor(null)}
        />
      )}
      {deletion && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !busy) setDeletion(null);
          }}
          title="Kayıt silinsin mi?"
          description={`“${deletion.name}” kaydı silinecek. Bu işlem geri alınamaz.`}
        >
          <p className="muted">
            {deletion.entity === "categories"
              ? "Geçmiş işlemlere bağlı bir kategori silinemez. Bunun yerine kategoriyi arşivleyebilirsin."
              : deletion.entity === "recurring_rules"
                ? "Daha önce gerçekleşmiş işlemler korunur."
                : "Finansal özetlerin kayıt silindikten sonra yeniden hesaplanır."}
          </p>
          <div className="dialog-actions">
            <Button
              variant="secondary"
              onClick={() => setDeletion(null)}
              disabled={busy}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate({
                    entity: "delete",
                    data: { table: deletion.entity, id: deletion.id },
                  })
                )
                  setDeletion(null);
              }}
            >
              {busy ? "Siliniyor…" : "Evet, sil"}
            </Button>
          </div>
        </Dialog>
      )}
      {menu && (
        <Dialog
          open
          onOpenChange={setMenu}
          title="Kişisel alanın"
          description="Tüm sayfalara buradan ulaşabilirsin."
        >
          <div className="mobile-menu-grid">
            {navigation.map(({ page: item, icon: Icon }) => (
              <Link
                key={item}
                href={`${base}/${item}`}
                onClick={() => setMenu(false)}
                aria-current={item === page ? "page" : undefined}
              >
                <Icon size={22} />
                {pageNames[item]}
              </Link>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setMenu(false);
              void logout();
            }}
          >
            <LogOut size={16} />
            {demo ? "Demodan çık" : "Çıkış yap"}
          </Button>
        </Dialog>
      )}
      {help && (
        <Dialog
          open
          onOpenChange={setHelp}
          title="Biraz yardım, daha çok kontrol."
          description="KasaFlow'u kullanmaya başlamak için ihtiyacın olanlar."
        >
          <div className="help-content">
            <p>
              <strong>1. Hesabını oluştur.</strong> Banka, nakit veya birikim
              hesabını ve başlangıç bakiyeni ekle.
            </p>
            <p>
              <strong>2. İşlemini kaydet.</strong> Gelir ya da giderin adını
              kendin yaz; tutarını, kategorisini ve hesabını seç.
            </p>
            <p>
              <strong>3. Büyük resme bak.</strong> Tarih filtresiyle özetlerini
              ve raporlarını incele. Bütçeler her zaman tam ay üzerinden
              hesaplanır.
            </p>
            <div className="shortcut">
              <kbd>N</kbd> Yeni işlem <kbd>/</kbd> İşlemlerde ara <kbd>Esc</kbd>{" "}
              Pencereyi kapat
            </div>
            <p className="muted">
              Tutarları 1.250,50 biçiminde girebilirsin. Transferler gelir ve
              gider toplamına katılmaz. Gelecek tarihli hareketler için düzenli
              ödeme oluştur.
            </p>
          </div>
        </Dialog>
      )}
      {customDate && (
        <RangeDialog
          range={range}
          onClose={() => setCustomDate(false)}
          onSave={(value) => {
            setRange(value);
            setCustomDate(false);
          }}
        />
      )}
    </div>
  );
}

function RangeDialog({
  range,
  onSave,
  onClose,
}: {
  range: DateRange;
  onSave: (value: DateRange) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);
  const [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Kendi dönemini seç"
      description="En fazla üç yıllık tarih aralığıyla finansal resmini incele."
    >
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (
            !isDate(start) ||
            !isDate(end) ||
            start > end ||
            (Date.parse(end) - Date.parse(start)) / 86400000 > 1096
          ) {
            setError(
              "Başlangıç ve bitiş tarihlerini kontrol edin (en fazla 3 yıl).",
            );
            return;
          }
          onSave({ start, end });
        }}
      >
        <label>
          Başlangıç tarihi
          <input
            type="date"
            value={start}
            min="1900-01-01"
            max="2199-12-31"
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </label>
        <label>
          Bitiş tarihi
          <input
            type="date"
            value={end}
            min="1900-01-01"
            max="2199-12-31"
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit">Uygula</Button>
        </div>
      </form>
    </Dialog>
  );
}
function Overview({
  onEdit,
  onDelete,
  onDeleteTransaction,
}: {
  onEdit: (v: EditorTarget) => void;
  onDelete: (v: DeleteTarget) => void;
  onDeleteTransaction: (v: { id: string; name: string }) => void;
}) {
  const { data, range } = useWorkspace();
  const stats = summarize(data, range);
  const budgets = visibleBudgets(data, range.start, range.end).map((b) => ({
    ...b,
    ...budgetStatus(b, data.transactions),
  }));
  const maxUsage = budgets.length
    ? Math.max(...budgets.map((b) => b.usage))
    : null;
  const metrics = [
    {
      label: "Toplam bakiye",
      value: stats.balance,
      icon: Wallet,
      hint: "Tüm hesapların güncel toplamı",
      className: "balance-metric",
    },
    {
      label: "Dönem geliri",
      value: stats.income,
      icon: ArrowDownLeft,
      hint: "Seçili dönemdeki tüm gelirler",
      className: "income-metric",
    },
    {
      label: "Dönem gideri",
      value: stats.expense,
      icon: ArrowUpRight,
      hint: "Seçili dönemdeki tüm giderler",
      className: "expense-metric",
    },
    {
      label: "Net nakit akışı",
      value: stats.net,
      icon: TrendingUp,
      hint: "Dönem geliri − dönem gideri",
      className: "net-metric",
    },
  ];
  return (
    <div className="stack dashboard-stack">
      {!data.accounts.length && (
        <section className="onboarding">
          <div>
            <span className="eyebrow">İLK ADIMI BİRLİKTE ATALIM</span>
            <h2>Finansal hikâyen burada başlıyor.</h2>
            <p>
              İlk hesabını ve başlangıç bakiyeni ekle. Ardından gelir ve
              giderlerini kaydetmeye başlayabilirsin.
            </p>
            <div className="onboarding-steps">
              <span>
                <b>1</b> Hesabını oluştur
              </span>
              <span>
                <b>2</b> İlk işlemini ekle
              </span>
              <span>
                <b>3</b> Büyük resmi gör
              </span>
            </div>
          </div>
          <Button onClick={() => onEdit({ entity: "accounts" })}>
            <Plus size={17} /> İlk hesabımı oluştur
          </Button>
        </section>
      )}
      <div className="metrics-grid">
        {metrics.map(({ label, value, icon: Icon, hint, className }) => (
          <article
            className={
              "metric-card " +
              className +
              (Math.abs(value) >= 1000000000 ? " large-value" : "")
            }
            key={label}
          >
            <div className="metric-top">
              <span>{label}</span>
              <span className="metric-icon">
                <Icon size={18} strokeWidth={1.7} />
              </span>
            </div>
            <strong
              data-testid={
                label === "Toplam bakiye" ? "total-balance" : undefined
              }
            >
              {money(value)}
            </strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
      <div className="insights-strip">
        <div>
          <span className="insight-icon">
            <PiggyBankIcon />
          </span>
          <div>
            <span>Tasarruf oranı</span>
            <strong>
              {stats.savings === null
                ? "Henüz gelir yok"
                : percent(stats.savings)}
            </strong>
          </div>
          <p>
            {stats.savings === null
              ? "Gelir eklediğinde hesaplanacak."
              : stats.savings >= 0
                ? "Bugünden geleceğine ayırdığın pay."
                : "Bu dönemin gideri, gelirini aşıyor."}
          </p>
        </div>
        <div>
          <span className="insight-icon">
            <Target size={20} />
          </span>
          <div>
            <span>Bütçe kullanımı</span>
            <strong>
              {maxUsage === null ? "Henüz bütçe yok" : percent(maxUsage)}
            </strong>
          </div>
          <p>
            {maxUsage === null
              ? "Kendine bir harcama alanı belirle."
              : "Seçili aylardaki en yüksek limit kullanımı."}
          </p>
        </div>
      </div>
      <div className="dashboard-two-columns">
        <CashflowChart />
        <DistributionChart />
      </div>
      <div className="dashboard-two-columns">
        <Suspense>
          <TransactionsPanel
            recent
            onEdit={onEdit}
            onDelete={onDeleteTransaction}
          />
        </Suspense>
        <BudgetsPanel compact onEdit={onEdit} onDelete={onDelete} />
      </div>
      <AccountCards compact onEdit={onEdit} onDelete={onDelete} />
      <BalanceChart />
    </div>
  );
}
function PiggyBankIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 8c1 1 2 3 2 5h1v4h-3l-1 3h-3v-2H8v2H5l-1-5-2-2V9l4 1a8 8 0 0 1 7-4l4-3v4" />
      <path d="M10 6V3h4M15 11h.01" />
    </svg>
  );
}

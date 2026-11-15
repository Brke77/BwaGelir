"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Download,
  LockKeyhole,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { BalanceChart, CashflowChart, DistributionChart } from "./charts";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Field } from "./entity-editor";
import { CategoryIcon } from "./category-icon";
import { addDays, dayLabel } from "@/lib/dates";
import { cashflow, distribution, inRange, summarize } from "@/lib/finance";
import { money, percent } from "@/lib/money";
import { downloadFile, transactionsCsv } from "@/lib/csv";
import { BudgetsPanel, type DeleteTarget } from "./management-panels";
import type { EditorTarget } from "./entity-editor";
import { browserSupabase } from "@/lib/supabase/client";

export function ReportsPanel({
  onEdit,
  onDelete,
}: {
  onEdit: (v: EditorTarget) => void;
  onDelete: (v: DeleteTarget) => void;
}) {
  const { data, range } = useWorkspace();
  const summary = summarize(data, range);
  const days =
    Math.round((Date.parse(range.end) - Date.parse(range.start)) / 86400000) +
    1;
  const previousRange = {
    start: addDays(range.start, -days),
    end: addDays(range.start, -1),
  };
  const previous = data.previous_summary ?? summarize(data, previousRange);
  const categories = distribution(data, range);
  const previousCategories =
    data.previous_expenses ??
    distribution(data, previousRange).map((c) => ({
      category_id: c.id,
      amount: c.value,
    }));
  const expenses = data.transactions
    .filter((t) => t.kind === "expense" && inRange(t, range))
    .sort((a, b) => b.amount - a.amount);
  const busiest = cashflow(data, range, "day").sort(
    (a, b) => b.expense - a.expense,
  )[0];
  const change =
    previous.expense > 0
      ? ((summary.expense - previous.expense) / previous.expense) * 100
      : null;
  return (
    <div className="stack">
      <div className="report-intro">
        <div>
          <span className="eyebrow">SAYILARIN ANLATTIĞI</span>
          <h2>
            Alışkanlıklarını tanı.
            <br />
            Daha bilinçli adımlar at.
          </h2>
          <p>
            {dayLabel(range.start, true)} – {dayLabel(range.end, true)} dönemi,
            gerçek kayıtlarından hesaplandı.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadFile(
              "kasaflow-rapor.csv",
              transactionsCsv(
                data.transactions.filter((t) => inRange(t, range)),
                data,
              ),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={16} /> Raporu indir
        </Button>
      </div>
      <div className="report-stats">
        <article>
          <span>Ortalama gider</span>
          <strong>
            {money(
              expenses.length
                ? Math.round(summary.expense / expenses.length)
                : 0,
            )}
          </strong>
          <small>{expenses.length} gider işlemi</small>
        </article>
        <article>
          <span>Önceki döneme göre gider</span>
          <strong>
            {change === null
              ? "—"
              : `${change > 0 ? "+" : ""}${percent(change)}`}
          </strong>
          <small>
            {dayLabel(previousRange.start, true)} –{" "}
            {dayLabel(previousRange.end, true)} karşılaştırması
          </small>
        </article>
        <article>
          <span>En yoğun harcama günü</span>
          <strong>
            {busiest?.expense ? dayLabel(busiest.date, true) : "—"}
          </strong>
          <small>
            {busiest?.expense ? money(busiest.expense) : "Bu dönemde gider yok"}
          </small>
        </article>
        <article>
          <span>Net nakit akışı</span>
          <strong>{money(summary.net)}</strong>
          <small>{summary.count} finansal hareket</small>
        </article>
      </div>
      <div className="dashboard-two-columns">
        <CashflowChart report />
        <DistributionChart />
      </div>
      <BalanceChart />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Kategori analizi</h2>
            <p>
              Seçili dönem ve aynı uzunluktaki önceki dönem karşılaştırması.
            </p>
          </div>
        </div>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Gider</th>
                <th>Pay</th>
                <th>Önceki dönem</th>
                <th>Değişim</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const prior =
                  previousCategories.find((p) => p.category_id === c.id)
                    ?.amount ?? 0;
                const delta = prior ? ((c.value - prior) / prior) * 100 : null;
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="table-category">
                        <CategoryIcon icon={c.icon} color={c.color} size={15} />
                        {c.name}
                      </span>
                    </td>
                    <td>{money(c.value)}</td>
                    <td>{percent(c.share)}</td>
                    <td>{money(prior)}</td>
                    <td>
                      {delta === null
                        ? "Yeni harcama"
                        : `${delta > 0 ? "+" : ""}${percent(delta)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!categories.length && (
            <p className="muted empty-text">
              Bu dönemde kategori harcaması yok.
            </p>
          )}
        </div>
      </section>
      <div className="dashboard-two-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>En yüksek giderler</h2>
              <p>Harcama resminin en büyük parçaları.</p>
            </div>
            <ArrowUpRight size={18} />
          </div>
          {expenses.slice(0, 5).map((t, index) => (
            <div className="top-expense" key={t.id}>
              <span className="expense-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{t.name}</strong>
                <small>
                  {dayLabel(t.date, true)} ·{" "}
                  {data.categories.find((c) => c.id === t.category_id)?.name}
                </small>
              </div>
              <strong>{money(t.amount)}</strong>
            </div>
          ))}
          {!expenses.length && (
            <p className="empty-text muted">Henüz gider yok.</p>
          )}
        </section>
        <BudgetsPanel compact onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
export function SettingsPanel() {
  const { data, demo, mutate, busy, notify, resetDemo, refresh, range } =
    useWorkspace();
  const { theme, setTheme } = useTheme();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate({
      entity: "preferences",
      data: {
        name: String(form.get("name") ?? ""),
        theme: String(form.get("theme") ?? "system") as
          "light" | "dark" | "system",
        budget_alerts: form.get("budget_alerts") === "on",
      },
    });
  }
  async function exportData() {
    try {
      if (demo) {
        downloadFile(
          "kasaflow-demo-yedek.json",
          JSON.stringify({ version: 1, ...data }, null, 2),
          "application/json",
        );
        return;
      }
      const response = await fetch("/api/export", { cache: "no-store" });
      if (!response.ok) throw new Error("Yedek indirilemedi.");
      downloadFile(
        "kasaflow-yedek.json",
        await response.text(),
        "application/json",
      );
    } catch {
      notify("Yedek indirilemedi. Bağlantıyı kontrol edin.", true);
    }
  }
  async function clearData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleting) return;
    if (demo) {
      resetDemo();
      setConfirm(false);
      return;
    }
    setDeleting(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: form.get("password"),
          confirmation: form.get("confirmation"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Veriler silinemedi.");
      await refresh();
      setConfirm(false);
      notify("Finansal verileriniz silindi.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "İşlem başarısız.", true);
    } finally {
      setDeleting(false);
    }
  }
  async function changePassword() {
    try {
      const {
        data: { user },
      } = await browserSupabase().auth.getUser();
      if (!user?.email) throw new Error();
      const { error } = await browserSupabase().auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );
      if (error) throw error;
      notify("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch {
      notify("Bağlantı gönderilemedi. Daha sonra tekrar deneyin.", true);
    }
  }
  return (
    <div className="settings-layout">
      <div className="stack">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Sana ait bir alan</h2>
              <p>Profilin ve günlük kullanım tercihlerin.</p>
            </div>
          </div>
          <form onSubmit={save} className="settings-form">
            <Field label="Ad Soyad">
              <input
                name="name"
                defaultValue={data.preferences.name}
                maxLength={80}
                placeholder="Adını gir"
              />
            </Field>
            <div className="form-columns">
              <Field label="Görünüm">
                <select
                  name="theme"
                  defaultValue={data.preferences.theme || theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="system">Sistem tercihi</option>
                  <option value="light">Açık tema</option>
                  <option value="dark">Koyu tema</option>
                </select>
              </Field>
              <Field label="Para birimi">
                <input value="TRY · Türk Lirası" readOnly />
              </Field>
              <Field label="Dil">
                <input value="Türkçe" readOnly />
              </Field>
              <Field label="Saat dilimi">
                <input value="Europe/Istanbul" readOnly />
              </Field>
            </div>
            <label className="preference-check">
              <Bell size={20} />
              <span>
                <strong>Bütçe uyarıları</strong>
                <small>
                  %75, %90 ve %100 eşiklerinde uygulama içi uyarılar.
                </small>
              </span>
              <input
                name="budget_alerts"
                type="checkbox"
                defaultChecked={data.preferences.budget_alerts}
              />
            </label>
            <Button type="submit" disabled={busy}>
              Tercihleri kaydet
            </Button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Verilerin her zaman senin</h2>
              <p>Tüm kayıtlarını veya seçili dönemin işlemlerini indir.</p>
            </div>
          </div>
          <div className="settings-actions">
            <Button variant="secondary" onClick={() => void exportData()}>
              <ArrowDownToLine size={17} /> Tam veri yedeği (JSON)
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadFile(
                  "kasaflow-islemler.csv",
                  transactionsCsv(
                    data.transactions.filter((t) => inRange(t, range)),
                    data,
                  ),
                  "text/csv;charset=utf-8",
                )
              }
            >
              <Download size={17} /> Seçili dönem (CSV)
            </Button>
          </div>
          <p className="settings-hint">
            CSV dosyası Türkçe Excel için UTF-8 ve noktalı virgül ile
            hazırlanır. JSON yedeği tüm finansal kayıtlarını içerir; otomatik
            geri yükleme bu sürümde yoktur.
          </p>
        </section>
        <section className="panel danger-zone">
          <div className="panel-heading">
            <div>
              <h2>
                {demo ? "Demoyu yeniden başlat" : "Finansal verileri sil"}
              </h2>
              <p>
                {demo
                  ? "Örnek kayıtları başlangıç durumuna getir."
                  : "İşlemler, hesaplar, kategoriler, bütçeler ve planlar silinir. Kullanıcı hesabın korunur."}
              </p>
            </div>
          </div>
          <div className="settings-actions">
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              <Trash2 size={16} />
              {demo ? "Demoyu sıfırla" : "Tüm finansal verileri sil"}
            </Button>
          </div>
        </section>
      </div>
      <aside className="stack">
        <section className="panel privacy-card">
          <ShieldCheck size={30} strokeWidth={1.3} />
          <h2>Gizliliğin önce gelir.</h2>
          <p>
            Verilerine sadece kendi hesabınla erişebilirsin. Banka şifreni veya
            kart bilgilerini istemeyiz.
          </p>
          <div>
            <LockKeyhole size={15} /> Kişisel, güvenli ve sana özel.
          </div>
          {!demo && (
            <Button variant="secondary" onClick={() => void changePassword()}>
              Şifremi değiştir
            </Button>
          )}
        </section>
        <section className="panel install-card">
          <span className="eyebrow">HER ZAMAN ELİNİN ALTINDA</span>
          <h2>KasaFlow cebinde.</h2>
          <p>
            Tarayıcındaki “Ana Ekrana Ekle” veya “Uygulamayı yükle” seçeneğiyle
            hızlıca eriş.
          </p>
          <small>
            Finansal bilgiler çevrimdışı önbelleğe alınmaz. İşlem kaydetmek için
            internet gerekir.
          </small>
        </section>
      </aside>
      {confirm && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !deleting) setConfirm(false);
          }}
          title={
            demo ? "Demo sıfırlansın mı?" : "Finansal verilerin silinsin mi?"
          }
          description={
            demo
              ? "Yaptığın demo değişiklikleri kaldırılır ve örnek kayıtlar yenilenir."
              : "Bu işlem geri alınamaz. Önce bir veri yedeği indirmeni öneririz."
          }
        >
          <form onSubmit={clearData} className="editor-form">
            {!demo && (
              <>
                <Field label="Onay için VERİLERİ SİL yazın">
                  <input
                    name="confirmation"
                    required
                    autoComplete="off"
                    pattern="VERİLERİ SİL"
                  />
                </Field>
                <Field label="Hesap şifreniz">
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    maxLength={128}
                    required
                  />
                </Field>
              </>
            )}
            <div className="dialog-actions">
              <Button
                variant="secondary"
                disabled={deleting}
                onClick={() => setConfirm(false)}
              >
                Vazgeç
              </Button>
              <Button type="submit" variant="destructive" disabled={deleting}>
                {deleting
                  ? "Siliniyor…"
                  : demo
                    ? "Demoyu sıfırla"
                    : "Kalıcı olarak sil"}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

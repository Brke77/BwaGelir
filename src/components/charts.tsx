"use client";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { useRouter } from "next/navigation";
import { balanceTrend, cashflow, distribution } from "@/lib/finance";
import { dayLabel, monthLabel } from "@/lib/dates";
import { money, percent, sumMoney } from "@/lib/money";
import { useWorkspace } from "./workspace-provider";

function axisMoney(value: number) {
  const lira = value / 100;
  return Math.abs(lira) >= 1000
    ? `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(lira / 1000)}b`
    : String(lira);
}
function chartDate(value: string) {
  if (value.length === 4) return value;
  if (value.length === 7) return monthLabel(value).split(" ")[0].slice(0, 3);
  return dayLabel(value, true);
}
const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--text)",
  boxShadow: "0 8px 30px #00000010",
  fontSize: 12,
};
export function EmptyChart({
  text = "Bu dönemde henüz işlem yok.",
}: {
  text?: string;
}) {
  return (
    <div className="empty-chart">
      <ChartNoAxesCombined size={30} strokeWidth={1.3} />
      <p>{text}</p>
    </div>
  );
}

export function CashflowChart({ report = false }: { report?: boolean }) {
  const { data, range } = useWorkspace();
  const [group, setGroup] = useState<"day" | "week" | "month" | "year">("day");
  const rows = cashflow(data, range, group);
  const hasData = rows.some((r) => r.income || r.expense);
  return (
    <section className="panel cashflow-panel">
      <div className="panel-heading">
        <div>
          <h2>Gelir & gider</h2>
          <p>Paranın akışını yakından tanı.</p>
        </div>
        <label
          className="sr-only"
          htmlFor={report ? "report-group" : "chart-group"}
        >
          Grafik dönemi
        </label>
        <select
          className="compact-select"
          id={report ? "report-group" : "chart-group"}
          value={group}
          onChange={(e) => setGroup(e.target.value as typeof group)}
        >
          <option value="day">Günlük</option>
          <option value="week">Haftalık</option>
          <option value="month">Aylık</option>
          <option value="year">Yıllık</option>
        </select>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-dot income-dot" /> Gelir
        </span>
        <span>
          <i className="legend-dot expense-dot" /> Gider
        </span>
        <small>Türk Lirası (₺)</small>
      </div>
      <div
        className="chart-container"
        role="img"
        aria-label="Seçili dönemin gelir gider sütun grafiği"
      >
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={rows}
              margin={{ top: 10, right: 4, left: -14, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={chartDate}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                tickFormatter={axisMoney}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                width={58}
              />
              <Tooltip
                cursor={{ fill: "var(--hover)" }}
                contentStyle={tooltipStyle}
                formatter={(v) => money(Number(v ?? 0))}
                labelFormatter={(v) => chartDate(String(v))}
              />
              <Bar
                isAnimationActive={false}
                name="Gelir"
                dataKey="income"
                fill="#7b9569"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                isAnimationActive={false}
                name="Gider"
                dataKey="expense"
                fill="#e1b7a3"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </section>
  );
}
export function DistributionChart() {
  const { data, range, demo } = useWorkspace();
  const router = useRouter();
  const rows = distribution(data, range);
  const total = sumMoney(rows.map((r) => r.value));
  const open = (index: number) => {
    const row = rows[index];
    if (row)
      router.push(`${demo ? "/demo" : "/app"}/transactions?category=${row.id}`);
  };
  return (
    <section className="panel distribution-panel">
      <div className="panel-heading">
        <div>
          <h2>Harcama dağılımı</h2>
          <p>Küçük parçalar, büyük resim.</p>
        </div>
        <ArrowUpRight size={19} className="muted" />
      </div>
      {rows.length ? (
        <>
          <div
            className="donut-container"
            role="img"
            aria-label="Kategorilere göre harcama dağılımı"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="70%"
                  outerRadius="92%"
                  paddingAngle={4}
                  cornerRadius={4}
                  stroke="none"
                  onClick={(_entry, index) => open(index)}
                  style={{ cursor: "pointer" }}
                >
                  {rows.map((row) => (
                    <Cell key={row.id} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => money(Number(v ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span>Toplam gider</span>
              <strong>{money(total, true)}</strong>
            </div>
          </div>
          <div className="distribution-legend">
            {rows.map((row) => (
              <button key={row.id} onClick={() => open(rows.indexOf(row))}>
                <span>
                  <i className="legend-dot" style={{ background: row.color }} />
                  {row.name}
                </span>
                <strong>{percent(row.share)}</strong>
              </button>
            ))}
          </div>
        </>
      ) : (
        <EmptyChart text="Harcama eklediğinde dağılım burada görünecek." />
      )}
    </section>
  );
}
export function BalanceChart() {
  const { data, range } = useWorkspace();
  const [group, setGroup] = useState<"day" | "month" | "year">("day");
  const rows = balanceTrend(data, range, group);
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Bakiye trendi</h2>
          <p>Başlangıç bakiyeleri ve tüm geçmiş hareketlerle.</p>
        </div>
        <select
          className="compact-select"
          aria-label="Bakiye grafik dönemi"
          value={group}
          onChange={(e) => setGroup(e.target.value as typeof group)}
        >
          <option value="day">Günlük</option>
          <option value="month">Aylık</option>
          <option value="year">Yıllık</option>
        </select>
      </div>
      <div
        className="chart-container"
        role="img"
        aria-label="Bakiye değişimi alan grafiği"
      >
        {data.accounts.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={rows}
              margin={{ top: 10, right: 5, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7b9569" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#7b9569" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={chartDate}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                minTickGap={35}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={axisMoney}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                axisLine={false}
                tickLine={false}
                width={65}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => money(Number(v ?? 0))}
                labelFormatter={(v) => chartDate(String(v))}
              />
              <Area
                isAnimationActive={false}
                name="Bakiye"
                type="monotone"
                dataKey="balance"
                stroke="#7b9569"
                strokeWidth={2.5}
                fill="url(#balance-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </section>
  );
}

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * The pieces every role's dashboard is built from.
 *
 * Four roles see four different dashboards, but they are the same product —
 * so the cards, headings, charts and empty states live here once. A role
 * dashboard is then a composition rather than its own design, which is what
 * keeps them from drifting apart.
 */

const HL = 'var(--font-heading), Outfit, sans-serif';
const BL = 'var(--font-body), "Plus Jakarta Sans", sans-serif';

export const ROYAL = '#0F5FB5';
export const INK   = '#334155';

/* ── Page header ─────────────────────────────────────────────────────────── */

export function DashboardHeader({ title, subtitle, actions }: {
  title: string; subtitle: string; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold" style={{ color: '#0B3D91', fontFamily: HL }}>{title}</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: BL }}>{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ── Metric ──────────────────────────────────────────────────────────────── */

export function Metric({
  icon, label, value, sub, trend, accent = ROYAL, href, loading,
}: {
  icon: ReactNode; label: string; value: ReactNode; sub?: string;
  /** Percent change against the previous period. null when there is nothing to compare against. */
  trend?: number | null;
  accent?: string; href?: string; loading?: boolean;
}) {
  const body = (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 h-full transition hover:shadow-md hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}14`, color: accent }}>
          {icon}
        </span>
        {trend !== undefined && trend !== null && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: trend > 0 ? 'rgba(22,163,74,0.1)' : trend < 0 ? 'rgba(220,38,38,0.08)' : 'rgba(100,116,139,0.1)',
              color: trend > 0 ? '#16A34A' : trend < 0 ? '#DC2626' : '#64748B',
            }}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3 leading-none tabular-nums" style={{ color: '#0F172A', fontFamily: HL }}>
        {loading ? <span className="inline-block w-14 h-6 rounded bg-gray-100 animate-pulse" /> : value}
      </p>
      <p className="text-xs font-semibold mt-1.5" style={{ color: INK, fontFamily: BL }}>{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: BL }}>{sub}</p>}
    </div>
  );

  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{children}</div>;
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

export function Panel({ title, subtitle, action, children, className = '' }: {
  title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-gray-200/80 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-gray-900 text-sm" style={{ fontFamily: HL }}>{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: BL }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

export function EmptyState({ icon, title, message, action }: {
  icon: ReactNode; title: string; message: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(15,95,181,0.06)', color: 'rgba(15,95,181,0.5)' }}>
        {icon}
      </span>
      <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: HL }}>{title}</p>
      <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed" style={{ fontFamily: BL }}>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Trend chart ─────────────────────────────────────────────────────────── */

export interface SeriesPoint { date: string; views: number; visitors: number }

/**
 * Two lines on a shared scale, drawn as inline SVG.
 *
 * No chart library: this is one shape that needs to be responsive, theme-
 * consistent and light on a page that already ships Framer Motion and three
 * fonts. A dependency for a sparkline would cost more than it explains.
 */
export function TrendChart({ series, height = 200 }: { series: SeriesPoint[]; height?: number }) {
  if (!series.length) return null;

  const W = 720, H = height, pad = { t: 12, r: 12, b: 22, l: 34 };
  const max = Math.max(1, ...series.map(p => Math.max(p.views, p.visitors)));
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;

  const x = (i: number) => pad.l + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  const line = (key: 'views' | 'visitors') =>
    series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const area = `${line('views')} L${x(series.length - 1).toFixed(1)},${pad.t + innerH} L${x(0).toFixed(1)},${pad.t + innerH} Z`;

  // Four gridlines is enough to read a value off without becoming graph paper.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f));
  const labelEvery = Math.max(1, Math.ceil(series.length / 7));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img"
      aria-label="Page views and unique visitors over time">
      <defs>
        <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ROYAL} stopOpacity="0.18" />
          <stop offset="100%" stopColor={ROYAL} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => {
        const yy = y(t);
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke="#E2E8F0" strokeWidth="1" strokeDasharray={i ? '3 4' : undefined} />
            <text x={pad.l - 6} y={yy + 3} textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily={BL}>{t}</text>
          </g>
        );
      })}

      <path d={area} fill="url(#dashArea)" />
      <path d={line('views')}    fill="none" stroke={ROYAL}     strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={line('visitors')} fill="none" stroke="#2EC4D6"   strokeWidth="2"   strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />

      {series.map((p, i) => i % labelEvery === 0 && (
        <text key={p.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily={BL}>
          {p.date.slice(5).replace('-', '/')}
        </text>
      ))}
    </svg>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-[11px]" style={{ fontFamily: BL, color: INK }}>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-0.5 rounded" style={{ backgroundColor: ROYAL }} /> Page views
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-0.5 rounded" style={{ backgroundColor: '#2EC4D6' }} /> Unique visitors
      </span>
    </div>
  );
}

/* ── Ranked list ─────────────────────────────────────────────────────────── */

export function RankedList({ items }: {
  items: { label: string; value: ReactNode; href?: string; meta?: string }[];
}) {
  const max = Math.max(1, ...items.map(i => (typeof i.value === 'number' ? i.value : 0)));
  return (
    <ol className="divide-y divide-gray-50">
      {items.map((item, i) => {
        const pct = typeof item.value === 'number' ? (item.value / max) * 100 : 0;
        const row = (
          <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition">
            <span className="w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0"
              style={{ backgroundColor: i < 3 ? `${ROYAL}12` : '#F1F5F9', color: i < 3 ? ROYAL : '#94A3B8', fontFamily: HL }}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: BL }}>{item.label}</p>
              {/* The bar carries the comparison; the number carries the fact. */}
              <div className="h-1 rounded-full bg-gray-100 mt-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ROYAL, opacity: 0.55 }} />
              </div>
            </div>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: INK, fontFamily: HL }}>{item.value}</span>
          </div>
        );
        return <li key={`${item.label}-${i}`}>{item.href ? <Link href={item.href}>{row}</Link> : row}</li>;
      })}
    </ol>
  );
}

/* ── Activity feed ───────────────────────────────────────────────────────── */

export function ActivityFeed({ items }: {
  items: { icon: ReactNode; accent: string; title: string; meta: string; when: string }[];
}) {
  return (
    <ul className="divide-y divide-gray-50">
      {items.map((a, i) => (
        <li key={i} className="flex items-start gap-3 px-5 py-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${a.accent}14`, color: a.accent }}>
            {a.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-800 truncate" style={{ fontFamily: BL }}>{a.title}</p>
            <p className="text-[11px] text-gray-400 truncate" style={{ fontFamily: BL }}>{a.meta}</p>
          </div>
          <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap" style={{ fontFamily: BL }}>{a.when}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Pending queue ───────────────────────────────────────────────────────── */

export function PendingRow({ label, count, href, accent = ROYAL, onClick }: {
  label: string; count: number; href?: string; accent?: string; onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition w-full text-left">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: count > 0 ? accent : '#CBD5E1' }} />
      <span className="text-sm flex-1 min-w-0 truncate" style={{ color: INK, fontFamily: BL }}>{label}</span>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
        style={{
          backgroundColor: count > 0 ? `${accent}14` : '#F1F5F9',
          color: count > 0 ? accent : '#94A3B8', fontFamily: HL,
        }}>
        {count}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button onClick={onClick} className="block w-full">{inner}</button>;
}

/* ── Quick action ────────────────────────────────────────────────────────── */

export function QuickAction({ icon, label, href, onClick, accent = ROYAL }: {
  icon: ReactNode; label: string; href?: string; onClick?: () => void; accent?: string;
}) {
  const inner = (
    <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-sm transition text-center h-full">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}14`, color: accent }}>
        {icon}
      </span>
      <span className="text-[11px] font-semibold leading-tight" style={{ color: INK, fontFamily: BL }}>{label}</span>
    </motion.span>
  );
  if (href) return <Link href={href} className="block h-full">{inner}</Link>;
  return <button onClick={onClick} className="block w-full h-full">{inner}</button>;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

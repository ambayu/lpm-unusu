import React from 'react';

/**
 * LaporanCharts — kumpulan komponen grafik ringkas berbasis SVG/CSS murni untuk
 * dashboard panel ekosistem ONE UNUSU.
 *
 * Alasan tidak memakai library chart eksternal:
 *  - Grafik di dashboard hanya bersifat ringkasan (bukan analitik interaktif).
 *  - Menjaga bundle tetap ringan dan bebas dependensi tambahan.
 *  - Semua warna mengikuti palette aplikasi masing-masing.
 *
 * Aksesibilitas: setiap grafik memiliki `role="img"` + `aria-label` yang
 * merangkum datanya, dan tabel nilai tetap ditampilkan sebagai teks.
 */

/* -------------------------------------------------------------------------- */
/* Tipe dasar                                                                  */
/* -------------------------------------------------------------------------- */

export type ChartDatum = {
  label: string;
  value: number;
  color?: string;
};

export type IconComponent = React.ComponentType<React.ComponentProps<'svg'>>;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* -------------------------------------------------------------------------- */
/* Kartu pembungkus laporan                                                    */
/* -------------------------------------------------------------------------- */

export interface ReportCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => (
  <section
    className={`bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs overflow-hidden flex flex-col ${className}`}
  >
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="p-5 flex-1 flex flex-col">{children}</div>
  </section>
);

/* -------------------------------------------------------------------------- */
/* Kartu metrik ringkas                                                        */
/* -------------------------------------------------------------------------- */

export interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: IconComponent;
  accent?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' | 'violet';
}

const ACCENTS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
};

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'emerald',
}) => (
  <div className="bg-white border border-[#CBD5E1] rounded-[16px] p-4 sm:p-5 shadow-xs flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl sm:text-3xl font-black text-slate-900 leading-none tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11px] font-medium text-slate-500 truncate">{hint}</p>}
    </div>
    {Icon && (
      <div className={`w-10 h-10 rounded-xl border grid place-items-center shrink-0 ${ACCENTS[accent] || ACCENTS.emerald}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Donut chart                                                                 */
/* -------------------------------------------------------------------------- */

export interface DonutChartProps {
  data?: ChartDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: number | string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data = [],
  size = 148,
  thickness = 20,
  centerLabel,
  centerValue,
}) => {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments: Array<{
    label: string;
    value: number;
    color: string;
    dashArray: string;
    dashOffset: number;
    percent: number;
  }> = [];
  let offset = 0;

  for (const item of data) {
    const value = Number(item.value) || 0;
    if (value <= 0) continue;
    const fraction = total > 0 ? value / total : 0;
    const length = fraction * circumference;
    segments.push({
      label: item.label,
      value,
      color: item.color || '#047857',
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
      percent: Math.round(fraction * 100),
    });
    offset += length;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Diagram donat: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
        >
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EEF2F0" strokeWidth={thickness} />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((seg) => (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
              >
                <title>{`${seg.label}: ${seg.value} (${seg.percent}%)`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            <div className="text-xl font-black text-slate-900 leading-none tabular-nums">
              {centerValue ?? total}
            </div>
            {centerLabel && (
              <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {centerLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2 min-w-0">
        {data.map((d) => {
          const pct = total > 0 ? Math.round(((Number(d.value) || 0) / total) * 100) : 0;
          return (
            <li key={d.label} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                style={{ backgroundColor: d.color || '#047857' }}
                aria-hidden="true"
              />
              <span className="text-slate-600 truncate flex-1">{d.label}</span>
              <span className="font-bold text-slate-900 tabular-nums">{d.value}</span>
              <span className="text-slate-400 tabular-nums w-9 text-right">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Bar chart horizontal                                                        */
/* -------------------------------------------------------------------------- */

export interface BarChartProps {
  data?: ChartDatum[];
  color?: string;
  unit?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data = [], color = '#047857', unit = '' }) => {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));

  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const value = Number(d.value) || 0;
        const pct = clamp01(value / max) * 100;
        return (
          <li key={d.label}>
            <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
              <span className="text-slate-600 truncate">{d.label}</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {value}
                {unit}
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
              role="img"
              aria-label={`${d.label}: ${value}${unit}`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, backgroundColor: d.color || color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/* -------------------------------------------------------------------------- */
/* Bar chart vertikal (kolom)                                                  */
/* -------------------------------------------------------------------------- */

export interface ColumnChartProps {
  data?: ChartDatum[];
  color?: string;
  height?: number;
  unit?: string;
}

export const ColumnChart: React.FC<ColumnChartProps> = ({
  data = [],
  color = '#047857',
  height = 128,
  unit = '',
}) => {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));

  return (
    <div>
      <div
        className="flex items-end gap-1.5 sm:gap-2"
        style={{ height }}
        role="img"
        aria-label={`Grafik kolom: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
      >
        {data.map((d) => {
          const value = Number(d.value) || 0;
          const pct = clamp01(value / max) * 100;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] font-bold text-slate-500 tabular-nums">{value}</span>
              <div
                className="w-full rounded-t-[4px] transition-[height] duration-500"
                style={{
                  height: `${Math.max(pct, value > 0 ? 4 : 0)}%`,
                  backgroundColor: d.color || color,
                }}
                title={`${d.label}: ${value}${unit}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-slate-100">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center text-[9.5px] font-semibold text-slate-500 truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Line / area trend                                                           */
/* -------------------------------------------------------------------------- */

export interface TrendChartProps {
  data?: { label: string; value: number }[];
  stroke?: string;
  height?: number;
  fillOpacity?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data = [],
  stroke = '#047857',
  height = 150,
  fillOpacity = 0.14,
}) => {
  const width = 320;
  const padTop = 12;
  const padBottom = 22;
  const plotHeight = height - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((d, i) => {
    const value = Number(d.value) || 0;
    return {
      x: i * stepX,
      y: padTop + plotHeight - (value / max) * plotHeight,
      value,
      label: d.label,
    };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L${width},${padTop + plotHeight} L0,${padTop + plotHeight} Z`
    : '';

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Grafik tren: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
      >
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1="0"
            x2={width}
            y1={padTop + plotHeight - plotHeight * t}
            y2={padTop + plotHeight - plotHeight * t}
            stroke="#EEF2F0"
            strokeWidth="1"
          />
        ))}
        {areaPath && <path d={areaPath} fill={stroke} fillOpacity={fillOpacity} />}
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3" fill="#fff" stroke={stroke} strokeWidth="2">
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d) => (
          <span key={d.label} className="text-[9.5px] font-semibold text-slate-500">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Progress bertingkat (stacked)                                               */
/* -------------------------------------------------------------------------- */

export interface StackedBarProps {
  data?: ChartDatum[];
  height?: number;
}

export const StackedBar: React.FC<StackedBarProps> = ({ data = [], height = 12 }) => {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div>
      <div
        className="w-full rounded-full overflow-hidden bg-slate-100 flex"
        style={{ height }}
        role="img"
        aria-label={`Komposisi: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
      >
        {total > 0 &&
          data.map((d) => {
            const value = Number(d.value) || 0;
            if (value <= 0) return null;
            return (
              <div
                key={d.label}
                style={{ width: `${(value / total) * 100}%`, backgroundColor: d.color || '#047857' }}
                title={`${d.label}: ${value}`}
              />
            );
          })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: d.color || '#047857' }}
              aria-hidden="true"
            />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-bold text-slate-900 tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Gauge ring                                                                  */
/* -------------------------------------------------------------------------- */

export interface GaugeRingProps {
  value?: number;
  total?: number;
  label?: string;
  color?: string;
  size?: number;
}

export const GaugeRing: React.FC<GaugeRingProps> = ({
  value = 0,
  total = 100,
  label,
  color = '#047857',
  size = 110,
}) => {
  const pct = total > 0 ? clamp01(value / total) : 0;
  const thickness = 10;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`${label || 'Capaian'}: ${Math.round(pct * 100)}%`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EEF2F0" strokeWidth={thickness} />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${pct * circumference} ${circumference}`}
            />
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-lg font-black text-slate-900 tabular-nums">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      {label && (
        <span className="mt-1.5 text-[10.5px] font-semibold text-slate-500 text-center leading-tight">{label}</span>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Timeline aktivitas terbaru                                                  */
/* -------------------------------------------------------------------------- */

export interface ActivityItem {
  title: string;
  meta?: string;
  time?: string;
  tone?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
}

export interface ActivityFeedProps {
  items?: ActivityItem[];
  emptyText?: string;
}

const TONES: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items = [],
  emptyText = 'Belum ada aktivitas tercatat.',
}) => {
  if (!items.length) {
    return <p className="text-xs text-slate-500">{emptyText}</p>;
  }

  return (
    <ol className="relative space-y-3.5">
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${TONES[item.tone || 'slate'] || TONES.slate}`} aria-hidden="true" />
            {i < items.length - 1 && <span className="w-px flex-1 bg-slate-200 mt-1" aria-hidden="true" />}
          </div>
          <div className="min-w-0 pb-0.5">
            <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{item.title}</p>
            <p className="text-[10.5px] text-slate-500 mt-0.5">
              {item.meta}
              {item.time && <span className="text-slate-400"> &middot; {item.time}</span>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n';
import { AdminStats, PaymentMethod, RoomCategory } from '../types';

interface SalesAnalyticsProps {
  stats: AdminStats;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(2);
    d += ` C ${cx} ${p0.y.toFixed(2)}, ${cx} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return d;
}

export function SalesAnalytics({ stats }: SalesAnalyticsProps) {
  const { t, formatPrice, formatCategory } = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const series = stats.salesSeries || [];
  const maxRevenue = Math.max(...series.map((p) => p.revenue), 100000);
  const maxBookings = Math.max(...series.map((p) => p.bookings), 1);

  const width = 680;
  const height = 220;
  const padLeft = 18;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const coords = series.map((pt, idx) => {
    const x =
      series.length > 1
        ? padLeft + (idx / (series.length - 1)) * plotW
        : padLeft + plotW / 2;
    const ratio = maxRevenue > 0 ? pt.revenue / maxRevenue : 0;
    const y = padTop + plotH - ratio * plotH;
    return { x, y, pt };
  });

  const linePath = buildSmoothPath(coords);
  const baselineY = padTop + plotH;
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${coords[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
      : '';

  const bookingCoords = series.map((pt, idx) => {
    const x =
      series.length > 1
        ? padLeft + (idx / (series.length - 1)) * plotW
        : padLeft + plotW / 2;
    const ratio = maxBookings > 0 ? pt.bookings / maxBookings : 0;
    const y = padTop + plotH - ratio * (plotH * 0.55);
    return { x, y };
  });
  const bookingLinePath = buildSmoothPath(bookingCoords);

  const activePoint =
    hoveredIdx !== null && series[hoveredIdx]
      ? series[hoveredIdx]
      : series.length > 0
        ? series[series.length - 1]
        : null;

  const paymentLabel = (method: PaymentMethod) => {
    if (method === 'mtn_momo') return t('mtnMomo');
    if (method === 'orange_money') return t('orangeMoney');
    return t('visaMastercard');
  };

  const paymentBarColor = (method: PaymentMethod) => {
    if (method === 'mtn_momo') return 'bg-brand-accent';
    if (method === 'orange_money') return 'bg-[#FF7900]';
    return 'bg-brand-primary';
  };

  const categoryTotalRevenue = Math.max(
    stats.categorySales.reduce((acc, item) => acc + item.revenue, 0),
    1
  );
  const paymentTotalRevenue = Math.max(
    stats.paymentBreakdown.reduce((acc, item) => acc + item.revenue, 0),
    1
  );

  return (
    <div className="space-y-6">
      {/* 7-Day Sales & Revenue Curve */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <h2 className="text-base font-semibold text-brand-primary">{t('salesCurveTitle')}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('salesCurveSubtitle')}</p>
          </div>

          {activePoint && (
            <div className="sm:text-right bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 shrink-0">
              <p className="text-[11px] font-medium text-slate-500 tabular-nums">
                {activePoint.date}
              </p>
              <p className="font-mono-tabular text-sm font-semibold text-brand-primary">
                {formatPrice(activePoint.revenue)}
              </p>
              <p className="font-mono-tabular text-[11px] text-slate-600">
                {activePoint.bookings} {t('bookingsWord')}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 overflow-visible"
            role="img"
            aria-label={t('salesCurveTitle')}
          >
            <defs>
              <linearGradient id="kbnRevenueArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--theme-accent)', stopOpacity: 0.45 }} />
                <stop offset="100%" style={{ stopColor: 'var(--theme-accent)', stopOpacity: 0.02 }} />
              </linearGradient>
            </defs>

            {/* Horizontal reference gridlines */}
            {[0, 0.5, 1].map((step) => {
              const y = padTop + plotH - step * plotH;
              return (
                <line
                  key={step}
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={step === 0 ? undefined : '4 4'}
                />
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#kbnRevenueArea)" />}

            {/* Secondary Bookings Volume Curve */}
            {bookingLinePath && (
              <path
                d={bookingLinePath}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.75"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
            )}

            {/* Primary Revenue Curve */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--theme-primary)"
                strokeWidth="2.75"
                strokeLinecap="round"
              />
            )}

            {/* Interactive Nodes & X-Axis Labels */}
            {coords.map(({ x, y, pt }, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g
                  key={pt.date}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <rect
                    x={x - 24}
                    y={padTop}
                    width="48"
                    height={plotH + padBottom}
                    fill="transparent"
                  />
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={baselineY}
                      stroke="var(--theme-primary)"
                      strokeOpacity="0.25"
                      strokeWidth="1"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4.25}
                    fill="var(--theme-accent)"
                    stroke="var(--theme-primary)"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fill={isHovered ? 'var(--theme-primary)' : '#64748B'}
                    fontSize="11"
                    fontWeight={isHovered ? '700' : '500'}
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 bg-brand-primary inline-block" />
              {t('kpiRevenue')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
              {t('bookingsWord')}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Channel & Room Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-brand-primary pb-4 border-b border-slate-100">
            {t('paymentChannelsTitle')}
          </h3>
          <div className="mt-4 space-y-4">
            {stats.paymentBreakdown.map((item) => {
              const pct = Math.round((item.revenue / paymentTotalRevenue) * 100);
              return (
                <div key={item.method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {paymentLabel(item.method)}{' '}
                      <span className="font-normal text-slate-500 tabular-nums">
                        · {item.count} {t('bookingsWord')}
                      </span>
                    </span>
                    <span className="font-mono-tabular font-semibold text-brand-primary">
                      {formatPrice(item.revenue)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${paymentBarColor(item.method)}`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-brand-primary pb-4 border-b border-slate-100">
            {t('categorySalesTitle')}
          </h3>
          <div className="mt-4 space-y-4">
            {stats.categorySales.map((item) => {
              const pct = Math.round((item.revenue / categoryTotalRevenue) * 100);
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {formatCategory(item.category as RoomCategory)}{' '}
                      <span className="font-normal text-slate-500 tabular-nums">
                        · {item.count} {t('bookingsWord')}
                      </span>
                    </span>
                    <span className="font-mono-tabular font-semibold text-brand-primary">
                      {formatPrice(item.revenue)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-primary transition-all"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatBaht, baht } from "@/domain/money";
import type { HourBucket } from "@/domain/summary";

const W = 474;
const H = 330;
const PAD = { left: 44, right: 8, top: 28, bottom: 30 };
const BAR_MAX = 24;
const TICK_STEPS = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const money = (n: number) => formatBaht(baht(n));

function axisFor(max: number): { step: number; top: number } {
  const step = TICK_STEPS.find((s) => max / s <= 4) ?? TICK_STEPS[TICK_STEPS.length - 1];
  return { step, top: Math.max(step, Math.ceil(max / step) * step) };
}

export function peakOf(hourly: HourBucket[]): HourBucket {
  return hourly.reduce((best, b) => (b.revenue > best.revenue ? b : best), hourly[0]);
}

export function HourlyChart({ hourly }: { hourly: HourBucket[] }) {
  const [active, setActive] = useState<number | null>(null);
  const peak = peakOf(hourly);
  const { step, top } = axisFor(peak.revenue);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / hourly.length;
  const barW = Math.min(BAR_MAX, band - 2);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const labelEvery = hourly.length > 10 ? 2 : 1;
  const shown = active === null ? null : hourly[active];
  const tipLeft = active === null ? 0 : ((PAD.left + band * (active + 0.5)) / W) * 100;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        role="img"
        aria-label={`ยอดขายรายชั่วโมง ${hourLabel(hourly[0].hour)} ถึง ${hourLabel(hourly[hourly.length - 1].hour)} สูงสุดช่วง ${hourLabel(peak.hour)} ${money(peak.revenue)}`}
        className="h-full"
      >
        <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onPointerLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line-soft)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--color-ink-2)">
                {t.toLocaleString("en-US")}
              </text>
            </g>
          ))}
          {hourly.map((b, i) => {
            const cx = PAD.left + band * (i + 0.5);
            const h = (b.revenue / top) * plotH;
            const isPeak = b === peak && b.revenue > 0;
            const r = Math.min(4, h);
            const x0 = cx - barW / 2;
            const yTop = PAD.top + plotH - h;
            return (
              <g key={b.hour}>
                {h > 0 && (
                  <path
                    d={`M${x0} ${PAD.top + plotH}V${yTop + r}Q${x0} ${yTop} ${x0 + r} ${yTop}H${x0 + barW - r}Q${x0 + barW} ${yTop} ${x0 + barW} ${yTop + r}V${PAD.top + plotH}Z`}
                    fill={isPeak ? "var(--color-accent)" : "#8c918d"}
                    opacity={active === null || active === i ? 1 : 0.55}
                  />
                )}
                {isPeak && (
                  <text x={cx} y={yTop - 8} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--color-accent-ink)">
                    {money(b.revenue)}
                  </text>
                )}
                {i % labelEvery === 0 && (
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize={13} fill="var(--color-ink-2)">
                    {hourLabel(b.hour)}
                  </text>
                )}
                <rect
                  data-testid="hour-bar"
                  data-hour={b.hour}
                  data-revenue={b.revenue}
                  x={PAD.left + band * i}
                  y={0}
                  width={band}
                  height={PAD.top + plotH}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                />
              </g>
            );
          })}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="var(--color-line)" strokeWidth={1} />
        </svg>
      </div>
      {shown && (
        <div
          role="status"
          style={{ left: `${tipLeft}%`, top: 0 }}
          className="pointer-events-none absolute -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-white shadow-lg"
        >
          <div className="text-[16px] font-bold">{money(shown.revenue)}</div>
          <div className="text-[13px] text-[#c9ccc5]">
            {hourLabel(shown.hour)}–{hourLabel(shown.hour + 1)} · {shown.billCount} บิล
          </div>
        </div>
      )}
      <table className="sr-only">
        <caption>ยอดขายรายชั่วโมง</caption>
        <thead>
          <tr>
            <th scope="col">ช่วงเวลา</th>
            <th scope="col">ยอดขาย</th>
            <th scope="col">จำนวนบิล</th>
          </tr>
        </thead>
        <tbody>
          {hourly.map((b) => (
            <tr key={b.hour}>
              <th scope="row">{hourLabel(b.hour)}</th>
              <td>{money(b.revenue)}</td>
              <td>{b.billCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

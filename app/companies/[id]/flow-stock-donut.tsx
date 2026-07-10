"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { INK } from "@/lib/palette";

/**
 * Monetisation weighting split between flow (L1–L2) and stock (L3–L5).
 * `stockShare` is null when nothing is monetised — the UNPRICED case.
 */
export function FlowStockDonut({ stockShare }: { stockShare: number | null }) {
  if (stockShare === null) {
    return (
      <div className="flex h-[180px] items-center justify-center text-center">
        <p className="text-sm text-ink-soft">
          Nothing is monetised yet, so there is no split to show.
        </p>
      </div>
    );
  }

  const flowShare = 100 - stockShare;
  const data = [
    { name: "Stock", value: stockShare, fill: "#1e5f58" },
    { name: "Flow", value: flowShare, fill: "#c7783a" },
  ];

  return (
    <div className="relative h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={55}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            stroke={INK}
            strokeWidth={1.5}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl text-ink">{stockShare}%</span>
        <span className="eyebrow">stock</span>
      </div>
    </div>
  );
}

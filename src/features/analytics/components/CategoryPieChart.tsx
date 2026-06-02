// src/features/analytics/components/CategoryPieChart.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// Logic untouched – only JSX/className enhancements

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryTotal } from "@/types/analytics";

// Theme-Aware Institutional Palette
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))"
];

interface Props {
  data: CategoryTotal[];
}

export const CategoryPieChart = ({ data }: Props) => {
  return (
    <div className="bg-surface rounded-premium shadow-premium border border-border/40 p-8 transition-all duration-700 hover:shadow-institutional group">
      <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-institutional-blue opacity-60" />
        Category Matrix Audit
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={110}
            paddingAngle={6}
            dataKey="total"
            nameKey="category"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="hover:opacity-85 transition-opacity duration-500 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--surface))",
              borderRadius: "16px",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              padding: "16px",
            }}
            itemStyle={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.2em", color: "hsl(var(--foreground))" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

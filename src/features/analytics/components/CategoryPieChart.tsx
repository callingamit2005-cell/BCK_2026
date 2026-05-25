// src/features/analytics/components/CategoryPieChart.tsx
// Polished Enterprise‑Grade UI with Tailwind CSS
// Logic untouched – only JSX/className enhancements

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryTotal } from "@/types/analytics";

// Gradient‑inspired colors (purple/pink family)
const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#6366f1"];

interface Props {
  data: CategoryTotal[];
}

export const CategoryPieChart = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-purple-100/20 border border-slate-100 p-5 hover:shadow-purple-200/30 transition-all duration-300">
      <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-4">
        🥧 Spending by Category
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="total"
            nameKey="category"
            label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              padding: "8px 12px",
            }}
            labelStyle={{ fontWeight: 600, color: "#1e293b" }}
            itemStyle={{ color: "#8B5CF6" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
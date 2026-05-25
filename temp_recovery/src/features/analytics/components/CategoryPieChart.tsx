import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryTotal } from "@/types/analytics";

// Custom colors matching your purple/pink gradient
const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#6366f1"];

interface Props {
  data: CategoryTotal[];
}

export const CategoryPieChart = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">🥧 Spending by Category</h3>
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
            contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
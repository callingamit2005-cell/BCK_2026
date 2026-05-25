import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MonthlyTotal } from "@/types/analytics";

interface Props {
  data: MonthlyTotal[];
}

export const SpendingTrendChart = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 Spending Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          />
          <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
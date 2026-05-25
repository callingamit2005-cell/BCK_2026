import { formatCurrency } from '@/utils/currencyFormatter';

interface Props {
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentChange: number;
}

export const MonthlyComparison = ({ currentMonthTotal, previousMonthTotal, percentChange }: Props) => {
  const arrow = percentChange >= 0 ? "▲" : "▼";
  const color = percentChange >= 0 ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl p-6 shadow-lg border border-purple-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Month Comparison</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Current Month</p>
          <p className="text-3xl font-bold text-purple-700">{formatCurrency(currentMonthTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Previous Month</p>
          <p className="text-3xl font-bold text-indigo-600">{formatCurrency(previousMonthTotal)}</p>
        </div>
      </div>
      <div className="mt-4 text-center">
        <span className={`text-lg font-semibold ${color}`}>
          {arrow} {Math.abs(percentChange).toFixed(1)}%
        </span>
        <span className="text-gray-600 ml-2">vs last month</span>
      </div>
    </div>
  );
};
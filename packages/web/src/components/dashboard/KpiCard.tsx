import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatEur, formatPercent } from '@finthesis/shared';

interface KpiCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'percent' | 'days';
  trend?: number; // variation en %
}

export function KpiCard({ label, value, format = 'currency', trend }: KpiCardProps) {
  const formattedValue =
    format === 'currency'
      ? formatEur(value)
      : format === 'percent'
        ? formatPercent(value)
        : `${Math.round(value)} jours`;

  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm" style={{ borderTop: '2px solid #E8621A' }}>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

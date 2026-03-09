import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TresorerieMensuelle } from '@finthesis/shared';
import { formatEur } from '@finthesis/shared';

const MOIS_COURT: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aoû',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
};

const MOIS_LONG: Record<string, string> = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
};

interface Props {
  data: TresorerieMensuelle[];
}

export function TresorerieChart({ data }: Props) {
  if (data.length === 0) return null;

  const hasNegative = data.some((d) => d.solde < 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Solde de trésorerie cumulé par mois
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tresoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2D5A3D" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2D5A3D" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => MOIS_COURT[v] ?? v}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [formatEur(value), 'Trésorerie']}
            labelFormatter={(label) => MOIS_LONG[String(label)] ?? label}
          />
          {hasNegative && (
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
          )}
          <Area
            type="monotone"
            dataKey="solde"
            stroke="#2D5A3D"
            strokeWidth={2.5}
            fill="url(#tresoGradient)"
            dot={{ r: 3, fill: '#2D5A3D', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#2D5A3D' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

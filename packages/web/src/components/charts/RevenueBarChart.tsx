import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlyData } from '@finthesis/shared';
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
  data: MonthlyData[];
  dataN1?: MonthlyData[];
}

export function RevenueBarChart({ data, dataN1 }: Props) {
  // Fusionner les deux séries par numéro de mois (label = "MM")
  const mergedData = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0');
    const current = data.find((d) => d.label === mm);
    const prev = dataN1?.find((d) => d.label === mm);
    return {
      label: mm,
      montant: current?.montant ?? null,
      montantN1: prev?.montant ?? null,
    };
  }).filter((d) => d.montant !== null || d.montantN1 !== null);

  const hasN1 = dataN1 && dataN1.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Chiffre d'affaires mensuel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => MOIS_COURT[v] ?? v}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatEur(value),
              name === 'montant' ? 'N (exercice actuel)' : 'N-1',
            ]}
            labelFormatter={(label) => MOIS_LONG[label] ?? label}
          />
          {hasN1 && <Legend formatter={(v) => (v === 'montant' ? 'Exercice actuel' : 'N-1')} />}
          <Bar dataKey="montant" fill="#6DC28A" radius={[4, 4, 0, 0]} name="montant" />
          {hasN1 && (
            <Line
              type="monotone"
              dataKey="montantN1"
              stroke="#E8621A"
              strokeWidth={2}
              dot={{ r: 3, fill: '#E8621A' }}
              name="montantN1"
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

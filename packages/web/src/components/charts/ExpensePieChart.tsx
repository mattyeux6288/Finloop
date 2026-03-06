import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ExpenseCategory } from '@finthesis/shared';
import { formatEur } from '@finthesis/shared';

// 10 couleurs pour les 10 comptes max
const COLORS = ['#ff6d2d', '#f94f1c', '#ffa647', '#d93c0d', '#ffb98a', '#ffd4a8', '#2e2c2f', '#e87820', '#c23b00', '#6b3a2a'];

interface Props {
  data: ExpenseCategory[];
}

export function ExpensePieChart({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Répartition des charges</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="montant"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ pourcentage }) => `${pourcentage.toFixed(1)}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatEur(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

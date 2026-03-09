import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ExpenseCategory } from '@finthesis/shared';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';

// Palette Raly Conseils — orange accent sur la tranche dominante, vert pour les suivantes
const COLORS = ['#E8621A', '#1E3A30', '#6DC28A', '#2D6B48', '#84caaa', '#3a7d52', '#aedfc5', '#4a9866', '#c94f0e', '#243C33'];

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  pourcentage: number;
}

// Label rendu à l'intérieur du secteur, masqué si tranche < 7%
function renderInnerLabel({ cx, cy, midAngle, innerRadius, outerRadius, pourcentage }: LabelProps) {
  if (pourcentage < 7) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${pourcentage.toFixed(1)}%`}
    </text>
  );
}

interface Props {
  data: ExpenseCategory[];
}

export function ExpensePieChart({ data }: Props) {
  const { formatCurrency } = useCurrencyFormat();
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Répartition des charges</h3>
      <ResponsiveContainer width="100%" height={380}>
        <PieChart>
          <Pie
            data={data}
            dataKey="montant"
            nameKey="label"
            cx="50%"
            cy="42%"
            outerRadius={110}
            labelLine={false}
            label={renderInnerLabel}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name: string, props: any) => [
              `${formatCurrency(value)}  (${props.payload.pourcentage.toFixed(1)}%)`,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value) =>
              <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

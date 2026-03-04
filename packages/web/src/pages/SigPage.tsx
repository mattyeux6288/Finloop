import { useQuery } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getSig } from '@/api/analysis.api';
import { formatEur } from '@finthesis/shared';
import type { SigLevel } from '@finthesis/shared';

function SigRow({ level, index }: { level: SigLevel; index: number }) {
  const isPositive = level.montant >= 0;
  const bgColors = [
    'bg-blue-50', 'bg-indigo-50', 'bg-violet-50', 'bg-purple-50',
    'bg-fuchsia-50', 'bg-pink-50', 'bg-rose-50', 'bg-amber-50', 'bg-emerald-50',
  ];

  return (
    <div className={`rounded-lg p-4 ${bgColors[index % bgColors.length]}`}>
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-900">{level.label}</span>
        <span className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
          {formatEur(level.montant)}
        </span>
      </div>
      {level.details.length > 0 && (
        <div className="mt-2 space-y-1">
          {level.details.map((d, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-600 pl-4">
              <span>{d.label}</span>
              <span className="font-medium">{formatEur(d.montant)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SigPage() {
  const { selectedFiscalYear } = useCompanyStore();

  const { data: sig, isLoading } = useQuery({
    queryKey: ['sig', selectedFiscalYear?.id],
    queryFn: () => getSig(selectedFiscalYear!.id),
    enabled: !!selectedFiscalYear,
  });

  if (!selectedFiscalYear) {
    return <div className="text-center text-gray-500 py-16">Sélectionnez un exercice fiscal.</div>;
  }
  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }
  if (!sig) return null;

  const levels: SigLevel[] = [
    sig.margeCommerciale,
    sig.productionExercice,
    sig.valeurAjoutee,
    sig.ebe,
    sig.resultatExploitation,
    sig.rcai,
    sig.resultatExceptionnel,
    sig.resultatNet,
    sig.plusMoinsValuesCessions,
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Soldes Intermédiaires de Gestion (SIG)</h2>

      <div className="space-y-3">
        {levels.map((level, i) => (
          <SigRow key={i} level={level} index={i} />
        ))}
      </div>
    </div>
  );
}

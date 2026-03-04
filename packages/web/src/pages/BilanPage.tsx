import { useQuery } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getBilan } from '@/api/analysis.api';
import { formatEur } from '@finthesis/shared';
import type { BilanSection } from '@finthesis/shared';

function BilanTable({ section, title }: { section: BilanSection; title: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h4>
      <table className="w-full text-sm">
        <tbody>
          {section.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 text-gray-700">{item.label}</td>
              <td className="py-2 text-right font-medium text-gray-900">{formatEur(item.montant)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-300 font-bold">
            <td className="py-2 text-gray-900">Total {section.label}</td>
            <td className="py-2 text-right text-gray-900">{formatEur(section.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function BilanPage() {
  const { selectedFiscalYear } = useCompanyStore();

  const { data: bilan, isLoading } = useQuery({
    queryKey: ['bilan', selectedFiscalYear?.id],
    queryFn: () => getBilan(selectedFiscalYear!.id),
    enabled: !!selectedFiscalYear,
  });

  if (!selectedFiscalYear) {
    return <div className="text-center text-gray-500 py-16">Sélectionnez un exercice fiscal.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!bilan) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Bilan simplifié</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIF */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Actif</h3>
          <div className="space-y-6">
            <BilanTable section={bilan.actif.immobilisations} title="Immobilisations" />
            <BilanTable section={bilan.actif.stocks} title="Stocks" />
            <BilanTable section={bilan.actif.creances} title="Créances" />
            <BilanTable section={bilan.actif.tresorerie} title="Trésorerie" />
          </div>
          <div className="mt-6 pt-4 border-t-2 border-primary-500 flex justify-between text-lg font-bold text-primary-700">
            <span>Total Actif</span>
            <span>{formatEur(bilan.actif.totalActif)}</span>
          </div>
        </div>

        {/* PASSIF */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Passif</h3>
          <div className="space-y-6">
            <BilanTable section={bilan.passif.capitauxPropres} title="Capitaux propres" />
            <BilanTable section={bilan.passif.dettesFinancieres} title="Dettes financières" />
            <BilanTable section={bilan.passif.dettesFournisseurs} title="Dettes fournisseurs" />
            <BilanTable section={bilan.passif.dettesFiscales} title="Dettes fiscales et sociales" />
          </div>
          <div className="mt-6 pt-4 border-t-2 border-primary-500 flex justify-between text-lg font-bold text-primary-700">
            <span>Total Passif</span>
            <span>{formatEur(bilan.passif.totalPassif)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

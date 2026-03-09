import { useQuery } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getCompteDeResultat } from '@/api/analysis.api';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import type { ResultatSection } from '@finthesis/shared';

function ResultSection({ section }: { section: ResultatSection }) {
  const { formatCurrency } = useCurrencyFormat();
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {section.label}
      </h4>
      <table className="w-full text-sm">
        <tbody>
          {section.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5 text-gray-700 pl-4">{item.label}</td>
              <td className="py-1.5 text-right font-medium text-gray-900 w-36">
                {formatCurrency(item.montant)}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2 text-gray-900">Total</td>
            <td className="py-2 text-right text-gray-900 w-36">{formatCurrency(section.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SubtotalRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const { formatCurrency } = useCurrencyFormat();
  const isNeg = value < 0;
  return (
    <div className={`flex justify-between py-3 px-4 rounded-lg mb-2 ${highlight ? 'bg-primary-50 text-primary-800 font-bold text-lg' : 'bg-gray-50 font-semibold'}`}>
      <span>{label}</span>
      <span className={isNeg ? 'text-red-600' : ''}>{formatCurrency(value)}</span>
    </div>
  );
}

export function CompteResultatPage() {
  const { formatCurrency } = useCurrencyFormat();
  const { selectedFiscalYear } = useCompanyStore();

  const { data: cr, isLoading } = useQuery({
    queryKey: ['compte-resultat', selectedFiscalYear?.id],
    queryFn: () => getCompteDeResultat(selectedFiscalYear!.id),
    enabled: !!selectedFiscalYear,
  });

  if (!selectedFiscalYear) {
    return <div className="text-center text-gray-500 py-16">Sélectionnez un exercice fiscal.</div>;
  }
  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }
  if (!cr) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Compte de résultat</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <ResultSection section={cr.produitsExploitation} />
        <ResultSection section={cr.chargesExploitation} />
        <SubtotalRow label="Résultat d'exploitation" value={cr.resultatExploitation} />

        <ResultSection section={cr.produitsFinanciers} />
        <ResultSection section={cr.chargesFinancieres} />
        <SubtotalRow label="Résultat financier" value={cr.resultatFinancier} />

        <ResultSection section={cr.produitsExceptionnels} />
        <ResultSection section={cr.chargesExceptionnelles} />
        <SubtotalRow label="Résultat exceptionnel" value={cr.resultatExceptionnel} />

        <div className="flex justify-between py-2 px-4 text-sm">
          <span className="text-gray-600">Impôts sur les bénéfices</span>
          <span className="font-medium">{formatCurrency(cr.impots)}</span>
        </div>

        <SubtotalRow label="Résultat net" value={cr.resultatNet} highlight />
      </div>
    </div>
  );
}

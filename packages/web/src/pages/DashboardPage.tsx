import { useQuery } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getDashboard } from '@/api/analysis.api';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueBarChart } from '@/components/charts/RevenueBarChart';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';

export function DashboardPage() {
  const { selectedFiscalYear } = useCompanyStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedFiscalYear?.id],
    queryFn: () => getDashboard(selectedFiscalYear!.id),
    enabled: !!selectedFiscalYear,
  });

  if (!selectedFiscalYear) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Sélectionnez une entreprise et un exercice fiscal pour voir le tableau de bord.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-700 rounded-lg p-4">
        Erreur lors du chargement du tableau de bord.
      </div>
    );
  }

  const { kpis, revenueMonthly, expenseBreakdown } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Tableau de bord</h2>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Chiffre d'affaires" value={kpis.chiffreAffaires} />
        <KpiCard label="Marge brute" value={kpis.margeBrute} />
        <KpiCard label="Taux de marge" value={kpis.tauxMargeBrute} format="percent" />
        <KpiCard label="EBE" value={kpis.ebe} />
        <KpiCard label="Résultat net" value={kpis.resultatNet} />
        <KpiCard label="Trésorerie" value={kpis.tresorerieNette} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueBarChart data={revenueMonthly} />
        <ExpensePieChart data={expenseBreakdown} />
      </div>

      {/* Indicateurs supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="BFR" value={kpis.bfr} />
        <KpiCard label="Rentabilité nette" value={kpis.ratioRentabilite} format="percent" />
        <KpiCard label="Délai client" value={kpis.delaiClientMoyen} format="days" />
        <KpiCard label="Délai fournisseur" value={kpis.delaiFournisseurMoyen} format="days" />
      </div>
    </div>
  );
}

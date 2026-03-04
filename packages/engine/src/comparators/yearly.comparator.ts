import type { DashboardKpis, ComparisonRow, ComparisonData, MonthlyData } from '@finthesis/shared';

/**
 * Compare les KPIs de deux exercices fiscaux (N et N-1)
 */
export function compareKpis(
  kpisN: DashboardKpis,
  kpisN1: DashboardKpis,
  labelN: string,
  labelN1: string,
): ComparisonData {
  const kpiFields: { key: keyof DashboardKpis; label: string }[] = [
    { key: 'chiffreAffaires', label: 'Chiffre d\'affaires' },
    { key: 'margeBrute', label: 'Marge brute' },
    { key: 'tauxMargeBrute', label: 'Taux de marge brute (%)' },
    { key: 'ebe', label: 'Excédent brut d\'exploitation' },
    { key: 'resultatNet', label: 'Résultat net' },
    { key: 'tresorerieNette', label: 'Trésorerie nette' },
    { key: 'ratioRentabilite', label: 'Ratio de rentabilité (%)' },
    { key: 'bfr', label: 'Besoin en fonds de roulement' },
    { key: 'delaiClientMoyen', label: 'Délai client moyen (jours)' },
    { key: 'delaiFournisseurMoyen', label: 'Délai fournisseur moyen (jours)' },
  ];

  const kpis: ComparisonRow[] = kpiFields.map(({ key, label }) => {
    const valueN = kpisN[key];
    const valueN1 = kpisN1[key];
    const deltaAbsolute = round(valueN - valueN1);
    const deltaPercent = valueN1 !== 0 ? round(((valueN - valueN1) / Math.abs(valueN1)) * 100) : null;

    return { label, valueN, valueN1, deltaAbsolute, deltaPercent };
  });

  return {
    labelN,
    labelN1,
    kpis,
    monthlyRevenue: [],
  };
}

/**
 * Compare le CA mensuel de deux exercices
 */
export function compareMonthlyRevenue(
  revenueN: MonthlyData[],
  revenueN1: MonthlyData[],
): ComparisonData['monthlyRevenue'] {
  // Aligner par index de mois (les deux exercices doivent avoir le même nombre de mois)
  const maxLength = Math.max(revenueN.length, revenueN1.length);
  const result: ComparisonData['monthlyRevenue'] = [];

  for (let i = 0; i < maxLength; i++) {
    const n = revenueN[i];
    const n1 = revenueN1[i];

    result.push({
      month: n?.month || n1?.month || '',
      label: n?.label || n1?.label || '',
      valueN: n?.montant || 0,
      valueN1: n1?.montant || 0,
    });
  }

  return result;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

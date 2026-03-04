import type { CompteAggregate, MonthlyData } from '@finthesis/shared';
import { compteStartsWith, getMonthLabel } from '@finthesis/shared';

interface EcritureForTresorerie {
  compteNum: string;
  ecritureDate: Date;
  debit: number;
  credit: number;
}

/**
 * Calcule l'évolution mensuelle de la trésorerie
 */
export function computeTresorerieMensuelle(
  ecritures: EcritureForTresorerie[],
  startDate: Date,
  endDate: Date,
): MonthlyData[] {
  // Filtrer uniquement les écritures de trésorerie (classe 5)
  const tresoEcritures = ecritures.filter((e) =>
    compteStartsWith(e.compteNum, ['51', '53', '54']),
  );

  // Grouper par mois
  const monthlyMap = new Map<string, number>();

  // Initialiser tous les mois
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (current <= last) {
    const key = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`;
    monthlyMap.set(key, 0);
    current.setMonth(current.getMonth() + 1);
  }

  // Cumuler les mouvements
  for (const ecriture of tresoEcritures) {
    const date = ecriture.ecritureDate;
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const existing = monthlyMap.get(key) || 0;
    monthlyMap.set(key, existing + ecriture.debit - ecriture.credit);
  }

  // Convertir en tableau avec cumul
  const result: MonthlyData[] = [];
  let cumul = 0;

  for (const [month, mouvement] of monthlyMap) {
    cumul += mouvement;
    const monthIndex = parseInt(month.split('-')[1], 10) - 1;
    result.push({
      month,
      label: getMonthLabel(monthIndex),
      montant: Math.round(cumul * 100) / 100,
    });
  }

  return result;
}

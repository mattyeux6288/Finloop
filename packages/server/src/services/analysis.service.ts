import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import type { CompteAggregate } from '@finthesis/shared';
import {
  computeBilan,
  computeCompteDeResultat,
  computeSig,
  computeKpis,
} from '@finthesis/engine';

/**
 * Récupère les agrégations par compte pour un exercice fiscal
 */
async function getCompteAggregates(fiscalYearId: string): Promise<CompteAggregate[]> {
  const rows = await db('ecritures')
    .where({ fiscal_year_id: fiscalYearId })
    .groupBy('compte_num', 'compte_lib', 'compte_classe', 'compte_racine')
    .select(
      'compte_num as compteNum',
      'compte_lib as compteLib',
      'compte_classe as compteClasse',
      'compte_racine as compteRacine',
    )
    .sum('debit as totalDebit')
    .sum('credit as totalCredit');

  return rows.map((r: any) => ({
    compteNum: String(r.compteNum),
    compteLib: String(r.compteLib),
    compteClasse: Number(r.compteClasse) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    compteRacine: String(r.compteRacine),
    totalDebit: Number(r.totalDebit) || 0,
    totalCredit: Number(r.totalCredit) || 0,
    solde: (Number(r.totalDebit) || 0) - (Number(r.totalCredit) || 0),
  }));
}

/**
 * Récupère ou calcule un rapport en cache
 */
async function getCachedOrCompute<T>(
  fiscalYearId: string,
  reportType: string,
  computeFn: () => Promise<T>,
): Promise<T> {
  const cached = await db('computed_reports')
    .where({ fiscal_year_id: fiscalYearId, report_type: reportType })
    .first();

  if (cached) {
    return typeof cached.data === 'string' ? JSON.parse(cached.data) : cached.data;
  }

  const data = await computeFn();

  // Sauvegarder en cache (supprimer puis insérer pour compatibilité SQLite)
  await db('computed_reports')
    .where({ fiscal_year_id: fiscalYearId, report_type: reportType })
    .del();

  await db('computed_reports').insert({
    id: uuid(),
    fiscal_year_id: fiscalYearId,
    report_type: reportType,
    data: JSON.stringify(data),
  });

  return data;
}

export async function getDashboard(fiscalYearId: string) {
  return getCachedOrCompute(fiscalYearId, 'dashboard', async () => {
    const aggregates = await getCompteAggregates(fiscalYearId);
    const kpis = computeKpis(aggregates);

    // Revenue mensuel - compatible SQLite avec substr()
    const monthlyRevenue = await db('ecritures')
      .where({ fiscal_year_id: fiscalYearId })
      .whereRaw("compte_num LIKE '70%'")
      .groupByRaw("substr(ecriture_date, 1, 7)")
      .select(
        db.raw("substr(ecriture_date, 1, 7) as month"),
      )
      .sum('credit as creditTotal')
      .sum('debit as debitTotal')
      .orderBy('month');

    // Répartition des charges par racine
    const expenseBreakdown = await db('ecritures')
      .where({ fiscal_year_id: fiscalYearId, compte_classe: 6 })
      .groupBy('compte_racine')
      .select('compte_racine as compteRacine')
      .sum('debit as debitTotal')
      .sum('credit as creditTotal')
      .orderByRaw('(COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0)) DESC');

    const totalCharges = expenseBreakdown.reduce(
      (sum: number, e: any) => sum + ((Number(e.debitTotal) || 0) - (Number(e.creditTotal) || 0)),
      0,
    );

    return {
      kpis,
      revenueMonthly: monthlyRevenue.map((r: any) => ({
        month: String(r.month),
        label: String(r.month).substring(5),
        montant: (Number(r.creditTotal) || 0) - (Number(r.debitTotal) || 0),
      })),
      expenseBreakdown: expenseBreakdown.map((e: any) => {
        const montant = (Number(e.debitTotal) || 0) - (Number(e.creditTotal) || 0);
        return {
          compteRacine: String(e.compteRacine),
          label: String(e.compteRacine),
          montant,
          pourcentage: totalCharges > 0 ? Math.round((montant / totalCharges) * 10000) / 100 : 0,
        };
      }),
    };
  });
}

export async function getBilan(fiscalYearId: string) {
  return getCachedOrCompute(fiscalYearId, 'bilan', async () => {
    const aggregates = await getCompteAggregates(fiscalYearId);
    return computeBilan(aggregates);
  });
}

export async function getCompteDeResultat(fiscalYearId: string) {
  return getCachedOrCompute(fiscalYearId, 'resultat', async () => {
    const aggregates = await getCompteAggregates(fiscalYearId);
    return computeCompteDeResultat(aggregates);
  });
}

export async function getSig(fiscalYearId: string) {
  return getCachedOrCompute(fiscalYearId, 'sig', async () => {
    const aggregates = await getCompteAggregates(fiscalYearId);
    return computeSig(aggregates);
  });
}

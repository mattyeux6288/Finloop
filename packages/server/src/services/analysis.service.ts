import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import { config } from '../config/env';
import type { CompteAggregate, EcritureDetail } from '@finthesis/shared';
import {
  computeBilan,
  computeCompteDeResultat,
  computeSig,
  computeKpis,
} from '@finthesis/engine';

/** Expression SQL pour extraire YYYY-MM d'une date (compatible SQLite et PostgreSQL) */
const monthExpr = config.databaseType === 'postgresql'
  ? "to_char(ecriture_date, 'YYYY-MM')"
  : "substr(ecriture_date, 1, 7)";

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
 * Version du schéma de cache. Incrémenter quand la structure des données calculées change
 * pour invalider automatiquement les caches obsolètes.
 */
const CACHE_VERSION = 4; // v4 : bilan équilibré (résultat exercice, comptes double sens, autresDettes)

/**
 * Récupère ou calcule un rapport en cache
 */
async function getCachedOrCompute<T>(
  fiscalYearId: string,
  reportType: string,
  computeFn: () => Promise<T>,
): Promise<T> {
  const versionedType = `${reportType}_v${CACHE_VERSION}`;
  const cached = await db('computed_reports')
    .where({ fiscal_year_id: fiscalYearId, report_type: versionedType })
    .first();

  if (cached) {
    return typeof cached.data === 'string' ? JSON.parse(cached.data) : cached.data;
  }

  const data = await computeFn();

  // Sauvegarder en cache (supprimer puis insérer pour compatibilité SQLite)
  await db('computed_reports')
    .where({ fiscal_year_id: fiscalYearId, report_type: versionedType })
    .del();

  await db('computed_reports').insert({
    id: uuid(),
    fiscal_year_id: fiscalYearId,
    report_type: versionedType,
    data: JSON.stringify(data),
  });

  return data;
}

export async function getDashboard(fiscalYearId: string) {
  return getCachedOrCompute(fiscalYearId, 'dashboard', async () => {
    const aggregates = await getCompteAggregates(fiscalYearId);
    const kpis = computeKpis(aggregates);

    // Revenue mensuel - compatible SQLite (substr) et PostgreSQL (to_char)
    const monthlyRevenue = await db('ecritures')
      .where({ fiscal_year_id: fiscalYearId })
      .whereRaw("compte_num LIKE '70%'")
      .groupByRaw(monthExpr)
      .select(
        db.raw(`${monthExpr} as month`),
      )
      .sum('credit as creditTotal')
      .sum('debit as debitTotal')
      .orderBy('month');

    // Répartition des charges — top 10 comptes (par numéro de compte)
    const allExpenses = await db('ecritures')
      .where({ fiscal_year_id: fiscalYearId, compte_classe: 6 })
      .groupBy(['compte_num', 'compte_lib'])
      .select('compte_num as compteNum', 'compte_lib as compteLib')
      .sum('debit as debitTotal')
      .sum('credit as creditTotal')
      .orderByRaw('(COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0)) DESC');

    // Total de TOUTES les charges (dénominateur pour les pourcentages)
    const totalCharges = allExpenses.reduce(
      (sum: number, e: any) => sum + Math.max(0, (Number(e.debitTotal) || 0) - (Number(e.creditTotal) || 0)),
      0,
    );

    // On ne garde que les 10 plus importants
    const expenseBreakdown = allExpenses.slice(0, 10);

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
          compteNum: String(e.compteNum),
          label: String(e.compteLib || e.compteNum), // libellé du compte, fallback sur le numéro
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

/**
 * Récupère toutes les écritures pour un compte donné dans un exercice,
 * triées par date puis numéro d'écriture.
 */
export async function getEcrituresByCompte(
  fiscalYearId: string,
  compteNum: string,
): Promise<EcritureDetail[]> {
  const rows = await db('ecritures')
    .where({ fiscal_year_id: fiscalYearId, compte_num: compteNum })
    .select(
      'ecriture_date as ecritureDate',
      'journal_code as journalCode',
      'journal_lib as journalLib',
      'piece_ref as pieceRef',
      'ecriture_lib as ecritureLib',
      'debit',
      'credit',
      'ecriture_num as ecritureNum',
      'ecriture_let as ecritureLet',
    )
    .orderBy('ecriture_date', 'asc')
    .orderBy('ecriture_num', 'asc');

  return rows.map((r: any) => ({
    ecritureDate: String(r.ecritureDate),
    journalCode: String(r.journalCode),
    journalLib: String(r.journalLib || ''),
    pieceRef: r.pieceRef ? String(r.pieceRef) : null,
    ecritureLib: String(r.ecritureLib || ''),
    debit: Number(r.debit) || 0,
    credit: Number(r.credit) || 0,
    ecritureNum: String(r.ecritureNum),
    ecritureLet: r.ecritureLet ? String(r.ecritureLet) : null,
  }));
}

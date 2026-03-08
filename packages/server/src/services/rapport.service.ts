import { db } from '../config/database';
import { config } from '../config/env';
import * as analysisService from './analysis.service';
import { PCG_MAIN_ACCOUNTS } from '@finthesis/shared';
import { getBenchmarkByNaf } from '../data/naf-benchmarks';
import type { SecteurBenchmark } from '../data/naf-benchmarks';
import type {
  RapportActiviteData,
  ChargeClassDetail,
  RatioFinancier,
  PointDiscussion,
  DashboardKpis,
  Bilan,
  Sig,
  CompteAggregate,
  MonthlyData,
} from '@finthesis/shared';

/** Expression SQL pour extraire YYYY-MM (compatible SQLite + PostgreSQL) */
const monthExpr = config.databaseType === 'postgresql'
  ? "to_char(ecriture_date, 'YYYY-MM')"
  : "substr(ecriture_date, 1, 7)";

// ── Charges détaillées par classe PCG ──

function buildChargesDetaillees(aggregates: CompteAggregate[]): ChargeClassDetail[] {
  const chargeAccounts = aggregates.filter((a) => a.compteClasse === 6);

  const grouped = new Map<string, { label: string; comptes: { compteNum: string; label: string; montant: number }[] }>();

  for (const acc of chargeAccounts) {
    const racine = acc.compteRacine.substring(0, 2);
    const montant = acc.totalDebit - acc.totalCredit;
    if (montant <= 0) continue;

    if (!grouped.has(racine)) {
      grouped.set(racine, {
        label: PCG_MAIN_ACCOUNTS[racine] || `Classe ${racine}`,
        comptes: [],
      });
    }

    grouped.get(racine)!.comptes.push({
      compteNum: acc.compteNum,
      label: acc.compteLib || acc.compteNum,
      montant,
    });
  }

  const classes: ChargeClassDetail[] = [];
  let totalCharges = 0;

  for (const [code, group] of grouped) {
    const montant = group.comptes.reduce((sum, c) => sum + c.montant, 0);
    totalCharges += montant;
    classes.push({
      classeCode: code,
      classeLabel: group.label,
      montant,
      pourcentage: 0,
      sousComptes: group.comptes.sort((a, b) => b.montant - a.montant),
    });
  }

  for (const c of classes) {
    c.pourcentage = totalCharges > 0 ? Math.round((c.montant / totalCharges) * 10000) / 100 : 0;
  }

  return classes.sort((a, b) => b.montant - a.montant);
}

// ── Ratios financiers (avec benchmarks sectoriels) ──

function buildRatios(
  kpis: DashboardKpis,
  bilan: Bilan,
  sig: Sig,
  benchmark: SecteurBenchmark,
): RatioFinancier[] {
  const ratios: RatioFinancier[] = [];
  const B = benchmark.ratios;
  const secteurLabel = benchmark.libelle;

  // Helper : seuil adaptatif basé sur le benchmark sectoriel
  function interp(valeur: number, moyenne: number, modeHaut: boolean): 'bon' | 'attention' | 'alerte' {
    const ratio = modeHaut ? valeur / moyenne : moyenne / valeur;
    if (ratio >= 1.1) return 'bon';
    if (ratio >= 0.8) return 'attention';
    return 'alerte';
  }

  function seuilStr(valeur: number, unite: string): string {
    const formatted = unite === '%' ? `${valeur}%` : `${valeur} ${unite}`;
    return `Moyenne secteur : ${formatted}`;
  }

  // 1. Taux de marge brute
  ratios.push({
    label: 'Taux de marge brute',
    valeur: kpis.tauxMargeBrute,
    unite: '%',
    interpretation: interp(kpis.tauxMargeBrute, B.tauxMargeBrute, true),
    seuil: seuilStr(B.tauxMargeBrute, '%'),
    secteurMoyenne: B.tauxMargeBrute,
    secteurLibelle: secteurLabel,
  });

  // 2. Rentabilité nette
  ratios.push({
    label: 'Rentabilité nette',
    valeur: kpis.ratioRentabilite,
    unite: '%',
    interpretation: interp(kpis.ratioRentabilite, B.rentabiliteNette, true),
    seuil: seuilStr(B.rentabiliteNette, '%'),
    secteurMoyenne: B.rentabiliteNette,
    secteurLibelle: secteurLabel,
  });

  // 3. Ratio d'endettement
  const cp = bilan.passif.capitauxPropres.total;
  const dettesFinancieres = bilan.passif.dettesFinancieres.total;
  const ratioEndettement = cp !== 0 ? Math.round((dettesFinancieres / cp) * 10000) / 100 : 0;
  ratios.push({
    label: "Ratio d'endettement",
    valeur: ratioEndettement,
    unite: '%',
    interpretation: interp(ratioEndettement, B.endettement, false), // moins = mieux
    seuil: seuilStr(B.endettement, '%'),
    secteurMoyenne: B.endettement,
    secteurLibelle: secteurLabel,
  });

  // 4. Autonomie financière
  const autonomie = bilan.passif.totalPassif !== 0
    ? Math.round((cp / bilan.passif.totalPassif) * 10000) / 100
    : 0;
  ratios.push({
    label: 'Autonomie financière',
    valeur: autonomie,
    unite: '%',
    interpretation: interp(autonomie, B.autonomieFinanciere, true),
    seuil: seuilStr(B.autonomieFinanciere, '%'),
    secteurMoyenne: B.autonomieFinanciere,
    secteurLibelle: secteurLabel,
  });

  // 5. BFR en jours de CA
  const bfrJours = kpis.chiffreAffaires > 0
    ? Math.round((kpis.bfr / kpis.chiffreAffaires) * 365)
    : 0;
  ratios.push({
    label: 'BFR en jours de CA',
    valeur: bfrJours,
    unite: 'jours',
    interpretation: interp(bfrJours, B.bfrJours, false), // moins = mieux
    seuil: seuilStr(B.bfrJours, 'jours'),
    secteurMoyenne: B.bfrJours,
    secteurLibelle: secteurLabel,
  });

  // 6. Délai client moyen
  ratios.push({
    label: 'Délai client moyen',
    valeur: kpis.delaiClientMoyen,
    unite: 'jours',
    interpretation: interp(kpis.delaiClientMoyen, B.delaiClient, false),
    seuil: seuilStr(B.delaiClient, 'jours'),
    secteurMoyenne: B.delaiClient,
    secteurLibelle: secteurLabel,
  });

  // 7. Délai fournisseur moyen
  ratios.push({
    label: 'Délai fournisseur moyen',
    valeur: kpis.delaiFournisseurMoyen,
    unite: 'jours',
    interpretation: kpis.delaiFournisseurMoyen >= B.delaiFournisseur * 0.5 && kpis.delaiFournisseurMoyen <= B.delaiFournisseur * 1.5 ? 'bon' : 'attention',
    seuil: seuilStr(B.delaiFournisseur, 'jours'),
    secteurMoyenne: B.delaiFournisseur,
    secteurLibelle: secteurLabel,
  });

  // 8. Taux de valeur ajoutée
  const va = sig.valeurAjoutee.montant;
  const tauxVA = kpis.chiffreAffaires > 0
    ? Math.round((va / kpis.chiffreAffaires) * 10000) / 100
    : 0;
  ratios.push({
    label: 'Taux de valeur ajoutée',
    valeur: tauxVA,
    unite: '%',
    interpretation: interp(tauxVA, B.tauxVA, true),
    seuil: seuilStr(B.tauxVA, '%'),
    secteurMoyenne: B.tauxVA,
    secteurLibelle: secteurLabel,
  });

  return ratios;
}

// ── Points de discussion ──

function buildPointsDiscussion(
  kpis: DashboardKpis,
  ratios: RatioFinancier[],
  chargesDetaillees: ChargeClassDetail[],
  bilan: Bilan,
  sig: Sig,
  benchmark: SecteurBenchmark,
): PointDiscussion[] {
  const points: PointDiscussion[] = [];
  const B = benchmark.ratios;
  const secteurLabel = benchmark.libelle;

  // ── Forces ──

  if (kpis.tauxMargeBrute >= B.tauxMargeBrute * 1.05) {
    points.push({
      type: 'force',
      titre: 'Marge brute supérieure au secteur',
      description: `Le taux de marge brute de ${kpis.tauxMargeBrute.toFixed(1)}% dépasse la moyenne du secteur "${secteurLabel}" (${B.tauxMargeBrute}%). Signe d'un bon positionnement prix ou de conditions d'achat favorables.`,
    });
  } else if (kpis.tauxMargeBrute >= B.tauxMargeBrute * 0.9) {
    points.push({
      type: 'force',
      titre: 'Marge brute dans la norme sectorielle',
      description: `Le taux de marge brute de ${kpis.tauxMargeBrute.toFixed(1)}% est aligné avec la moyenne "${secteurLabel}" (${B.tauxMargeBrute}%).`,
    });
  }

  if (kpis.bfr < 0) {
    points.push({
      type: 'force',
      titre: 'BFR négatif',
      description: `Le BFR est négatif : l'activité génère un excédent de trésorerie de cycle. Les fournisseurs financent une partie du cycle d'exploitation.`,
    });
  }

  if (kpis.tresorerieNette > 0 && kpis.chiffreAffaires > 0) {
    const moisCA = Math.round((kpis.tresorerieNette / kpis.chiffreAffaires) * 12 * 10) / 10;
    if (moisCA >= 2) {
      points.push({
        type: 'force',
        titre: 'Trésorerie confortable',
        description: `La trésorerie nette représente ${moisCA} mois de CA, offrant une marge de sécurité pour absorber les imprévus.`,
      });
    }
  }

  if (kpis.resultatNet > 0 && kpis.ratioRentabilite >= B.rentabiliteNette) {
    points.push({
      type: 'force',
      titre: 'Rentabilité supérieure au secteur',
      description: `L'exercice dégage une rentabilité nette de ${kpis.ratioRentabilite.toFixed(1)}%, au-dessus de la moyenne "${secteurLabel}" (${B.rentabiliteNette}%).`,
    });
  } else if (kpis.resultatNet > 0) {
    points.push({
      type: 'force',
      titre: 'Exercice bénéficiaire',
      description: `L'exercice se clôture avec un résultat net positif (rentabilité de ${kpis.ratioRentabilite.toFixed(1)}%).`,
    });
  }

  const ratioEndettement = ratios.find((r) => r.label === "Ratio d'endettement");
  if (ratioEndettement && ratioEndettement.valeur <= B.endettement * 0.5) {
    points.push({
      type: 'force',
      titre: 'Endettement faible vs secteur',
      description: `Le ratio d'endettement est de ${ratioEndettement.valeur.toFixed(1)}%, soit la moitié de la moyenne "${secteurLabel}" (${B.endettement}%). La capacité d'emprunt est préservée.`,
    });
  }

  const ebeMensuel = sig.ebe.montant;
  if (ebeMensuel > 0) {
    const tauxEBE = kpis.chiffreAffaires > 0
      ? Math.round((ebeMensuel / kpis.chiffreAffaires) * 10000) / 100
      : 0;
    if (tauxEBE >= B.tauxEBE * 1.1) {
      points.push({
        type: 'force',
        titre: 'EBE au-dessus de la moyenne sectorielle',
        description: `L'EBE représente ${tauxEBE.toFixed(1)}% du CA contre ${B.tauxEBE}% en moyenne pour le secteur "${secteurLabel}". La performance opérationnelle est solide.`,
      });
    } else if (tauxEBE >= B.tauxEBE * 0.9) {
      points.push({
        type: 'force',
        titre: 'EBE dans la norme sectorielle',
        description: `L'EBE s'établit à ${tauxEBE.toFixed(1)}% du CA, aligné avec la moyenne du secteur "${secteurLabel}" (${B.tauxEBE}%).`,
      });
    }
  }

  // ── Vigilance ──

  if (kpis.tauxMargeBrute > 0 && kpis.tauxMargeBrute < B.tauxMargeBrute * 0.8) {
    points.push({
      type: 'vigilance',
      titre: 'Marge brute en-dessous du secteur',
      description: `Le taux de marge brute de ${kpis.tauxMargeBrute.toFixed(1)}% est inférieur à la moyenne "${secteurLabel}" (${B.tauxMargeBrute}%). Revoir la politique tarifaire ou les conditions d'achat.`,
    });
  }

  const chargesPersonnel = chargesDetaillees.find((c) => c.classeCode === '64');
  const va = sig.valeurAjoutee.montant;
  if (chargesPersonnel && va > 0) {
    const poidsPersonnel = Math.round((chargesPersonnel.montant / va) * 10000) / 100;
    if (poidsPersonnel > 65) {
      points.push({
        type: 'vigilance',
        titre: 'Charges de personnel élevées',
        description: `Les charges de personnel représentent ${poidsPersonnel.toFixed(1)}% de la valeur ajoutée (seuil habituel : < 65%). Évaluer l'efficacité organisationnelle.`,
      });
    }
  }

  if (ratioEndettement && ratioEndettement.valeur > B.endettement * 1.3) {
    points.push({
      type: 'vigilance',
      titre: 'Endettement élevé vs secteur',
      description: `Le ratio d'endettement de ${ratioEndettement.valeur.toFixed(1)}% dépasse significativement la moyenne "${secteurLabel}" (${B.endettement}%). Veiller à la capacité de remboursement.`,
    });
  }

  if (kpis.delaiClientMoyen > B.delaiClient * 1.3) {
    points.push({
      type: 'vigilance',
      titre: 'Délais clients au-dessus du secteur',
      description: `Le délai moyen de paiement clients est de ${Math.round(kpis.delaiClientMoyen)} jours contre ${B.delaiClient} jours en moyenne pour le secteur "${secteurLabel}". La trésorerie en est directement impactée.`,
    });
  }

  // ── Actions ──

  if (kpis.resultatNet < 0) {
    points.push({
      type: 'action',
      titre: 'Exercice déficitaire',
      description: `L'exercice se clôture avec un résultat net négatif. Identifier les postes de charges à optimiser et les leviers de CA à activer en priorité.`,
    });
  }

  if (kpis.tresorerieNette < 0) {
    points.push({
      type: 'action',
      titre: 'Trésorerie négative',
      description: `La trésorerie nette est négative, signalant un risque de tension de cash. Envisager un rééchelonnement des dettes ou une ligne de crédit court terme.`,
    });
  }

  const bfrJours = ratios.find((r) => r.label === 'BFR en jours de CA');
  if (bfrJours && bfrJours.valeur > B.bfrJours * 1.4) {
    points.push({
      type: 'action',
      titre: 'BFR élevé vs secteur',
      description: `Le BFR représente ${bfrJours.valeur} jours de CA contre ${B.bfrJours} jours pour le secteur "${secteurLabel}". Négocier des délais fournisseurs plus longs ou raccourcir les délais clients.`,
    });
  }

  const servicesExt = chargesDetaillees.filter((c) => c.classeCode === '61' || c.classeCode === '62');
  const totalServExt = servicesExt.reduce((sum, s) => sum + s.montant, 0);
  if (kpis.chiffreAffaires > 0) {
    const pctServExt = Math.round((totalServExt / kpis.chiffreAffaires) * 10000) / 100;
    if (pctServExt > 25) {
      points.push({
        type: 'action',
        titre: 'Services extérieurs importants',
        description: `Les services extérieurs (sous-traitance, locations, honoraires...) pèsent ${pctServExt.toFixed(1)}% du CA. Passer en revue les contrats pour identifier des optimisations.`,
      });
    }
  }

  if (bilan.passif.capitauxPropres.total <= 0) {
    points.push({
      type: 'action',
      titre: 'Capitaux propres insuffisants',
      description: `Les capitaux propres sont négatifs ou nuls. La situation nécessite un apport en capital ou un abandon de compte courant pour restaurer l'équilibre financier.`,
    });
  }

  // Garantir au moins un point par type
  if (!points.some((p) => p.type === 'force')) {
    points.push({
      type: 'force',
      titre: 'Activité en place',
      description: `L'entreprise dispose d'une structure comptable suivie, base indispensable pour piloter la performance.`,
    });
  }

  return points;
}

// ── Fonction principale ──

export async function getRapportActivite(fiscalYearId: string): Promise<RapportActiviteData> {
  const [dashboard, bilan, sig, aggregates] = await Promise.all([
    analysisService.getDashboard(fiscalYearId),
    analysisService.getBilan(fiscalYearId),
    analysisService.getSig(fiscalYearId),
    getAggregatesForRapport(fiscalYearId),
  ]);

  // Infos entreprise + NAF
  const fy = await db('fiscal_years').where({ id: fiscalYearId }).first();
  const company = fy ? await db('companies').where({ id: fy.company_id }).first() : null;

  // Benchmark sectoriel
  const { benchmark } = getBenchmarkByNaf(company?.naf_code);

  // Construire les sections calculées
  const chargesDetaillees = buildChargesDetaillees(aggregates);
  const ratios = buildRatios(dashboard.kpis, bilan, sig, benchmark);
  const pointsDiscussion = buildPointsDiscussion(dashboard.kpis, ratios, chargesDetaillees, bilan, sig, benchmark);

  // Données N-1 (exercice précédent de la même entreprise)
  let revenueMonthlyN1: MonthlyData[] = [];
  if (fy && company) {
    const previousFy = await db('fiscal_years')
      .where({ company_id: company.id })
      .where('end_date', '<', fy.start_date)
      .orderBy('end_date', 'desc')
      .first();

    if (previousFy) {
      const monthlyN1 = await db('ecritures')
        .where({ fiscal_year_id: previousFy.id })
        .whereRaw("compte_num LIKE '70%'")
        .groupByRaw(monthExpr)
        .select(db.raw(`${monthExpr} as month`))
        .sum('credit as creditTotal')
        .sum('debit as debitTotal')
        .orderBy('month');

      revenueMonthlyN1 = monthlyN1.map((r: any) => ({
        month: String(r.month),
        label: String(r.month).substring(5),
        montant: (Number(r.creditTotal) || 0) - (Number(r.debitTotal) || 0),
      }));
    }
  }

  return {
    entreprise: {
      nom: company?.name || 'Entreprise',
      siren: company?.siren || '',
      exercice: fy?.label || '',
      dateDebut: fy?.start_date || '',
      dateFin: fy?.end_date || '',
      nafCode: company?.naf_code || undefined,
      nafLibelle: benchmark.libelle,
    },
    kpis: dashboard.kpis,
    revenueMonthly: dashboard.revenueMonthly,
    revenueMonthlyN1,
    chargesDetaillees,
    bilan,
    sig,
    ratios,
    pointsDiscussion,
    genereA: new Date().toISOString(),
  };
}

/**
 * Récupère les agrégats par compte pour le détail des charges.
 */
async function getAggregatesForRapport(fiscalYearId: string): Promise<CompteAggregate[]> {
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

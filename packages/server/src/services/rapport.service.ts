import { db } from '../config/database';
import * as analysisService from './analysis.service';
import { PCG_MAIN_ACCOUNTS } from '@finthesis/shared';
import type {
  RapportActiviteData,
  ChargeClassDetail,
  RatioFinancier,
  PointDiscussion,
  DashboardKpis,
  Bilan,
  Sig,
  CompteAggregate,
} from '@finthesis/shared';

// ── Charges détaillées par classe PCG ──

function buildChargesDetaillees(aggregates: CompteAggregate[]): ChargeClassDetail[] {
  // Filtrer uniquement les comptes de classe 6 (charges)
  const chargeAccounts = aggregates.filter((a) => a.compteClasse === 6);

  // Grouper par racine 2 chiffres (60, 61, 62...)
  const grouped = new Map<string, { label: string; comptes: { compteNum: string; label: string; montant: number }[] }>();

  for (const acc of chargeAccounts) {
    const racine = acc.compteRacine.substring(0, 2);
    const montant = acc.totalDebit - acc.totalCredit;
    if (montant <= 0) continue; // ignorer les comptes à solde nul ou créditeur

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

  // Calculer les totaux par classe
  const classes: ChargeClassDetail[] = [];
  let totalCharges = 0;

  for (const [code, group] of grouped) {
    const montant = group.comptes.reduce((sum, c) => sum + c.montant, 0);
    totalCharges += montant;
    classes.push({
      classeCode: code,
      classeLabel: group.label,
      montant,
      pourcentage: 0, // calculé après
      sousComptes: group.comptes.sort((a, b) => b.montant - a.montant),
    });
  }

  // Calculer les pourcentages et trier par montant décroissant
  for (const c of classes) {
    c.pourcentage = totalCharges > 0 ? Math.round((c.montant / totalCharges) * 10000) / 100 : 0;
  }

  return classes.sort((a, b) => b.montant - a.montant);
}

// ── Ratios financiers ──

function buildRatios(kpis: DashboardKpis, bilan: Bilan, sig: Sig): RatioFinancier[] {
  const ratios: RatioFinancier[] = [];

  // 1. Taux de marge brute
  ratios.push({
    label: 'Taux de marge brute',
    valeur: kpis.tauxMargeBrute,
    unite: '%',
    interpretation: kpis.tauxMargeBrute >= 30 ? 'bon' : kpis.tauxMargeBrute >= 15 ? 'attention' : 'alerte',
    seuil: 'Norme > 25%',
  });

  // 2. Rentabilité nette
  ratios.push({
    label: 'Rentabilité nette',
    valeur: kpis.ratioRentabilite,
    unite: '%',
    interpretation: kpis.ratioRentabilite >= 5 ? 'bon' : kpis.ratioRentabilite >= 0 ? 'attention' : 'alerte',
    seuil: 'Norme > 5%',
  });

  // 3. Ratio d'endettement (Dettes financières / Capitaux propres)
  const cp = bilan.passif.capitauxPropres.total;
  const dettesFinancieres = bilan.passif.dettesFinancieres.total;
  const ratioEndettement = cp !== 0 ? Math.round((dettesFinancieres / cp) * 10000) / 100 : 0;
  ratios.push({
    label: "Ratio d'endettement",
    valeur: ratioEndettement,
    unite: '%',
    interpretation: ratioEndettement <= 50 ? 'bon' : ratioEndettement <= 100 ? 'attention' : 'alerte',
    seuil: 'Norme < 100%',
  });

  // 4. Autonomie financière (Capitaux propres / Total passif)
  const autonomie = bilan.passif.totalPassif !== 0
    ? Math.round((cp / bilan.passif.totalPassif) * 10000) / 100
    : 0;
  ratios.push({
    label: 'Autonomie financière',
    valeur: autonomie,
    unite: '%',
    interpretation: autonomie >= 30 ? 'bon' : autonomie >= 15 ? 'attention' : 'alerte',
    seuil: 'Norme > 25%',
  });

  // 5. BFR en jours de CA
  const bfrJours = kpis.chiffreAffaires > 0
    ? Math.round((kpis.bfr / kpis.chiffreAffaires) * 365)
    : 0;
  ratios.push({
    label: 'BFR en jours de CA',
    valeur: bfrJours,
    unite: 'jours',
    interpretation: bfrJours <= 30 ? 'bon' : bfrJours <= 90 ? 'attention' : 'alerte',
    seuil: 'Norme < 60 jours',
  });

  // 6. Délai client moyen
  ratios.push({
    label: 'Délai client moyen',
    valeur: kpis.delaiClientMoyen,
    unite: 'jours',
    interpretation: kpis.delaiClientMoyen <= 45 ? 'bon' : kpis.delaiClientMoyen <= 60 ? 'attention' : 'alerte',
    seuil: 'Norme < 45 jours',
  });

  // 7. Délai fournisseur moyen
  ratios.push({
    label: 'Délai fournisseur moyen',
    valeur: kpis.delaiFournisseurMoyen,
    unite: 'jours',
    interpretation: kpis.delaiFournisseurMoyen >= 30 && kpis.delaiFournisseurMoyen <= 60 ? 'bon' : 'attention',
    seuil: 'Norme 30-60 jours',
  });

  // 8. Taux de VA (Valeur Ajoutée / CA)
  const va = sig.valeurAjoutee.montant;
  const tauxVA = kpis.chiffreAffaires > 0
    ? Math.round((va / kpis.chiffreAffaires) * 10000) / 100
    : 0;
  ratios.push({
    label: "Taux de valeur ajoutée",
    valeur: tauxVA,
    unite: '%',
    interpretation: tauxVA >= 30 ? 'bon' : tauxVA >= 15 ? 'attention' : 'alerte',
    seuil: 'Varie par secteur',
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
): PointDiscussion[] {
  const points: PointDiscussion[] = [];

  // ── Forces ──

  if (kpis.tauxMargeBrute >= 30) {
    points.push({
      type: 'force',
      titre: 'Marge brute solide',
      description: `Le taux de marge brute s'établit à ${kpis.tauxMargeBrute.toFixed(1)}%, un niveau confortable qui témoigne d'un bon positionnement prix.`,
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

  if (kpis.resultatNet > 0 && kpis.ratioRentabilite >= 5) {
    points.push({
      type: 'force',
      titre: 'Exercice bénéficiaire',
      description: `L'exercice dégage un résultat net positif avec une rentabilité de ${kpis.ratioRentabilite.toFixed(1)}%.`,
    });
  }

  const ratioEndettement = ratios.find((r) => r.label === "Ratio d'endettement");
  if (ratioEndettement && ratioEndettement.valeur <= 30) {
    points.push({
      type: 'force',
      titre: 'Faible endettement',
      description: `Le ratio d'endettement est de ${ratioEndettement.valeur.toFixed(1)}%, laissant une capacité d'emprunt importante.`,
    });
  }

  // Tendance CA mensuelle
  const ebeMensuel = sig.ebe.montant;
  if (ebeMensuel > 0) {
    const tauxEBE = kpis.chiffreAffaires > 0
      ? Math.round((ebeMensuel / kpis.chiffreAffaires) * 10000) / 100
      : 0;
    if (tauxEBE >= 10) {
      points.push({
        type: 'force',
        titre: "EBE performant",
        description: `L'EBE représente ${tauxEBE.toFixed(1)}% du CA, signe d'une bonne performance opérationnelle avant prise en compte de la politique d'investissement.`,
      });
    }
  }

  // ── Vigilance ──

  if (kpis.tauxMargeBrute > 0 && kpis.tauxMargeBrute < 15) {
    points.push({
      type: 'vigilance',
      titre: 'Marge brute fragile',
      description: `Le taux de marge brute de ${kpis.tauxMargeBrute.toFixed(1)}% est en-dessous des normes habituelles. Revoir la politique tarifaire ou les conditions d'achat.`,
    });
  }

  // Poids salarial dans la VA
  const chargesPersonnel = chargesDetaillees.find((c) => c.classeCode === '64');
  const va = sig.valeurAjoutee.montant;
  if (chargesPersonnel && va > 0) {
    const poidsPersonnel = Math.round((chargesPersonnel.montant / va) * 10000) / 100;
    if (poidsPersonnel > 65) {
      points.push({
        type: 'vigilance',
        titre: 'Charges de personnel élevées',
        description: `Les charges de personnel représentent ${poidsPersonnel.toFixed(1)}% de la valeur ajoutée (norme : < 65%). Évaluer l'efficacité organisationnelle.`,
      });
    }
  }

  if (ratioEndettement && ratioEndettement.valeur > 70) {
    points.push({
      type: 'vigilance',
      titre: 'Endettement significatif',
      description: `Le ratio d'endettement de ${ratioEndettement.valeur.toFixed(1)}% indique un recours important aux dettes financières. Veiller à la capacité de remboursement.`,
    });
  }

  if (kpis.delaiClientMoyen > 60) {
    points.push({
      type: 'vigilance',
      titre: 'Délais clients longs',
      description: `Le délai moyen de paiement clients est de ${Math.round(kpis.delaiClientMoyen)} jours (norme < 45j). La trésorerie en est directement impactée.`,
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
  if (bfrJours && bfrJours.valeur > 90) {
    points.push({
      type: 'action',
      titre: 'BFR élevé',
      description: `Le BFR représente ${bfrJours.valeur} jours de CA. Négocier des délais fournisseurs plus longs ou raccourcir les délais clients pour améliorer le cycle de trésorerie.`,
    });
  }

  // Services extérieurs importants
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

  // Capitaux propres faibles ou négatifs
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
  // Récupérer les données en parallèle (bénéficient du cache computed_reports)
  const [dashboard, bilan, sig, aggregates] = await Promise.all([
    analysisService.getDashboard(fiscalYearId),
    analysisService.getBilan(fiscalYearId),
    analysisService.getSig(fiscalYearId),
    getAggregatesForRapport(fiscalYearId),
  ]);

  // Infos entreprise
  const fy = await db('fiscal_years').where({ id: fiscalYearId }).first();
  const company = fy ? await db('companies').where({ id: fy.company_id }).first() : null;

  // Construire les sections calculées
  const chargesDetaillees = buildChargesDetaillees(aggregates);
  const ratios = buildRatios(dashboard.kpis, bilan, sig);
  const pointsDiscussion = buildPointsDiscussion(dashboard.kpis, ratios, chargesDetaillees, bilan, sig);

  return {
    entreprise: {
      nom: company?.name || 'Entreprise',
      siren: company?.siren || '',
      exercice: fy?.label || '',
      dateDebut: fy?.start_date || '',
      dateFin: fy?.end_date || '',
    },
    kpis: dashboard.kpis,
    revenueMonthly: dashboard.revenueMonthly,
    chargesDetaillees,
    bilan,
    sig,
    ratios,
    pointsDiscussion,
    genereA: new Date().toISOString(),
  };
}

/**
 * Récupère les agrégats par compte — réutilise la logique de analysis.service
 * mais on a besoin d'y accéder directement ici pour le détail des charges.
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

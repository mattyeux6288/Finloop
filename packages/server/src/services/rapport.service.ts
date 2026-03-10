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
  TresorerieMensuelle,
  EquilibreFinancier,
} from '@finthesis/shared';

/** Helper : formater un montant en k€ */
function formatK(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(0)} k€`;
  return `${Math.round(v)} €`;
}

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

  // ── Ratios SIG ──

  // 1. Taux de marge brute
  ratios.push({
    label: 'Taux de marge brute',
    valeur: kpis.tauxMargeBrute,
    unite: '%',
    interpretation: interp(kpis.tauxMargeBrute, B.tauxMargeBrute, true),
    seuil: seuilStr(B.tauxMargeBrute, '%'),
    secteurMoyenne: B.tauxMargeBrute,
    secteurLibelle: secteurLabel,
    formule: `Marge brute (${formatK(kpis.margeBrute)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100`,
    categorie: 'sig',
  });

  // 2. Taux de valeur ajoutée
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
    formule: `Valeur ajoutée (${formatK(va)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100`,
    categorie: 'sig',
  });

  // 3. Taux d'EBE (nouveau)
  const tauxEBE = kpis.chiffreAffaires > 0
    ? Math.round((sig.ebe.montant / kpis.chiffreAffaires) * 10000) / 100
    : 0;
  ratios.push({
    label: "Taux d'EBE",
    valeur: tauxEBE,
    unite: '%',
    interpretation: interp(tauxEBE, B.tauxEBE, true),
    seuil: seuilStr(B.tauxEBE, '%'),
    secteurMoyenne: B.tauxEBE,
    secteurLibelle: secteurLabel,
    formule: `EBE (${formatK(sig.ebe.montant)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100`,
    categorie: 'sig',
  });

  // 4. Rentabilité nette
  ratios.push({
    label: 'Rentabilité nette',
    valeur: kpis.ratioRentabilite,
    unite: '%',
    interpretation: interp(kpis.ratioRentabilite, B.rentabiliteNette, true),
    seuil: seuilStr(B.rentabiliteNette, '%'),
    secteurMoyenne: B.rentabiliteNette,
    secteurLibelle: secteurLabel,
    formule: `Résultat net (${formatK(kpis.resultatNet)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100`,
    categorie: 'sig',
  });

  // ── Ratios Bilan ──

  // 5. Ratio d'endettement
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
    formule: `Dettes financières (${formatK(dettesFinancieres)}) / Capitaux propres (${formatK(cp)}) × 100`,
    categorie: 'bilan',
  });

  // 6. Autonomie financière
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
    formule: `Capitaux propres (${formatK(cp)}) / Total passif (${formatK(bilan.passif.totalPassif)}) × 100`,
    categorie: 'bilan',
  });

  // 7. BFR en jours de CA
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
    formule: `BFR (${formatK(kpis.bfr)}) / CA (${formatK(kpis.chiffreAffaires)}) × 365`,
    categorie: 'bilan',
  });

  // 8. Délai client moyen
  ratios.push({
    label: 'Délai client moyen',
    valeur: kpis.delaiClientMoyen,
    unite: 'jours',
    interpretation: interp(kpis.delaiClientMoyen, B.delaiClient, false),
    seuil: seuilStr(B.delaiClient, 'jours'),
    secteurMoyenne: B.delaiClient,
    secteurLibelle: secteurLabel,
    formule: `Créances clients / CA TTC × 365`,
    categorie: 'bilan',
  });

  // 9. Délai fournisseur moyen
  ratios.push({
    label: 'Délai fournisseur moyen',
    valeur: kpis.delaiFournisseurMoyen,
    unite: 'jours',
    interpretation: kpis.delaiFournisseurMoyen >= B.delaiFournisseur * 0.5 && kpis.delaiFournisseurMoyen <= B.delaiFournisseur * 1.5 ? 'bon' : 'attention',
    seuil: seuilStr(B.delaiFournisseur, 'jours'),
    secteurMoyenne: B.delaiFournisseur,
    secteurLibelle: secteurLabel,
    formule: `Dettes fournisseurs / Achats TTC × 365`,
    categorie: 'bilan',
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
  equilibre: EquilibreFinancier,
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
      formule: `Marge brute (${formatK(kpis.margeBrute)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${kpis.tauxMargeBrute.toFixed(1)}%`,
    });
  } else if (kpis.tauxMargeBrute >= B.tauxMargeBrute * 0.9) {
    points.push({
      type: 'force',
      titre: 'Marge brute dans la norme sectorielle',
      description: `Le taux de marge brute de ${kpis.tauxMargeBrute.toFixed(1)}% est aligné avec la moyenne "${secteurLabel}" (${B.tauxMargeBrute}%).`,
      formule: `Marge brute (${formatK(kpis.margeBrute)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${kpis.tauxMargeBrute.toFixed(1)}%`,
    });
  }

  if (kpis.bfr < 0) {
    points.push({
      type: 'force',
      titre: 'BFR négatif',
      description: `Le BFR est négatif : l'activité génère un excédent de trésorerie de cycle. Les fournisseurs financent une partie du cycle d'exploitation.`,
      formule: `BFR = Stocks + Créances clients − Dettes fournisseurs − Dettes fiscales = ${formatK(kpis.bfr)}`,
    });
  }

  if (kpis.tresorerieNette > 0 && kpis.chiffreAffaires > 0) {
    const moisCA = Math.round((kpis.tresorerieNette / kpis.chiffreAffaires) * 12 * 10) / 10;
    if (moisCA >= 2) {
      points.push({
        type: 'force',
        titre: 'Trésorerie confortable',
        description: `La trésorerie nette représente ${moisCA} mois de CA, offrant une marge de sécurité pour absorber les imprévus.`,
        formule: `Trésorerie nette (${formatK(kpis.tresorerieNette)}) / CA mensuel (${formatK(kpis.chiffreAffaires / 12)}) = ${moisCA} mois`,
      });
    }
  }

  if (kpis.resultatNet > 0 && kpis.ratioRentabilite >= B.rentabiliteNette) {
    points.push({
      type: 'force',
      titre: 'Rentabilité supérieure au secteur',
      description: `L'exercice dégage une rentabilité nette de ${kpis.ratioRentabilite.toFixed(1)}%, au-dessus de la moyenne "${secteurLabel}" (${B.rentabiliteNette}%).`,
      formule: `Résultat net (${formatK(kpis.resultatNet)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${kpis.ratioRentabilite.toFixed(1)}%`,
    });
  } else if (kpis.resultatNet > 0) {
    points.push({
      type: 'force',
      titre: 'Exercice bénéficiaire',
      description: `L'exercice se clôture avec un résultat net positif (rentabilité de ${kpis.ratioRentabilite.toFixed(1)}%).`,
      formule: `Résultat net (${formatK(kpis.resultatNet)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${kpis.ratioRentabilite.toFixed(1)}%`,
    });
  }

  const ratioEndettement = ratios.find((r) => r.label === "Ratio d'endettement");
  if (ratioEndettement && ratioEndettement.valeur <= B.endettement * 0.5) {
    points.push({
      type: 'force',
      titre: 'Endettement faible vs secteur',
      description: `Le ratio d'endettement est de ${ratioEndettement.valeur.toFixed(1)}%, soit la moitié de la moyenne "${secteurLabel}" (${B.endettement}%). La capacité d'emprunt est préservée.`,
      formule: `Dettes financières / Capitaux propres × 100 = ${ratioEndettement.valeur.toFixed(1)}%`,
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
        formule: `EBE (${formatK(ebeMensuel)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${tauxEBE.toFixed(1)}%`,
      });
    } else if (tauxEBE >= B.tauxEBE * 0.9) {
      points.push({
        type: 'force',
        titre: 'EBE dans la norme sectorielle',
        description: `L'EBE s'établit à ${tauxEBE.toFixed(1)}% du CA, aligné avec la moyenne du secteur "${secteurLabel}" (${B.tauxEBE}%).`,
        formule: `EBE (${formatK(ebeMensuel)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${tauxEBE.toFixed(1)}%`,
      });
    }
  }

  // ── Vigilance ──

  if (kpis.tauxMargeBrute > 0 && kpis.tauxMargeBrute < B.tauxMargeBrute * 0.8) {
    points.push({
      type: 'vigilance',
      titre: 'Marge brute en-dessous du secteur',
      description: `Le taux de marge brute de ${kpis.tauxMargeBrute.toFixed(1)}% est inférieur à la moyenne "${secteurLabel}" (${B.tauxMargeBrute}%). Revoir la politique tarifaire ou les conditions d'achat.`,
      formule: `Marge brute (${formatK(kpis.margeBrute)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${kpis.tauxMargeBrute.toFixed(1)}%`,
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
        formule: `Charges personnel (${formatK(chargesPersonnel.montant)}) / VA (${formatK(va)}) × 100 = ${poidsPersonnel.toFixed(1)}%`,
      });
    }
  }

  if (ratioEndettement && ratioEndettement.valeur > B.endettement * 1.3) {
    points.push({
      type: 'vigilance',
      titre: 'Endettement élevé vs secteur',
      description: `Le ratio d'endettement de ${ratioEndettement.valeur.toFixed(1)}% dépasse significativement la moyenne "${secteurLabel}" (${B.endettement}%). Veiller à la capacité de remboursement.`,
      formule: `Dettes financières / Capitaux propres × 100 = ${ratioEndettement.valeur.toFixed(1)}%`,
    });
  }

  if (kpis.delaiClientMoyen > B.delaiClient * 1.3) {
    points.push({
      type: 'vigilance',
      titre: 'Délais clients au-dessus du secteur',
      description: `Le délai moyen de paiement clients est de ${Math.round(kpis.delaiClientMoyen)} jours contre ${B.delaiClient} jours en moyenne pour le secteur "${secteurLabel}". La trésorerie en est directement impactée.`,
      formule: `Créances clients / CA TTC × 365 = ${Math.round(kpis.delaiClientMoyen)} jours`,
    });
  }

  // ── Actions ──

  if (kpis.resultatNet < 0) {
    points.push({
      type: 'action',
      titre: 'Exercice déficitaire',
      description: `L'exercice se clôture avec un résultat net négatif. Identifier les postes de charges à optimiser et les leviers de CA à activer en priorité.`,
      formule: `Résultat net (${formatK(kpis.resultatNet)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${kpis.ratioRentabilite.toFixed(1)}%`,
    });
  }

  if (kpis.tresorerieNette < 0) {
    points.push({
      type: 'action',
      titre: 'Trésorerie négative',
      description: `La trésorerie nette est négative, signalant un risque de tension de cash. Envisager un rééchelonnement des dettes ou une ligne de crédit court terme.`,
      formule: `Trésorerie nette = Banques (51x) + Caisse (53x) − Concours bancaires (519) = ${formatK(kpis.tresorerieNette)}`,
    });
  }

  const bfrJours = ratios.find((r) => r.label === 'BFR en jours de CA');
  if (bfrJours && bfrJours.valeur > B.bfrJours * 1.4) {
    points.push({
      type: 'action',
      titre: 'BFR élevé vs secteur',
      description: `Le BFR représente ${bfrJours.valeur} jours de CA contre ${B.bfrJours} jours pour le secteur "${secteurLabel}". Négocier des délais fournisseurs plus longs ou raccourcir les délais clients.`,
      formule: `BFR (${formatK(kpis.bfr)}) / CA (${formatK(kpis.chiffreAffaires)}) × 365 = ${bfrJours.valeur} jours`,
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
        formule: `Services ext. (${formatK(totalServExt)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${pctServExt.toFixed(1)}%`,
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

  // ── Analyse FRNG / CAF ──

  if (equilibre.frng > 0 && equilibre.frng >= kpis.bfr) {
    points.push({
      type: 'force',
      titre: 'Équilibre financier respecté',
      description: `Le Fonds de Roulement (${formatK(equilibre.frng)}) couvre le BFR (${formatK(kpis.bfr)}). L'entreprise dispose d'un matelas de sécurité pour ses opérations courantes.`,
      formule: `FRNG (${formatK(equilibre.frng)}) − BFR (${formatK(kpis.bfr)}) = excédent de ${formatK(equilibre.frng - kpis.bfr)}`,
    });
  } else if (equilibre.frng < 0) {
    points.push({
      type: 'action',
      titre: 'Fonds de roulement négatif',
      description: `Le FRNG est négatif (${formatK(equilibre.frng)}) : les immobilisations ne sont pas entièrement financées par des ressources stables. Envisager un renforcement des fonds propres ou un emprunt long terme.`,
      formule: `FRNG = Capitaux permanents − Immobilisations = ${formatK(equilibre.frng)}`,
    });
  } else if (equilibre.frng > 0 && equilibre.frng < kpis.bfr) {
    points.push({
      type: 'vigilance',
      titre: 'FRNG insuffisant pour couvrir le BFR',
      description: `Le Fonds de Roulement (${formatK(equilibre.frng)}) ne couvre pas entièrement le BFR (${formatK(kpis.bfr)}). L'écart est financé par la trésorerie courante, ce qui peut créer des tensions.`,
      formule: `FRNG (${formatK(equilibre.frng)}) − BFR (${formatK(kpis.bfr)}) = déficit de ${formatK(kpis.bfr - equilibre.frng)}`,
    });
  }

  if (equilibre.caf > 0) {
    const cafPctCA = kpis.chiffreAffaires > 0
      ? Math.round((equilibre.caf / kpis.chiffreAffaires) * 10000) / 100
      : 0;
    if (cafPctCA >= 8) {
      points.push({
        type: 'force',
        titre: 'Capacité d\'autofinancement solide',
        description: `La CAF s'élève à ${formatK(equilibre.caf)} (${cafPctCA.toFixed(1)}% du CA), offrant une bonne capacité de remboursement et d'investissement sans recours à l'endettement.`,
        formule: `CAF (${formatK(equilibre.caf)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${cafPctCA.toFixed(1)}%`,
      });
    } else if (cafPctCA >= 3) {
      points.push({
        type: 'vigilance',
        titre: 'CAF modérée',
        description: `La Capacité d'Autofinancement représente ${cafPctCA.toFixed(1)}% du CA (${formatK(equilibre.caf)}). Elle permet de couvrir les remboursements mais laisse peu de marge pour l'investissement.`,
        formule: `CAF (${formatK(equilibre.caf)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${cafPctCA.toFixed(1)}%`,
      });
    } else {
      points.push({
        type: 'action',
        titre: 'CAF faible',
        description: `La CAF ne représente que ${cafPctCA.toFixed(1)}% du CA. L'entreprise dispose de peu de ressources internes pour rembourser ses emprunts ou autofinancer ses investissements.`,
        formule: `CAF (${formatK(equilibre.caf)}) / CA (${formatK(kpis.chiffreAffaires)}) × 100 = ${cafPctCA.toFixed(1)}%`,
      });
    }
  } else if (equilibre.caf <= 0) {
    points.push({
      type: 'action',
      titre: 'Capacité d\'autofinancement négative',
      description: `La CAF est négative (${formatK(equilibre.caf)}). L'activité ne génère pas assez de trésorerie pour couvrir ses besoins. Revoir la structure de coûts en priorité.`,
      formule: `CAF = Résultat net + Dotations (68x) − Reprises (78x) ± Cessions = ${formatK(equilibre.caf)}`,
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

// ── Trésorerie mensuelle (soldes classe 5 cumulés mois par mois) ──

async function buildTresorerieMensuelle(fiscalYearId: string): Promise<TresorerieMensuelle[]> {
  // Solde des comptes de trésorerie (51x banques, 53x caisse) - concours bancaires (519)
  // Groupé par mois pour montrer l'évolution au fil de l'exercice
  const rows = await db('ecritures')
    .where({ fiscal_year_id: fiscalYearId })
    .whereRaw("(compte_num LIKE '51%' OR compte_num LIKE '53%')")
    .groupByRaw(monthExpr)
    .select(db.raw(`${monthExpr} as month`))
    .sum('debit as totalDebit')
    .sum('credit as totalCredit')
    .orderBy('month');

  // Calculer le solde cumulé mois par mois
  let cumul = 0;
  return rows.map((r: any) => {
    // Comptes d'actif : débit = entrée, crédit = sortie → solde = D - C
    const flux = (Number(r.totalDebit) || 0) - (Number(r.totalCredit) || 0);
    cumul += flux;
    return {
      month: String(r.month),
      label: String(r.month).substring(5),
      solde: Math.round(cumul * 100) / 100,
    };
  });
}

// ── Équilibre financier (FRNG, BFR, Trésorerie, CAF) ──

function buildEquilibreFinancier(
  kpis: DashboardKpis,
  bilan: Bilan,
  sig: Sig,
  aggregates: CompteAggregate[],
): EquilibreFinancier {
  const round = (v: number) => Math.round(v * 100) / 100;

  // FRNG = Capitaux permanents - Actif immobilisé
  // Capitaux permanents = Capitaux propres + Dettes financières (LT)
  const capitauxPermanents = bilan.passif.capitauxPropres.total + bilan.passif.dettesFinancieres.total;
  const frng = round(capitauxPermanents - bilan.actif.immobilisations.total);

  // CAF = Résultat net + Dotations aux amortissements/provisions (68x)
  //       - Reprises sur amortissements/provisions (78x)
  //       + VNC des actifs cédés (675) - Produits de cession (775)
  const dotations = aggregates
    .filter((a) => a.compteRacine.startsWith('68'))
    .reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0);

  const reprises = aggregates
    .filter((a) => a.compteRacine.startsWith('78'))
    .reduce((sum, a) => sum + a.totalCredit - a.totalDebit, 0);

  const vncCessions = aggregates
    .filter((a) => a.compteNum.startsWith('675'))
    .reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0);

  const produitsCession = aggregates
    .filter((a) => a.compteNum.startsWith('775'))
    .reduce((sum, a) => sum + a.totalCredit - a.totalDebit, 0);

  const caf = round(sig.resultatNet.montant + dotations - reprises + vncCessions - produitsCession);

  // Trésorerie en jours de CA (autonomie de trésorerie)
  const joursCA = kpis.chiffreAffaires > 0
    ? Math.round((kpis.tresorerieNette / kpis.chiffreAffaires) * 365)
    : 0;

  return {
    frng,
    bfr: kpis.bfr,
    tresorerieNette: kpis.tresorerieNette,
    caf,
    joursCA,
  };
}

// ── Fonction principale ──

export async function getRapportActivite(fiscalYearId: string): Promise<RapportActiviteData> {
  const [dashboard, bilan, sig, aggregates, tresorerieMensuelle] = await Promise.all([
    analysisService.getDashboard(fiscalYearId),
    analysisService.getBilan(fiscalYearId),
    analysisService.getSig(fiscalYearId),
    getAggregatesForRapport(fiscalYearId),
    buildTresorerieMensuelle(fiscalYearId),
  ]);

  // Infos entreprise + NAF
  const fy = await db('fiscal_years').where({ id: fiscalYearId }).first();
  let company = fy ? await db('companies').where({ id: fy.company_id }).first() : null;

  // Dirigeant : lookup SIREN à la volée si absent en DB (sociétés créées avant la feature)
  if (company && !company.dirigeant && company.siren) {
    try {
      const resp = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${company.siren}&page=1&per_page=1`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (resp.ok) {
        const json = await resp.json() as Record<string, any>;
        const firstDirigeant = json?.results?.[0]?.dirigeants?.[0];
        if (firstDirigeant) {
          const dirigeant = [firstDirigeant.prenoms, firstDirigeant.nom]
            .filter(Boolean).join(' ').toUpperCase();
          await db('companies').where({ id: company.id }).update({ dirigeant });
          company = { ...company, dirigeant };
        }
      }
    } catch { /* silencieux — le rapport reste valide sans dirigeant */ }
  }

  // Benchmark sectoriel
  const { benchmark } = getBenchmarkByNaf(company?.naf_code);

  // Construire les sections calculées
  const chargesDetaillees = buildChargesDetaillees(aggregates);
  const equilibreFinancier = buildEquilibreFinancier(dashboard.kpis, bilan, sig, aggregates);
  const ratios = buildRatios(dashboard.kpis, bilan, sig, benchmark);
  const pointsDiscussion = buildPointsDiscussion(dashboard.kpis, ratios, chargesDetaillees, bilan, sig, benchmark, equilibreFinancier);

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
      dirigeant: company?.dirigeant || undefined,
    },
    kpis: dashboard.kpis,
    revenueMonthly: dashboard.revenueMonthly,
    revenueMonthlyN1,
    tresorerieMensuelle,
    equilibreFinancier,
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

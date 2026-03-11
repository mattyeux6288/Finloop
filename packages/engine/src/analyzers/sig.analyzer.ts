import type { CompteAggregate, Sig, SigLevel, SigCompteDetail, AccountOverride } from '@finthesis/shared';
import {
  SIG_FORMULAS,
  SIG_COMPUTATION_ORDER,
  SIG_DEPENDENCIES,
  compteStartsWith,
} from '@finthesis/shared';

/**
 * Calcule les Soldes Intermédiaires de Gestion (SIG)
 *
 * Logique :
 * - Pour les comptes 7x (produits), le montant = totalCredit - totalDebit
 * - Pour les comptes 6x (charges), le montant = totalDebit - totalCredit
 * - Le sign dans la formule indique si on ajoute (+1) ou soustrait (-1)
 * - Les overrides permettent de reclasser un compte individuel dans un autre palier SIG
 */
export function computeSig(
  aggregates: CompteAggregate[],
  overrides?: AccountOverride[],
): Sig {
  const results: Record<string, SigLevel> = {};

  // Construire le set des comptes overridés pour les exclure du matching standard
  const sigOverrides = (overrides || []).filter(o => o.target.type === 'sig');
  const excludedComptes = new Set(sigOverrides.map(o => o.compteNum));

  for (const levelKey of SIG_COMPUTATION_ORDER) {
    const formula = SIG_FORMULAS[levelKey];
    const details: SigLevel['details'] = [];
    let montant = 0;

    // Ajouter les dépendances (niveaux précédents) — pas de comptes individuels ici
    const dependencies = SIG_DEPENDENCIES[levelKey] || [];
    for (const dep of dependencies) {
      if (results[dep]) {
        montant += results[dep].montant;
        details.push({
          label: results[dep].label,
          montant: results[dep].montant,
        });
      }
    }

    // Calculer les items de la formule
    for (let itemIdx = 0; itemIdx < formula.items.length; itemIdx++) {
      const item = formula.items[itemIdx];
      const { total: itemMontant, comptes } = computeFormulaItemWithComptes(
        aggregates, item.compteRacines, excludedComptes,
      );

      // Collecter les overrides ciblant cet item précis
      const itemOverrides = sigOverrides.filter(
        o => o.target.sigStep === levelKey && (o.target.sigItemIndex ?? 0) === itemIdx,
      );

      // Calculer les montants des comptes overridés
      let overrideMontant = 0;
      const overrideComptes: SigCompteDetail[] = [];
      for (const ov of itemOverrides) {
        const agg = aggregates.find(a => a.compteNum === ov.compteNum);
        if (!agg) continue;

        let m: number;
        if (agg.compteClasse === 7) m = agg.totalCredit - agg.totalDebit;
        else if (agg.compteClasse === 6) m = agg.totalDebit - agg.totalCredit;
        else m = agg.totalDebit - agg.totalCredit;

        if (m !== 0) {
          overrideMontant += m;
          overrideComptes.push({
            compteNum: agg.compteNum,
            compteLib: agg.compteLib,
            montant: round(m * item.sign),
          });
        }
      }

      const totalItemMontant = itemMontant + overrideMontant;
      const signedMontant = totalItemMontant * item.sign;

      // Extraire les 2 premiers chiffres de chaque racine, dédupliquer
      const racines2 = [...new Set(item.compteRacines.map(r => r.substring(0, 2)))].join('/');

      details.push({
        label: item.label,
        montant: round(signedMontant),
        compteRacines: racines2,
        comptes: [
          ...comptes.map(c => ({ ...c, montant: round(c.montant * item.sign) })),
          ...overrideComptes,
        ]
          .filter(c => c.montant !== 0)
          .sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant)),
      });

      montant += signedMontant;
    }

    results[levelKey] = {
      label: formula.label,
      montant: round(montant),
      details,
    };
  }

  return {
    margeCommerciale: results['margeCommerciale'],
    productionExercice: results['productionExercice'],
    valeurAjoutee: results['valeurAjoutee'],
    ebe: results['ebe'],
    resultatExploitation: results['resultatExploitation'],
    rcai: results['rcai'],
    resultatExceptionnel: results['resultatExceptionnel'],
    resultatNet: results['resultatNet'],
    plusMoinsValuesCessions: results['plusMoinsValuesCessions'],
  };
}

/**
 * Calcule le montant d'un item de formule SIG et retourne les comptes individuels.
 * Pour les comptes 7x : solde créditeur (positif = produit)
 * Pour les comptes 6x : solde débiteur (positif = charge)
 */
function computeFormulaItemWithComptes(
  aggregates: CompteAggregate[],
  compteRacines: string[],
  excludedComptes?: Set<string>,
): { total: number; comptes: SigCompteDetail[] } {
  let total = 0;
  const comptes: SigCompteDetail[] = [];

  for (const agg of aggregates) {
    // Skip les comptes overridés — ils seront injectés dans leur cible
    if (excludedComptes?.has(agg.compteNum)) continue;
    if (!compteStartsWith(agg.compteNum, compteRacines)) continue;

    let montant: number;
    if (agg.compteClasse === 7) {
      montant = agg.totalCredit - agg.totalDebit;
    } else if (agg.compteClasse === 6) {
      montant = agg.totalDebit - agg.totalCredit;
    } else {
      montant = agg.totalDebit - agg.totalCredit;
    }

    total += montant;
    if (montant !== 0) {
      comptes.push({
        compteNum: agg.compteNum,
        compteLib: agg.compteLib,
        montant: round(montant),
      });
    }
  }

  return { total, comptes };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

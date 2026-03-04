import type { CompteAggregate, CompteDeResultat, ResultatSection, ResultatItem } from '@finthesis/shared';
import { PCG_MAIN_ACCOUNTS, compteStartsWith } from '@finthesis/shared';

/**
 * Construit le Compte de Résultat à partir des agrégations de comptes
 *
 * Logique comptable :
 * - Comptes 7x (produits) : le montant est le total crédit - total débit (solde créditeur)
 * - Comptes 6x (charges) : le montant est le total débit - total crédit (solde débiteur)
 */
export function computeCompteDeResultat(aggregates: CompteAggregate[]): CompteDeResultat {
  // Séparer charges et produits
  const charges = aggregates.filter((a) => a.compteClasse === 6);
  const produits = aggregates.filter((a) => a.compteClasse === 7);

  // Produits d'exploitation (70-75, 78, 79)
  const produitsExploitation = buildSection(
    'Produits d\'exploitation',
    produits,
    ['70', '71', '72', '74', '75', '78', '79'],
    'credit',
  );

  // Charges d'exploitation (60-65, 68)
  const chargesExploitation = buildSection(
    'Charges d\'exploitation',
    charges,
    ['60', '61', '62', '63', '64', '65', '68'],
    'debit',
  );

  const resultatExploitation = round(produitsExploitation.total - chargesExploitation.total);

  // Produits financiers (76)
  const produitsFinanciers = buildSection(
    'Produits financiers',
    produits,
    ['76'],
    'credit',
  );

  // Charges financières (66)
  const chargesFinancieres = buildSection(
    'Charges financières',
    charges,
    ['66'],
    'debit',
  );

  const resultatFinancier = round(produitsFinanciers.total - chargesFinancieres.total);

  // Produits exceptionnels (77)
  const produitsExceptionnels = buildSection(
    'Produits exceptionnels',
    produits,
    ['77'],
    'credit',
  );

  // Charges exceptionnelles (67)
  const chargesExceptionnelles = buildSection(
    'Charges exceptionnelles',
    charges,
    ['67'],
    'debit',
  );

  const resultatExceptionnel = round(produitsExceptionnels.total - chargesExceptionnelles.total);

  // Impôts (69)
  const impotsAggs = charges.filter((a) => compteStartsWith(a.compteNum, ['69']));
  const impots = round(impotsAggs.reduce((sum, a) => sum + a.totalDebit - a.totalCredit, 0));

  const resultatNet = round(resultatExploitation + resultatFinancier + resultatExceptionnel - impots);

  return {
    produitsExploitation,
    chargesExploitation,
    resultatExploitation,
    produitsFinanciers,
    chargesFinancieres,
    resultatFinancier,
    produitsExceptionnels,
    chargesExceptionnelles,
    resultatExceptionnel,
    impots,
    resultatNet,
  };
}

function buildSection(
  label: string,
  aggregates: CompteAggregate[],
  racines: string[],
  nature: 'debit' | 'credit',
): ResultatSection {
  const items: ResultatItem[] = [];
  let total = 0;

  for (const racine of racines) {
    const matching = aggregates.filter((a) => compteStartsWith(a.compteNum, [racine]));
    if (matching.length === 0) continue;

    const montant = matching.reduce((sum, a) => {
      return sum + (nature === 'debit' ? a.totalDebit - a.totalCredit : a.totalCredit - a.totalDebit);
    }, 0);

    items.push({
      compteRacine: racine,
      label: PCG_MAIN_ACCOUNTS[racine.substring(0, 2)] || `Compte ${racine}`,
      montant: round(montant),
    });
    total += montant;
  }

  return { label, items, total: round(total) };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

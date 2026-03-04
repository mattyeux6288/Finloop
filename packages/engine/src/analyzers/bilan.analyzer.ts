import type { CompteAggregate, Bilan, BilanSection, BilanItem } from '@finthesis/shared';
import { BILAN_MAPPING, PCG_MAIN_ACCOUNTS, compteStartsWith } from '@finthesis/shared';

/**
 * Construit un Bilan simplifié à partir des agrégations de comptes
 */
export function computeBilan(aggregates: CompteAggregate[]): Bilan {
  const buildSection = (
    label: string,
    racines: readonly string[],
    amortRacines: readonly string[] = [],
  ): BilanSection => {
    const items: BilanItem[] = [];
    let total = 0;

    for (const racine of racines) {
      const matching = aggregates.filter((a) => a.compteRacine.startsWith(racine));
      if (matching.length === 0) continue;

      const montantBrut = matching.reduce((sum, a) => sum + Math.abs(a.solde), 0);
      const libelle = PCG_MAIN_ACCOUNTS[racine] || `Compte ${racine}`;

      items.push({
        compteRacine: racine,
        label: libelle,
        montant: montantBrut,
      });
      total += montantBrut;
    }

    // Soustraire les amortissements/dépréciations
    if (amortRacines.length > 0) {
      let totalAmort = 0;
      for (const racine of amortRacines) {
        const matching = aggregates.filter((a) => a.compteRacine.startsWith(racine));
        const montant = matching.reduce((sum, a) => sum + Math.abs(a.solde), 0);
        totalAmort += montant;
      }
      if (totalAmort > 0) {
        items.push({
          compteRacine: amortRacines[0],
          label: 'Amortissements et dépréciations',
          montant: -totalAmort,
        });
        total -= totalAmort;
      }
    }

    return { label, items, total: Math.round(total * 100) / 100 };
  };

  // ACTIF
  const immobilisations = buildSection(
    'Immobilisations',
    BILAN_MAPPING.actif.immobilisations,
    BILAN_MAPPING.actif.amortissementsImmobilisations,
  );

  const stocks = buildSection(
    'Stocks et en-cours',
    BILAN_MAPPING.actif.stocks,
    BILAN_MAPPING.actif.depreciationsStocks,
  );

  // Créances : uniquement les comptes 41x (clients) et débiteurs divers
  const creancesAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['41', '46']) && a.solde > 0,
  );
  const creances: BilanSection = {
    label: 'Créances',
    items: buildItemsFromAggregates(creancesAggregates),
    total: Math.round(creancesAggregates.reduce((sum, a) => sum + a.solde, 0) * 100) / 100,
  };

  // Trésorerie actif : comptes 51x, 53x avec solde débiteur
  const tresorerieActifAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['50', '51', '53', '54']) && a.solde > 0,
  );
  const tresorerieActif: BilanSection = {
    label: 'Disponibilités',
    items: buildItemsFromAggregates(tresorerieActifAggregates),
    total: Math.round(tresorerieActifAggregates.reduce((sum, a) => sum + a.solde, 0) * 100) / 100,
  };

  const totalActif = immobilisations.total + stocks.total + creances.total + tresorerieActif.total;

  // PASSIF
  const capitauxPropres = buildSection(
    'Capitaux propres',
    BILAN_MAPPING.passif.capitauxPropres,
  );

  // Ajouter les provisions
  const provisions = buildSection('Provisions', BILAN_MAPPING.passif.provisions);
  capitauxPropres.total += provisions.total;
  capitauxPropres.items.push(...provisions.items);

  const dettesFinancieres = buildSection(
    'Dettes financières',
    BILAN_MAPPING.passif.dettesFinancieres,
  );

  // Dettes fournisseurs : comptes 40x
  const dettesFournisseursAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['40']) && a.solde > 0,
  );
  const dettesFournisseurs: BilanSection = {
    label: 'Dettes fournisseurs',
    items: buildItemsFromAggregates(dettesFournisseursAggregates),
    total: Math.round(
      dettesFournisseursAggregates.reduce((sum, a) => sum + a.solde, 0) * 100,
    ) / 100,
  };

  // Dettes fiscales et sociales
  const dettesFiscalesAggregates = aggregates.filter(
    (a) => compteStartsWith(a.compteNum, ['42', '43', '44']) && a.solde > 0,
  );
  const dettesFiscales: BilanSection = {
    label: 'Dettes fiscales et sociales',
    items: buildItemsFromAggregates(dettesFiscalesAggregates),
    total: Math.round(
      dettesFiscalesAggregates.reduce((sum, a) => sum + a.solde, 0) * 100,
    ) / 100,
  };

  const totalPassif =
    capitauxPropres.total +
    dettesFinancieres.total +
    dettesFournisseurs.total +
    dettesFiscales.total;

  return {
    actif: {
      immobilisations,
      stocks,
      creances,
      tresorerie: tresorerieActif,
      totalActif: Math.round(totalActif * 100) / 100,
    },
    passif: {
      capitauxPropres,
      dettesFinancieres,
      dettesFournisseurs,
      dettesFiscales,
      totalPassif: Math.round(totalPassif * 100) / 100,
    },
  };
}

function buildItemsFromAggregates(aggregates: CompteAggregate[]): BilanItem[] {
  const byRacine = new Map<string, { label: string; montant: number }>();

  for (const agg of aggregates) {
    const racine = agg.compteRacine;
    const existing = byRacine.get(racine);
    if (existing) {
      existing.montant += Math.abs(agg.solde);
    } else {
      byRacine.set(racine, {
        label: PCG_MAIN_ACCOUNTS[agg.compteRacine.substring(0, 2)] || agg.compteLib,
        montant: Math.abs(agg.solde),
      });
    }
  }

  return Array.from(byRacine.entries()).map(([racine, data]) => ({
    compteRacine: racine,
    label: data.label,
    montant: Math.round(data.montant * 100) / 100,
  }));
}

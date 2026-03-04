import type { CompteClasse } from '../types';

/**
 * Plan Comptable Général - Classes et comptes principaux
 */

export const PCG_CLASSES: Record<CompteClasse, string> = {
  1: 'Comptes de capitaux',
  2: 'Comptes d\'immobilisations',
  3: 'Comptes de stocks et en-cours',
  4: 'Comptes de tiers',
  5: 'Comptes financiers',
  6: 'Comptes de charges',
  7: 'Comptes de produits',
};

/** Comptes principaux du PCG (racines à 2 chiffres) */
export const PCG_MAIN_ACCOUNTS: Record<string, string> = {
  // Classe 1 - Capitaux
  '10': 'Capital et réserves',
  '11': 'Report à nouveau',
  '12': 'Résultat de l\'exercice',
  '13': 'Subventions d\'investissement',
  '14': 'Provisions réglementées',
  '15': 'Provisions pour risques et charges',
  '16': 'Emprunts et dettes assimilées',
  '17': 'Dettes rattachées à des participations',
  '18': 'Comptes de liaison',
  // Classe 2 - Immobilisations
  '20': 'Immobilisations incorporelles',
  '21': 'Immobilisations corporelles',
  '22': 'Immobilisations mises en concession',
  '23': 'Immobilisations en cours',
  '26': 'Participations',
  '27': 'Autres immobilisations financières',
  '28': 'Amortissements des immobilisations',
  '29': 'Dépréciations des immobilisations',
  // Classe 3 - Stocks
  '31': 'Matières premières',
  '32': 'Autres approvisionnements',
  '33': 'En-cours de production de biens',
  '34': 'En-cours de production de services',
  '35': 'Stocks de produits',
  '37': 'Stocks de marchandises',
  '39': 'Dépréciations des stocks',
  // Classe 4 - Tiers
  '40': 'Fournisseurs et comptes rattachés',
  '41': 'Clients et comptes rattachés',
  '42': 'Personnel et comptes rattachés',
  '43': 'Sécurité sociale et organismes sociaux',
  '44': 'État et autres collectivités publiques',
  '45': 'Groupe et associés',
  '46': 'Débiteurs et créditeurs divers',
  '47': 'Comptes transitoires ou d\'attente',
  '48': 'Comptes de régularisation',
  '49': 'Dépréciations des comptes de tiers',
  // Classe 5 - Financiers
  '50': 'Valeurs mobilières de placement',
  '51': 'Banques, établissements financiers',
  '53': 'Caisse',
  '54': 'Régies d\'avances et accréditifs',
  '58': 'Virements internes',
  '59': 'Dépréciations des comptes financiers',
  // Classe 6 - Charges
  '60': 'Achats',
  '61': 'Services extérieurs',
  '62': 'Autres services extérieurs',
  '63': 'Impôts, taxes et versements assimilés',
  '64': 'Charges de personnel',
  '65': 'Autres charges de gestion courante',
  '66': 'Charges financières',
  '67': 'Charges exceptionnelles',
  '68': 'Dotations aux amortissements et provisions',
  '69': 'Participation, impôts sur les bénéfices',
  // Classe 7 - Produits
  '70': 'Ventes de produits, prestations de services, marchandises',
  '71': 'Production stockée',
  '72': 'Production immobilisée',
  '74': 'Subventions d\'exploitation',
  '75': 'Autres produits de gestion courante',
  '76': 'Produits financiers',
  '77': 'Produits exceptionnels',
  '78': 'Reprises sur amortissements et provisions',
  '79': 'Transferts de charges',
};

/** Mapping Bilan : quels comptes vont à l'actif, au passif */
export const BILAN_MAPPING = {
  actif: {
    immobilisations: ['20', '21', '22', '23', '26', '27'], // moins amortissements 28, 29
    amortissementsImmobilisations: ['28', '29'],
    stocks: ['31', '32', '33', '34', '35', '37'], // moins dépréciations 39
    depreciationsStocks: ['39'],
    creances: ['41', '46'], // clients + divers débiteurs, moins dépréciations 49
    depreciationsCreances: ['49'],
    tresorerie: ['50', '51', '53', '54'], // moins dépréciations 59
    depreciationsTresorerie: ['59'],
    regularisation: ['48'], // charges constatées d'avance (486)
  },
  passif: {
    capitauxPropres: ['10', '11', '12', '13', '14'],
    provisions: ['15'],
    dettesFinancieres: ['16', '17'],
    dettesFournisseurs: ['40'],
    dettesFiscalesSociales: ['42', '43', '44'],
    autresDettes: ['45', '46', '47'],
    regularisation: ['48'], // produits constatés d'avance (487)
  },
} as const;

/** Comptes de charges d'exploitation */
export const CHARGES_EXPLOITATION = ['60', '61', '62', '63', '64', '65', '68'];
/** Comptes de produits d'exploitation */
export const PRODUITS_EXPLOITATION = ['70', '71', '72', '74', '75', '78', '79'];

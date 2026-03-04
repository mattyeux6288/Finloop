/**
 * Configuration des Soldes Intermédiaires de Gestion (SIG)
 * Définit quels comptes alimentent chaque niveau du SIG
 */

export interface SigFormulaItem {
  label: string;
  compteRacines: string[]; // Racines de comptes (ex: '707', '60')
  sign: 1 | -1; // +1 = ajouté, -1 = soustrait
}

export interface SigFormula {
  label: string;
  items: SigFormulaItem[];
}

/**
 * Formules SIG - chaque niveau est calculé séquentiellement.
 * Les montants des comptes de classe 7 sont en crédit (positif),
 * les comptes de classe 6 sont en débit (positif).
 */
export const SIG_FORMULAS: Record<string, SigFormula> = {
  margeCommerciale: {
    label: 'Marge commerciale',
    items: [
      { label: 'Ventes de marchandises', compteRacines: ['707'], sign: 1 },
      { label: 'Coût d\'achat des marchandises vendues', compteRacines: ['607'], sign: -1 },
      { label: 'Variation de stock de marchandises', compteRacines: ['6037'], sign: -1 },
    ],
  },
  productionExercice: {
    label: 'Production de l\'exercice',
    items: [
      { label: 'Production vendue (biens et services)', compteRacines: ['701', '702', '703', '704', '705', '706', '708', '709'], sign: 1 },
      { label: 'Production stockée', compteRacines: ['71'], sign: 1 },
      { label: 'Production immobilisée', compteRacines: ['72'], sign: 1 },
    ],
  },
  valeurAjoutee: {
    label: 'Valeur ajoutée',
    items: [
      // Marge commerciale + Production de l'exercice sont ajoutées automatiquement
      { label: 'Consommation en provenance de tiers', compteRacines: ['601', '602', '604', '605', '606', '6031', '6032'], sign: -1 },
      { label: 'Services extérieurs', compteRacines: ['61', '62'], sign: -1 },
    ],
  },
  ebe: {
    label: 'Excédent brut d\'exploitation (EBE)',
    items: [
      // Valeur ajoutée est ajoutée automatiquement
      { label: 'Subventions d\'exploitation', compteRacines: ['74'], sign: 1 },
      { label: 'Impôts, taxes et versements assimilés', compteRacines: ['63'], sign: -1 },
      { label: 'Charges de personnel', compteRacines: ['64'], sign: -1 },
    ],
  },
  resultatExploitation: {
    label: 'Résultat d\'exploitation',
    items: [
      // EBE est ajouté automatiquement
      { label: 'Reprises sur provisions d\'exploitation', compteRacines: ['781'], sign: 1 },
      { label: 'Transferts de charges d\'exploitation', compteRacines: ['791'], sign: 1 },
      { label: 'Autres produits de gestion courante', compteRacines: ['75'], sign: 1 },
      { label: 'Dotations aux amortissements et provisions d\'exploitation', compteRacines: ['681'], sign: -1 },
      { label: 'Autres charges de gestion courante', compteRacines: ['65'], sign: -1 },
    ],
  },
  rcai: {
    label: 'Résultat courant avant impôts (RCAI)',
    items: [
      // Résultat d'exploitation est ajouté automatiquement
      { label: 'Produits financiers', compteRacines: ['76'], sign: 1 },
      { label: 'Charges financières', compteRacines: ['66'], sign: -1 },
    ],
  },
  resultatExceptionnel: {
    label: 'Résultat exceptionnel',
    items: [
      { label: 'Produits exceptionnels', compteRacines: ['77'], sign: 1 },
      { label: 'Charges exceptionnelles', compteRacines: ['67'], sign: -1 },
    ],
  },
  resultatNet: {
    label: 'Résultat de l\'exercice',
    items: [
      // RCAI + Résultat exceptionnel sont ajoutés automatiquement
      { label: 'Participation des salariés', compteRacines: ['691'], sign: -1 },
      { label: 'Impôt sur les bénéfices', compteRacines: ['695'], sign: -1 },
    ],
  },
  plusMoinsValuesCessions: {
    label: 'Plus ou moins-values de cession',
    items: [
      { label: 'Produits des cessions d\'éléments d\'actif', compteRacines: ['775'], sign: 1 },
      { label: 'Valeur comptable des éléments cédés', compteRacines: ['675'], sign: -1 },
    ],
  },
};

/** Ordre de calcul des SIG (chaque niveau dépend du précédent) */
export const SIG_COMPUTATION_ORDER = [
  'margeCommerciale',
  'productionExercice',
  'valeurAjoutee',
  'ebe',
  'resultatExploitation',
  'rcai',
  'resultatExceptionnel',
  'resultatNet',
  'plusMoinsValuesCessions',
] as const;

/** Dépendances : le calcul de valeur ajoutée utilise MC + Production, etc. */
export const SIG_DEPENDENCIES: Record<string, string[]> = {
  margeCommerciale: [],
  productionExercice: [],
  valeurAjoutee: ['margeCommerciale', 'productionExercice'],
  ebe: ['valeurAjoutee'],
  resultatExploitation: ['ebe'],
  rcai: ['resultatExploitation'],
  resultatExceptionnel: [],
  resultatNet: ['rcai', 'resultatExceptionnel'],
  plusMoinsValuesCessions: [],
};

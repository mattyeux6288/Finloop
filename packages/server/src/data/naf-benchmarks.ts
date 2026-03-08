/**
 * Référentiel des ratios financiers moyens par code NAF (INSEE/APE).
 * Sources : Banque de France (ratios PME), BPI France, CMA France, Xerfi.
 * Valeurs indicatives — exercices 2021-2023, PME < 10M€ CA.
 */

export interface SecteurBenchmark {
  libelle: string;
  ratios: {
    tauxMargeBrute: number;       // % (CA - achats) / CA
    rentabiliteNette: number;     // % résultat net / CA
    autonomieFinanciere: number;  // % capitaux propres / total passif
    endettement: number;          // % dettes financières / capitaux propres
    bfrJours: number;             // jours de CA
    delaiClient: number;          // jours
    delaiFournisseur: number;     // jours
    tauxVA: number;               // % valeur ajoutée / CA
    tauxEBE: number;              // % EBE / CA
  };
}

export const NAF_BENCHMARKS: Record<string, SecteurBenchmark> = {
  // ── INFORMATIQUE & CONSEIL ──
  '6201Z': {
    libelle: 'Programmation informatique',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 9, autonomieFinanciere: 42, endettement: 28, bfrJours: 45, delaiClient: 45, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 13 },
  },
  '6202A': {
    libelle: 'Conseil en systèmes informatiques',
    ratios: { tauxMargeBrute: 63, rentabiliteNette: 8, autonomieFinanciere: 40, endettement: 32, bfrJours: 50, delaiClient: 45, delaiFournisseur: 30, tauxVA: 67, tauxEBE: 12 },
  },
  '6209Z': {
    libelle: 'Autres activités informatiques',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 7, autonomieFinanciere: 38, endettement: 35, bfrJours: 48, delaiClient: 45, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 11 },
  },
  '6311Z': {
    libelle: 'Traitement de données, hébergement',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 8, autonomieFinanciere: 35, endettement: 45, bfrJours: 40, delaiClient: 30, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 14 },
  },

  // ── CONSEIL & MANAGEMENT ──
  '7022Z': {
    libelle: 'Conseil pour les affaires et la gestion',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 11, autonomieFinanciere: 50, endettement: 22, bfrJours: 28, delaiClient: 30, delaiFournisseur: 30, tauxVA: 75, tauxEBE: 16 },
  },
  '7021Z': {
    libelle: 'Conseil en relations publiques et communication',
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 9, autonomieFinanciere: 42, endettement: 30, bfrJours: 35, delaiClient: 30, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 14 },
  },
  '7311Z': {
    libelle: 'Activités des agences de publicité',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 50, bfrJours: 40, delaiClient: 45, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 9 },
  },

  // ── PROFESSIONS LIBÉRALES RÉGLEMENTÉES ──
  '6910Z': {
    libelle: 'Activités juridiques (avocats, notaires)',
    ratios: { tauxMargeBrute: 78, rentabiliteNette: 14, autonomieFinanciere: 55, endettement: 18, bfrJours: 22, delaiClient: 30, delaiFournisseur: 30, tauxVA: 80, tauxEBE: 20 },
  },
  '6920Z': {
    libelle: 'Activités comptables (experts-comptables)',
    ratios: { tauxMargeBrute: 74, rentabiliteNette: 12, autonomieFinanciere: 52, endettement: 20, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 77, tauxEBE: 18 },
  },
  '7111Z': {
    libelle: "Activités d'architecture",
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 10, autonomieFinanciere: 45, endettement: 25, bfrJours: 40, delaiClient: 45, delaiFournisseur: 30, tauxVA: 73, tauxEBE: 14 },
  },
  '8621Z': {
    libelle: 'Médecins généralistes en libéral',
    ratios: { tauxMargeBrute: 90, rentabiliteNette: 27, autonomieFinanciere: 62, endettement: 14, bfrJours: 12, delaiClient: 15, delaiFournisseur: 30, tauxVA: 88, tauxEBE: 32 },
  },
  '8622A': {
    libelle: 'Chirurgiens-dentistes en libéral',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 20, autonomieFinanciere: 50, endettement: 35, bfrJours: 15, delaiClient: 10, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 25 },
  },
  '8690A': {
    libelle: 'Auxiliaires médicaux en libéral',
    ratios: { tauxMargeBrute: 88, rentabiliteNette: 22, autonomieFinanciere: 58, endettement: 18, bfrJours: 15, delaiClient: 15, delaiFournisseur: 30, tauxVA: 85, tauxEBE: 28 },
  },

  // ── IMMOBILIER ──
  '6820A': {
    libelle: 'Location de logements',
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 10, autonomieFinanciere: 18, endettement: 180, bfrJours: -30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 45 },
  },
  '6820B': {
    libelle: 'Location de terrains et autres biens immobiliers',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 9, autonomieFinanciere: 20, endettement: 160, bfrJours: -20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 64, tauxEBE: 40 },
  },
  '6831Z': {
    libelle: 'Agences immobilières',
    ratios: { tauxMargeBrute: 80, rentabiliteNette: 8, autonomieFinanciere: 35, endettement: 40, bfrJours: 20, delaiClient: 15, delaiFournisseur: 30, tauxVA: 82, tauxEBE: 12 },
  },

  // ── CONSTRUCTION / BTP ──
  '4120A': {
    libelle: 'Construction de maisons individuelles',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 4, autonomieFinanciere: 22, endettement: 80, bfrJours: 65, delaiClient: 45, delaiFournisseur: 45, tauxVA: 32, tauxEBE: 7 },
  },
  '4120B': {
    libelle: "Construction d'autres bâtiments",
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 75, bfrJours: 60, delaiClient: 45, delaiFournisseur: 45, tauxVA: 35, tauxEBE: 7 },
  },
  '4321A': {
    libelle: "Travaux d'installation électrique",
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: 52, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 9 },
  },
  '4322A': {
    libelle: "Travaux d'installation d'eau et de gaz",
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 65, bfrJours: 55, delaiClient: 45, delaiFournisseur: 45, tauxVA: 46, tauxEBE: 8 },
  },
  '4331Z': {
    libelle: 'Travaux de plâtrerie',
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 58, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 50, tauxEBE: 9 },
  },
  '4339Z': {
    libelle: 'Autres travaux de finition',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 62, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 8 },
  },
  '4391A': {
    libelle: 'Travaux de charpente',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 4, autonomieFinanciere: 27, endettement: 68, bfrJours: 55, delaiClient: 45, delaiFournisseur: 45, tauxVA: 46, tauxEBE: 8 },
  },
  '4399C': {
    libelle: 'Travaux de maçonnerie générale',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 72, bfrJours: 58, delaiClient: 45, delaiFournisseur: 45, tauxVA: 42, tauxEBE: 7 },
  },

  // ── COMMERCE ──
  '4711F': {
    libelle: 'Supermarchés et grandes surfaces alimentaires',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 2, autonomieFinanciere: 18, endettement: 85, bfrJours: -12, delaiClient: 5, delaiFournisseur: 48, tauxVA: 24, tauxEBE: 4 },
  },
  '4711B': {
    libelle: "Commerce d'alimentation générale",
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 24, endettement: 70, bfrJours: 0, delaiClient: 5, delaiFournisseur: 45, tauxVA: 30, tauxEBE: 5 },
  },
  '4741Z': {
    libelle: "Commerce d'appareils électroménagers",
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 75, bfrJours: 30, delaiClient: 10, delaiFournisseur: 45, tauxVA: 35, tauxEBE: 5 },
  },
  '4759A': {
    libelle: 'Commerce de meubles',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 68, bfrJours: 35, delaiClient: 15, delaiFournisseur: 45, tauxVA: 42, tauxEBE: 6 },
  },
  '4771Z': {
    libelle: 'Commerce de vêtements',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 4, autonomieFinanciere: 20, endettement: 90, bfrJours: 60, delaiClient: 10, delaiFournisseur: 60, tauxVA: 55, tauxEBE: 7 },
  },

  // ── RESTAURATION / HÔTELLERIE ──
  '5610A': {
    libelle: 'Restauration traditionnelle',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 4, autonomieFinanciere: 18, endettement: 105, bfrJours: -18, delaiClient: 3, delaiFournisseur: 30, tauxVA: 54, tauxEBE: 8 },
  },
  '5610C': {
    libelle: 'Restauration rapide',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 5, autonomieFinanciere: 22, endettement: 95, bfrJours: -20, delaiClient: 1, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 10 },
  },
  '5630Z': {
    libelle: 'Débits de boissons',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 5, autonomieFinanciere: 20, endettement: 100, bfrJours: -15, delaiClient: 2, delaiFournisseur: 30, tauxVA: 50, tauxEBE: 9 },
  },
  '5510Z': {
    libelle: 'Hôtels et hébergement similaire',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 5, autonomieFinanciere: 15, endettement: 130, bfrJours: -25, delaiClient: 10, delaiFournisseur: 30, tauxVA: 48, tauxEBE: 12 },
  },

  // ── TRANSPORT ──
  '4941A': {
    libelle: 'Transports routiers de fret',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 95, bfrJours: 42, delaiClient: 45, delaiFournisseur: 30, tauxVA: 44, tauxEBE: 8 },
  },
  '4939A': {
    libelle: 'Transports routiers de voyageurs',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 3, autonomieFinanciere: 18, endettement: 110, bfrJours: 20, delaiClient: 20, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 9 },
  },

  // ── INDUSTRIE / FABRICATION ──
  '2560A': {
    libelle: 'Décolletage et mécanique de précision',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 65, bfrJours: 72, delaiClient: 60, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 10 },
  },
  '2572Z': {
    libelle: "Fabrication d'outillage",
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 6, autonomieFinanciere: 38, endettement: 58, bfrJours: 65, delaiClient: 60, delaiFournisseur: 45, tauxVA: 58, tauxEBE: 11 },
  },
  '1071A': {
    libelle: 'Fabrication industrielle de pain',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 80, bfrJours: 10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 8 },
  },

  // ── SERVICES À LA PERSONNE / ENTRETIEN ──
  '9601A': {
    libelle: 'Blanchisserie-teinturerie',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 62, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 10 },
  },
  '9602A': {
    libelle: 'Coiffure',
    ratios: { tauxMargeBrute: 78, rentabiliteNette: 8, autonomieFinanciere: 30, endettement: 55, bfrJours: 0, delaiClient: 1, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 12 },
  },
  '8110Z': {
    libelle: "Services généraux de gestion d'immeubles",
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 65, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 9 },
  },
  '8121Z': {
    libelle: 'Nettoyage courant de bâtiments',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 80, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 5 },
  },

  // ── FORMATION & ÉDUCATION ──
  '8559A': {
    libelle: "Formation continue d'adultes",
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 8, autonomieFinanciere: 40, endettement: 30, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 12 },
  },

  // ── AUTOMOBILE ──
  '4511Z': {
    libelle: 'Commerce de voitures et véhicules légers',
    ratios: { tauxMargeBrute: 15, rentabiliteNette: 2, autonomieFinanciere: 18, endettement: 110, bfrJours: 30, delaiClient: 15, delaiFournisseur: 30, tauxVA: 22, tauxEBE: 4 },
  },
  '4520A': {
    libelle: 'Entretien et réparation de véhicules',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 55, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 9 },
  },
};

/**
 * Benchmark par défaut — moyennes inter-sectorielles PME France (Banque de France 2022)
 */
export const DEFAULT_BENCHMARK: SecteurBenchmark = {
  libelle: 'Moyenne PME France (tous secteurs)',
  ratios: {
    tauxMargeBrute: 28,
    rentabiliteNette: 5,
    autonomieFinanciere: 28,
    endettement: 95,
    bfrJours: 55,
    delaiClient: 45,
    delaiFournisseur: 45,
    tauxVA: 38,
    tauxEBE: 9,
  },
};

/**
 * Retourne le benchmark correspondant au code NAF.
 * Essaie la correspondance exacte, puis par préfixe (2 chiffres).
 */
export function getBenchmarkByNaf(nafCode: string | null | undefined): {
  benchmark: SecteurBenchmark;
  isDefault: boolean;
} {
  if (!nafCode) return { benchmark: DEFAULT_BENCHMARK, isDefault: true };

  // Correspondance exacte
  if (NAF_BENCHMARKS[nafCode]) {
    return { benchmark: NAF_BENCHMARKS[nafCode], isDefault: false };
  }

  // Correspondance par sous-classe (4 chiffres sans lettre)
  const subClass = nafCode.substring(0, 4);
  const subMatch = Object.entries(NAF_BENCHMARKS).find(([code]) => code.startsWith(subClass));
  if (subMatch) return { benchmark: subMatch[1], isDefault: false };

  // Correspondance par division (2 premiers chiffres)
  const division = nafCode.substring(0, 2);
  const divMatch = Object.entries(NAF_BENCHMARKS).find(([code]) => code.startsWith(division));
  if (divMatch) return { benchmark: divMatch[1], isDefault: false };

  return { benchmark: DEFAULT_BENCHMARK, isDefault: true };
}

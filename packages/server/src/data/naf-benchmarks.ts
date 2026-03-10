/**
 * Référentiel des ratios financiers moyens par code NAF (INSEE/APE).
 * Sources : INSEE FARE, Banque de France FIBEN, Altares, Xerfi, CMA France.
 * Valeurs indicatives — exercices 2021-2023, PME < 10M€ CA.
 *
 * ~210 codes NAF couvrant l'ensemble des divisions de la nomenclature française.
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

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION A — AGRICULTURE, SYLVICULTURE ET PÊCHE (01-03)
  // ═══════════════════════════════════════════════════════════════════════════

  '0111Z': {
    libelle: 'Culture de céréales',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 8, autonomieFinanciere: 45, endettement: 60, bfrJours: 80, delaiClient: 30, delaiFournisseur: 45, tauxVA: 45, tauxEBE: 18 },
  },
  '0113Z': {
    libelle: 'Culture de légumes, melons, racines et tubercules',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 6, autonomieFinanciere: 40, endettement: 65, bfrJours: 50, delaiClient: 20, delaiFournisseur: 40, tauxVA: 48, tauxEBE: 14 },
  },
  '0121Z': {
    libelle: 'Culture de la vigne',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 10, autonomieFinanciere: 42, endettement: 70, bfrJours: 120, delaiClient: 45, delaiFournisseur: 45, tauxVA: 60, tauxEBE: 20 },
  },
  '0141Z': {
    libelle: 'Élevage de vaches laitières',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 4, autonomieFinanciere: 38, endettement: 80, bfrJours: 40, delaiClient: 15, delaiFournisseur: 35, tauxVA: 42, tauxEBE: 12 },
  },
  '0142Z': {
    libelle: "Élevage d'autres bovins et de buffles",
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 35, endettement: 85, bfrJours: 45, delaiClient: 20, delaiFournisseur: 35, tauxVA: 40, tauxEBE: 10 },
  },
  '0150Z': {
    libelle: 'Culture et élevage associés',
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 5, autonomieFinanciere: 40, endettement: 70, bfrJours: 60, delaiClient: 25, delaiFournisseur: 40, tauxVA: 44, tauxEBE: 14 },
  },
  '0161Z': {
    libelle: 'Activités de soutien aux cultures',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 7, autonomieFinanciere: 35, endettement: 65, bfrJours: 35, delaiClient: 30, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 12 },
  },
  '0210Z': {
    libelle: 'Sylviculture et autres activités forestières',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 8, autonomieFinanciere: 50, endettement: 45, bfrJours: 55, delaiClient: 30, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 15 },
  },
  '0311Z': {
    libelle: 'Pêche en mer',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 90, bfrJours: 20, delaiClient: 10, delaiFournisseur: 30, tauxVA: 50, tauxEBE: 12 },
  },
  '0322Z': {
    libelle: 'Aquaculture en eau douce',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 6, autonomieFinanciere: 32, endettement: 80, bfrJours: 30, delaiClient: 15, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 13 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION C — INDUSTRIE MANUFACTURIÈRE (10-33)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Industries alimentaires (10-12) ──
  '1011Z': {
    libelle: 'Transformation et conservation de viande de boucherie',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 2, autonomieFinanciere: 25, endettement: 75, bfrJours: 30, delaiClient: 25, delaiFournisseur: 35, tauxVA: 22, tauxEBE: 5 },
  },
  '1013A': {
    libelle: 'Préparation industrielle de produits à base de viande',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 3, autonomieFinanciere: 28, endettement: 70, bfrJours: 35, delaiClient: 30, delaiFournisseur: 40, tauxVA: 30, tauxEBE: 6 },
  },
  '1020Z': {
    libelle: 'Transformation et conservation de poisson',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 3, autonomieFinanciere: 26, endettement: 72, bfrJours: 32, delaiClient: 25, delaiFournisseur: 35, tauxVA: 28, tauxEBE: 6 },
  },
  '1039B': {
    libelle: 'Transformation et conservation de fruits',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 68, bfrJours: 35, delaiClient: 30, delaiFournisseur: 40, tauxVA: 34, tauxEBE: 7 },
  },
  '1051A': {
    libelle: 'Fabrication de lait liquide et de produits frais',
    ratios: { tauxMargeBrute: 20, rentabiliteNette: 3, autonomieFinanciere: 30, endettement: 65, bfrJours: 25, delaiClient: 25, delaiFournisseur: 35, tauxVA: 26, tauxEBE: 6 },
  },
  '1052Z': {
    libelle: 'Fabrication de glaces et sorbets',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 62, bfrJours: 30, delaiClient: 25, delaiFournisseur: 35, tauxVA: 42, tauxEBE: 8 },
  },
  '1071A': {
    libelle: 'Fabrication industrielle de pain',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 80, bfrJours: 10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 8 },
  },
  '1071C': {
    libelle: 'Boulangerie et boulangerie-pâtisserie',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 6, autonomieFinanciere: 25, endettement: 85, bfrJours: -5, delaiClient: 1, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 10 },
  },
  '1072Z': {
    libelle: 'Fabrication de biscuits, biscottes et pâtisseries',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 72, bfrJours: 30, delaiClient: 30, delaiFournisseur: 40, tauxVA: 40, tauxEBE: 7 },
  },
  '1101Z': {
    libelle: 'Production de boissons alcooliques distillées',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 10, autonomieFinanciere: 45, endettement: 55, bfrJours: 90, delaiClient: 40, delaiFournisseur: 40, tauxVA: 58, tauxEBE: 16 },
  },
  '1102A': {
    libelle: 'Fabrication de vins effervescents',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 9, autonomieFinanciere: 40, endettement: 65, bfrJours: 110, delaiClient: 40, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 15 },
  },
  '1102B': {
    libelle: 'Vinification',
    ratios: { tauxMargeBrute: 48, rentabiliteNette: 7, autonomieFinanciere: 38, endettement: 70, bfrJours: 100, delaiClient: 35, delaiFournisseur: 40, tauxVA: 52, tauxEBE: 14 },
  },
  '1107A': {
    libelle: 'Fabrication de boissons rafraîchissantes',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 6, autonomieFinanciere: 35, endettement: 60, bfrJours: 30, delaiClient: 30, delaiFournisseur: 40, tauxVA: 45, tauxEBE: 10 },
  },

  // ── Textile, habillement, cuir (13-15) ──
  '1320Z': {
    libelle: 'Tissage',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 4, autonomieFinanciere: 32, endettement: 65, bfrJours: 60, delaiClient: 50, delaiFournisseur: 45, tauxVA: 45, tauxEBE: 8 },
  },
  '1413Z': {
    libelle: "Fabrication de vêtements de dessus",
    ratios: { tauxMargeBrute: 48, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 72, bfrJours: 65, delaiClient: 45, delaiFournisseur: 50, tauxVA: 50, tauxEBE: 7 },
  },
  '1512Z': {
    libelle: 'Fabrication d\'articles de voyage, de maroquinerie',
    ratios: { tauxMargeBrute: 52, rentabiliteNette: 6, autonomieFinanciere: 35, endettement: 58, bfrJours: 55, delaiClient: 40, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 10 },
  },

  // ── Bois, papier, imprimerie (16-18) ──
  '1610A': {
    libelle: 'Sciage et rabotage du bois',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 4, autonomieFinanciere: 35, endettement: 62, bfrJours: 45, delaiClient: 35, delaiFournisseur: 35, tauxVA: 38, tauxEBE: 9 },
  },
  '1623Z': {
    libelle: "Fabrication de charpentes et d'autres menuiseries",
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 60, bfrJours: 50, delaiClient: 40, delaiFournisseur: 40, tauxVA: 42, tauxEBE: 9 },
  },
  '1712Z': {
    libelle: 'Fabrication de papier et de carton',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 60, bfrJours: 50, delaiClient: 40, delaiFournisseur: 40, tauxVA: 38, tauxEBE: 10 },
  },
  '1812Z': {
    libelle: 'Autre imprimerie (labeur)',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 65, bfrJours: 42, delaiClient: 40, delaiFournisseur: 40, tauxVA: 48, tauxEBE: 8 },
  },

  // ── Chimie, pharmacie, plasturgie (20-22) ──
  '2011Z': {
    libelle: 'Fabrication de gaz industriels',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 8, autonomieFinanciere: 40, endettement: 55, bfrJours: 45, delaiClient: 40, delaiFournisseur: 35, tauxVA: 50, tauxEBE: 14 },
  },
  '2042Z': {
    libelle: 'Fabrication de parfums et produits de toilette',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 8, autonomieFinanciere: 38, endettement: 58, bfrJours: 50, delaiClient: 40, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 12 },
  },
  '2110Z': {
    libelle: 'Fabrication de produits pharmaceutiques de base',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 12, autonomieFinanciere: 48, endettement: 42, bfrJours: 55, delaiClient: 45, delaiFournisseur: 45, tauxVA: 65, tauxEBE: 18 },
  },
  '2120Z': {
    libelle: 'Fabrication de préparations pharmaceutiques',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 10, autonomieFinanciere: 45, endettement: 48, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 60, tauxEBE: 15 },
  },
  '2219Z': {
    libelle: "Fabrication d'autres articles en caoutchouc",
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 60, bfrJours: 55, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 10 },
  },
  '2229A': {
    libelle: 'Fabrication de pièces techniques en matières plastiques',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 62, bfrJours: 55, delaiClient: 50, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 10 },
  },

  // ── Métallurgie (24-25) ──
  '2410Z': {
    libelle: 'Sidérurgie',
    ratios: { tauxMargeBrute: 20, rentabiliteNette: 3, autonomieFinanciere: 30, endettement: 75, bfrJours: 60, delaiClient: 50, delaiFournisseur: 45, tauxVA: 30, tauxEBE: 7 },
  },
  '2511Z': {
    libelle: 'Fabrication de structures métalliques',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 68, bfrJours: 55, delaiClient: 50, delaiFournisseur: 45, tauxVA: 45, tauxEBE: 8 },
  },
  '2550A': {
    libelle: 'Forge, estampage, matriçage',
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 60, bfrJours: 58, delaiClient: 50, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 10 },
  },
  '2560A': {
    libelle: 'Décolletage et mécanique de précision',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 65, bfrJours: 72, delaiClient: 60, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 10 },
  },
  '2572Z': {
    libelle: "Fabrication d'outillage",
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 6, autonomieFinanciere: 38, endettement: 58, bfrJours: 65, delaiClient: 60, delaiFournisseur: 45, tauxVA: 58, tauxEBE: 11 },
  },
  '2593Z': {
    libelle: "Fabrication d'articles en fils métalliques",
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 5, autonomieFinanciere: 33, endettement: 62, bfrJours: 55, delaiClient: 50, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 9 },
  },

  // ── Électronique, optique (26) ──
  '2611Z': {
    libelle: 'Fabrication de composants électroniques',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 7, autonomieFinanciere: 40, endettement: 50, bfrJours: 60, delaiClient: 50, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 12 },
  },
  '2620Z': {
    libelle: "Fabrication d'ordinateurs et d'équipements périphériques",
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 55, bfrJours: 50, delaiClient: 45, delaiFournisseur: 40, tauxVA: 45, tauxEBE: 10 },
  },

  // ── Équipements électriques (27) ──
  '2711Z': {
    libelle: 'Fabrication de moteurs et transformateurs électriques',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 58, bfrJours: 60, delaiClient: 55, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 10 },
  },
  '2751Z': {
    libelle: "Fabrication d'appareils électroménagers",
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 65, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 42, tauxEBE: 8 },
  },

  // ── Machines et équipements (28) ──
  '2822Z': {
    libelle: 'Fabrication de matériel de levage et de manutention',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 6, autonomieFinanciere: 38, endettement: 55, bfrJours: 60, delaiClient: 55, delaiFournisseur: 45, tauxVA: 50, tauxEBE: 11 },
  },
  '2892Z': {
    libelle: 'Fabrication de machines pour les industries extractives',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 60, bfrJours: 65, delaiClient: 55, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 10 },
  },

  // ── Industrie automobile (29) ──
  '2910Z': {
    libelle: 'Construction de véhicules automobiles',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 3, autonomieFinanciere: 28, endettement: 80, bfrJours: 40, delaiClient: 35, delaiFournisseur: 50, tauxVA: 25, tauxEBE: 6 },
  },
  '2932Z': {
    libelle: "Fabrication d'autres équipements automobiles",
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 70, bfrJours: 50, delaiClient: 45, delaiFournisseur: 50, tauxVA: 35, tauxEBE: 7 },
  },

  // ── Autres industries (30-33) ──
  '3011Z': {
    libelle: 'Construction de navires et de structures flottantes',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 80, bfrJours: 65, delaiClient: 50, delaiFournisseur: 45, tauxVA: 40, tauxEBE: 7 },
  },
  '3109B': {
    libelle: 'Fabrication d\'autres meubles',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 68, bfrJours: 50, delaiClient: 40, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 8 },
  },
  '3250A': {
    libelle: 'Fabrication de matériel médico-chirurgical',
    ratios: { tauxMargeBrute: 52, rentabiliteNette: 8, autonomieFinanciere: 42, endettement: 48, bfrJours: 55, delaiClient: 50, delaiFournisseur: 45, tauxVA: 58, tauxEBE: 13 },
  },
  '3312Z': {
    libelle: 'Réparation de machines et équipements mécaniques',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 60, bfrJours: 40, delaiClient: 40, delaiFournisseur: 35, tauxVA: 55, tauxEBE: 10 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION D — PRODUCTION ET DISTRIBUTION D'ÉNERGIE (35)
  // ═══════════════════════════════════════════════════════════════════════════

  '3511Z': {
    libelle: "Production d'électricité",
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 8, autonomieFinanciere: 30, endettement: 100, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 50, tauxEBE: 18 },
  },
  '3514Z': {
    libelle: "Commerce d'électricité",
    ratios: { tauxMargeBrute: 12, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 90, bfrJours: 15, delaiClient: 30, delaiFournisseur: 30, tauxVA: 18, tauxEBE: 6 },
  },
  '3530Z': {
    libelle: 'Production et distribution de vapeur et d\'air conditionné',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 6, autonomieFinanciere: 28, endettement: 95, bfrJours: 25, delaiClient: 35, delaiFournisseur: 30, tauxVA: 42, tauxEBE: 14 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION E — EAU, ASSAINISSEMENT, DÉCHETS (36-39)
  // ═══════════════════════════════════════════════════════════════════════════

  '3600Z': {
    libelle: "Captage, traitement et distribution d'eau",
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 5, autonomieFinanciere: 22, endettement: 120, bfrJours: 30, delaiClient: 40, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 20 },
  },
  '3811Z': {
    libelle: 'Collecte des déchets non dangereux',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 25, endettement: 85, bfrJours: 25, delaiClient: 35, delaiFournisseur: 30, tauxVA: 48, tauxEBE: 12 },
  },
  '3832Z': {
    libelle: 'Récupération de déchets triés',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 3, autonomieFinanciere: 28, endettement: 75, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 32, tauxEBE: 7 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION F — CONSTRUCTION (41-43)
  // ═══════════════════════════════════════════════════════════════════════════

  '4110A': {
    libelle: 'Promotion immobilière de logements',
    ratios: { tauxMargeBrute: 15, rentabiliteNette: 5, autonomieFinanciere: 15, endettement: 150, bfrJours: 90, delaiClient: 30, delaiFournisseur: 45, tauxVA: 20, tauxEBE: 8 },
  },
  '4120A': {
    libelle: 'Construction de maisons individuelles',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 4, autonomieFinanciere: 22, endettement: 80, bfrJours: 65, delaiClient: 45, delaiFournisseur: 45, tauxVA: 32, tauxEBE: 7 },
  },
  '4120B': {
    libelle: "Construction d'autres bâtiments",
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 75, bfrJours: 60, delaiClient: 45, delaiFournisseur: 45, tauxVA: 35, tauxEBE: 7 },
  },
  '4211Z': {
    libelle: 'Construction de routes et autoroutes',
    ratios: { tauxMargeBrute: 20, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 70, bfrJours: 50, delaiClient: 50, delaiFournisseur: 45, tauxVA: 35, tauxEBE: 8 },
  },
  '4221Z': {
    libelle: 'Construction de réseaux pour fluides',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 65, bfrJours: 48, delaiClient: 50, delaiFournisseur: 45, tauxVA: 40, tauxEBE: 9 },
  },
  '4321A': {
    libelle: "Travaux d'installation électrique",
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: 52, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 9 },
  },
  '4322A': {
    libelle: "Travaux d'installation d'eau et de gaz",
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 65, bfrJours: 55, delaiClient: 45, delaiFournisseur: 45, tauxVA: 46, tauxEBE: 8 },
  },
  '4322B': {
    libelle: "Travaux d'installation d'équipements thermiques et de climatisation",
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 62, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 9 },
  },
  '4331Z': {
    libelle: 'Travaux de plâtrerie',
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 58, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 50, tauxEBE: 9 },
  },
  '4332A': {
    libelle: 'Travaux de menuiserie bois et PVC',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 65, bfrJours: 52, delaiClient: 45, delaiFournisseur: 45, tauxVA: 44, tauxEBE: 8 },
  },
  '4332B': {
    libelle: 'Travaux de menuiserie métallique et serrurerie',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 62, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 46, tauxEBE: 8 },
  },
  '4334Z': {
    libelle: 'Travaux de peinture et vitrerie',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: 48, delaiClient: 45, delaiFournisseur: 45, tauxVA: 52, tauxEBE: 9 },
  },
  '4339Z': {
    libelle: 'Autres travaux de finition',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 62, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 8 },
  },
  '4391A': {
    libelle: 'Travaux de charpente',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 4, autonomieFinanciere: 27, endettement: 68, bfrJours: 55, delaiClient: 45, delaiFournisseur: 45, tauxVA: 46, tauxEBE: 8 },
  },
  '4391B': {
    libelle: 'Travaux de couverture par éléments',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 62, bfrJours: 50, delaiClient: 45, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 9 },
  },
  '4399A': {
    libelle: "Travaux d'étanchéification",
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: 48, delaiClient: 45, delaiFournisseur: 45, tauxVA: 50, tauxEBE: 9 },
  },
  '4399C': {
    libelle: 'Travaux de maçonnerie générale',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 72, bfrJours: 58, delaiClient: 45, delaiFournisseur: 45, tauxVA: 42, tauxEBE: 7 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION G — COMMERCE (45-47)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Commerce et réparation automobile (45) ──
  '4511Z': {
    libelle: 'Commerce de voitures et véhicules légers',
    ratios: { tauxMargeBrute: 15, rentabiliteNette: 2, autonomieFinanciere: 18, endettement: 110, bfrJours: 30, delaiClient: 15, delaiFournisseur: 30, tauxVA: 22, tauxEBE: 4 },
  },
  '4519Z': {
    libelle: "Commerce d'autres véhicules automobiles",
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 100, bfrJours: 35, delaiClient: 20, delaiFournisseur: 35, tauxVA: 25, tauxEBE: 5 },
  },
  '4520A': {
    libelle: 'Entretien et réparation de véhicules',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 5, autonomieFinanciere: 32, endettement: 55, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 9 },
  },
  '4532Z': {
    libelle: "Commerce de détail d'équipements automobiles",
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 72, bfrJours: 35, delaiClient: 20, delaiFournisseur: 40, tauxVA: 38, tauxEBE: 6 },
  },

  // ── Commerce de gros (46) ──
  '4611Z': {
    libelle: 'Intermédiaires du commerce en matières premières agricoles',
    ratios: { tauxMargeBrute: 15, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 80, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 22, tauxEBE: 6 },
  },
  '4617A': {
    libelle: 'Centrales d\'achat alimentaires',
    ratios: { tauxMargeBrute: 10, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 90, bfrJours: 5, delaiClient: 15, delaiFournisseur: 40, tauxVA: 14, tauxEBE: 4 },
  },
  '4631Z': {
    libelle: 'Commerce de gros de fruits et légumes',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 85, bfrJours: 15, delaiClient: 20, delaiFournisseur: 25, tauxVA: 22, tauxEBE: 4 },
  },
  '4639B': {
    libelle: 'Commerce de gros alimentaire non spécialisé',
    ratios: { tauxMargeBrute: 16, rentabiliteNette: 2, autonomieFinanciere: 22, endettement: 82, bfrJours: 18, delaiClient: 22, delaiFournisseur: 30, tauxVA: 20, tauxEBE: 4 },
  },
  '4641Z': {
    libelle: 'Commerce de gros de textiles',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 72, bfrJours: 50, delaiClient: 40, delaiFournisseur: 45, tauxVA: 38, tauxEBE: 7 },
  },
  '4649Z': {
    libelle: "Commerce de gros d'autres biens domestiques",
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 75, bfrJours: 45, delaiClient: 35, delaiFournisseur: 40, tauxVA: 34, tauxEBE: 6 },
  },
  '4669B': {
    libelle: 'Commerce de gros de fournitures et équipements industriels',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 68, bfrJours: 48, delaiClient: 40, delaiFournisseur: 40, tauxVA: 32, tauxEBE: 7 },
  },
  '4673A': {
    libelle: 'Commerce de gros de bois et de matériaux de construction',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 78, bfrJours: 35, delaiClient: 35, delaiFournisseur: 40, tauxVA: 28, tauxEBE: 6 },
  },
  '4674A': {
    libelle: 'Commerce de gros de quincaillerie',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 72, bfrJours: 45, delaiClient: 35, delaiFournisseur: 40, tauxVA: 32, tauxEBE: 7 },
  },
  '4690Z': {
    libelle: 'Commerce de gros non spécialisé',
    ratios: { tauxMargeBrute: 20, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 80, bfrJours: 30, delaiClient: 30, delaiFournisseur: 35, tauxVA: 25, tauxEBE: 5 },
  },

  // ── Commerce de détail (47) ──
  '4711B': {
    libelle: "Commerce d'alimentation générale",
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 24, endettement: 70, bfrJours: 0, delaiClient: 5, delaiFournisseur: 45, tauxVA: 30, tauxEBE: 5 },
  },
  '4711F': {
    libelle: 'Supermarchés et grandes surfaces alimentaires',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 2, autonomieFinanciere: 18, endettement: 85, bfrJours: -12, delaiClient: 5, delaiFournisseur: 48, tauxVA: 24, tauxEBE: 4 },
  },
  '4721Z': {
    libelle: 'Commerce de détail de fruits et légumes',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 4, autonomieFinanciere: 22, endettement: 75, bfrJours: -5, delaiClient: 2, delaiFournisseur: 20, tauxVA: 38, tauxEBE: 6 },
  },
  '4722Z': {
    libelle: 'Commerce de détail de viandes et produits à base de viande',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 65, bfrJours: 0, delaiClient: 2, delaiFournisseur: 25, tauxVA: 42, tauxEBE: 8 },
  },
  '4730Z': {
    libelle: 'Commerce de détail de carburants',
    ratios: { tauxMargeBrute: 8, rentabiliteNette: 1, autonomieFinanciere: 18, endettement: 90, bfrJours: -5, delaiClient: 2, delaiFournisseur: 25, tauxVA: 12, tauxEBE: 3 },
  },
  '4741Z': {
    libelle: "Commerce d'appareils électroménagers",
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 75, bfrJours: 30, delaiClient: 10, delaiFournisseur: 45, tauxVA: 35, tauxEBE: 5 },
  },
  '4759A': {
    libelle: 'Commerce de meubles',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 68, bfrJours: 35, delaiClient: 15, delaiFournisseur: 45, tauxVA: 42, tauxEBE: 6 },
  },
  '4759B': {
    libelle: "Commerce de détail d'autres équipements du foyer",
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 70, bfrJours: 35, delaiClient: 10, delaiFournisseur: 45, tauxVA: 44, tauxEBE: 7 },
  },
  '4761Z': {
    libelle: 'Commerce de détail de livres',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 70, bfrJours: 40, delaiClient: 5, delaiFournisseur: 60, tauxVA: 38, tauxEBE: 5 },
  },
  '4771Z': {
    libelle: 'Commerce de vêtements',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 4, autonomieFinanciere: 20, endettement: 90, bfrJours: 60, delaiClient: 10, delaiFournisseur: 60, tauxVA: 55, tauxEBE: 7 },
  },
  '4773Z': {
    libelle: 'Commerce de détail de produits pharmaceutiques',
    ratios: { tauxMargeBrute: 32, rentabiliteNette: 6, autonomieFinanciere: 35, endettement: 55, bfrJours: 20, delaiClient: 5, delaiFournisseur: 30, tauxVA: 35, tauxEBE: 10 },
  },
  '4775Z': {
    libelle: 'Commerce de détail de parfumerie et produits de beauté',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 4, autonomieFinanciere: 22, endettement: 78, bfrJours: 40, delaiClient: 5, delaiFournisseur: 45, tauxVA: 48, tauxEBE: 7 },
  },
  '4776Z': {
    libelle: 'Commerce de détail de fleurs, plantes',
    ratios: { tauxMargeBrute: 52, rentabiliteNette: 5, autonomieFinanciere: 25, endettement: 68, bfrJours: -5, delaiClient: 2, delaiFournisseur: 20, tauxVA: 55, tauxEBE: 8 },
  },
  '4778C': {
    libelle: 'Autres commerces de détail spécialisés divers',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 72, bfrJours: 35, delaiClient: 10, delaiFournisseur: 40, tauxVA: 45, tauxEBE: 7 },
  },
  '4791B': {
    libelle: 'Vente à distance sur catalogue spécialisé',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 65, bfrJours: 20, delaiClient: 5, delaiFournisseur: 35, tauxVA: 48, tauxEBE: 8 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION H — TRANSPORT ET ENTREPOSAGE (49-53)
  // ═══════════════════════════════════════════════════════════════════════════

  '4910Z': {
    libelle: 'Transport ferroviaire interurbain de voyageurs',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 120, bfrJours: -10, delaiClient: 15, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 10 },
  },
  '4920Z': {
    libelle: 'Transports ferroviaires de fret',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 2, autonomieFinanciere: 18, endettement: 130, bfrJours: 15, delaiClient: 30, delaiFournisseur: 30, tauxVA: 45, tauxEBE: 8 },
  },
  '4931Z': {
    libelle: 'Transports urbains et suburbains de voyageurs',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 110, bfrJours: -15, delaiClient: 15, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 10 },
  },
  '4932Z': {
    libelle: 'Transports de voyageurs par taxis',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 8, autonomieFinanciere: 35, endettement: 60, bfrJours: 5, delaiClient: 5, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 12 },
  },
  '4939A': {
    libelle: 'Transports routiers de voyageurs',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 3, autonomieFinanciere: 18, endettement: 110, bfrJours: 20, delaiClient: 20, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 9 },
  },
  '4941A': {
    libelle: 'Transports routiers de fret interurbains',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 95, bfrJours: 42, delaiClient: 45, delaiFournisseur: 30, tauxVA: 44, tauxEBE: 8 },
  },
  '4941B': {
    libelle: 'Transports routiers de fret de proximité',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 88, bfrJours: 38, delaiClient: 40, delaiFournisseur: 30, tauxVA: 46, tauxEBE: 8 },
  },
  '4942Z': {
    libelle: 'Services de déménagement',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 75, bfrJours: 20, delaiClient: 20, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 8 },
  },
  '5010Z': {
    libelle: 'Transports maritimes et côtiers de passagers',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 5, autonomieFinanciere: 22, endettement: 110, bfrJours: -10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 12 },
  },
  '5121Z': {
    libelle: 'Transports aériens de fret',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 120, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 35, tauxEBE: 8 },
  },
  '5210B': {
    libelle: 'Entreposage et stockage non frigorifique',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 6, autonomieFinanciere: 28, endettement: 85, bfrJours: 25, delaiClient: 35, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 14 },
  },
  '5229A': {
    libelle: 'Messagerie, fret express',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 82, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 35, tauxEBE: 6 },
  },
  '5320Z': {
    libelle: 'Autres activités de poste et de courrier',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 72, bfrJours: 20, delaiClient: 25, delaiFournisseur: 30, tauxVA: 48, tauxEBE: 8 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION I — HÉBERGEMENT ET RESTAURATION (55-56)
  // ═══════════════════════════════════════════════════════════════════════════

  '5510Z': {
    libelle: 'Hôtels et hébergement similaire',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 5, autonomieFinanciere: 15, endettement: 130, bfrJours: -25, delaiClient: 10, delaiFournisseur: 30, tauxVA: 48, tauxEBE: 12 },
  },
  '5520Z': {
    libelle: "Hébergement touristique et autre hébergement de courte durée",
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 8, autonomieFinanciere: 25, endettement: 95, bfrJours: -20, delaiClient: 5, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 15 },
  },
  '5530Z': {
    libelle: 'Terrains de camping et parcs',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 10, autonomieFinanciere: 22, endettement: 100, bfrJours: -15, delaiClient: 5, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 20 },
  },
  '5610A': {
    libelle: 'Restauration traditionnelle',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 4, autonomieFinanciere: 18, endettement: 105, bfrJours: -18, delaiClient: 3, delaiFournisseur: 30, tauxVA: 54, tauxEBE: 8 },
  },
  '5610C': {
    libelle: 'Restauration rapide',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 5, autonomieFinanciere: 22, endettement: 95, bfrJours: -20, delaiClient: 1, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 10 },
  },
  '5621Z': {
    libelle: 'Services des traiteurs',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 70, bfrJours: -5, delaiClient: 15, delaiFournisseur: 30, tauxVA: 50, tauxEBE: 9 },
  },
  '5629A': {
    libelle: 'Restauration collective sous contrat',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 80, bfrJours: -10, delaiClient: 30, delaiFournisseur: 35, tauxVA: 42, tauxEBE: 6 },
  },
  '5630Z': {
    libelle: 'Débits de boissons',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 5, autonomieFinanciere: 20, endettement: 100, bfrJours: -15, delaiClient: 2, delaiFournisseur: 30, tauxVA: 50, tauxEBE: 9 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION J — INFORMATION ET COMMUNICATION (58-63)
  // ═══════════════════════════════════════════════════════════════════════════

  '5811Z': {
    libelle: 'Édition de livres',
    ratios: { tauxMargeBrute: 48, rentabiliteNette: 5, autonomieFinanciere: 35, endettement: 55, bfrJours: 60, delaiClient: 50, delaiFournisseur: 45, tauxVA: 52, tauxEBE: 9 },
  },
  '5813Z': {
    libelle: 'Édition de journaux',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 3, autonomieFinanciere: 30, endettement: 65, bfrJours: 35, delaiClient: 40, delaiFournisseur: 40, tauxVA: 48, tauxEBE: 7 },
  },
  '5821Z': {
    libelle: 'Édition de jeux électroniques',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 12, autonomieFinanciere: 45, endettement: 40, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 18 },
  },
  '5829A': {
    libelle: "Édition de logiciels système et de réseau",
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 10, autonomieFinanciere: 45, endettement: 35, bfrJours: 40, delaiClient: 40, delaiFournisseur: 30, tauxVA: 75, tauxEBE: 15 },
  },
  '5829C': {
    libelle: "Édition de logiciels applicatifs",
    ratios: { tauxMargeBrute: 75, rentabiliteNette: 10, autonomieFinanciere: 42, endettement: 38, bfrJours: 35, delaiClient: 40, delaiFournisseur: 30, tauxVA: 78, tauxEBE: 15 },
  },
  '5911A': {
    libelle: 'Production de films cinématographiques',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 5, autonomieFinanciere: 25, endettement: 80, bfrJours: 45, delaiClient: 50, delaiFournisseur: 40, tauxVA: 50, tauxEBE: 8 },
  },
  '6010Z': {
    libelle: 'Édition et diffusion de programmes radio',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 10 },
  },
  '6110Z': {
    libelle: 'Télécommunications filaires',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 6, autonomieFinanciere: 25, endettement: 100, bfrJours: 15, delaiClient: 25, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 15 },
  },
  '6120Z': {
    libelle: 'Télécommunications sans fil',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 8, autonomieFinanciere: 28, endettement: 90, bfrJours: 10, delaiClient: 25, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 18 },
  },
  '6190Z': {
    libelle: 'Autres activités de télécommunication',
    ratios: { tauxMargeBrute: 48, rentabiliteNette: 7, autonomieFinanciere: 30, endettement: 80, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 12 },
  },
  '6201Z': {
    libelle: 'Programmation informatique',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 9, autonomieFinanciere: 42, endettement: 28, bfrJours: 45, delaiClient: 45, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 13 },
  },
  '6202A': {
    libelle: 'Conseil en systèmes informatiques',
    ratios: { tauxMargeBrute: 63, rentabiliteNette: 8, autonomieFinanciere: 40, endettement: 32, bfrJours: 50, delaiClient: 45, delaiFournisseur: 30, tauxVA: 67, tauxEBE: 12 },
  },
  '6202B': {
    libelle: 'Tierce maintenance de systèmes et d\'applications informatiques',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 7, autonomieFinanciere: 38, endettement: 38, bfrJours: 45, delaiClient: 40, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 11 },
  },
  '6209Z': {
    libelle: 'Autres activités informatiques',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 7, autonomieFinanciere: 38, endettement: 35, bfrJours: 48, delaiClient: 45, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 11 },
  },
  '6311Z': {
    libelle: 'Traitement de données, hébergement',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 8, autonomieFinanciere: 35, endettement: 45, bfrJours: 40, delaiClient: 30, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 14 },
  },
  '6312Z': {
    libelle: 'Portails Internet',
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 8, autonomieFinanciere: 38, endettement: 42, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 12 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION K — ACTIVITÉS FINANCIÈRES ET D'ASSURANCE (64-66)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Intermédiation financière (64) ──
  '6419Z': {
    libelle: 'Autres intermédiations monétaires',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 12, autonomieFinanciere: 10, endettement: 300, bfrJours: 0, delaiClient: 15, delaiFournisseur: 20, tauxVA: 60, tauxEBE: 20 },
  },
  '6420Z': {
    libelle: 'Activités des sociétés holding',
    ratios: { tauxMargeBrute: 85, rentabiliteNette: 20, autonomieFinanciere: 50, endettement: 45, bfrJours: 10, delaiClient: 15, delaiFournisseur: 20, tauxVA: 88, tauxEBE: 25 },
  },
  '6430Z': {
    libelle: 'Fonds de placement et entités financières similaires',
    ratios: { tauxMargeBrute: 80, rentabiliteNette: 18, autonomieFinanciere: 55, endettement: 40, bfrJours: 5, delaiClient: 10, delaiFournisseur: 20, tauxVA: 85, tauxEBE: 22 },
  },
  '6491Z': {
    libelle: 'Crédit-bail',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 8, autonomieFinanciere: 12, endettement: 280, bfrJours: 15, delaiClient: 20, delaiFournisseur: 20, tauxVA: 48, tauxEBE: 15 },
  },
  '6492Z': {
    libelle: 'Autre distribution de crédit',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 10, autonomieFinanciere: 15, endettement: 250, bfrJours: 10, delaiClient: 15, delaiFournisseur: 20, tauxVA: 65, tauxEBE: 18 },
  },
  '6499Z': {
    libelle: "Autres activités des services financiers hors assurance et caisses de retraite",
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 11, autonomieFinanciere: 35, endettement: 80, bfrJours: 15, delaiClient: 20, delaiFournisseur: 25, tauxVA: 70, tauxEBE: 16 },
  },

  // ── Assurance (65) ──
  '6511Z': {
    libelle: 'Assurance vie',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 8, autonomieFinanciere: 8, endettement: 400, bfrJours: -30, delaiClient: 10, delaiFournisseur: 20, tauxVA: 35, tauxEBE: 12 },
  },
  '6512Z': {
    libelle: 'Autres assurances',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 7, autonomieFinanciere: 12, endettement: 350, bfrJours: -25, delaiClient: 15, delaiFournisseur: 20, tauxVA: 40, tauxEBE: 12 },
  },
  '6520Z': {
    libelle: 'Réassurance',
    ratios: { tauxMargeBrute: 38, rentabiliteNette: 9, autonomieFinanciere: 15, endettement: 300, bfrJours: -20, delaiClient: 20, delaiFournisseur: 25, tauxVA: 42, tauxEBE: 14 },
  },

  // ── Activités auxiliaires de services financiers et d'assurance (66) ──
  '6611Z': {
    libelle: 'Administration de marchés financiers',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 15, autonomieFinanciere: 50, endettement: 30, bfrJours: 10, delaiClient: 15, delaiFournisseur: 20, tauxVA: 78, tauxEBE: 22 },
  },
  '6612Z': {
    libelle: 'Courtage de valeurs mobilières et de marchandises',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 12, autonomieFinanciere: 45, endettement: 35, bfrJours: 15, delaiClient: 15, delaiFournisseur: 20, tauxVA: 75, tauxEBE: 18 },
  },
  '6619A': {
    libelle: 'Supports juridiques de gestion de patrimoine mobilier',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 15, autonomieFinanciere: 55, endettement: 25, bfrJours: 10, delaiClient: 15, delaiFournisseur: 20, tauxVA: 78, tauxEBE: 20 },
  },
  '6619B': {
    libelle: 'Autres activités auxiliaires de services financiers',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 10, autonomieFinanciere: 42, endettement: 40, bfrJours: 20, delaiClient: 20, delaiFournisseur: 25, tauxVA: 72, tauxEBE: 15 },
  },
  '6621Z': {
    libelle: "Évaluation des risques et dommages",
    ratios: { tauxMargeBrute: 78, rentabiliteNette: 12, autonomieFinanciere: 50, endettement: 28, bfrJours: 20, delaiClient: 25, delaiFournisseur: 25, tauxVA: 80, tauxEBE: 16 },
  },
  '6622Z': {
    libelle: "Activités des agents et courtiers d'assurances",
    ratios: { tauxMargeBrute: 80, rentabiliteNette: 10, autonomieFinanciere: 55, endettement: 25, bfrJours: 15, delaiClient: 20, delaiFournisseur: 30, tauxVA: 82, tauxEBE: 15 },
  },
  '6629Z': {
    libelle: "Autres activités auxiliaires d'assurance et de caisses de retraite",
    ratios: { tauxMargeBrute: 75, rentabiliteNette: 9, autonomieFinanciere: 48, endettement: 32, bfrJours: 18, delaiClient: 22, delaiFournisseur: 25, tauxVA: 78, tauxEBE: 14 },
  },
  '6630Z': {
    libelle: 'Gestion de fonds',
    ratios: { tauxMargeBrute: 75, rentabiliteNette: 18, autonomieFinanciere: 60, endettement: 20, bfrJours: 10, delaiClient: 15, delaiFournisseur: 20, tauxVA: 80, tauxEBE: 22 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION L — ACTIVITÉS IMMOBILIÈRES (68)
  // ═══════════════════════════════════════════════════════════════════════════

  '6810Z': {
    libelle: 'Activités des marchands de biens immobiliers',
    ratios: { tauxMargeBrute: 20, rentabiliteNette: 8, autonomieFinanciere: 20, endettement: 140, bfrJours: 60, delaiClient: 20, delaiFournisseur: 30, tauxVA: 25, tauxEBE: 12 },
  },
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
  '6832A': {
    libelle: 'Administration d\'immeubles et autres biens immobiliers',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 6, autonomieFinanciere: 30, endettement: 55, bfrJours: 15, delaiClient: 25, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 10 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION M — ACTIVITÉS PROFESSIONNELLES, SCIENTIFIQUES ET TECHNIQUES (69-75)
  // ═══════════════════════════════════════════════════════════════════════════

  '6910Z': {
    libelle: 'Activités juridiques (avocats, notaires)',
    ratios: { tauxMargeBrute: 78, rentabiliteNette: 14, autonomieFinanciere: 55, endettement: 18, bfrJours: 22, delaiClient: 30, delaiFournisseur: 30, tauxVA: 80, tauxEBE: 20 },
  },
  '6920Z': {
    libelle: 'Activités comptables (experts-comptables)',
    ratios: { tauxMargeBrute: 74, rentabiliteNette: 12, autonomieFinanciere: 52, endettement: 20, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 77, tauxEBE: 18 },
  },
  '7010Z': {
    libelle: 'Activités des sièges sociaux',
    ratios: { tauxMargeBrute: 80, rentabiliteNette: 15, autonomieFinanciere: 48, endettement: 45, bfrJours: 15, delaiClient: 20, delaiFournisseur: 25, tauxVA: 82, tauxEBE: 20 },
  },
  '7021Z': {
    libelle: 'Conseil en relations publiques et communication',
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 9, autonomieFinanciere: 42, endettement: 30, bfrJours: 35, delaiClient: 30, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 14 },
  },
  '7022Z': {
    libelle: 'Conseil pour les affaires et la gestion',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 11, autonomieFinanciere: 50, endettement: 22, bfrJours: 28, delaiClient: 30, delaiFournisseur: 30, tauxVA: 75, tauxEBE: 16 },
  },
  '7111Z': {
    libelle: "Activités d'architecture",
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 10, autonomieFinanciere: 45, endettement: 25, bfrJours: 40, delaiClient: 45, delaiFournisseur: 30, tauxVA: 73, tauxEBE: 14 },
  },
  '7112B': {
    libelle: "Ingénierie, études techniques",
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 8, autonomieFinanciere: 40, endettement: 35, bfrJours: 48, delaiClient: 50, delaiFournisseur: 35, tauxVA: 68, tauxEBE: 12 },
  },
  '7120B': {
    libelle: 'Analyses, essais et inspections techniques',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 7, autonomieFinanciere: 38, endettement: 40, bfrJours: 42, delaiClient: 45, delaiFournisseur: 35, tauxVA: 62, tauxEBE: 11 },
  },
  '7211Z': {
    libelle: 'Recherche-développement en biotechnologie',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: -5, autonomieFinanciere: 55, endettement: 35, bfrJours: 50, delaiClient: 40, delaiFournisseur: 30, tauxVA: 75, tauxEBE: -2 },
  },
  '7219Z': {
    libelle: 'Recherche-développement en autres sciences',
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 3, autonomieFinanciere: 45, endettement: 40, bfrJours: 45, delaiClient: 40, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 8 },
  },
  '7311Z': {
    libelle: 'Activités des agences de publicité',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 50, bfrJours: 40, delaiClient: 45, delaiFournisseur: 45, tauxVA: 55, tauxEBE: 9 },
  },
  '7312Z': {
    libelle: 'Régie publicitaire de médias',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 4, autonomieFinanciere: 28, endettement: 55, bfrJours: 35, delaiClient: 45, delaiFournisseur: 40, tauxVA: 48, tauxEBE: 8 },
  },
  '7320Z': {
    libelle: 'Études de marché et sondages',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 7, autonomieFinanciere: 40, endettement: 35, bfrJours: 35, delaiClient: 40, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 11 },
  },
  '7410Z': {
    libelle: 'Activités spécialisées de design',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 9, autonomieFinanciere: 42, endettement: 30, bfrJours: 30, delaiClient: 35, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 13 },
  },
  '7420Z': {
    libelle: 'Activités photographiques',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 7, autonomieFinanciere: 35, endettement: 45, bfrJours: 20, delaiClient: 20, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 11 },
  },
  '7490B': {
    libelle: 'Activités spécialisées, scientifiques et techniques diverses',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 7, autonomieFinanciere: 38, endettement: 40, bfrJours: 35, delaiClient: 35, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 11 },
  },
  '7500Z': {
    libelle: 'Activités vétérinaires',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 10, autonomieFinanciere: 40, endettement: 50, bfrJours: 10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 15 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION N — ACTIVITÉS DE SERVICES ADMINISTRATIFS ET DE SOUTIEN (77-82)
  // ═══════════════════════════════════════════════════════════════════════════

  '7711A': {
    libelle: 'Location de courte durée de voitures et véhicules légers',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 5, autonomieFinanciere: 15, endettement: 150, bfrJours: -10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 50, tauxEBE: 12 },
  },
  '7712Z': {
    libelle: 'Location et location-bail de camions',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 5, autonomieFinanciere: 15, endettement: 160, bfrJours: -5, delaiClient: 15, delaiFournisseur: 30, tauxVA: 48, tauxEBE: 14 },
  },
  '7729Z': {
    libelle: 'Location et location-bail d\'autres biens personnels',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 7, autonomieFinanciere: 22, endettement: 110, bfrJours: 5, delaiClient: 10, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 14 },
  },
  '7810Z': {
    libelle: 'Activités des agences de placement de main-d\'œuvre',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 3, autonomieFinanciere: 25, endettement: 65, bfrJours: 35, delaiClient: 35, delaiFournisseur: 25, tauxVA: 22, tauxEBE: 5 },
  },
  '7820Z': {
    libelle: 'Activités des agences de travail temporaire',
    ratios: { tauxMargeBrute: 15, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 75, bfrJours: 40, delaiClient: 40, delaiFournisseur: 25, tauxVA: 18, tauxEBE: 4 },
  },
  '7911Z': {
    libelle: 'Activités des agences de voyage',
    ratios: { tauxMargeBrute: 20, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 70, bfrJours: -10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 28, tauxEBE: 5 },
  },
  '7912Z': {
    libelle: 'Activités des voyagistes',
    ratios: { tauxMargeBrute: 18, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 80, bfrJours: -15, delaiClient: 10, delaiFournisseur: 30, tauxVA: 25, tauxEBE: 4 },
  },
  '8010Z': {
    libelle: 'Activités de sécurité privée',
    ratios: { tauxMargeBrute: 22, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 72, bfrJours: 35, delaiClient: 35, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 5 },
  },
  '8110Z': {
    libelle: "Services généraux de gestion d'immeubles",
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 65, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 9 },
  },
  '8121Z': {
    libelle: 'Nettoyage courant de bâtiments',
    ratios: { tauxMargeBrute: 28, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 80, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 5 },
  },
  '8122Z': {
    libelle: 'Autres activités de nettoyage des bâtiments et nettoyage industriel',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 4, autonomieFinanciere: 22, endettement: 75, bfrJours: 28, delaiClient: 30, delaiFournisseur: 30, tauxVA: 54, tauxEBE: 6 },
  },
  '8129A': {
    libelle: 'Désinfection, désinsectisation, dératisation',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 6, autonomieFinanciere: 30, endettement: 60, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 10 },
  },
  '8130Z': {
    libelle: 'Services d\'aménagement paysager',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 65, bfrJours: 30, delaiClient: 30, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 9 },
  },
  '8211Z': {
    libelle: 'Services administratifs combinés de bureau',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 6, autonomieFinanciere: 32, endettement: 55, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 10 },
  },
  '8219Z': {
    libelle: 'Photocopie, préparation de documents et autres activités de bureau',
    ratios: { tauxMargeBrute: 48, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 62, bfrJours: 20, delaiClient: 25, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 8 },
  },
  '8220Z': {
    libelle: 'Activités de centres d\'appels',
    ratios: { tauxMargeBrute: 30, rentabiliteNette: 4, autonomieFinanciere: 25, endettement: 68, bfrJours: 30, delaiClient: 35, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 7 },
  },
  '8230Z': {
    libelle: 'Organisation de foires, salons professionnels et congrès',
    ratios: { tauxMargeBrute: 40, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: -10, delaiClient: 25, delaiFournisseur: 35, tauxVA: 50, tauxEBE: 9 },
  },
  '8291Z': {
    libelle: 'Activités des agences de recouvrement et des sociétés d\'information financière',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 8, autonomieFinanciere: 38, endettement: 48, bfrJours: 20, delaiClient: 25, delaiFournisseur: 25, tauxVA: 68, tauxEBE: 12 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION P — ENSEIGNEMENT (85)
  // ═══════════════════════════════════════════════════════════════════════════

  '8510Z': {
    libelle: 'Enseignement pré-primaire',
    ratios: { tauxMargeBrute: 75, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: -10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 10 },
  },
  '8531Z': {
    libelle: 'Enseignement secondaire général',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 4, autonomieFinanciere: 35, endettement: 55, bfrJours: -5, delaiClient: 10, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 8 },
  },
  '8541Z': {
    libelle: 'Enseignement post-secondaire non supérieur',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 6, autonomieFinanciere: 38, endettement: 45, bfrJours: -5, delaiClient: 15, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 10 },
  },
  '8542Z': {
    libelle: 'Enseignement supérieur',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 5, autonomieFinanciere: 40, endettement: 50, bfrJours: -10, delaiClient: 15, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 10 },
  },
  '8551Z': {
    libelle: 'Enseignement de disciplines sportives et d\'activités de loisirs',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 7, autonomieFinanciere: 35, endettement: 52, bfrJours: -5, delaiClient: 10, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 12 },
  },
  '8552Z': {
    libelle: 'Enseignement culturel',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 6, autonomieFinanciere: 35, endettement: 55, bfrJours: -5, delaiClient: 10, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 10 },
  },
  '8553Z': {
    libelle: 'Enseignement de la conduite',
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 6, autonomieFinanciere: 28, endettement: 65, bfrJours: -5, delaiClient: 5, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 10 },
  },
  '8559A': {
    libelle: "Formation continue d'adultes",
    ratios: { tauxMargeBrute: 65, rentabiliteNette: 8, autonomieFinanciere: 40, endettement: 30, bfrJours: 20, delaiClient: 30, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 12 },
  },
  '8559B': {
    libelle: 'Autres enseignements',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 6, autonomieFinanciere: 35, endettement: 45, bfrJours: 10, delaiClient: 20, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 10 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION Q — SANTÉ HUMAINE ET ACTION SOCIALE (86-88)
  // ═══════════════════════════════════════════════════════════════════════════

  '8610Z': {
    libelle: 'Activités hospitalières',
    ratios: { tauxMargeBrute: 52, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 95, bfrJours: 20, delaiClient: 30, delaiFournisseur: 35, tauxVA: 60, tauxEBE: 8 },
  },
  '8621Z': {
    libelle: 'Médecins généralistes en libéral',
    ratios: { tauxMargeBrute: 90, rentabiliteNette: 27, autonomieFinanciere: 62, endettement: 14, bfrJours: 12, delaiClient: 15, delaiFournisseur: 30, tauxVA: 88, tauxEBE: 32 },
  },
  '8622A': {
    libelle: 'Chirurgiens-dentistes en libéral',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 20, autonomieFinanciere: 50, endettement: 35, bfrJours: 15, delaiClient: 10, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 25 },
  },
  '8622B': {
    libelle: 'Activités chirurgicales',
    ratios: { tauxMargeBrute: 70, rentabiliteNette: 18, autonomieFinanciere: 48, endettement: 40, bfrJours: 18, delaiClient: 15, delaiFournisseur: 30, tauxVA: 72, tauxEBE: 22 },
  },
  '8622C': {
    libelle: 'Autres activités des médecins spécialistes',
    ratios: { tauxMargeBrute: 82, rentabiliteNette: 22, autonomieFinanciere: 55, endettement: 22, bfrJours: 15, delaiClient: 15, delaiFournisseur: 30, tauxVA: 80, tauxEBE: 28 },
  },
  '8623Z': {
    libelle: 'Pratique dentaire',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 18, autonomieFinanciere: 48, endettement: 38, bfrJours: 15, delaiClient: 10, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 22 },
  },
  '8690A': {
    libelle: 'Auxiliaires médicaux en libéral',
    ratios: { tauxMargeBrute: 88, rentabiliteNette: 22, autonomieFinanciere: 58, endettement: 18, bfrJours: 15, delaiClient: 15, delaiFournisseur: 30, tauxVA: 85, tauxEBE: 28 },
  },
  '8690D': {
    libelle: 'Activités des infirmiers et des sages-femmes',
    ratios: { tauxMargeBrute: 90, rentabiliteNette: 25, autonomieFinanciere: 60, endettement: 15, bfrJours: 12, delaiClient: 10, delaiFournisseur: 30, tauxVA: 88, tauxEBE: 30 },
  },
  '8690E': {
    libelle: 'Activités des professionnels de la rééducation',
    ratios: { tauxMargeBrute: 85, rentabiliteNette: 20, autonomieFinanciere: 55, endettement: 22, bfrJours: 12, delaiClient: 12, delaiFournisseur: 30, tauxVA: 82, tauxEBE: 25 },
  },
  '8710A': {
    libelle: 'Hébergement médicalisé pour personnes âgées (EHPAD)',
    ratios: { tauxMargeBrute: 45, rentabiliteNette: 3, autonomieFinanciere: 15, endettement: 130, bfrJours: -10, delaiClient: 15, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 8 },
  },
  '8810A': {
    libelle: 'Aide à domicile',
    ratios: { tauxMargeBrute: 35, rentabiliteNette: 2, autonomieFinanciere: 20, endettement: 70, bfrJours: 15, delaiClient: 20, delaiFournisseur: 25, tauxVA: 72, tauxEBE: 5 },
  },
  '8891A': {
    libelle: 'Accueil de jeunes enfants (crèches)',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 80, bfrJours: -5, delaiClient: 15, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 7 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION R — ARTS, SPECTACLES ET ACTIVITÉS RÉCRÉATIVES (90-93)
  // ═══════════════════════════════════════════════════════════════════════════

  '9001Z': {
    libelle: 'Arts du spectacle vivant',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 4, autonomieFinanciere: 30, endettement: 55, bfrJours: -5, delaiClient: 20, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 8 },
  },
  '9002Z': {
    libelle: 'Activités de soutien au spectacle vivant',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 60, bfrJours: 10, delaiClient: 25, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 9 },
  },
  '9003A': {
    libelle: 'Création artistique relevant des arts plastiques',
    ratios: { tauxMargeBrute: 62, rentabiliteNette: 8, autonomieFinanciere: 45, endettement: 35, bfrJours: 15, delaiClient: 20, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 12 },
  },
  '9003B': {
    libelle: 'Autre création artistique',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 6, autonomieFinanciere: 40, endettement: 40, bfrJours: 15, delaiClient: 20, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 10 },
  },
  '9004Z': {
    libelle: 'Gestion de salles de spectacles',
    ratios: { tauxMargeBrute: 42, rentabiliteNette: 3, autonomieFinanciere: 20, endettement: 90, bfrJours: -10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 8 },
  },
  '9102Z': {
    libelle: 'Gestion des musées',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 2, autonomieFinanciere: 25, endettement: 70, bfrJours: -10, delaiClient: 10, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 6 },
  },
  '9200Z': {
    libelle: 'Organisation de jeux de hasard et d\'argent',
    ratios: { tauxMargeBrute: 25, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 55, bfrJours: -15, delaiClient: 2, delaiFournisseur: 20, tauxVA: 35, tauxEBE: 10 },
  },
  '9311Z': {
    libelle: 'Gestion d\'installations sportives',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 4, autonomieFinanciere: 18, endettement: 100, bfrJours: -10, delaiClient: 5, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 10 },
  },
  '9312Z': {
    libelle: 'Activités de clubs de sports',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 3, autonomieFinanciere: 22, endettement: 80, bfrJours: -10, delaiClient: 5, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 8 },
  },
  '9313Z': {
    libelle: 'Activités des centres de culture physique',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 6, autonomieFinanciere: 20, endettement: 95, bfrJours: -15, delaiClient: 3, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 12 },
  },
  '9321Z': {
    libelle: 'Activités des parcs d\'attractions et parcs à thèmes',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 5, autonomieFinanciere: 18, endettement: 110, bfrJours: -20, delaiClient: 3, delaiFournisseur: 30, tauxVA: 52, tauxEBE: 14 },
  },
  '9329Z': {
    libelle: 'Autres activités récréatives et de loisirs',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 5, autonomieFinanciere: 25, endettement: 75, bfrJours: -10, delaiClient: 8, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 10 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION S — AUTRES ACTIVITÉS DE SERVICES (94-96)
  // ═══════════════════════════════════════════════════════════════════════════

  '9411Z': {
    libelle: 'Activités des organisations patronales et consulaires',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 3, autonomieFinanciere: 40, endettement: 40, bfrJours: -5, delaiClient: 15, delaiFournisseur: 25, tauxVA: 65, tauxEBE: 7 },
  },
  '9412Z': {
    libelle: 'Activités des organisations professionnelles',
    ratios: { tauxMargeBrute: 58, rentabiliteNette: 3, autonomieFinanciere: 42, endettement: 38, bfrJours: -5, delaiClient: 15, delaiFournisseur: 25, tauxVA: 62, tauxEBE: 6 },
  },
  '9499Z': {
    libelle: 'Autres organisations fonctionnant par adhésion volontaire',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 2, autonomieFinanciere: 45, endettement: 35, bfrJours: -5, delaiClient: 10, delaiFournisseur: 25, tauxVA: 60, tauxEBE: 5 },
  },
  '9511Z': {
    libelle: 'Réparation d\'ordinateurs et d\'équipements périphériques',
    ratios: { tauxMargeBrute: 52, rentabiliteNette: 6, autonomieFinanciere: 32, endettement: 55, bfrJours: 20, delaiClient: 20, delaiFournisseur: 30, tauxVA: 58, tauxEBE: 10 },
  },
  '9521Z': {
    libelle: "Réparation de produits électroniques grand public",
    ratios: { tauxMargeBrute: 48, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 60, bfrJours: 15, delaiClient: 15, delaiFournisseur: 30, tauxVA: 55, tauxEBE: 9 },
  },
  '9601A': {
    libelle: 'Blanchisserie-teinturerie de gros',
    ratios: { tauxMargeBrute: 50, rentabiliteNette: 5, autonomieFinanciere: 30, endettement: 62, bfrJours: 25, delaiClient: 30, delaiFournisseur: 30, tauxVA: 60, tauxEBE: 10 },
  },
  '9601B': {
    libelle: 'Blanchisserie-teinturerie de détail',
    ratios: { tauxMargeBrute: 55, rentabiliteNette: 6, autonomieFinanciere: 28, endettement: 65, bfrJours: 5, delaiClient: 5, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 10 },
  },
  '9602A': {
    libelle: 'Coiffure',
    ratios: { tauxMargeBrute: 78, rentabiliteNette: 8, autonomieFinanciere: 30, endettement: 55, bfrJours: 0, delaiClient: 1, delaiFournisseur: 30, tauxVA: 70, tauxEBE: 12 },
  },
  '9602B': {
    libelle: 'Soins de beauté',
    ratios: { tauxMargeBrute: 72, rentabiliteNette: 7, autonomieFinanciere: 28, endettement: 60, bfrJours: 0, delaiClient: 1, delaiFournisseur: 30, tauxVA: 68, tauxEBE: 11 },
  },
  '9604Z': {
    libelle: 'Entretien corporel',
    ratios: { tauxMargeBrute: 68, rentabiliteNette: 6, autonomieFinanciere: 25, endettement: 65, bfrJours: 0, delaiClient: 1, delaiFournisseur: 30, tauxVA: 65, tauxEBE: 10 },
  },
  '9609Z': {
    libelle: 'Autres services personnels n.c.a.',
    ratios: { tauxMargeBrute: 60, rentabiliteNette: 5, autonomieFinanciere: 28, endettement: 62, bfrJours: 5, delaiClient: 10, delaiFournisseur: 30, tauxVA: 62, tauxEBE: 9 },
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
 * Essaie la correspondance exacte, puis par sous-classe, puis par division.
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

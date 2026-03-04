/**
 * Types pour les états financiers et les KPIs
 */

// ---- BILAN ----

export interface BilanSection {
  label: string;
  items: BilanItem[];
  total: number;
}

export interface BilanItem {
  compteRacine: string;
  label: string;
  montant: number;
  children?: BilanItem[];
}

export interface Bilan {
  actif: {
    immobilisations: BilanSection;
    stocks: BilanSection;
    creances: BilanSection;
    tresorerie: BilanSection;
    totalActif: number;
  };
  passif: {
    capitauxPropres: BilanSection;
    dettesFinancieres: BilanSection;
    dettesFournisseurs: BilanSection;
    dettesFiscales: BilanSection;
    totalPassif: number;
  };
}

// ---- COMPTE DE RÉSULTAT ----

export interface ResultatSection {
  label: string;
  items: ResultatItem[];
  total: number;
}

export interface ResultatItem {
  compteRacine: string;
  label: string;
  montant: number;
}

export interface CompteDeResultat {
  produitsExploitation: ResultatSection;
  chargesExploitation: ResultatSection;
  resultatExploitation: number;
  produitsFinanciers: ResultatSection;
  chargesFinancieres: ResultatSection;
  resultatFinancier: number;
  produitsExceptionnels: ResultatSection;
  chargesExceptionnelles: ResultatSection;
  resultatExceptionnel: number;
  impots: number;
  resultatNet: number;
}

// ---- SOLDES INTERMÉDIAIRES DE GESTION (SIG) ----

export interface SigLevel {
  label: string;
  montant: number;
  details: { label: string; montant: number }[];
}

export interface Sig {
  margeCommerciale: SigLevel;
  productionExercice: SigLevel;
  valeurAjoutee: SigLevel;
  ebe: SigLevel; // Excédent Brut d'Exploitation
  resultatExploitation: SigLevel;
  rcai: SigLevel; // Résultat Courant Avant Impôts
  resultatExceptionnel: SigLevel;
  resultatNet: SigLevel;
  plusMoinsValuesCessions: SigLevel;
}

// ---- KPIs ----

export interface DashboardKpis {
  chiffreAffaires: number;
  margeBrute: number;
  tauxMargeBrute: number; // en %
  ebe: number;
  resultatNet: number;
  tresorerieNette: number;
  ratioRentabilite: number; // en %
  bfr: number;
  delaiClientMoyen: number; // en jours
  delaiFournisseurMoyen: number; // en jours
}

export interface MonthlyData {
  month: string; // YYYY-MM
  label: string; // "Jan", "Fév", etc.
  montant: number;
}

export interface ExpenseCategory {
  label: string;
  compteRacine: string;
  montant: number;
  pourcentage: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  revenueMonthly: MonthlyData[];
  expenseBreakdown: ExpenseCategory[];
}

// ---- COMPARAISON ----

export interface ComparisonRow {
  label: string;
  valueN: number;
  valueN1: number;
  deltaAbsolute: number;
  deltaPercent: number | null; // null si division par zéro
}

export interface ComparisonData {
  labelN: string;
  labelN1: string;
  kpis: ComparisonRow[];
  monthlyRevenue: {
    month: string;
    label: string;
    valueN: number;
    valueN1: number;
  }[];
}

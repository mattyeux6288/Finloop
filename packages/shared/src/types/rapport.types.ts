import type { DashboardKpis, MonthlyData, Bilan, Sig } from './financial.types';

/**
 * Types pour le Rapport d'activité 2.0
 */

// ---- CHARGES DETAILLEES PAR CLASSE PCG ----

export interface SousCompteDetail {
  compteNum: string;   // "641000"
  label: string;       // "Rémunérations du personnel"
  montant: number;
}

export interface ChargeClassDetail {
  classeCode: string;       // "60", "61", "62"...
  classeLabel: string;      // "Achats", "Services extérieurs"...
  montant: number;
  pourcentage: number;      // % du total charges
  sousComptes: SousCompteDetail[];
}

// ---- RATIOS FINANCIERS ----

export interface RatioFinancier {
  label: string;
  valeur: number;
  unite: '%' | 'jours' | 'ratio';
  interpretation: 'bon' | 'attention' | 'alerte';
  seuil?: string;           // ex: "Norme > 20%"
  secteurMoyenne?: number;  // Moyenne sectorielle (NAF)
  secteurLibelle?: string;  // ex: "Moyenne Conseil informatique"
}

// ---- POINTS DE DISCUSSION ----

export interface PointDiscussion {
  type: 'force' | 'vigilance' | 'action';
  titre: string;
  description: string;
}

// ---- RAPPORT COMPLET ----

export interface RapportEntreprise {
  nom: string;
  siren: string;
  exercice: string;
  dateDebut: string;
  dateFin: string;
  nafCode?: string;
  nafLibelle?: string;
}

export interface RapportActiviteData {
  entreprise: RapportEntreprise;
  kpis: DashboardKpis;
  revenueMonthly: MonthlyData[];
  revenueMonthlyN1?: MonthlyData[]; // Exercice précédent (N-1)
  chargesDetaillees: ChargeClassDetail[];
  bilan: Bilan;
  sig: Sig;
  ratios: RatioFinancier[];
  pointsDiscussion: PointDiscussion[];
  genereA: string; // ISO date
}

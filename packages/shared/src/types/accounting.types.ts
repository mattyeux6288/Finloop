/**
 * Types pour la comptabilité et le Plan Comptable Général (PCG)
 */

/** Classes du PCG (1-7) */
export type CompteClasse = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Écriture comptable stockée en base */
export interface Ecriture {
  id: string;
  importId: string;
  fiscalYearId: string;
  journalCode: string;
  journalLib: string;
  ecritureNum: string;
  ecritureDate: Date;
  compteNum: string;
  compteLib: string;
  compteAuxNum: string | null;
  compteAuxLib: string | null;
  pieceRef: string | null;
  pieceDate: Date | null;
  ecritureLib: string;
  debit: number;
  credit: number;
  ecritureLet: string | null;
  dateLet: Date | null;
  validDate: Date | null;
  montantDevise: number | null;
  idevise: string | null;
  compteClasse: CompteClasse;
  compteRacine: string; // 3 premiers chiffres
}

/** Compte du PCG (table de référence) */
export interface PcgAccount {
  id: number;
  compteNum: string;
  compteLib: string;
  classe: CompteClasse;
  category: string | null;
  bilanPosition: 'actif' | 'passif' | null;
  resultatNature: string | null;
}

/** Agrégation par compte pour les états financiers */
export interface CompteAggregate {
  compteNum: string;
  compteLib: string;
  compteClasse: CompteClasse;
  compteRacine: string;
  totalDebit: number;
  totalCredit: number;
  solde: number; // debit - credit (positif = solde débiteur)
}

/** Import de données */
export interface Import {
  id: string;
  fiscalYearId: string;
  filename: string;
  fileType: 'fec' | 'csv' | 'xlsx';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rowCount: number | null;
  errorLog: unknown | null;
  importedAt: Date;
}

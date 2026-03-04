/**
 * Types pour le Fichier des Écritures Comptables (FEC)
 * Format standard français défini par l'article A.47 A-1 du LPF
 */

/** Les 18 colonnes obligatoires du FEC */
export interface FecEntry {
  journalCode: string;       // Col 1 - Code journal
  journalLib: string;        // Col 2 - Libellé journal
  ecritureNum: string;       // Col 3 - Numéro écriture
  ecritureDate: string;      // Col 4 - Date écriture (YYYYMMDD)
  compteNum: string;         // Col 5 - Numéro de compte
  compteLib: string;         // Col 6 - Libellé de compte
  compteAuxNum: string;      // Col 7 - Numéro compte auxiliaire
  compteAuxLib: string;      // Col 8 - Libellé compte auxiliaire
  pieceRef: string;          // Col 9 - Référence pièce
  pieceDate: string;         // Col 10 - Date pièce (YYYYMMDD)
  ecritureLib: string;       // Col 11 - Libellé écriture
  debit: number;             // Col 12 - Montant débit
  credit: number;            // Col 13 - Montant crédit
  ecritureLet: string;       // Col 14 - Lettrage
  dateLet: string;           // Col 15 - Date lettrage
  validDate: string;         // Col 16 - Date validation
  montantDevise: number;     // Col 17 - Montant en devise
  idevise: string;           // Col 18 - Identifiant devise
}

/** Noms des colonnes FEC dans le fichier source */
export const FEC_COLUMN_NAMES = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompteAuxNum',
  'CompteAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcritureLet',
  'DateLet',
  'ValidDate',
  'MontantDevise',
  'Idevise',
] as const;

export type FecColumnName = (typeof FEC_COLUMN_NAMES)[number];

/** Colonnes requises (non vides) dans un FEC */
export const FEC_REQUIRED_COLUMNS: FecColumnName[] = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'EcritureLib',
];

/** Résultat de parsing d'un fichier FEC */
export interface FecParseResult {
  entries: FecEntry[];
  rowCount: number;
  errors: FecParseError[];
  warnings: string[];
  delimiter: string;
  encoding: string;
}

export interface FecParseError {
  line: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

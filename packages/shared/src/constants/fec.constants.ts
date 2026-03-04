/**
 * Constantes pour le parsing FEC
 */

/** Délimiteurs possibles dans un fichier FEC */
export const FEC_DELIMITERS = ['|', '\t', ';'] as const;

/** Encodages possibles pour un fichier FEC */
export const FEC_ENCODINGS = ['utf-8', 'iso-8859-15', 'iso-8859-1', 'windows-1252'] as const;

/** Nombre de colonnes dans un FEC standard */
export const FEC_COLUMN_COUNT = 18;

/** Format de date FEC : YYYYMMDD */
export const FEC_DATE_REGEX = /^\d{8}$/;

/** Taille max d'upload en octets (50 MB) */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

/** Extensions de fichiers acceptées */
export const ACCEPTED_FILE_EXTENSIONS = ['.txt', '.csv', '.xlsx', '.xls'] as const;

/** Types MIME acceptés */
export const ACCEPTED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

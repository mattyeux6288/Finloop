import { parse } from 'csv-parse/sync';
import type { FecEntry, FecParseResult, FecParseError } from '@finthesis/shared';
import { parseFecAmount } from '@finthesis/shared';

/**
 * Mapping de colonnes personnalisé pour les fichiers CSV non-FEC
 */
export interface CsvColumnMapping {
  journalCode?: number;
  journalLib?: number;
  ecritureNum?: number;
  ecritureDate?: number;
  compteNum?: number;
  compteLib?: number;
  compteAuxNum?: number;
  compteAuxLib?: number;
  pieceRef?: number;
  pieceDate?: number;
  ecritureLib?: number;
  debit?: number;
  credit?: number;
  ecritureLet?: number;
  dateLet?: number;
  validDate?: number;
  montantDevise?: number;
  idevise?: number;
}

/**
 * Parse un fichier CSV avec un mapping de colonnes personnalisé
 */
export function parseCsv(
  content: string,
  mapping: CsvColumnMapping,
  delimiter: string = ';',
): FecParseResult {
  const errors: FecParseError[] = [];
  const warnings: string[] = [];
  const entries: FecEntry[] = [];

  let records: string[][];
  try {
    records = parse(content, {
      delimiter,
      quote: '"',
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      from_line: 2, // Skip header
    });
  } catch (err) {
    errors.push({
      line: 0,
      message: `Erreur de parsing CSV: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error',
    });
    return { entries, rowCount: 0, errors, warnings, delimiter, encoding: 'utf-8' };
  }

  const getCol = (row: string[], index?: number): string => {
    if (index === undefined || index < 0 || index >= row.length) return '';
    return row[index]?.trim() || '';
  };

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const lineNum = i + 2; // +2 car on skip le header

    const compteNum = getCol(row, mapping.compteNum);
    if (!compteNum) {
      errors.push({
        line: lineNum,
        message: 'Numéro de compte manquant.',
        severity: 'error',
      });
      continue;
    }

    entries.push({
      journalCode: getCol(row, mapping.journalCode),
      journalLib: getCol(row, mapping.journalLib),
      ecritureNum: getCol(row, mapping.ecritureNum),
      ecritureDate: getCol(row, mapping.ecritureDate),
      compteNum,
      compteLib: getCol(row, mapping.compteLib),
      compteAuxNum: getCol(row, mapping.compteAuxNum),
      compteAuxLib: getCol(row, mapping.compteAuxLib),
      pieceRef: getCol(row, mapping.pieceRef),
      pieceDate: getCol(row, mapping.pieceDate),
      ecritureLib: getCol(row, mapping.ecritureLib),
      debit: parseFecAmount(getCol(row, mapping.debit)),
      credit: parseFecAmount(getCol(row, mapping.credit)),
      ecritureLet: getCol(row, mapping.ecritureLet),
      dateLet: getCol(row, mapping.dateLet),
      validDate: getCol(row, mapping.validDate),
      montantDevise: parseFecAmount(getCol(row, mapping.montantDevise)),
      idevise: getCol(row, mapping.idevise),
    });
  }

  return {
    entries,
    rowCount: entries.length,
    errors,
    warnings,
    delimiter,
    encoding: 'utf-8',
  };
}

/**
 * Aperçu des premières lignes d'un CSV pour le mapping de colonnes
 */
export function previewCsv(
  content: string,
  delimiter: string = ';',
  maxRows: number = 5,
): { headers: string[]; rows: string[][] } {
  const records: string[][] = parse(content, {
    delimiter,
    quote: '"',
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    to: maxRows + 1,
  });

  const headers = records[0] || [];
  const rows = records.slice(1, maxRows + 1);

  return { headers, rows };
}

import ExcelJS from 'exceljs';
import type { FecEntry, FecParseResult, FecParseError } from '@finthesis/shared';
import { parseFecAmount } from '@finthesis/shared';
import type { CsvColumnMapping } from './csv.parser';

/**
 * Parse un fichier Excel (.xlsx) avec un mapping de colonnes
 */
export async function parseExcel(
  buffer: Buffer,
  mapping: CsvColumnMapping,
): Promise<FecParseResult> {
  const errors: FecParseError[] = [];
  const warnings: string[] = [];
  const entries: FecEntry[] = [];

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch (err) {
    errors.push({
      line: 0,
      message: `Erreur de lecture du fichier Excel: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error',
    });
    return { entries, rowCount: 0, errors, warnings, delimiter: '', encoding: 'xlsx' };
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    errors.push({ line: 0, message: 'Aucune feuille trouvée dans le fichier Excel.', severity: 'error' });
    return { entries, rowCount: 0, errors, warnings, delimiter: '', encoding: 'xlsx' };
  }

  const getCell = (row: ExcelJS.Row, colIndex?: number): string => {
    if (colIndex === undefined || colIndex < 0) return '';
    const cell = row.getCell(colIndex + 1); // ExcelJS est 1-indexed
    const value = cell.value;
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      // Formater en YYYYMMDD
      const y = value.getFullYear();
      const m = (value.getMonth() + 1).toString().padStart(2, '0');
      const d = value.getDate().toString().padStart(2, '0');
      return `${y}${m}${d}`;
    }
    return String(value).trim();
  };

  // Parcourir les lignes (skip la première = en-tête)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const compteNum = getCell(row, mapping.compteNum);
    if (!compteNum) {
      errors.push({
        line: rowNumber,
        message: 'Numéro de compte manquant.',
        severity: 'error',
      });
      return;
    }

    entries.push({
      journalCode: getCell(row, mapping.journalCode),
      journalLib: getCell(row, mapping.journalLib),
      ecritureNum: getCell(row, mapping.ecritureNum),
      ecritureDate: getCell(row, mapping.ecritureDate),
      compteNum,
      compteLib: getCell(row, mapping.compteLib),
      compteAuxNum: getCell(row, mapping.compteAuxNum),
      compteAuxLib: getCell(row, mapping.compteAuxLib),
      pieceRef: getCell(row, mapping.pieceRef),
      pieceDate: getCell(row, mapping.pieceDate),
      ecritureLib: getCell(row, mapping.ecritureLib),
      debit: parseFecAmount(getCell(row, mapping.debit)),
      credit: parseFecAmount(getCell(row, mapping.credit)),
      ecritureLet: getCell(row, mapping.ecritureLet),
      dateLet: getCell(row, mapping.dateLet),
      validDate: getCell(row, mapping.validDate),
      montantDevise: parseFecAmount(getCell(row, mapping.montantDevise)),
      idevise: getCell(row, mapping.idevise),
    });
  });

  return {
    entries,
    rowCount: entries.length,
    errors,
    warnings,
    delimiter: '',
    encoding: 'xlsx',
  };
}

/**
 * Aperçu des premières lignes d'un fichier Excel
 */
export async function previewExcel(
  buffer: Buffer,
  maxRows: number = 5,
): Promise<{ headers: string[]; rows: string[][] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { headers: [], rows: [] };

  const headers: string[] = [];
  const rows: string[][] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > maxRows + 1) return;

    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      values.push(cell.value !== null && cell.value !== undefined ? String(cell.value) : '');
    });

    if (rowNumber === 1) {
      headers.push(...values);
    } else {
      rows.push(values);
    }
  });

  return { headers, rows };
}

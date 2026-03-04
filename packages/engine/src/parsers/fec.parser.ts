import { parse } from 'csv-parse/sync';
import {
  FEC_COLUMN_NAMES,
  FEC_DELIMITERS,
  FEC_COLUMN_COUNT,
  FEC_DATE_REGEX,
  FEC_REQUIRED_COLUMNS,
  parseFecAmount,
} from '@finthesis/shared';
import type { FecEntry, FecParseResult, FecParseError } from '@finthesis/shared';

/**
 * Détecte le délimiteur utilisé dans un fichier FEC
 */
function detectDelimiter(firstLine: string): string {
  for (const delimiter of FEC_DELIMITERS) {
    const parts = firstLine.split(delimiter);
    if (parts.length >= FEC_COLUMN_COUNT) {
      return delimiter;
    }
  }
  // Fallback : pipe
  return '|';
}

/**
 * Vérifie que l'en-tête correspond aux colonnes FEC
 */
function validateHeader(headerRow: string[], delimiter: string): string[] {
  const warnings: string[] = [];

  if (headerRow.length < FEC_COLUMN_COUNT) {
    warnings.push(
      `L'en-tête contient ${headerRow.length} colonnes au lieu de ${FEC_COLUMN_COUNT}.`,
    );
  }

  // Vérifier la correspondance des noms de colonnes
  for (let i = 0; i < Math.min(headerRow.length, FEC_COLUMN_NAMES.length); i++) {
    const expected = FEC_COLUMN_NAMES[i].toLowerCase();
    const actual = headerRow[i].trim().toLowerCase();
    if (actual !== expected) {
      warnings.push(`Colonne ${i + 1}: attendu "${FEC_COLUMN_NAMES[i]}", trouvé "${headerRow[i].trim()}"`);
    }
  }

  return warnings;
}

/**
 * Parse un fichier FEC (texte brut)
 */
export function parseFec(content: string): FecParseResult {
  const errors: FecParseError[] = [];
  const warnings: string[] = [];
  const entries: FecEntry[] = [];

  // Normaliser les fins de ligne
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    errors.push({
      line: 0,
      message: 'Le fichier est vide ou ne contient que l\'en-tête.',
      severity: 'error',
    });
    return { entries, rowCount: 0, errors, warnings, delimiter: '|', encoding: 'utf-8' };
  }

  // Détecter le délimiteur depuis la première ligne
  const delimiter = detectDelimiter(lines[0]);

  // Valider l'en-tête
  const headerRow = lines[0].split(delimiter).map((col) => col.trim().replace(/^"|"$/g, ''));
  const headerWarnings = validateHeader(headerRow, delimiter);
  warnings.push(...headerWarnings);

  // Parser les lignes de données
  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1; // Numéro de ligne humain (1-indexed)
    const line = lines[i];

    let columns: string[];
    try {
      const parsed = parse(line, {
        delimiter,
        quote: '"',
        relax_quotes: true,
        relax_column_count: true,
      });
      columns = parsed[0] || [];
    } catch {
      // Fallback : split simple
      columns = line.split(delimiter).map((col) => col.trim().replace(/^"|"$/g, ''));
    }

    if (columns.length < FEC_COLUMN_COUNT) {
      errors.push({
        line: lineNum,
        message: `Nombre de colonnes insuffisant: ${columns.length}/${FEC_COLUMN_COUNT}`,
        severity: 'error',
      });
      continue;
    }

    // Vérifier les champs obligatoires
    let hasError = false;
    for (const reqCol of FEC_REQUIRED_COLUMNS) {
      const colIndex = FEC_COLUMN_NAMES.indexOf(reqCol);
      if (colIndex >= 0 && (!columns[colIndex] || columns[colIndex].trim() === '')) {
        errors.push({
          line: lineNum,
          column: reqCol,
          message: `Champ obligatoire vide: ${reqCol}`,
          severity: 'error',
        });
        hasError = true;
      }
    }

    // Valider les dates
    const ecritureDate = columns[3]?.trim() || '';
    if (ecritureDate && !FEC_DATE_REGEX.test(ecritureDate)) {
      errors.push({
        line: lineNum,
        column: 'EcritureDate',
        message: `Format de date invalide: "${ecritureDate}" (attendu: YYYYMMDD)`,
        severity: 'error',
      });
      hasError = true;
    }

    // Valider que débit et crédit ne sont pas tous les deux non-nuls
    const debit = parseFecAmount(columns[11] || '');
    const credit = parseFecAmount(columns[12] || '');
    if (debit !== 0 && credit !== 0) {
      errors.push({
        line: lineNum,
        message: `Débit (${debit}) et crédit (${credit}) ne peuvent pas être tous les deux non-nuls.`,
        severity: 'warning',
      });
    }

    if (hasError) continue;

    entries.push({
      journalCode: columns[0]?.trim() || '',
      journalLib: columns[1]?.trim() || '',
      ecritureNum: columns[2]?.trim() || '',
      ecritureDate: columns[3]?.trim() || '',
      compteNum: columns[4]?.trim() || '',
      compteLib: columns[5]?.trim() || '',
      compteAuxNum: columns[6]?.trim() || '',
      compteAuxLib: columns[7]?.trim() || '',
      pieceRef: columns[8]?.trim() || '',
      pieceDate: columns[9]?.trim() || '',
      ecritureLib: columns[10]?.trim() || '',
      debit,
      credit,
      ecritureLet: columns[13]?.trim() || '',
      dateLet: columns[14]?.trim() || '',
      validDate: columns[15]?.trim() || '',
      montantDevise: parseFecAmount(columns[16] || ''),
      idevise: columns[17]?.trim() || '',
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

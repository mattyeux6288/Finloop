import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import { parseFec, validateFecEntries } from '@finthesis/engine';
import { getCompteClasse, getCompteRacine, parseFecDate } from '@finthesis/shared';
import type { FecEntry } from '@finthesis/shared';

export async function processImport(
  fiscalYearId: string,
  filePath: string,
  filename: string,
) {
  const ext = path.extname(filename).toLowerCase();
  const fileType = ext === '.xlsx' || ext === '.xls' ? 'xlsx' : 'fec';
  const importId = uuid();

  // Créer l'entrée d'import
  await db('imports').insert({
    id: importId,
    fiscal_year_id: fiscalYearId,
    filename,
    file_type: fileType,
    status: 'processing',
  });

  try {
    // Lire et parser le fichier
    const content = fs.readFileSync(filePath, 'utf-8');
    const parseResult = parseFec(content);

    if (parseResult.errors.filter((e) => e.severity === 'error').length > 0) {
      await db('imports').where({ id: importId }).update({
        status: 'failed',
        error_log: JSON.stringify(parseResult.errors),
        row_count: 0,
      });
      return {
        importId,
        status: 'failed',
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        stats: null,
      };
    }

    // Valider les écritures
    const validation = validateFecEntries(parseResult.entries);

    if (!validation.isValid) {
      await db('imports').where({ id: importId }).update({
        status: 'failed',
        error_log: JSON.stringify(validation.errors),
        row_count: 0,
      });
      return {
        importId,
        status: 'failed',
        errors: validation.errors,
        warnings: validation.warnings,
        stats: validation.stats,
      };
    }

    // Insérer les écritures en batch
    await insertEcritures(importId, fiscalYearId, parseResult.entries);

    // Invalider le cache des rapports
    await db('computed_reports').where({ fiscal_year_id: fiscalYearId }).del();

    // Mettre à jour le statut
    await db('imports').where({ id: importId }).update({
      status: 'completed',
      row_count: parseResult.entries.length,
    });

    return {
      importId,
      status: 'completed',
      errors: [],
      warnings: [...parseResult.warnings, ...validation.warnings.map((w) => w.message)],
      stats: validation.stats,
    };
  } catch (err) {
    await db('imports').where({ id: importId }).update({
      status: 'failed',
      error_log: JSON.stringify({ message: err instanceof Error ? err.message : String(err) }),
    });
    throw err;
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

async function insertEcritures(
  importId: string,
  fiscalYearId: string,
  entries: FecEntry[],
): Promise<void> {
  const BATCH_SIZE = 100; // SQLite supporte moins de paramètres que PostgreSQL

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const rows = batch.map((entry) => ({
      id: uuid(),
      import_id: importId,
      fiscal_year_id: fiscalYearId,
      journal_code: entry.journalCode,
      journal_lib: entry.journalLib,
      ecriture_num: entry.ecritureNum,
      ecriture_date: parseFecDate(entry.ecritureDate)?.toISOString().split('T')[0] || entry.ecritureDate,
      compte_num: entry.compteNum,
      compte_lib: entry.compteLib,
      compte_aux_num: entry.compteAuxNum || null,
      compte_aux_lib: entry.compteAuxLib || null,
      piece_ref: entry.pieceRef || null,
      piece_date: entry.pieceDate ? (parseFecDate(entry.pieceDate)?.toISOString().split('T')[0] || null) : null,
      ecriture_lib: entry.ecritureLib,
      debit: entry.debit,
      credit: entry.credit,
      ecriture_let: entry.ecritureLet || null,
      date_let: entry.dateLet ? (parseFecDate(entry.dateLet)?.toISOString().split('T')[0] || null) : null,
      valid_date: entry.validDate ? (parseFecDate(entry.validDate)?.toISOString().split('T')[0] || null) : null,
      montant_devise: entry.montantDevise || null,
      idevise: entry.idevise || null,
      compte_classe: getCompteClasse(entry.compteNum),
      compte_racine: getCompteRacine(entry.compteNum),
    }));

    await db('ecritures').insert(rows);
  }
}

export async function getImportsForFiscalYear(fiscalYearId: string) {
  return db('imports')
    .where({ fiscal_year_id: fiscalYearId })
    .orderBy('imported_at', 'desc');
}

export async function deleteImport(importId: string) {
  const importRecord = await db('imports').where({ id: importId }).first();
  if (!importRecord) throw new Error('Import introuvable.');
  await db('ecritures').where({ import_id: importId }).del();
  await db('computed_reports').where({ fiscal_year_id: importRecord.fiscal_year_id }).del();
  await db('imports').where({ id: importId }).del();
}

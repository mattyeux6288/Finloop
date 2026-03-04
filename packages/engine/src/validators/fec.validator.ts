import type { FecEntry, FecParseError } from '@finthesis/shared';
import { FEC_DATE_REGEX, getCompteClasse } from '@finthesis/shared';

export interface ValidationResult {
  isValid: boolean;
  errors: FecParseError[];
  warnings: FecParseError[];
  stats: {
    totalEntries: number;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    journalCount: number;
    compteCount: number;
    dateRange: { start: string; end: string } | null;
  };
}

/**
 * Valide un ensemble d'écritures FEC parsées
 */
export function validateFecEntries(entries: FecEntry[]): ValidationResult {
  const errors: FecParseError[] = [];
  const warnings: FecParseError[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  const journals = new Set<string>();
  const comptes = new Set<string>();
  let minDate = '';
  let maxDate = '';

  // Regrouper les écritures par numéro pour vérifier l'équilibre
  const ecritureGroups = new Map<string, { debit: number; credit: number; lines: number[] }>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const lineNum = i + 2; // +2 car ligne 1 = en-tête

    // Valider le numéro de compte
    try {
      getCompteClasse(entry.compteNum);
    } catch {
      errors.push({
        line: lineNum,
        column: 'CompteNum',
        message: `Numéro de compte invalide: "${entry.compteNum}" (doit commencer par 1-7)`,
        severity: 'error',
      });
    }

    // Valider la date
    if (entry.ecritureDate && !FEC_DATE_REGEX.test(entry.ecritureDate)) {
      errors.push({
        line: lineNum,
        column: 'EcritureDate',
        message: `Format de date invalide: "${entry.ecritureDate}"`,
        severity: 'error',
      });
    }

    // Cumuler
    totalDebit += entry.debit;
    totalCredit += entry.credit;
    journals.add(entry.journalCode);
    comptes.add(entry.compteNum);

    // Date range
    if (entry.ecritureDate) {
      if (!minDate || entry.ecritureDate < minDate) minDate = entry.ecritureDate;
      if (!maxDate || entry.ecritureDate > maxDate) maxDate = entry.ecritureDate;
    }

    // Grouper par numéro d'écriture pour vérifier l'équilibre
    const key = `${entry.journalCode}-${entry.ecritureNum}`;
    const group = ecritureGroups.get(key) || { debit: 0, credit: 0, lines: [] };
    group.debit += entry.debit;
    group.credit += entry.credit;
    group.lines.push(lineNum);
    ecritureGroups.set(key, group);
  }

  // Vérifier l'équilibre de chaque écriture
  for (const [key, group] of ecritureGroups) {
    const diff = Math.abs(group.debit - group.credit);
    if (diff > 0.01) {
      warnings.push({
        line: group.lines[0],
        message: `Écriture ${key} déséquilibrée: débit=${group.debit.toFixed(2)}, crédit=${group.credit.toFixed(2)}, écart=${diff.toFixed(2)}`,
        severity: 'warning',
      });
    }
  }

  // Vérifier l'équilibre global
  const globalBalance = Math.round((totalDebit - totalCredit) * 100) / 100;
  if (Math.abs(globalBalance) > 0.01) {
    warnings.push({
      line: 0,
      message: `Balance globale déséquilibrée: débit=${totalDebit.toFixed(2)}, crédit=${totalCredit.toFixed(2)}, écart=${globalBalance.toFixed(2)}`,
      severity: 'warning',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalEntries: entries.length,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      balance: globalBalance,
      journalCount: journals.size,
      compteCount: comptes.size,
      dateRange: minDate ? { start: minDate, end: maxDate } : null,
    },
  };
}

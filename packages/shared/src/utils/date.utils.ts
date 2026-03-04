/**
 * Utilitaires pour les dates d'exercice fiscal
 */

const MONTH_LABELS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

/**
 * Parse une date FEC au format YYYYMMDD
 */
export function parseFecDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim().length !== 8) return null;
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Formate une date en YYYYMMDD (format FEC)
 */
export function formatFecDate(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Formate une date en format français : 01/01/2024
 */
export function formatDateFr(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Retourne le label court d'un mois (Jan, Fév, etc.)
 */
export function getMonthLabel(monthIndex: number): string {
  return MONTH_LABELS_FR[monthIndex] || '';
}

/**
 * Retourne le label YYYY-MM pour une date
 */
export function getYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Génère la liste des mois entre deux dates
 */
export function getMonthsBetween(start: Date, end: Date): { yearMonth: string; label: string }[] {
  const months: { yearMonth: string; label: string }[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= last) {
    months.push({
      yearMonth: getYearMonth(current),
      label: `${MONTH_LABELS_FR[current.getMonth()]} ${current.getFullYear()}`,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Vérifie si une date est dans un exercice fiscal
 */
export function isInFiscalYear(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

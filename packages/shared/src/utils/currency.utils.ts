/**
 * Utilitaires de formatage monétaire
 */

const eurFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const eurCompactFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formate un montant en euros : 1 234,56 €
 */
export function formatEur(amount: number): string {
  return eurFormatter.format(amount);
}

/**
 * Formate un montant en euros compact : 1,2 k€, 3,4 M€
 */
export function formatEurCompact(amount: number): string {
  return eurCompactFormatter.format(amount);
}

/**
 * Formate un pourcentage : 12,3 %
 */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

/**
 * Formate un nombre avec séparateurs : 1 234,56
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Parse un montant FEC (peut utiliser , ou . comme séparateur décimal)
 */
export function parseFecAmount(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remplacer la virgule par un point pour le parsing
  const cleaned = value.trim().replace(',', '.').replace(/\s/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

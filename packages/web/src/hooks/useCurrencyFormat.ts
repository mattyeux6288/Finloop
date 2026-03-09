import { useCallback } from 'react';
import { useDisplayStore } from '@/store/displayStore';
import { formatEur, formatEurCompact } from '@finthesis/shared';

/**
 * Hook qui retourne le formateur monétaire adapté au mode d'affichage (€ ou k€).
 * Utiliser `formatCurrency(amount)` à la place de `formatEur(amount)` directement.
 */
export function useCurrencyFormat() {
  const currencyMode = useDisplayStore((s) => s.currencyMode);

  const formatCurrency = useCallback(
    (amount: number): string => {
      return currencyMode === 'keur' ? formatEurCompact(amount) : formatEur(amount);
    },
    [currencyMode],
  );

  return { formatCurrency, currencyMode };
}

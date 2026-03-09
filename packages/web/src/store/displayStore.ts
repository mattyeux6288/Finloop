import { create } from 'zustand';

export type CurrencyDisplayMode = 'eur' | 'keur';

const LS_KEY = 'finloop_currency_mode';

interface DisplayState {
  currencyMode: CurrencyDisplayMode;
  toggleCurrencyMode: () => void;
  setCurrencyMode: (mode: CurrencyDisplayMode) => void;
}

export const useDisplayStore = create<DisplayState>((set) => ({
  currencyMode: (localStorage.getItem(LS_KEY) as CurrencyDisplayMode) || 'eur',

  toggleCurrencyMode: () =>
    set((state) => {
      const next = state.currencyMode === 'eur' ? 'keur' : 'eur';
      localStorage.setItem(LS_KEY, next);
      return { currencyMode: next };
    }),

  setCurrencyMode: (mode) => {
    localStorage.setItem(LS_KEY, mode);
    set({ currencyMode: mode });
  },
}));

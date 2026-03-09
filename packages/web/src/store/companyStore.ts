import { create } from 'zustand';
import type { Company, FiscalYear } from '@finthesis/shared';

const LS_COMPANY_KEY = 'finloop_company_id';
const LS_FY_KEY = 'finloop_fy_id';

interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  fiscalYears: FiscalYear[];
  selectedFiscalYear: FiscalYear | null;
  setCompanies: (companies: Company[]) => void;
  selectCompany: (company: Company | null) => void;
  updateCompanyInStore: (updated: Company) => void;
  setFiscalYears: (fiscalYears: FiscalYear[]) => void;
  selectFiscalYear: (fy: FiscalYear | null) => void;
  clearSession: () => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  selectedCompany: null,
  fiscalYears: [],
  selectedFiscalYear: null,

  setCompanies: (companies) => set({ companies }),

  selectCompany: (company) => {
    if (company) {
      localStorage.setItem(LS_COMPANY_KEY, company.id);
    } else {
      localStorage.removeItem(LS_COMPANY_KEY);
      localStorage.removeItem(LS_FY_KEY);
    }
    set({ selectedCompany: company, fiscalYears: [], selectedFiscalYear: null });
  },

  updateCompanyInStore: (updated) =>
    set((state) => ({
      companies: state.companies.map((c) => (c.id === updated.id ? updated : c)),
      selectedCompany: state.selectedCompany?.id === updated.id ? updated : state.selectedCompany,
    })),

  setFiscalYears: (fiscalYears) => set({ fiscalYears }),

  selectFiscalYear: (fy) => {
    if (fy) {
      localStorage.setItem(LS_FY_KEY, fy.id);
    } else {
      localStorage.removeItem(LS_FY_KEY);
    }
    set({ selectedFiscalYear: fy });
  },

  /** Appelé au logout : nettoie le localStorage */
  clearSession: () => {
    localStorage.removeItem(LS_COMPANY_KEY);
    localStorage.removeItem(LS_FY_KEY);
    set({ companies: [], selectedCompany: null, fiscalYears: [], selectedFiscalYear: null });
  },
}));

/** Helpers pour lire les IDs sauvegardés (utilisés dans App.tsx) */
export const getSavedCompanyId = () => localStorage.getItem(LS_COMPANY_KEY);
export const getSavedFyId = () => localStorage.getItem(LS_FY_KEY);

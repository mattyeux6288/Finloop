import { create } from 'zustand';
import type { Company, FiscalYear } from '@finthesis/shared';

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
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  selectedCompany: null,
  fiscalYears: [],
  selectedFiscalYear: null,

  setCompanies: (companies) => set({ companies }),
  selectCompany: (company) => set({ selectedCompany: company, fiscalYears: [], selectedFiscalYear: null }),
  updateCompanyInStore: (updated) =>
    set((state) => ({
      companies: state.companies.map((c) => (c.id === updated.id ? updated : c)),
      selectedCompany: state.selectedCompany?.id === updated.id ? updated : state.selectedCompany,
    })),
  setFiscalYears: (fiscalYears) => set({ fiscalYears }),
  selectFiscalYear: (fy) => set({ selectedFiscalYear: fy }),
}));

/**
 * Types pour les entreprises et exercices fiscaux
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  siren: string | null;
  siret: string | null;
  nafCode: string | null;
  address: string | null;
  dirigeant: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiscalYear {
  id: string;
  companyId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  createdAt: Date;
}

export interface CreateCompanyDto {
  name: string;
  siren?: string;
  siret?: string;
  nafCode?: string;
  address?: string;
  dirigeant?: string;
}

export interface CreateFiscalYearDto {
  label: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

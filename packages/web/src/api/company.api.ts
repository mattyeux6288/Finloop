import api from './client';
import type { ApiResponse, Company, FiscalYear } from '@finthesis/shared';

export async function getCompanies(): Promise<Company[]> {
  const { data } = await api.get<ApiResponse<Company[]>>('/companies');
  return data.data!;
}

export async function createCompany(payload: { name: string; siren?: string; siret?: string; nafCode?: string; address?: string }): Promise<Company> {
  const { data } = await api.post<ApiResponse<Company>>('/companies', payload);
  return data.data!;
}

export async function updateCompany(companyId: string, payload: { name?: string; siren?: string; siret?: string; nafCode?: string; address?: string }): Promise<Company> {
  const { data } = await api.put<ApiResponse<Company>>(`/companies/${companyId}`, payload);
  return data.data!;
}

export async function getFiscalYears(companyId: string): Promise<FiscalYear[]> {
  const { data } = await api.get<ApiResponse<FiscalYear[]>>(`/companies/${companyId}/fiscal-years`);
  return data.data!;
}

export async function createFiscalYear(companyId: string, payload: { label: string; startDate: string; endDate: string }): Promise<FiscalYear> {
  const { data } = await api.post<ApiResponse<FiscalYear>>(`/companies/${companyId}/fiscal-years`, payload);
  return data.data!;
}

export async function updateFiscalYear(companyId: string, fyId: string, payload: { label?: string; startDate?: string; endDate?: string }): Promise<FiscalYear> {
  const { data } = await api.put<ApiResponse<FiscalYear>>(`/companies/${companyId}/fiscal-years/${fyId}`, payload);
  return data.data!;
}

export async function deleteFiscalYear(companyId: string, fyId: string): Promise<void> {
  await api.delete(`/companies/${companyId}/fiscal-years/${fyId}`);
}

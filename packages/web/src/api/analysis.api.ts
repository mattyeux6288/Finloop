import api from './client';
import type { ApiResponse, DashboardData, Bilan, CompteDeResultat, Sig, RapportActiviteData, EcritureDetail, AccountMapping, UpdateOverrideDto } from '@finthesis/shared';

export async function getDashboard(fyId: string): Promise<DashboardData> {
  const { data } = await api.get<ApiResponse<DashboardData>>(`/fiscal-years/${fyId}/dashboard`);
  return data.data!;
}

export async function getBilan(fyId: string): Promise<Bilan> {
  const { data } = await api.get<ApiResponse<Bilan>>(`/fiscal-years/${fyId}/bilan`);
  return data.data!;
}

export async function getCompteDeResultat(fyId: string): Promise<CompteDeResultat> {
  const { data } = await api.get<ApiResponse<CompteDeResultat>>(`/fiscal-years/${fyId}/compte-resultat`);
  return data.data!;
}

export async function getSig(fyId: string): Promise<Sig> {
  const { data } = await api.get<ApiResponse<Sig>>(`/fiscal-years/${fyId}/sig`);
  return data.data!;
}

export async function uploadFile(fyId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  // Ne pas forcer Content-Type — axios détecte FormData et ajoute le boundary automatiquement
  const { data } = await api.post(`/fiscal-years/${fyId}/import`, formData);
  return data;
}

export async function uploadFileAutoDetect(companyId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  // Ne pas forcer Content-Type — axios détecte FormData et ajoute le boundary automatiquement
  const { data } = await api.post(`/companies/${companyId}/import`, formData);
  return data;
}

export interface ImportRecord {
  id: string;
  fiscal_year_id: string;
  filename: string;
  file_type: string;
  status: string;
  row_count: number | null;
  error_log: string | null;
  imported_at: string;
}

export async function getImports(fyId: string): Promise<ImportRecord[]> {
  const { data } = await api.get<ApiResponse<ImportRecord[]>>(`/fiscal-years/${fyId}/imports`);
  return data.data!;
}

export async function deleteImport(importId: string): Promise<void> {
  await api.delete(`/fiscal-years/imports/${importId}`);
}

export async function getRapportActivite(fyId: string): Promise<RapportActiviteData> {
  const { data } = await api.get<ApiResponse<RapportActiviteData>>(`/fiscal-years/${fyId}/rapport-activite`);
  return data.data!;
}

export async function getEcrituresByCompte(fyId: string, compteNum: string): Promise<EcritureDetail[]> {
  const { data } = await api.get<ApiResponse<EcritureDetail[]>>(`/fiscal-years/${fyId}/ecritures/${compteNum}`);
  return data.data!;
}

// ── Mapping de comptes ──

export async function getAccountMapping(companyId: string): Promise<AccountMapping | null> {
  const { data } = await api.get<ApiResponse<AccountMapping | null>>(`/companies/${companyId}/mapping`);
  return data.data ?? null;
}

export async function upsertAccountOverride(companyId: string, override: UpdateOverrideDto): Promise<void> {
  await api.put(`/companies/${companyId}/mapping/override`, override);
}

export async function deleteAccountOverride(companyId: string, compteNum: string): Promise<void> {
  await api.delete(`/companies/${companyId}/mapping/override/${compteNum}`);
}

export async function generateAiMapping(companyId: string, nafCode: string, fiscalYearId: string): Promise<{ overrides: any[]; count: number }> {
  const { data } = await api.post<ApiResponse<{ overrides: any[]; count: number }>>(`/companies/${companyId}/mapping/generate`, { nafCode, fiscalYearId });
  return data.data!;
}

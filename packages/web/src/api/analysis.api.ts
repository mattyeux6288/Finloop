import api from './client';
import type { ApiResponse, DashboardData, Bilan, CompteDeResultat, Sig } from '@finthesis/shared';

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
  const { data } = await api.post(`/fiscal-years/${fyId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

import { v4 as uuid } from 'uuid';
import { db } from '../config/database';

export async function getCompanies() {
  return db('companies').orderBy('name');
}

export async function getCompanyById(companyId: string) {
  const company = await db('companies').where({ id: companyId }).first();
  if (!company) throw new Error('Entreprise introuvable.');
  return company;
}

export async function createCompany(data: {
  name: string;
  siren?: string;
  siret?: string;
  nafCode?: string;
  address?: string;
}) {
  const id = uuid();
  await db('companies').insert({
    id,
    user_id: 'default',
    name: data.name,
    siren: data.siren || null,
    siret: data.siret || null,
    naf_code: data.nafCode || null,
    address: data.address || null,
  });
  return db('companies').where({ id }).first();
}

export async function updateCompany(companyId: string, data: {
  name?: string;
  siren?: string;
  siret?: string;
  nafCode?: string;
  address?: string;
}) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.siren !== undefined) updateData.siren = data.siren;
  if (data.siret !== undefined) updateData.siret = data.siret;
  if (data.nafCode !== undefined) updateData.naf_code = data.nafCode;
  if (data.address !== undefined) updateData.address = data.address;

  const count = await db('companies')
    .where({ id: companyId })
    .update(updateData);

  if (!count) throw new Error('Entreprise introuvable.');
  return db('companies').where({ id: companyId }).first();
}

export async function deleteCompany(companyId: string) {
  const deleted = await db('companies').where({ id: companyId }).del();
  if (!deleted) throw new Error('Entreprise introuvable.');
}

// Fiscal Years
export async function getFiscalYears(companyId: string) {
  return db('fiscal_years').where({ company_id: companyId }).orderBy('start_date', 'desc');
}

export async function getFiscalYearById(fyId: string) {
  const fy = await db('fiscal_years').where({ id: fyId }).first();
  if (!fy) throw new Error('Exercice fiscal introuvable.');
  return fy;
}

export async function createFiscalYear(companyId: string, data: {
  label: string;
  startDate: string;
  endDate: string;
}) {
  const id = uuid();
  await db('fiscal_years').insert({
    id,
    company_id: companyId,
    label: data.label,
    start_date: data.startDate,
    end_date: data.endDate,
  });
  return db('fiscal_years').where({ id }).first();
}

export async function updateFiscalYear(fyId: string, data: {
  label?: string;
  startDate?: string;
  endDate?: string;
}) {
  const updateData: Record<string, unknown> = {};
  if (data.label !== undefined) updateData.label = data.label;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.endDate !== undefined) updateData.end_date = data.endDate;

  if (Object.keys(updateData).length === 0) {
    throw new Error('Aucune donnée à mettre à jour.');
  }

  const count = await db('fiscal_years').where({ id: fyId }).update(updateData);
  if (!count) throw new Error('Exercice fiscal introuvable.');
  return db('fiscal_years').where({ id: fyId }).first();
}

export async function deleteFiscalYear(fyId: string) {
  const fy = await db('fiscal_years').where({ id: fyId }).first();
  if (!fy) throw new Error('Exercice fiscal introuvable.');

  // Suppression en cascade : rapports cachés → écritures → imports → exercice
  await db('computed_reports').where({ fiscal_year_id: fyId }).del();
  await db('ecritures').where({ fiscal_year_id: fyId }).del();
  await db('imports').where({ fiscal_year_id: fyId }).del();
  await db('fiscal_years').where({ id: fyId }).del();
}

/**
 * Vercel Serverless Function — wrape l'app Express pour la prod.
 *
 * Imports statiques = le bundler Vercel inclut les fichiers.
 * Knex est LAZY (Proxy dans database.ts) = better-sqlite3 jamais chargé.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../packages/server/dist/app';
import { db } from '../packages/server/dist/config/database';
import { createClient } from '@supabase/supabase-js';

// Force le bundler Vercel à inclure ces dépendances indirectes
// que @vercel/nft ne trace pas depuis les fichiers CJS compilés
import 'pg';             // Knex le charge dynamiquement via require(clientName)
import 'csv-parse/sync'; // @finthesis/engine l'utilise (sub-path export non tracé)
import '@anthropic-ai/sdk'; // Krokmou — force le bundler à inclure le SDK Claude

const app = createApp();
let initialized = false;

async function initialize() {
  if (initialized) return;

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('[finloop] Initializing...');
  console.log('[finloop] DATABASE_URL =', dbUrl ? '✓ set' : '✗ NOT SET');
  console.log('[finloop] SUPABASE_URL =', supabaseUrl ? '✓ set' : '✗ NOT SET');

  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL non définie. Ajoutez votre connection string Supabase dans Vercel → Settings → Environment Variables.'
    );
  }

  console.log('[finloop] Running migrations...');
  await db.migrate.latest();
  console.log('[finloop] Migrations done.');

  // --- 4 utilisateurs prédéfinis via Supabase Auth ---
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const seedUsers = [
    { email: 'dutheil.matthieu@outlook.fr', display_name: 'head_user',    role: 'admin', password: 'ADMIN-TEMP-2025!' },
    { email: 'test@finloop.fr',             display_name: 'user_test',    role: 'user',  password: 'INCREDIBLE' },
    { email: 'pascaldutheil@orange.fr',     display_name: 'user_dutheil', role: 'user',  password: 'DUTHEIL-TEMP-2025!' },
    { email: 'matthieu@ralyconseils.com',   display_name: 'user_raly',    role: 'user',  password: 'RALY-TEMP-2025!' },
  ];

  for (const u of seedUsers) {
    // Check if user already exists in custom table (by email)
    const existsLocal = await db('users').where({ email: u.email }).first();
    if (existsLocal) {
      // Update display_name and role in custom table
      await db('users').where({ id: existsLocal.id }).update({
        display_name: u.display_name,
        role: u.role,
      });
      console.log(`[finloop] User "${u.email}" already exists, updated.`);
      continue;
    }

    // Create in Supabase Auth (or fetch existing)
    let supabaseUserId: string;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { display_name: u.display_name },
      app_metadata: { role: u.role },
    });

    if (createErr) {
      // User might already exist in Supabase Auth — try to find by email
      if (createErr.message?.includes('already been registered') || createErr.status === 422) {
        const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUsers?.find((su: { email?: string }) => su.email === u.email);
        if (found) {
          supabaseUserId = found.id;
          // Update metadata
          await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
            user_metadata: { display_name: u.display_name },
            app_metadata: { role: u.role },
          });
          console.log(`[finloop] Supabase user "${u.email}" already exists, synced metadata.`);
        } else {
          console.error(`[finloop] Cannot find Supabase user "${u.email}":`, createErr.message);
          continue;
        }
      } else {
        console.error(`[finloop] Failed to create Supabase user "${u.email}":`, createErr.message);
        continue;
      }
    } else {
      supabaseUserId = created.user.id;
      console.log(`[finloop] Supabase user "${u.email}" created (${supabaseUserId}).`);
    }

    // Insert into custom users table with Supabase UUID
    await db('users').insert({
      id: supabaseUserId,
      email: u.email,
      display_name: u.display_name,
      role: u.role,
    });
    console.log(`[finloop] Custom user "${u.email}" inserted (${supabaseUserId}).`);
  }

  // Migrer les anciens users avec IDs non-UUID : transférer leurs companies puis supprimer
  const oldUsers = await db('users')
    .whereNotIn('email', seedUsers.map(u => u.email))
    .select('id');
  for (const old of oldUsers) {
    // Transfer companies to first matching seed user or skip
    await db('companies').where({ user_id: old.id }).update({ user_id: (await db('users').where({ email: 'test@finloop.fr' }).first())?.id });
    await db('users').where({ id: old.id }).del();
    console.log(`[finloop] Migrated old user "${old.id}" companies to user-test.`);
  }

  // Resolve user IDs by email (now Supabase UUIDs)
  const userTestRow = await db('users').where({ email: 'test@finloop.fr' }).first();
  const userDutheilRow = await db('users').where({ email: 'pascaldutheil@orange.fr' }).first();
  const userTestId = userTestRow?.id;
  const userDutheilId = userDutheilRow?.id;

  // --- Société Test + Exercice 2025 + FEC test ---
  const companyId = 'seed-company-test';
  const fyId      = 'seed-fy-2025';
  const importId  = 'seed-import-test';

  if (userTestId) {
    const companyExists = await db('companies').where({ id: companyId }).first();
    if (!companyExists) {
      console.log('[finloop] Seeding Société Test...');

      await db('companies').insert({
        id: companyId, user_id: userTestId, name: 'Société Test', siren: '123456789',
      });
      await db('fiscal_years').insert({
        id: fyId, company_id: companyId, label: 'Exercice 2025',
        start_date: '2025-01-01', end_date: '2025-12-31', is_closed: false,
      });
      await db('imports').insert({
        id: importId, fiscal_year_id: fyId, filename: 'fec_test_2025.txt',
        file_type: 'FEC', status: 'completed', row_count: 18,
      });

      const ecritures = [
        { num: 'OD001', date: '2025-01-01', j: 'OD', jl: 'Opérations Diverses', c: '101000', cl: 'Capital social', d: 0, cr: 50000, p: 'CONST-001' },
        { num: 'OD001', date: '2025-01-01', j: 'OD', jl: 'Opérations Diverses', c: '512000', cl: 'Banque', d: 50000, cr: 0, p: 'CONST-001' },
        { num: 'AC001', date: '2025-01-15', j: 'AC', jl: 'Achats', c: '607000', cl: 'Achats de marchandises', d: 15000, cr: 0, p: 'FA-2025-001' },
        { num: 'AC001', date: '2025-01-15', j: 'AC', jl: 'Achats', c: '445660', cl: 'TVA déductible', d: 3000, cr: 0, p: 'FA-2025-001' },
        { num: 'AC001', date: '2025-01-15', j: 'AC', jl: 'Achats', c: '401000', cl: 'Fournisseurs', d: 0, cr: 18000, p: 'FA-2025-001' },
        { num: 'VE001', date: '2025-02-10', j: 'VE', jl: 'Ventes', c: '411000', cl: 'Clients', d: 36000, cr: 0, p: 'FC-2025-001' },
        { num: 'VE001', date: '2025-02-10', j: 'VE', jl: 'Ventes', c: '707000', cl: 'Ventes de marchandises', d: 0, cr: 30000, p: 'FC-2025-001' },
        { num: 'VE001', date: '2025-02-10', j: 'VE', jl: 'Ventes', c: '445710', cl: 'TVA collectée', d: 0, cr: 6000, p: 'FC-2025-001' },
        { num: 'AC002', date: '2025-03-01', j: 'AC', jl: 'Achats', c: '613200', cl: 'Locations immobilières', d: 2500, cr: 0, p: 'FA-2025-010' },
        { num: 'AC002', date: '2025-03-01', j: 'AC', jl: 'Achats', c: '445660', cl: 'TVA déductible', d: 500, cr: 0, p: 'FA-2025-010' },
        { num: 'AC002', date: '2025-03-01', j: 'AC', jl: 'Achats', c: '401000', cl: 'Fournisseurs', d: 0, cr: 3000, p: 'FA-2025-010' },
        { num: 'OD002', date: '2025-04-30', j: 'OD', jl: 'Opérations Diverses', c: '641100', cl: 'Rémunérations du personnel', d: 8000, cr: 0, p: 'SAL-04' },
        { num: 'OD002', date: '2025-04-30', j: 'OD', jl: 'Opérations Diverses', c: '645100', cl: 'Charges sociales', d: 3200, cr: 0, p: 'SAL-04' },
        { num: 'OD002', date: '2025-04-30', j: 'OD', jl: 'Opérations Diverses', c: '421000', cl: 'Personnel rémunérations dues', d: 0, cr: 8000, p: 'SAL-04' },
        { num: 'OD002', date: '2025-04-30', j: 'OD', jl: 'Opérations Diverses', c: '431000', cl: 'Sécurité sociale', d: 0, cr: 3200, p: 'SAL-04' },
        { num: 'BQ001', date: '2025-03-15', j: 'BQ', jl: 'Banque', c: '512000', cl: 'Banque', d: 36000, cr: 0, p: 'REM-001' },
        { num: 'BQ001', date: '2025-03-15', j: 'BQ', jl: 'Banque', c: '411000', cl: 'Clients', d: 0, cr: 36000, p: 'REM-001' },
        { num: 'BQ002', date: '2025-04-10', j: 'BQ', jl: 'Banque', c: '401000', cl: 'Fournisseurs', d: 18000, cr: 0, p: 'VIR-001' },
        { num: 'BQ002', date: '2025-04-10', j: 'BQ', jl: 'Banque', c: '512000', cl: 'Banque', d: 0, cr: 18000, p: 'VIR-001' },
      ];

      let i = 0;
      for (const e of ecritures) {
        await db('ecritures').insert({
          id: `seed-ecriture-${String(++i).padStart(3, '0')}`,
          import_id: importId, fiscal_year_id: fyId,
          journal_code: e.j, journal_lib: e.jl,
          ecriture_num: e.num, ecriture_date: e.date,
          compte_num: e.c, compte_lib: e.cl,
          piece_ref: e.p, piece_date: e.date, ecriture_lib: e.cl,
          debit: e.d, credit: e.cr,
          compte_classe: parseInt(e.c[0], 10), compte_racine: e.c.slice(0, 3),
        });
      }
      console.log('[finloop] Seed data created.');
    } else if (companyExists.user_id !== userTestId) {
      // Reassign to correct user if needed
      await db('companies').where({ id: companyId }).update({ user_id: userTestId });
      console.log('[finloop] Reassigned Société Test to user-test.');
    }
  }

  // --- Société PARAME IMMOBILIER pour user-dutheil ---
  if (userDutheilId) {
    const parameId = 'seed-company-parame';
    const parameExists = await db('companies').where({ id: parameId }).first();
    if (!parameExists) {
      const parameByName = await db('companies').where({ name: 'PARAME IMMOBILIER' }).first();
      if (parameByName) {
        await db('companies').where({ id: parameByName.id }).update({ user_id: userDutheilId });
        console.log('[finloop] Reassigned PARAME IMMOBILIER to user-dutheil.');
      } else {
        await db('companies').insert({
          id: parameId, user_id: userDutheilId, name: 'PARAME IMMOBILIER',
        });
        console.log('[finloop] Seeded PARAME IMMOBILIER for user-dutheil.');
      }
    }
  }

  initialized = true;
  console.log('[finloop] Ready.');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await initialize();
  } catch (err) {
    console.error('[finloop] Init error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server initialization failed', details: String(err) }));
    return;
  }

  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Vercel Serverless Function — wrape l'app Express pour la prod.
 * Toutes les requêtes /api/* sont redirigées ici par vercel.json.
 */
import type { IncomingMessage, ServerResponse } from 'http';
// ⚠️ Import explicite de pg — Vercel's bundler ne le trace pas via Knex
import 'pg';
import { createApp } from '../packages/server/src/app';
import { db } from '../packages/server/src/config/database';

// Diagnostic au démarrage — visible dans les logs Vercel
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
console.log('[finloop] Serverless function loading...');
console.log('[finloop] DATABASE_URL  =', dbUrl ? '✓ set' : '✗ NOT SET');
console.log('[finloop] POSTGRES_URL  =', process.env.POSTGRES_URL ? '✓ set' : '✗ NOT SET');

// Vérification : une URL PostgreSQL doit être définie sur Vercel
if (process.env.VERCEL && !dbUrl) {
  throw new Error(
    '[finloop] FATAL: Aucune URL PostgreSQL trouvée. ' +
    'Ajoutez DATABASE_URL ou POSTGRES_URL dans Vercel → Settings → Environment Variables.'
  );
}

const app = createApp();
let initialized = false;

async function initialize() {
  if (initialized) return;

  console.log('[finloop] Running migrations...');
  await db.migrate.latest();
  console.log('[finloop] Migrations done.');

  // --- Utilisateur par défaut ---
  const userExists = await db('users').where({ id: 'default' }).first();
  if (!userExists) {
    await db('users').insert({
      id:            'default',
      email:         'local@finloop.fr',
      password_hash: 'none',
      display_name:  'Utilisateur local',
    });
    console.log('[finloop] Default user created.');
  }

  // --- Société Test + Exercice 2025 + FEC test ---
  const companyId   = 'seed-company-test';
  const fyId        = 'seed-fy-2025';
  const importId    = 'seed-import-test';

  const companyExists = await db('companies').where({ id: companyId }).first();
  if (!companyExists) {
    console.log('[finloop] Seeding Société Test...');

    await db('companies').insert({
      id:       companyId,
      user_id:  'default',
      name:     'Société Test',
      siren:    '123456789',
    });

    await db('fiscal_years').insert({
      id:         fyId,
      company_id: companyId,
      label:      'Exercice 2025',
      start_date: '2025-01-01',
      end_date:   '2025-12-31',
      is_closed:  false,
    });

    await db('imports').insert({
      id:             importId,
      fiscal_year_id: fyId,
      filename:       'fec_test_2025.txt',
      file_type:      'FEC',
      status:         'completed',
      row_count:      18,
    });

    // FEC test réaliste — 18 écritures couvrant les classes 1-7
    const ecritures = [
      // Constitution (JO - OD)
      { num: 'OD001', date: '2025-01-01', journal: 'OD', journalLib: 'Opérations Diverses',
        compte: '101000', compteLib: 'Capital social',            debit: 0,     credit: 50000, pieceRef: 'CONST-001' },
      { num: 'OD001', date: '2025-01-01', journal: 'OD', journalLib: 'Opérations Diverses',
        compte: '512000', compteLib: 'Banque',                    debit: 50000, credit: 0,     pieceRef: 'CONST-001' },

      // Achat marchandises janvier (AC)
      { num: 'AC001', date: '2025-01-15', journal: 'AC', journalLib: 'Achats',
        compte: '607000', compteLib: 'Achats de marchandises',    debit: 15000, credit: 0,     pieceRef: 'FA-2025-001' },
      { num: 'AC001', date: '2025-01-15', journal: 'AC', journalLib: 'Achats',
        compte: '445660', compteLib: 'TVA déductible sur ABS',    debit: 3000,  credit: 0,     pieceRef: 'FA-2025-001' },
      { num: 'AC001', date: '2025-01-15', journal: 'AC', journalLib: 'Achats',
        compte: '401000', compteLib: 'Fournisseurs',              debit: 0,     credit: 18000, pieceRef: 'FA-2025-001' },

      // Vente février (VE)
      { num: 'VE001', date: '2025-02-10', journal: 'VE', journalLib: 'Ventes',
        compte: '411000', compteLib: 'Clients',                   debit: 36000, credit: 0,     pieceRef: 'FC-2025-001' },
      { num: 'VE001', date: '2025-02-10', journal: 'VE', journalLib: 'Ventes',
        compte: '707000', compteLib: 'Ventes de marchandises',    debit: 0,     credit: 30000, pieceRef: 'FC-2025-001' },
      { num: 'VE001', date: '2025-02-10', journal: 'VE', journalLib: 'Ventes',
        compte: '445710', compteLib: 'TVA collectée',             debit: 0,     credit: 6000,  pieceRef: 'FC-2025-001' },

      // Loyer mars (AC)
      { num: 'AC002', date: '2025-03-01', journal: 'AC', journalLib: 'Achats',
        compte: '613200', compteLib: 'Locations immobilières',    debit: 2500,  credit: 0,     pieceRef: 'FA-2025-010' },
      { num: 'AC002', date: '2025-03-01', journal: 'AC', journalLib: 'Achats',
        compte: '445660', compteLib: 'TVA déductible sur ABS',    debit: 500,   credit: 0,     pieceRef: 'FA-2025-010' },
      { num: 'AC002', date: '2025-03-01', journal: 'AC', journalLib: 'Achats',
        compte: '401000', compteLib: 'Fournisseurs',              debit: 0,     credit: 3000,  pieceRef: 'FA-2025-010' },

      // Salaires avril (OD)
      { num: 'OD002', date: '2025-04-30', journal: 'OD', journalLib: 'Opérations Diverses',
        compte: '641100', compteLib: 'Rémunérations du personnel',debit: 8000,  credit: 0,     pieceRef: 'SAL-04-2025' },
      { num: 'OD002', date: '2025-04-30', journal: 'OD', journalLib: 'Opérations Diverses',
        compte: '645100', compteLib: 'Charges sociales patronales',debit: 3200, credit: 0,     pieceRef: 'SAL-04-2025' },
      { num: 'OD002', date: '2025-04-30', journal: 'OD', journalLib: 'Opérations Diverses',
        compte: '421000', compteLib: 'Personnel — Rémunérations dues', debit: 0, credit: 8000, pieceRef: 'SAL-04-2025' },
      { num: 'OD002', date: '2025-04-30', journal: 'OD', journalLib: 'Opérations Diverses',
        compte: '431000', compteLib: 'Sécurité sociale',          debit: 0,     credit: 3200,  pieceRef: 'SAL-04-2025' },

      // Paiement client (BQ)
      { num: 'BQ001', date: '2025-03-15', journal: 'BQ', journalLib: 'Banque',
        compte: '512000', compteLib: 'Banque',                    debit: 36000, credit: 0,     pieceRef: 'REM-001' },
      { num: 'BQ001', date: '2025-03-15', journal: 'BQ', journalLib: 'Banque',
        compte: '411000', compteLib: 'Clients',                   debit: 0,     credit: 36000, pieceRef: 'REM-001' },

      // Paiement fournisseur (BQ)
      { num: 'BQ002', date: '2025-04-10', journal: 'BQ', journalLib: 'Banque',
        compte: '401000', compteLib: 'Fournisseurs',              debit: 18000, credit: 0,     pieceRef: 'VIR-001' },
      // Contrepartie bancaire
      { num: 'BQ002', date: '2025-04-10', journal: 'BQ', journalLib: 'Banque',
        compte: '512000', compteLib: 'Banque',                    debit: 0,     credit: 18000, pieceRef: 'VIR-001' },
    ];

    let i = 0;
    for (const e of ecritures) {
      await db('ecritures').insert({
        id:              `seed-ecriture-${String(++i).padStart(3, '0')}`,
        import_id:       importId,
        fiscal_year_id:  fyId,
        journal_code:    e.journal,
        journal_lib:     e.journalLib,
        ecriture_num:    e.num,
        ecriture_date:   e.date,
        compte_num:      e.compte,
        compte_lib:      e.compteLib,
        piece_ref:       e.pieceRef,
        piece_date:      e.date,
        ecriture_lib:    e.compteLib,
        debit:           e.debit,
        credit:          e.credit,
        compte_classe:   parseInt(e.compte[0], 10),
        compte_racine:   e.compte.slice(0, 3),
      });
    }

    console.log('[finloop] Société Test + Exercice 2025 + 18 écritures FEC créées.');
  }

  initialized = true;
  console.log('[finloop] Ready.');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await initialize();
  } catch (err) {
    console.error('[finloop] Initialization error:', err);
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

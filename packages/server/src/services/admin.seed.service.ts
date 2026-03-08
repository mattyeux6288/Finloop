/**
 * Service de génération de données de test — FEC fictif 2024
 * Génère un exercice N-1 pour "Société Test" afin de permettre
 * la comparaison N vs N-1 dans le rapport d'activité.
 */

import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import { getCompteClasse, getCompteRacine } from '@finthesis/shared';

interface EcritureRow {
  id: string;
  import_id: string;
  fiscal_year_id: string;
  journal_code: string;
  journal_lib: string;
  ecriture_num: string;
  ecriture_date: string;
  compte_num: string;
  compte_lib: string;
  compte_aux_num: string | null;
  compte_aux_lib: string | null;
  piece_ref: string | null;
  piece_date: string | null;
  ecriture_lib: string;
  debit: number;
  credit: number;
  ecriture_let: string | null;
  date_let: string | null;
  valid_date: string | null;
  montant_devise: number | null;
  idevise: string | null;
  compte_classe: number;
  compte_racine: string;
}

function ecriture(
  importId: string,
  fyId: string,
  journal: string,
  journalLib: string,
  num: string,
  date: string,
  compteNum: string,
  compteLib: string,
  debit: number,
  credit: number,
  lib: string,
): EcritureRow {
  return {
    id: uuid(),
    import_id: importId,
    fiscal_year_id: fyId,
    journal_code: journal,
    journal_lib: journalLib,
    ecriture_num: num,
    ecriture_date: date,
    compte_num: compteNum,
    compte_lib: compteLib,
    compte_aux_num: null,
    compte_aux_lib: null,
    piece_ref: null,
    piece_date: null,
    ecriture_lib: lib,
    debit: Math.round(debit * 100) / 100,
    credit: Math.round(credit * 100) / 100,
    ecriture_let: null,
    date_let: null,
    valid_date: null,
    montant_devise: null,
    idevise: null,
    compte_classe: getCompteClasse(compteNum),
    compte_racine: getCompteRacine(compteNum),
  };
}

/**
 * Génère le FEC fictif 2024 pour la première entreprise nommée "Société Test"
 * (ou la première entreprise trouvée si le nom diffère).
 * Crée le fiscal year 2024 s'il n'existe pas, puis insère ~150 écritures.
 */
export async function seedFec2024(): Promise<{ fiscalYearId: string; rowsInserted: number; message: string }> {
  // 1. Trouver "Société Test" (ou première entreprise)
  let company = await db('companies').whereILike('name', '%test%').first();
  if (!company) {
    company = await db('companies').first();
  }
  if (!company) {
    throw new Error('Aucune entreprise trouvée. Créez d\'abord une entreprise.');
  }

  // 2. Vérifier si l'exercice 2024 existe déjà
  const existingFy = await db('fiscal_years')
    .where({ company_id: company.id })
    .whereBetween('start_date', ['2024-01-01', '2024-01-31'])
    .first();

  if (existingFy) {
    const existingImport = await db('imports').where({ fiscal_year_id: existingFy.id }).first();
    if (existingImport) {
      const rowCount = await db('ecritures').where({ fiscal_year_id: existingFy.id }).count('id as c').first();
      return {
        fiscalYearId: existingFy.id,
        rowsInserted: 0,
        message: `L'exercice 2024 existe déjà pour "${company.name}" avec ${rowCount?.c ?? 0} écritures. Aucune donnée ajoutée.`,
      };
    }
  }

  // 3. Créer le fiscal year 2024
  const fyId = existingFy?.id ?? uuid();
  if (!existingFy) {
    await db('fiscal_years').insert({
      id: fyId,
      company_id: company.id,
      label: 'Exercice 2024',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      is_closed: true,
    });
  }

  // 4. Créer un import "seed"
  const importId = uuid();
  await db('imports').insert({
    id: importId,
    fiscal_year_id: fyId,
    filename: 'FEC_fictif_2024.txt',
    file_type: 'fec',
    status: 'completed',
    row_count: 0, // mis à jour à la fin
  });

  // 5. Générer les écritures
  const rows: EcritureRow[] = [];
  let ecNum = 1;
  const nextNum = () => `EC2024-${String(ecNum++).padStart(4, '0')}`;

  // ── BILAN D'OUVERTURE (01/01/2024) ──
  const ouv = '2024-01-01';
  // Capital + réserves
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), ouv, '10600000', 'Réserves', 0, 45000, 'Bilan ouverture - réserves'));
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), ouv, '10100000', 'Capital', 0, 10000, 'Bilan ouverture - capital'));
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), ouv, '12000000', 'Résultat N-1', 0, 12000, 'Bilan ouverture - résultat N-1'));
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), ouv, '16400000', 'Emprunt bancaire', 0, 30000, 'Bilan ouverture - emprunt'));
  // Actif
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), ouv, '21800000', 'Matériel de bureau', 15000, 0, 'Bilan ouverture - immobilisations'));
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), ouv, '51200000', 'Banque', 82000, 0, 'Bilan ouverture - trésorerie'));

  // ── CA MENSUEL + TVA + RÈGLEMENT CLIENT ──
  // Objectif 2024 : ~190k€ HT (vs ~230k€ en 2025 → croissance ~20%)
  const monthlyCA = [
    { m: '01', ht: 13500, tva: 2700 },
    { m: '02', ht: 14000, tva: 2800 },
    { m: '03', ht: 16000, tva: 3200 },
    { m: '04', ht: 15000, tva: 3000 },
    { m: '05', ht: 17000, tva: 3400 },
    { m: '06', ht: 18000, tva: 3600 },
    { m: '07', ht: 12000, tva: 2400 },
    { m: '08', ht: 10000, tva: 2000 },
    { m: '09', ht: 18500, tva: 3700 },
    { m: '10', ht: 19000, tva: 3800 },
    { m: '11', ht: 20000, tva: 4000 },
    { m: '12', ht: 21000, tva: 4200 },
  ];

  for (const { m, ht, tva } of monthlyCA) {
    const ttc = ht + tva;
    const dateFacture = `2024-${m}-05`;
    const dateReg = `2024-${m}-28`;
    const facNum = `FAC2024-${m}`;

    // Facture client
    rows.push(ecriture(importId, fyId, 'VE', 'Ventes', nextNum(), dateFacture, '41100000', 'Clients', ttc, 0, `Facture ${facNum}`));
    rows.push(ecriture(importId, fyId, 'VE', 'Ventes', nextNum(), dateFacture, '70600000', 'Prestations de services', 0, ht, `Facture ${facNum}`));
    rows.push(ecriture(importId, fyId, 'VE', 'Ventes', nextNum(), dateFacture, '44571000', 'TVA collectée', 0, tva, `Facture ${facNum}`));

    // Règlement client
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateReg, '51200000', 'Banque', ttc, 0, `Règlement ${facNum}`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateReg, '41100000', 'Clients', 0, ttc, `Règlement ${facNum}`));
  }

  // ── SALAIRES MENSUELS ──
  // 1 salarié à 2 500€ brut + charges patronales ~1 050€
  for (const { m } of monthlyCA) {
    const brut = 2500;
    const net = 1950;
    const chargesPatronales = 1050;
    const dateRem = `2024-${m}-25`;
    const datePaie = `2024-${m}-28`;

    // Salaire brut
    rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), dateRem, '64100000', 'Rémunérations du personnel', brut, 0, `Salaire ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), dateRem, '42100000', 'Personnel - rémunérations dues', 0, net, `Salaire ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), dateRem, '43100000', 'Sécurité sociale', 0, brut - net, `Cotisations salariales ${m}/2024`));

    // Charges patronales
    rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), dateRem, '64500000', 'Charges de sécurité sociale patronales', chargesPatronales, 0, `Charges patronales ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), dateRem, '43100000', 'Sécurité sociale', 0, chargesPatronales, `Charges patronales ${m}/2024`));

    // Paiement salaire net
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), datePaie, '42100000', 'Personnel', net, 0, `Virement salaire ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), datePaie, '51200000', 'Banque', 0, net, `Virement salaire ${m}/2024`));
  }

  // ── LOYER MENSUEL (800 € HT) ──
  for (const { m } of monthlyCA) {
    const loyer = 800;
    const tvaLoyer = 0; // souvent exonéré
    const dateLoyer = `2024-${m}-01`;

    rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), dateLoyer, '61300000', 'Locations', loyer, 0, `Loyer ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), dateLoyer, '40100000', 'Fournisseurs', 0, loyer, `Loyer ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateLoyer, '40100000', 'Fournisseurs', loyer, 0, `Règlement loyer ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateLoyer, '51200000', 'Banque', 0, loyer, `Règlement loyer ${m}/2024`));
  }

  // ── HONORAIRES COMPTABLE (trimestriel, 600 € HT) ──
  for (const m of ['03', '06', '09', '12']) {
    const hon = 600;
    const tvaHon = 120;
    const dateHon = `2024-${m}-15`;

    rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), dateHon, '62200000', 'Honoraires', hon, 0, `Honoraires expert-comptable T${Math.ceil(Number(m) / 3)}/2024`));
    rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), dateHon, '44566000', 'TVA déductible', tvaHon, 0, `TVA honoraires`));
    rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), dateHon, '40100000', 'Fournisseurs', 0, hon + tvaHon, `Honoraires comptable`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateHon, '40100000', 'Fournisseurs', hon + tvaHon, 0, `Règlement honoraires`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateHon, '51200000', 'Banque', 0, hon + tvaHon, `Règlement honoraires`));
  }

  // ── ASSURANCES (annuel, 1 200 €) ──
  rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), '2024-01-15', '61600000', 'Assurances', 1200, 0, 'Assurance responsabilité civile 2024'));
  rows.push(ecriture(importId, fyId, 'AC', 'Achats', nextNum(), '2024-01-15', '40100000', 'Fournisseurs', 0, 1200, 'Assurance RC'));
  rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), '2024-01-15', '40100000', 'Fournisseurs', 1200, 0, 'Règlement assurance'));
  rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), '2024-01-15', '51200000', 'Banque', 0, 1200, 'Règlement assurance'));

  // ── REMBOURSEMENT EMPRUNT (mensuel, 500 €) ──
  for (const { m } of monthlyCA) {
    const capital = 400;
    const interet = 100;
    const dateEmpr = `2024-${m}-05`;

    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateEmpr, '16400000', 'Emprunt bancaire', capital, 0, `Remboursement emprunt ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateEmpr, '66100000', 'Intérêts bancaires', interet, 0, `Intérêts emprunt ${m}/2024`));
    rows.push(ecriture(importId, fyId, 'BQ', 'Banque', nextNum(), dateEmpr, '51200000', 'Banque', 0, capital + interet, `Prélèvement emprunt ${m}/2024`));
  }

  // ── AMORTISSEMENTS (annuel, 3 000 €) ──
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), '2024-12-31', '68110000', 'DAP immobilisations', 3000, 0, 'Amortissement matériel 2024'));
  rows.push(ecriture(importId, fyId, 'OD', 'Opérations diverses', nextNum(), '2024-12-31', '28180000', 'Amort. matériel de bureau', 0, 3000, 'Amortissement matériel 2024'));

  // 6. Insérer en batch
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db('ecritures').insert(rows.slice(i, i + BATCH));
  }

  // 7. Mettre à jour le compteur
  await db('imports').where({ id: importId }).update({ row_count: rows.length });

  // 8. Invalider le cache
  await db('computed_reports').where({ fiscal_year_id: fyId }).del();

  return {
    fiscalYearId: fyId,
    rowsInserted: rows.length,
    message: `FEC fictif 2024 généré pour "${company.name}" : ${rows.length} écritures insérées (exercice ${fyId}).`,
  };
}

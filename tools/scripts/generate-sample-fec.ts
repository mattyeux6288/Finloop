/**
 * Générateur de fichier FEC de test
 * Crée un fichier FEC réaliste pour une entreprise fictive sur un exercice de 12 mois
 *
 * Usage: npx tsx tools/scripts/generate-sample-fec.ts
 */

import fs from 'fs';
import path from 'path';

const DELIMITER = '|';
const YEAR = 2025;
const OUTPUT = path.resolve(__dirname, '../../sample-fec.txt');

// En-tête FEC standard (18 colonnes)
const HEADER = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompteAuxNum', 'CompteAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib',
  'Debit', 'Credit', 'EcritureLet', 'DateLet',
  'ValidDate', 'MontantDevise', 'Idevise',
].join(DELIMITER);

let ecritureNum = 1;

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, '0');
}

function fecDate(year: number, month: number, day: number): string {
  return `${year}${pad(month)}${pad(day)}`;
}

function amount(val: number): string {
  return val.toFixed(2).replace('.', ',');
}

function line(
  journal: string,
  journalLib: string,
  num: number,
  date: string,
  compte: string,
  compteLib: string,
  lib: string,
  debit: number,
  credit: number,
): string {
  return [
    journal, journalLib, `EC${pad(num, 6)}`, date,
    compte, compteLib, '', '',
    `FA${pad(num, 6)}`, date, lib,
    amount(debit), amount(credit), '', '',
    date, '', '',
  ].join(DELIMITER);
}

const lines: string[] = [HEADER];

// Générer les écritures pour chaque mois
for (let month = 1; month <= 12; month++) {
  const dateStr = fecDate(YEAR, month, 15);
  const dateFin = fecDate(YEAR, month, 28);

  // --- Ventes (journal VE) ---
  const ca = 25000 + Math.round(Math.random() * 15000); // CA entre 25k et 40k
  const num = ecritureNum++;
  // Client débit
  lines.push(line('VE', 'Ventes', num, dateStr, '411000', 'Clients', `Facture vente ${month}/${YEAR}`, ca * 1.2, 0));
  // Ventes de services crédit
  lines.push(line('VE', 'Ventes', num, dateStr, '706000', 'Prestations de services', `Prestations ${month}/${YEAR}`, 0, ca));
  // TVA collectée
  lines.push(line('VE', 'Ventes', num, dateStr, '445710', 'TVA collectée', `TVA ventes ${month}/${YEAR}`, 0, ca * 0.2));

  // Vente de marchandises (50% des mois)
  if (month % 2 === 0) {
    const vMarch = 8000 + Math.round(Math.random() * 5000);
    const numV = ecritureNum++;
    lines.push(line('VE', 'Ventes', numV, dateStr, '411000', 'Clients', `Vente marchandises ${month}/${YEAR}`, vMarch * 1.2, 0));
    lines.push(line('VE', 'Ventes', numV, dateStr, '707000', 'Ventes de marchandises', `Marchandises ${month}/${YEAR}`, 0, vMarch));
    lines.push(line('VE', 'Ventes', numV, dateStr, '445710', 'TVA collectée', `TVA marchandises ${month}/${YEAR}`, 0, vMarch * 0.2));
  }

  // --- Achats (journal AC) ---
  const achats = 5000 + Math.round(Math.random() * 5000);
  const numA = ecritureNum++;
  lines.push(line('AC', 'Achats', numA, dateStr, '601000', 'Achats matières premières', `Achats MP ${month}/${YEAR}`, achats, 0));
  lines.push(line('AC', 'Achats', numA, dateStr, '445660', 'TVA déductible', `TVA achats ${month}/${YEAR}`, achats * 0.2, 0));
  lines.push(line('AC', 'Achats', numA, dateStr, '401000', 'Fournisseurs', `Fournisseur ${month}/${YEAR}`, 0, achats * 1.2));

  // Achats de marchandises
  if (month % 2 === 0) {
    const aMarch = 4000 + Math.round(Math.random() * 3000);
    const numAM = ecritureNum++;
    lines.push(line('AC', 'Achats', numAM, dateStr, '607000', 'Achats de marchandises', `Achats march ${month}/${YEAR}`, aMarch, 0));
    lines.push(line('AC', 'Achats', numAM, dateStr, '445660', 'TVA déductible', `TVA march ${month}/${YEAR}`, aMarch * 0.2, 0));
    lines.push(line('AC', 'Achats', numAM, dateStr, '401000', 'Fournisseurs', `Fournisseur march ${month}/${YEAR}`, 0, aMarch * 1.2));
  }

  // --- Services extérieurs (journal AC) ---
  const loyer = 2500;
  const numL = ecritureNum++;
  lines.push(line('AC', 'Achats', numL, dateStr, '613000', 'Locations', `Loyer ${month}/${YEAR}`, loyer, 0));
  lines.push(line('AC', 'Achats', numL, dateStr, '401000', 'Fournisseurs', `Loyer ${month}/${YEAR}`, 0, loyer));

  const assurance = 500;
  const numAs = ecritureNum++;
  lines.push(line('AC', 'Achats', numAs, dateStr, '616000', 'Assurances', `Assurance ${month}/${YEAR}`, assurance, 0));
  lines.push(line('AC', 'Achats', numAs, dateStr, '401000', 'Fournisseurs', `Assurance ${month}/${YEAR}`, 0, assurance));

  // --- Salaires (journal SA) ---
  const salaireBrut = 12000;
  const chargesSociales = 5000;
  const salaireNet = 9500;
  const numS = ecritureNum++;
  lines.push(line('SA', 'Salaires', numS, dateFin, '641000', 'Rémunérations du personnel', `Salaires ${month}/${YEAR}`, salaireBrut, 0));
  lines.push(line('SA', 'Salaires', numS, dateFin, '645000', 'Charges sociales', `Charges sociales ${month}/${YEAR}`, chargesSociales, 0));
  lines.push(line('SA', 'Salaires', numS, dateFin, '421000', 'Personnel - rémunérations dues', `Net à payer ${month}/${YEAR}`, 0, salaireNet));
  lines.push(line('SA', 'Salaires', numS, dateFin, '431000', 'Sécurité sociale', `Cotisations ${month}/${YEAR}`, 0, chargesSociales + (salaireBrut - salaireNet)));

  // --- Banque (journal BQ) - encaissements clients ---
  const numB = ecritureNum++;
  lines.push(line('BQ', 'Banque', numB, dateFin, '512000', 'Banque', `Encaissement clients ${month}/${YEAR}`, ca * 1.15, 0));
  lines.push(line('BQ', 'Banque', numB, dateFin, '411000', 'Clients', `Encaissement ${month}/${YEAR}`, 0, ca * 1.15));

  // Paiement fournisseurs
  const numBF = ecritureNum++;
  const paiementFourn = achats * 1.2 + loyer + assurance;
  lines.push(line('BQ', 'Banque', numBF, dateFin, '401000', 'Fournisseurs', `Paiement fourn ${month}/${YEAR}`, paiementFourn, 0));
  lines.push(line('BQ', 'Banque', numBF, dateFin, '512000', 'Banque', `Paiement fourn ${month}/${YEAR}`, 0, paiementFourn));

  // Paiement salaires
  const numBS = ecritureNum++;
  lines.push(line('BQ', 'Banque', numBS, dateFin, '421000', 'Personnel', `Paiement salaires ${month}/${YEAR}`, salaireNet, 0));
  lines.push(line('BQ', 'Banque', numBS, dateFin, '512000', 'Banque', `Paiement salaires ${month}/${YEAR}`, 0, salaireNet));
}

// --- Écritures annuelles ---
// Dotation aux amortissements
const numAmort = ecritureNum++;
const dateAnnu = fecDate(YEAR, 12, 31);
lines.push(line('OD', 'Opérations diverses', numAmort, dateAnnu, '681100', 'Dotations amort. immobilisations', 'Dotation amort 2025', 8000, 0));
lines.push(line('OD', 'Opérations diverses', numAmort, dateAnnu, '281000', 'Amort. immobilisations corporelles', 'Dotation amort 2025', 0, 8000));

// Impôt sur les sociétés (estimation)
const numIS = ecritureNum++;
lines.push(line('OD', 'Opérations diverses', numIS, dateAnnu, '695000', 'Impôts sur les bénéfices', 'IS estimé 2025', 15000, 0));
lines.push(line('OD', 'Opérations diverses', numIS, dateAnnu, '444000', 'État - IS', 'IS estimé 2025', 0, 15000));

// Immobilisations (solde d'ouverture)
const numOD = ecritureNum++;
lines.push(line('AN', 'À-nouveau', numOD, fecDate(YEAR, 1, 1), '211000', 'Terrains', 'Report à nouveau', 50000, 0));
lines.push(line('AN', 'À-nouveau', numOD, fecDate(YEAR, 1, 1), '218000', 'Matériel informatique', 'Report à nouveau', 30000, 0));
lines.push(line('AN', 'À-nouveau', numOD, fecDate(YEAR, 1, 1), '101000', 'Capital social', 'Report à nouveau', 0, 50000));
lines.push(line('AN', 'À-nouveau', numOD, fecDate(YEAR, 1, 1), '110000', 'Report à nouveau', 'Report à nouveau', 0, 20000));
lines.push(line('AN', 'À-nouveau', numOD, fecDate(YEAR, 1, 1), '512000', 'Banque', 'Report à nouveau', 15000, 0));
lines.push(line('AN', 'À-nouveau', numOD, fecDate(YEAR, 1, 1), '164000', 'Emprunt bancaire', 'Report à nouveau', 0, 25000));

const content = lines.join('\n');
fs.writeFileSync(OUTPUT, content, 'utf-8');

console.log(`FEC de test généré: ${OUTPUT}`);
console.log(`Nombre de lignes: ${lines.length - 1} (hors en-tête)`);
console.log(`Période: 01/01/${YEAR} - 31/12/${YEAR}`);

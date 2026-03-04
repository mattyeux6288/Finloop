import type { CompteClasse } from '../types';

/**
 * Extrait la classe (1er chiffre) d'un numéro de compte
 */
export function getCompteClasse(compteNum: string): CompteClasse {
  const classe = parseInt(compteNum.charAt(0), 10);
  if (classe < 1 || classe > 7) {
    throw new Error(`Classe de compte invalide: ${compteNum}`);
  }
  return classe as CompteClasse;
}

/**
 * Extrait la racine (3 premiers chiffres) d'un numéro de compte
 */
export function getCompteRacine(compteNum: string): string {
  return compteNum.substring(0, Math.min(3, compteNum.length));
}

/**
 * Vérifie si un numéro de compte commence par une des racines données
 */
export function compteStartsWith(compteNum: string, racines: string[]): boolean {
  return racines.some((racine) => compteNum.startsWith(racine));
}

/**
 * Détermine si un compte est un compte de bilan (classes 1-5)
 */
export function isCompteBilan(compteNum: string): boolean {
  const classe = getCompteClasse(compteNum);
  return classe >= 1 && classe <= 5;
}

/**
 * Détermine si un compte est un compte de résultat (classes 6-7)
 */
export function isCompteResultat(compteNum: string): boolean {
  const classe = getCompteClasse(compteNum);
  return classe === 6 || classe === 7;
}

/**
 * Détermine si un compte est un compte de charge (classe 6)
 */
export function isCompteCharge(compteNum: string): boolean {
  return getCompteClasse(compteNum) === 6;
}

/**
 * Détermine si un compte est un compte de produit (classe 7)
 */
export function isCompteProduit(compteNum: string): boolean {
  return getCompteClasse(compteNum) === 7;
}

/**
 * Calcule le solde d'un compte selon sa nature
 * - Comptes d'actif (2, 3, 5) et charges (6) : solde débiteur normal (débit - crédit)
 * - Comptes de passif (1, 4) et produits (7) : solde créditeur normal (crédit - débit)
 * - Classe 4 : dépend du sous-compte (40x = passif, 41x = actif)
 */
export function calculateSolde(
  compteNum: string,
  totalDebit: number,
  totalCredit: number,
): number {
  const classe = getCompteClasse(compteNum);
  const racine2 = compteNum.substring(0, 2);

  // Comptes à solde débiteur normal (actif + charges)
  if (classe === 2 || classe === 3 || classe === 5 || classe === 6) {
    return totalDebit - totalCredit;
  }

  // Comptes à solde créditeur normal (passif + produits)
  if (classe === 1 || classe === 7) {
    return totalCredit - totalDebit;
  }

  // Classe 4 - Tiers : dépend du sous-compte
  if (classe === 4) {
    if (racine2 === '40' || racine2 === '42' || racine2 === '43' || racine2 === '44') {
      // Fournisseurs, personnel, sécu, état = passif (créditeur)
      return totalCredit - totalDebit;
    }
    // Clients (41), débiteurs divers (46) = actif (débiteur)
    return totalDebit - totalCredit;
  }

  return totalDebit - totalCredit;
}

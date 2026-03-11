/**
 * Types pour le mapping de comptes personnalisé (SIG & Bilan)
 */

/** Cible d'un override de compte */
export interface OverrideTarget {
  type: 'sig' | 'bilan';
  /** Clé du palier SIG (ex: 'margeCommerciale', 'valeurAjoutee') — si type = 'sig' */
  sigStep?: string;
  /** Index de l'item dans SIG_FORMULAS[sigStep].items[] — si type = 'sig' */
  sigItemIndex?: number;
  /** Clé de la section bilan (ex: 'immobilisations', 'creances') — si type = 'bilan' */
  bilanSection?: string;
  /** Côté du bilan — si type = 'bilan' */
  bilanSide?: 'actif' | 'passif';
}

/** Override de mapping pour un compte individuel */
export interface AccountOverride {
  compteNum: string;
  compteLib: string;
  target: OverrideTarget;
}

/** Mapping complet sauvegardé pour une entreprise */
export interface AccountMapping {
  companyId: string;
  mappings: AccountOverride[];
  generatedByAi: boolean;
  nafCode?: string;
  createdAt: string;
  updatedAt: string;
}

/** DTO pour créer/modifier un override (depuis le drag & drop) */
export interface UpdateOverrideDto {
  compteNum: string;
  compteLib: string;
  target: OverrideTarget;
}

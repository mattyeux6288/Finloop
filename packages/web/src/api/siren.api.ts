/**
 * Lookup d'entreprise via l'API officielle française (données INSEE/SIRENE)
 * https://recherche-entreprises.api.gouv.fr
 * Gratuite, sans clé API, données publiques.
 */

export interface SirenResult {
  nom: string;
  siren: string;
  siret?: string;
  adresse?: string;
  nafCode?: string;
  nafLibelle?: string;
  effectifLabel?: string;
  categorie?: string;
  dirigeants: { nom: string; prenom?: string; qualite: string }[];
  formeJuridique?: string;
  dateCreation?: string;
}

export async function lookupSiren(siren: string): Promise<SirenResult | null> {
  if (siren.length !== 9 || !/^\d{9}$/.test(siren)) return null;

  const resp = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&page=1&per_page=1`,
    { signal: AbortSignal.timeout(5000) }
  );

  if (!resp.ok) return null;

  const json = await resp.json();
  const result = json?.results?.[0];
  if (!result) return null;

  const siege = result.siege || {};
  const dirigeants = (result.dirigeants || []).map((d: Record<string, string>) => ({
    nom: d.nom || d.denomination || '',
    prenom: d.prenoms || '',
    qualite: d.qualite || '',
  }));

  return {
    nom: result.nom_complet || result.nom_raison_sociale || '',
    siren: result.siren || siren,
    siret: siege.siret,
    adresse: siege.adresse || '',
    nafCode: siege.activite_principale?.replace('.', '') || '',
    nafLibelle: siege.libelle_activite_principale || '',
    effectifLabel: result.tranche_effectif_salarie
      ? formatEffectif(result.tranche_effectif_salarie)
      : undefined,
    categorie: result.categorie_entreprise || '',
    dirigeants,
    formeJuridique: result.nature_juridique
      ? formatFormeJuridique(result.nature_juridique)
      : undefined,
    dateCreation: result.date_creation
      ? new Date(result.date_creation).toLocaleDateString('fr-FR')
      : undefined,
  };
}

function formatEffectif(code: string): string {
  const map: Record<string, string> = {
    '00': '0 salarié',
    '01': '1 à 2 salariés',
    '02': '3 à 5 salariés',
    '03': '6 à 9 salariés',
    '11': '10 à 19 salariés',
    '12': '20 à 49 salariés',
    '21': '50 à 99 salariés',
    '22': '100 à 199 salariés',
    '31': '200 à 249 salariés',
    '32': '250 à 499 salariés',
    '41': '500 à 999 salariés',
    '42': '1 000 à 1 999 salariés',
    '51': '2 000 à 4 999 salariés',
    '52': '5 000 à 9 999 salariés',
    '53': '10 000 salariés et plus',
  };
  return map[code] ?? code;
}

function formatFormeJuridique(code: string): string {
  const map: Record<string, string> = {
    '1000': 'Entrepreneur individuel',
    '5499': 'SARL',
    '5710': 'SAS',
    '5720': 'SASU',
    '5308': 'EURL',
    '6540': 'SA à conseil d\'administration',
    '6552': 'SA à directoire',
    '9220': 'Association loi 1901',
  };
  return map[code] ?? `Forme juridique ${code}`;
}

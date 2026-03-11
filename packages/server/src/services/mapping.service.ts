import { v4 as uuid } from 'uuid';
import OpenAI from 'openai';
import { db } from '../config/database';
import { config } from '../config/env';
import type { AccountMapping, AccountOverride, UpdateOverrideDto, CompteAggregate } from '@finthesis/shared';
import { SIG_FORMULAS, SIG_COMPUTATION_ORDER, BILAN_MAPPING } from '@finthesis/shared';
import { NAF_BENCHMARKS } from '../data/naf-benchmarks';

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

/**
 * Récupère le mapping de comptes pour une entreprise
 */
export async function getMapping(companyId: string): Promise<AccountMapping | null> {
  const row = await db('account_mappings').where({ company_id: companyId }).first();
  if (!row) return null;

  return {
    companyId: row.company_id,
    mappings: typeof row.mappings === 'string' ? JSON.parse(row.mappings) : row.mappings,
    generatedByAi: Boolean(row.generated_by_ai),
    nafCode: row.naf_code || undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Sauvegarde un mapping complet (insert ou update)
 */
export async function saveMapping(
  companyId: string,
  overrides: AccountOverride[],
  generatedByAi: boolean,
  nafCode?: string,
): Promise<void> {
  const existing = await db('account_mappings').where({ company_id: companyId }).first();
  const now = new Date().toISOString();

  if (existing) {
    await db('account_mappings').where({ company_id: companyId }).update({
      mappings: JSON.stringify(overrides),
      generated_by_ai: generatedByAi,
      naf_code: nafCode || null,
      updated_at: now,
    });
  } else {
    await db('account_mappings').insert({
      id: uuid(),
      company_id: companyId,
      mappings: JSON.stringify(overrides),
      generated_by_ai: generatedByAi,
      naf_code: nafCode || null,
      created_at: now,
      updated_at: now,
    });
  }
}

/**
 * Ajoute ou remplace un override pour un compte individuel
 */
export async function upsertOverride(
  companyId: string,
  dto: UpdateOverrideDto,
): Promise<void> {
  const mapping = await getMapping(companyId);
  const overrides = mapping?.mappings || [];

  // Retirer l'ancien override de ce compte s'il existe
  const filtered = overrides.filter(o => o.compteNum !== dto.compteNum);
  filtered.push({
    compteNum: dto.compteNum,
    compteLib: dto.compteLib,
    target: dto.target,
  });

  await saveMapping(companyId, filtered, mapping?.generatedByAi || false, mapping?.nafCode);
}

/**
 * Supprime un override pour un compte individuel (retour au standard)
 */
export async function deleteOverride(
  companyId: string,
  compteNum: string,
): Promise<void> {
  const mapping = await getMapping(companyId);
  if (!mapping) return;

  const filtered = mapping.mappings.filter(o => o.compteNum !== compteNum);
  await saveMapping(companyId, filtered, mapping.generatedByAi, mapping.nafCode);
}

// ─────────────────────────────────────────────
// GÉNÉRATION IA
// ─────────────────────────────────────────────

/**
 * Génère un mapping IA basé sur le code NAF et les comptes réels.
 * Utilise GPT-4o avec un prompt d'expert-comptable.
 * En cas d'erreur → mapping vide (ne bloque pas).
 */
export async function generateAiMapping(
  companyId: string,
  nafCode: string,
  aggregates: CompteAggregate[],
): Promise<AccountOverride[]> {
  if (!config.openaiApiKey) {
    console.warn('[mapping] Pas de clé OpenAI — mapping IA ignoré');
    return [];
  }

  const benchmark = NAF_BENCHMARKS[nafCode];
  const secteurInfo = benchmark
    ? `Secteur : ${benchmark.libelle} (NAF ${nafCode})\nRatios moyens du secteur : marge brute ${benchmark.ratios.tauxMargeBrute}%, VA ${benchmark.ratios.tauxVA}%, EBE ${benchmark.ratios.tauxEBE}%`
    : `Code NAF : ${nafCode}`;

  // Construire la structure des SIG steps avec leurs items
  const sigStructure = SIG_COMPUTATION_ORDER.map(key => {
    const formula = SIG_FORMULAS[key];
    return {
      key,
      label: formula.label,
      items: formula.items.map((it, idx) => ({
        index: idx,
        label: it.label,
        compteRacines: it.compteRacines,
      })),
    };
  });

  // Construire la structure Bilan
  const bilanStructure = {
    actif: {
      immobilisations: BILAN_MAPPING.actif.immobilisations,
      stocks: BILAN_MAPPING.actif.stocks,
      creances: ['41', '45', '46', '47'],
      tresorerie: ['50', '51', '53', '54'],
    },
    passif: {
      capitauxPropres: BILAN_MAPPING.passif.capitauxPropres,
      dettesFinancieres: BILAN_MAPPING.passif.dettesFinancieres,
      dettesFournisseurs: ['40'],
      dettesFiscales: ['42', '43', '44'],
      autresDettes: ['45', '46', '47'],
    },
  };

  // Liste des comptes réels (filtrer les comptes non significatifs)
  const comptesReels = aggregates
    .filter(a => [6, 7].includes(a.compteClasse) || [1, 2, 3, 4, 5].includes(a.compteClasse))
    .map(a => ({
      compteNum: a.compteNum,
      compteLib: a.compteLib,
      classe: a.compteClasse,
      solde: Math.round((a.totalDebit - a.totalCredit) * 100) / 100,
    }))
    .filter(c => Math.abs(c.solde) > 0);

  const systemPrompt = `Tu es un expert-comptable français spécialisé dans l'analyse sectorielle.
Tu dois analyser les comptes d'une entreprise et identifier les comptes qui devraient être reclassés par rapport au mapping PCG standard.

${secteurInfo}

STRUCTURE SIG STANDARD (mapping par préfixes de comptes) :
${JSON.stringify(sigStructure, null, 2)}

STRUCTURE BILAN STANDARD (mapping par préfixes de comptes) :
${JSON.stringify(bilanStructure, null, 2)}

RÈGLES :
- Ne renvoie QUE les exceptions au mapping standard (comptes à reclasser)
- Un reclassement SIG doit cibler un step (clé) et un itemIndex existant
- Un reclassement Bilan doit cibler une section et un side (actif/passif)
- Sois conservateur : ne reclasse que si c'est clairement justifié par le secteur
- Les comptes 6xx et 7xx concernent le SIG, les comptes 1xx-5xx le Bilan
- Format JSON strict, pas de commentaire`;

  const userPrompt = `Voici les comptes réels de l'entreprise. Identifie ceux qui devraient être reclassés :

${JSON.stringify(comptesReels, null, 2)}

Réponds en JSON avec ce format exact :
{
  "overrides": [
    {
      "compteNum": "string",
      "compteLib": "string",
      "target": {
        "type": "sig" | "bilan",
        "sigStep": "string (clé SIG si type=sig)",
        "sigItemIndex": number (index dans items[] si type=sig),
        "bilanSection": "string (clé section si type=bilan)",
        "bilanSide": "actif" | "passif" (si type=bilan)
      }
    }
  ]
}

Si aucun reclassement n'est nécessaire, renvoie { "overrides": [] }.`;

  try {
    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const rawOverrides: any[] = parsed.overrides || [];

    // Valider chaque override
    const validSigSteps = new Set(SIG_COMPUTATION_ORDER);
    const validBilanSections = new Set([
      'immobilisations', 'stocks', 'creances', 'tresorerie',
      'capitauxPropres', 'dettesFinancieres', 'dettesFournisseurs', 'dettesFiscales', 'autresDettes',
    ]);

    const validOverrides: AccountOverride[] = [];

    for (const ov of rawOverrides) {
      if (!ov.compteNum || !ov.target) continue;

      // Vérifier que le compte existe réellement
      const realCompte = aggregates.find(a => a.compteNum === ov.compteNum);
      if (!realCompte) continue;

      if (ov.target.type === 'sig') {
        if (!validSigSteps.has(ov.target.sigStep)) continue;
        const formula = SIG_FORMULAS[ov.target.sigStep];
        if (!formula || ov.target.sigItemIndex >= formula.items.length) continue;
        validOverrides.push({
          compteNum: ov.compteNum,
          compteLib: ov.compteLib || realCompte.compteLib,
          target: {
            type: 'sig',
            sigStep: ov.target.sigStep,
            sigItemIndex: ov.target.sigItemIndex ?? 0,
          },
        });
      } else if (ov.target.type === 'bilan') {
        if (!validBilanSections.has(ov.target.bilanSection)) continue;
        if (!['actif', 'passif'].includes(ov.target.bilanSide)) continue;
        validOverrides.push({
          compteNum: ov.compteNum,
          compteLib: ov.compteLib || realCompte.compteLib,
          target: {
            type: 'bilan',
            bilanSection: ov.target.bilanSection,
            bilanSide: ov.target.bilanSide,
          },
        });
      }
    }

    // Sauvegarder
    await saveMapping(companyId, validOverrides, true, nafCode);
    console.log(`[mapping] IA a généré ${validOverrides.length} override(s) pour ${nafCode}`);

    return validOverrides;

  } catch (err: any) {
    console.error('[mapping] Erreur génération IA:', err?.message || err);
    // Graceful : ne bloque pas, crée un mapping vide
    await saveMapping(companyId, [], true, nafCode);
    return [];
  }
}

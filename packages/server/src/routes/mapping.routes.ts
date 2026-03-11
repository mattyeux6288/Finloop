import { Router, Request, Response } from 'express';
import * as mappingService from '../services/mapping.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { db } from '../config/database';

const router = Router();

router.use(authMiddleware);

/**
 * GET /companies/:companyId/mapping
 * Récupère le mapping de comptes d'une entreprise
 */
router.get('/:companyId/mapping', async (req: Request, res: Response) => {
  try {
    const mapping = await mappingService.getMapping(req.params.companyId as string);
    res.json({ success: true, data: mapping });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

/**
 * PUT /companies/:companyId/mapping/override
 * Ajoute ou remplace un override de compte (drag & drop)
 */
router.put('/:companyId/mapping/override', async (req: Request, res: Response) => {
  try {
    const { compteNum, compteLib, target } = req.body;
    if (!compteNum || !target || !target.type) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'compteNum et target requis' },
      });
      return;
    }

    await mappingService.upsertOverride(req.params.companyId as string, { compteNum, compteLib, target });

    // Invalider le cache des rapports
    await invalidateCompanyCache(req.params.companyId as string);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

/**
 * DELETE /companies/:companyId/mapping/override/:compteNum
 * Supprime un override (retour au mapping standard)
 */
router.delete('/:companyId/mapping/override/:compteNum', async (req: Request, res: Response) => {
  try {
    await mappingService.deleteOverride(req.params.companyId as string, req.params.compteNum as string);

    // Invalider le cache des rapports
    await invalidateCompanyCache(req.params.companyId as string);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

/**
 * POST /companies/:companyId/mapping/generate
 * Déclenche manuellement la génération IA du mapping
 */
router.post('/:companyId/mapping/generate', async (req: Request, res: Response) => {
  try {
    const { nafCode, fiscalYearId } = req.body;
    if (!nafCode || !fiscalYearId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'nafCode et fiscalYearId requis' },
      });
      return;
    }

    // Récupérer les agrégats pour l'exercice
    const aggregates = await getCompteAggregates(fiscalYearId);

    const overrides = await mappingService.generateAiMapping(
      req.params.companyId as string,
      nafCode,
      aggregates,
    );

    // Invalider le cache des rapports
    await invalidateCompanyCache(req.params.companyId as string);

    res.json({ success: true, data: { overrides, count: overrides.length } });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Invalide le cache computed_reports pour tous les exercices d'une entreprise
 */
async function invalidateCompanyCache(companyId: string): Promise<void> {
  const fiscalYears = await db('fiscal_years').where({ company_id: companyId }).select('id');
  const fyIds = fiscalYears.map((fy: any) => fy.id);
  if (fyIds.length > 0) {
    await db('computed_reports').whereIn('fiscal_year_id', fyIds).del();
  }
}

/**
 * Récupère les agrégats de comptes pour un exercice
 */
async function getCompteAggregates(fiscalYearId: string) {
  const rows = await db('ecritures')
    .where({ fiscal_year_id: fiscalYearId })
    .groupBy('compte_num', 'compte_lib', 'compte_classe', 'compte_racine')
    .select(
      'compte_num as compteNum',
      'compte_lib as compteLib',
      'compte_classe as compteClasse',
      'compte_racine as compteRacine',
    )
    .sum('debit as totalDebit')
    .sum('credit as totalCredit');

  return rows.map((r: any) => ({
    compteNum: String(r.compteNum),
    compteLib: String(r.compteLib),
    compteClasse: Number(r.compteClasse) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    compteRacine: String(r.compteRacine),
    totalDebit: Number(r.totalDebit) || 0,
    totalCredit: Number(r.totalCredit) || 0,
    solde: (Number(r.totalDebit) || 0) - (Number(r.totalCredit) || 0),
  }));
}

export default router;

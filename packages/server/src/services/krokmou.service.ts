import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import { config } from '../config/env';
import * as analysisService from './analysis.service';

// ── Claude API client ──
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// ── Contexte financier ──

async function buildFinancialContext(fiscalYearId: string): Promise<string> {
  // Récupérer toutes les données financières en parallèle (utilise le cache existant)
  const [dashboard, bilan, resultat, sig] = await Promise.all([
    analysisService.getDashboard(fiscalYearId),
    analysisService.getBilan(fiscalYearId),
    analysisService.getCompteDeResultat(fiscalYearId),
    analysisService.getSig(fiscalYearId),
  ]);

  // Infos entreprise
  const fy = await db('fiscal_years').where({ id: fiscalYearId }).first();
  const company = fy ? await db('companies').where({ id: fy.company_id }).first() : null;

  // Documents PDF uploadés
  const documents = await db('krokmou_documents')
    .where({ fiscal_year_id: fiscalYearId })
    .select('filename', 'extracted_text');

  let context = `## Entreprise\n`;
  context += `Nom : ${company?.name || 'Inconnue'}\n`;
  context += `SIREN : ${company?.siren || 'Non renseigne'}\n`;
  context += `Exercice : ${fy?.label || ''} (${fy?.start_date} au ${fy?.end_date})\n\n`;

  context += `## KPIs\n${JSON.stringify(dashboard.kpis, null, 2)}\n\n`;
  context += `## Chiffre d'affaires mensuel\n${JSON.stringify(dashboard.revenueMonthly, null, 2)}\n\n`;
  context += `## Repartition des charges (top 10)\n${JSON.stringify(dashboard.expenseBreakdown, null, 2)}\n\n`;
  context += `## Bilan\n${JSON.stringify(bilan, null, 2)}\n\n`;
  context += `## Compte de resultat\n${JSON.stringify(resultat, null, 2)}\n\n`;
  context += `## Soldes Intermediaires de Gestion (SIG)\n${JSON.stringify(sig, null, 2)}\n\n`;

  if (documents.length > 0) {
    context += `## Documents PDF uploades\n`;
    for (const doc of documents) {
      // Tronquer le texte du PDF à 50 000 caractères max par document
      const text = doc.extracted_text.length > 50000
        ? doc.extracted_text.substring(0, 50000) + '\n[... texte tronque ...]'
        : doc.extracted_text;
      context += `### ${doc.filename}\n${text}\n\n`;
    }
  }

  return context;
}

function buildSystemPrompt(financialContext: string): string {
  return `Tu es Krokmou, un assistant expert en analyse financiere francaise.
Tu travailles pour le cabinet Raly Conseils et utilises l'application Finloop.

Ton role :
- Analyser les donnees financieres de l'entreprise selectionnee
- Repondre aux questions sur les KPIs, le bilan, le compte de resultat, les SIG
- Donner des recommandations strategiques basees sur les chiffres
- Expliquer les concepts comptables et financiers en termes clairs
- Comparer les indicateurs aux normes sectorielles quand c'est pertinent

Regles :
- Reponds toujours en francais
- Sois precis avec les chiffres, cite les montants exacts
- Utilise le format monetaire francais (ex: 150 000,00 EUR)
- Si une donnee manque, dis-le clairement plutot que de supposer
- Sois concis mais complet dans tes analyses
- Structure tes reponses avec des titres et des listes pour la lisibilite

Voici les donnees financieres de l'entreprise pour l'exercice en cours :

${financialContext}`;
}

// ── Chat ──

export async function sendMessage(
  fiscalYearId: string,
  userId: string,
  conversationId: string | null,
  userMessage: string,
): Promise<{ conversationId: string; assistantMessage: string }> {
  // Créer ou récupérer la conversation
  let convId = conversationId;
  if (!convId) {
    convId = uuid();
    await db('krokmou_conversations').insert({
      id: convId,
      fiscal_year_id: fiscalYearId,
      user_id: userId,
      title: userMessage.substring(0, 100),
    });
  }

  // Sauvegarder le message utilisateur
  await db('krokmou_messages').insert({
    id: uuid(),
    conversation_id: convId,
    role: 'user',
    content: userMessage,
  });

  // Charger tout l'historique
  const history = await db('krokmou_messages')
    .where({ conversation_id: convId })
    .orderBy('created_at', 'asc')
    .select('role', 'content');

  // Construire le contexte financier + appeler Claude
  const financialContext = await buildFinancialContext(fiscalYearId);
  const systemPrompt = buildSystemPrompt(financialContext);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: history.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const assistantContent = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');

  // Sauvegarder la réponse
  await db('krokmou_messages').insert({
    id: uuid(),
    conversation_id: convId,
    role: 'assistant',
    content: assistantContent,
  });

  // Mettre à jour le timestamp de conversation
  await db('krokmou_conversations')
    .where({ id: convId })
    .update({ updated_at: db.fn.now() });

  return { conversationId: convId, assistantMessage: assistantContent };
}

// ── Conversations CRUD ──

export async function getConversations(fiscalYearId: string, userId: string) {
  return db('krokmou_conversations')
    .where({ fiscal_year_id: fiscalYearId, user_id: userId })
    .orderBy('updated_at', 'desc')
    .select('id', 'title', 'created_at', 'updated_at');
}

export async function getConversationMessages(conversationId: string) {
  return db('krokmou_messages')
    .where({ conversation_id: conversationId })
    .orderBy('created_at', 'asc')
    .select('id', 'role', 'content', 'created_at');
}

export async function deleteConversation(conversationId: string) {
  const deleted = await db('krokmou_conversations').where({ id: conversationId }).del();
  if (!deleted) throw new Error('Conversation introuvable.');
}

// ── Documents PDF ──

export async function uploadDocument(
  fiscalYearId: string,
  userId: string,
  filePath: string,
  filename: string,
): Promise<{ id: string; filename: string; pageCount: number }> {
  const fs = await import('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;

  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);

  const docId = uuid();
  await db('krokmou_documents').insert({
    id: docId,
    fiscal_year_id: fiscalYearId,
    user_id: userId,
    filename,
    extracted_text: parsed.text,
    page_count: parsed.numpages,
  });

  // Nettoyage du fichier temporaire
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }

  return { id: docId, filename, pageCount: parsed.numpages };
}

export async function getDocuments(fiscalYearId: string) {
  return db('krokmou_documents')
    .where({ fiscal_year_id: fiscalYearId })
    .select('id', 'filename', 'page_count', 'uploaded_at');
}

export async function deleteDocument(documentId: string) {
  const deleted = await db('krokmou_documents').where({ id: documentId }).del();
  if (!deleted) throw new Error('Document introuvable.');
}

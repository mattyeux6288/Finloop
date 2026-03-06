import { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCompanyStore } from '@/store/companyStore';
import * as krokmouApi from '@/api/krokmou.api';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  FileText,
  Upload,
  Loader2,
  Bot,
  User,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import type { KrokmouConversation, KrokmouMessage, KrokmouDocument } from '@finthesis/shared';

export function KrokmouPage() {
  const { selectedFiscalYear } = useCompanyStore();

  // Conversations
  const [conversations, setConversations] = useState<KrokmouConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<KrokmouMessage[]>([]);

  // Input
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<KrokmouDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docsOpen, setDocsOpen] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fyId = selectedFiscalYear?.id;

  // ── Charger les conversations ──
  useEffect(() => {
    if (!fyId) return;
    krokmouApi.getConversations(fyId).then(setConversations).catch(() => {});
    krokmouApi.getDocuments(fyId).then(setDocuments).catch(() => {});
  }, [fyId]);

  // ── Charger les messages quand on change de conversation ──
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    krokmouApi.getMessages(activeConvId).then(setMessages).catch(() => {});
  }, [activeConvId]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Envoyer un message ──
  const handleSend = async () => {
    if (!fyId || !input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);

    // Afficher immédiatement le message utilisateur
    const tempUserMsg: KrokmouMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await krokmouApi.sendMessage(fyId, userMsg, activeConvId || undefined);

      // Mettre à jour l'ID de conversation si c'est la première
      if (!activeConvId) {
        setActiveConvId(result.conversationId);
        // Rafraîchir la liste des conversations
        const convs = await krokmouApi.getConversations(fyId);
        setConversations(convs);
      }

      // Ajouter la réponse de l'assistant
      const assistantMsg: KrokmouMessage = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: result.assistantMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: KrokmouMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Erreur : ${err?.response?.data?.error?.message || err?.message || 'Erreur inconnue'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // ── Nouvelle conversation ──
  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    textareaRef.current?.focus();
  };

  // ── Supprimer une conversation ──
  const handleDeleteConv = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;
    await krokmouApi.deleteConversation(convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  // ── Upload PDF ──
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!fyId || acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await krokmouApi.uploadDocument(fyId, file);
        }
        const docs = await krokmouApi.getDocuments(fyId);
        setDocuments(docs);
      } catch {
        /* ignore */
      } finally {
        setUploading(false);
      }
    },
    [fyId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024,
  });

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    await krokmouApi.deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // ── Keyboard ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedFiscalYear) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Selectionnez une entreprise et un exercice pour utiliser Krokmou.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      {/* ── Colonne gauche : conversations ── */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-gray-400 text-center mt-4">Aucune conversation</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors group ${
                activeConvId === conv.id
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{conv.title || 'Sans titre'}</span>
              <button
                onClick={(e) => handleDeleteConv(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Centre : chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot className="w-12 h-12 mb-3 text-accent-400" />
              <p className="text-lg font-medium text-gray-500">Krokmou IA</p>
              <p className="text-sm mt-1">Posez une question sur vos donnees financieres</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-accent-600" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Krokmou reflechit...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Colonne droite : documents PDF ── */}
      <aside
        className={`bg-white border-l border-gray-200 flex flex-col shrink-0 transition-all duration-200 ${
          docsOpen ? 'w-64' : 'w-10'
        }`}
      >
        <button
          onClick={() => setDocsOpen((o) => !o)}
          className="p-2.5 border-b border-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center"
        >
          {docsOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {docsOpen && (
          <>
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Documents PDF
              </h3>
            </div>

            {/* Dropzone */}
            <div className="p-3">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-accent-400 bg-accent-50'
                    : 'border-gray-300 hover:border-accent-400'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-accent-500" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">
                      Deposez un PDF
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Liste des documents */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group"
                >
                  <FileText className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{doc.filename}</p>
                    <p className="text-[10px] text-gray-400">
                      {doc.page_count ? `${doc.page_count} pages` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

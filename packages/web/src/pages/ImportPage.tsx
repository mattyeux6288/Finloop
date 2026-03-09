import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCompanyStore } from '@/store/companyStore';
import { uploadFileAutoDetect, getImports, deleteImport, type ImportRecord } from '@/api/analysis.api';
import { getFiscalYears } from '@/api/company.api';
import { Upload, CheckCircle, XCircle, FileText, Trash2, X, Clock, AlertTriangle, CalendarCheck } from 'lucide-react';

interface ImportResult {
  status: string;
  importId?: string | null;
  fiscalYear?: {
    id: string;
    label: string;
    start_date: string;
    end_date: string;
    created: boolean;
  } | null;
  stats?: Record<string, unknown>;
  errors?: unknown[];
  warnings?: string[];
}

export function ImportPage() {
  const { selectedCompany, selectedFiscalYear, setFiscalYears, selectFiscalYear } = useCompanyStore();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Import history
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [importsLoading, setImportsLoading] = useState(false);
  const [deletingImport, setDeletingImport] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Charger les imports quand l'exercice change
  useEffect(() => {
    if (!selectedFiscalYear) {
      setImports([]);
      return;
    }
    loadImports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiscalYear?.id]);

  async function loadImports() {
    if (!selectedFiscalYear) return;
    setImportsLoading(true);
    try {
      const data = await getImports(selectedFiscalYear.id);
      setImports(data);
    } catch {
      // silently fail
    } finally {
      setImportsLoading(false);
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedCompany || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setResult(null);

    try {
      const response = await uploadFileAutoDetect(selectedCompany.id, file);
      setResult(response.data);

      // Auto-sélectionner l'exercice créé/détecté
      if (response.data?.fiscalYear) {
        const fys = await getFiscalYears(selectedCompany.id);
        setFiscalYears(fys);
        const matchedFy = fys.find((fy: { id: string }) => fy.id === response.data.fiscalYear.id);
        if (matchedFy) {
          selectFiscalYear(matchedFy);
        }
      }
    } catch (err) {
      setResult({ status: 'failed', errors: [{ message: err instanceof Error ? err.message : 'Erreur' }] });
    } finally {
      setUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const handleDeleteImport = async (importId: string) => {
    try {
      await deleteImport(importId);
      setDeletingImport(null);
      setDeleteMessage('Import supprimé avec ses écritures.');
      await loadImports();
      setTimeout(() => setDeleteMessage(''), 3000);
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: !selectedCompany || uploading,
  });

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDateShort = (d: string) => {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Sélectionnez une entreprise pour importer des données.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Importer des données comptables</h2>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Déposez le fichier ici...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">
              Glissez-déposez un fichier FEC, CSV ou Excel
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou cliquez pour sélectionner un fichier (.txt, .csv, .xlsx)
            </p>
            <p className="text-xs text-gray-400 mt-2">
              L'exercice fiscal sera détecté automatiquement à partir des dates du fichier.
            </p>
          </>
        )}
      </div>

      {uploading && (
        <div className="flex items-center gap-3 bg-blue-50 text-blue-700 rounded-lg p-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Import en cours...</span>
        </div>
      )}

      {result && (
        <div className={`rounded-lg p-5 ${result.status === 'completed' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${result.status === 'completed' ? 'text-green-700' : 'text-red-700'}`}>
              {result.status === 'completed' ? 'Import réussi' : 'Import échoué'}
            </span>
          </div>

          {/* Info exercice fiscal détecté/créé */}
          {result.status === 'completed' && result.fiscalYear && (
            <div className="flex items-center gap-2 mb-3 text-sm text-green-700 bg-green-100 rounded-lg px-3 py-2">
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>
                {result.fiscalYear.created
                  ? `Exercice fiscal créé : ${result.fiscalYear.label} (${formatDateShort(result.fiscalYear.start_date)} – ${formatDateShort(result.fiscalYear.end_date)})`
                  : `Exercice fiscal détecté : ${result.fiscalYear.label}`
                }
              </span>
            </div>
          )}

          {result.stats && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(result.stats).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {result.errors && Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-red-700">Erreurs:</p>
              {result.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                  <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{typeof err === 'object' && err !== null && 'message' in err ? String((err as Record<string, unknown>).message) : String(err)}</span>
                </div>
              ))}
              {result.errors.length > 10 && (
                <p className="text-sm text-red-500">... et {result.errors.length - 10} autres erreurs</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Historique des imports */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Imports précédents</h3>

        {deleteMessage && (
          <div className="rounded-lg p-3 text-sm bg-green-50 text-green-700 mb-4">
            {deleteMessage}
          </div>
        )}

        {!selectedFiscalYear ? (
          <p className="text-sm text-gray-500 py-4">Importez un fichier FEC pour voir l'historique.</p>
        ) : importsLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            Chargement...
          </div>
        ) : imports.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Aucun import pour cet exercice.</p>
        ) : (
          <div className="space-y-3">
            {imports.map((imp) => (
              <div key={imp.id} className="border border-gray-200 rounded-lg p-4">
                {deletingImport === imp.id ? (
                  /* Mode confirmation suppression */
                  <div className="space-y-3">
                    <p className="text-sm text-red-700 font-medium">
                      Supprimer &quot;{imp.filename}&quot; ? Toutes les écritures importées seront supprimées.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteImport(imp.id)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Confirmer
                      </button>
                      <button
                        onClick={() => setDeletingImport(null)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Mode affichage */
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{imp.filename}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(imp.imported_at)}
                          </span>
                          {imp.row_count != null && (
                            <span>{imp.row_count} écritures</span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            imp.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : imp.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {imp.status === 'completed' ? (
                              <><CheckCircle className="w-3 h-3" /> Réussi</>
                            ) : imp.status === 'failed' ? (
                              <><AlertTriangle className="w-3 h-3" /> Échoué</>
                            ) : (
                              <><Clock className="w-3 h-3" /> En cours</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeletingImport(imp.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer cet import"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

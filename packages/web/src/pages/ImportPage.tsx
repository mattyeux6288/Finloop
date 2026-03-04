import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCompanyStore } from '@/store/companyStore';
import { uploadFile } from '@/api/analysis.api';
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react';

export function ImportPage() {
  const { selectedFiscalYear } = useCompanyStore();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ status: string; stats?: Record<string, unknown>; errors?: unknown[] } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedFiscalYear || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setResult(null);

    try {
      const response = await uploadFile(selectedFiscalYear.id, file);
      setResult(response.data);
    } catch (err) {
      setResult({ status: 'failed', errors: [{ message: err instanceof Error ? err.message : 'Erreur' }] });
    } finally {
      setUploading(false);
    }
  }, [selectedFiscalYear]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: !selectedFiscalYear || uploading,
  });

  if (!selectedFiscalYear) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Sélectionnez un exercice fiscal pour importer des données.
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
    </div>
  );
}

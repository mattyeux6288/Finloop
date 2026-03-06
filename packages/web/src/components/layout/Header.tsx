import { useState, FormEvent, useEffect, useRef } from 'react';
import { useCompanyStore } from '@/store/companyStore';
import { createCompany, createFiscalYear } from '@/api/company.api';
import { lookupSiren, type SirenResult } from '@/api/siren.api';
import { Plus, X, Search, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const {
    companies, selectedCompany, selectCompany, setCompanies,
    fiscalYears, selectedFiscalYear, selectFiscalYear, setFiscalYears,
  } = useCompanyStore();

  // --- Formulaire entreprise ---
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSiren, setNewSiren] = useState('');
  const [companyLoading, setCompanyLoading] = useState(false);

  // SIREN lookup
  const [sirenInfo, setSirenInfo] = useState<SirenResult | null>(null);
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenError, setSirenError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSirenInfo(null);
    setSirenError('');
    if (newSiren.length !== 9) return;
    debounceRef.current = setTimeout(async () => {
      setSirenLoading(true);
      try {
        const result = await lookupSiren(newSiren);
        if (result) {
          setSirenInfo(result);
          if (!newName) setNewName(result.nom);
        } else {
          setSirenError('SIREN introuvable');
        }
      } catch {
        setSirenError('Erreur réseau');
      } finally {
        setSirenLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSiren]);

  const handleCloseCompany = () => {
    setShowCompanyForm(false);
    setNewName('');
    setNewSiren('');
    setSirenInfo(null);
    setSirenError('');
  };

  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCompanyLoading(true);
    try {
      const company = await createCompany({
        name: newName.trim(),
        siren: newSiren.trim() || undefined,
        siret: sirenInfo?.siret || undefined,
        nafCode: sirenInfo?.nafCode || undefined,
        address: sirenInfo?.adresse || undefined,
      });
      setCompanies([...companies, company]);
      selectCompany(company);
      handleCloseCompany();
    } catch { /* silencieux */ } finally {
      setCompanyLoading(false);
    }
  };

  // --- Formulaire exercice fiscal ---
  const [showFyForm, setShowFyForm] = useState(false);
  const [fyLabel, setFyLabel] = useState('');
  const [fyStart, setFyStart] = useState('');
  const [fyEnd, setFyEnd] = useState('');
  const [fyLoading, setFyLoading] = useState(false);

  const handleCloseFy = () => {
    setShowFyForm(false);
    setFyLabel('');
    setFyStart('');
    setFyEnd('');
  };

  // Raccourci : remplir automatiquement avec une année complète
  const fillYear = (year: number) => {
    setFyLabel(`Exercice ${year}`);
    setFyStart(`${year}-01-01`);
    setFyEnd(`${year}-12-31`);
  };

  const handleCreateFy = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !fyLabel.trim() || !fyStart || !fyEnd) return;
    setFyLoading(true);
    try {
      const fy = await createFiscalYear(selectedCompany.id, {
        label: fyLabel.trim(),
        startDate: fyStart,
        endDate: fyEnd,
      });
      const updated = [...fiscalYears, fy];
      setFiscalYears(updated);
      selectFiscalYear(fy);
      handleCloseFy();
    } catch { /* silencieux */ } finally {
      setFyLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative">
      <div className="flex items-center gap-3">

        {/* Sélecteur d'entreprise */}
        <select
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          value={selectedCompany?.id || ''}
          onChange={(e) => {
            const company = companies.find((c) => c.id === e.target.value) || null;
            selectCompany(company);
          }}
        >
          <option value="">Sélectionner une entreprise</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Bouton ajouter une entreprise */}
        <button
          onClick={() => { setShowCompanyForm(!showCompanyForm); setShowFyForm(false); }}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="Ajouter une entreprise"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Sélecteur d'exercice fiscal */}
        {selectedCompany && (
          <>
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              value={selectedFiscalYear?.id || ''}
              onChange={(e) => {
                const fy = fiscalYears.find((f) => f.id === e.target.value) || null;
                selectFiscalYear(fy);
              }}
            >
              <option value="">Sélectionner un exercice</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>{fy.label}</option>
              ))}
            </select>

            {/* Bouton ajouter un exercice */}
            <button
              onClick={() => { setShowFyForm(!showFyForm); setShowCompanyForm(false); }}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Ajouter un exercice fiscal"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <img
            src="/logo-rc.jpg"
            alt="Raly Conseils"
            className="w-8 h-8 rounded-md object-cover"
          />
          <span className="text-sm font-semibold text-primary-600">Finloop</span>
        </div>
      </div>

      {/* Popup : nouvelle entreprise */}
      {showCompanyForm && (
        <div className="absolute top-full left-6 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50 w-96">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Nouvelle entreprise</h4>
            <button onClick={handleCloseCompany} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreateCompany} className="space-y-3">
            {/* SIREN avec recherche auto */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={newSiren}
                  onChange={(e) => setNewSiren(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="SIREN (9 chiffres — recherche auto)"
                  maxLength={9}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {sirenLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                  ) : newSiren.length === 9 && sirenInfo ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
              {sirenError && <p className="text-xs text-red-500 mt-1">{sirenError}</p>}
            </div>

            {/* Résumé SIREN */}
            {sirenInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800 space-y-0.5">
                {sirenInfo.formeJuridique && (
                  <div><span className="text-blue-500">Forme :</span> {sirenInfo.formeJuridique}</div>
                )}
                {sirenInfo.nafLibelle && (
                  <div><span className="text-blue-500">Activité :</span> {sirenInfo.nafCode} — {sirenInfo.nafLibelle}</div>
                )}
                {sirenInfo.effectifLabel && (
                  <div><span className="text-blue-500">Effectif :</span> {sirenInfo.effectifLabel}</div>
                )}
                {sirenInfo.dirigeants.length > 0 && (
                  <div>
                    <span className="text-blue-500">Dirigeant :</span>{' '}
                    {sirenInfo.dirigeants[0].prenom} {sirenInfo.dirigeants[0].nom}
                    {sirenInfo.dirigeants[0].qualite && ` (${sirenInfo.dirigeants[0].qualite})`}
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de l'entreprise *"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              autoFocus={!newSiren}
            />
            <button
              type="submit"
              disabled={companyLoading || !newName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {companyLoading ? 'Création...' : 'Créer'}
            </button>
          </form>
        </div>
      )}

      {/* Popup : nouvel exercice fiscal */}
      {showFyForm && selectedCompany && (
        <div className="absolute top-full left-6 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50 w-80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Nouvel exercice fiscal</h4>
              <p className="text-xs text-gray-500">{selectedCompany.name}</p>
            </div>
            <button onClick={handleCloseFy} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Raccourcis années */}
          <div className="flex gap-1.5 mb-3">
            {[currentYear - 1, currentYear].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => fillYear(y)}
                className="flex-1 text-xs border border-gray-200 rounded-lg py-1 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {y}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateFy} className="space-y-3">
            <input
              type="text"
              value={fyLabel}
              onChange={(e) => setFyLabel(e.target.value)}
              placeholder="Label (ex: Exercice 2025) *"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Début *</label>
                <input
                  type="date"
                  value={fyStart}
                  onChange={(e) => setFyStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin *</label>
                <input
                  type="date"
                  value={fyEnd}
                  onChange={(e) => setFyEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={fyLoading || !fyLabel.trim() || !fyStart || !fyEnd}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              {fyLoading ? 'Création...' : 'Créer l\'exercice'}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

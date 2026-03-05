import { useState, FormEvent, useEffect, useRef } from 'react';
import type { Company } from '@finthesis/shared';
import { useCompanyStore } from '@/store/companyStore';
import { useAuthStore } from '@/store/authStore';
import { createCompany } from '@/api/company.api';
import { lookupSiren, type SirenResult } from '@/api/siren.api';
import { Plus, Search, Loader2, CheckCircle, Building2, ArrowRight, ChevronLeft, LogOut } from 'lucide-react';
import { FinloopLogo } from '@/components/FinloopLogo';

interface Props {
  onSelect: (company: Company) => void;
}

export function WelcomePage({ onSelect }: Props) {
  const { companies, setCompanies } = useCompanyStore();
  const { user, logout } = useAuthStore();
  const [selected, setSelected] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Formulaire création
  const [newName, setNewName]   = useState('');
  const [newSiren, setNewSiren] = useState('');
  const [creating, setCreating] = useState(false);

  // SIREN lookup
  const [sirenInfo, setSirenInfo]     = useState<SirenResult | null>(null);
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenError, setSirenError]   = useState('');
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

  const canContinue = !!selected;

  const handleContinue = () => {
    const company = companies.find(c => c.id === selected);
    if (company) {
      onSelect(company);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const company = await createCompany({
        name: newName.trim(),
        siren: newSiren || undefined,
        siret: sirenInfo?.siret,
        nafCode: sirenInfo?.nafCode,
        address: sirenInfo?.adresse,
      });
      setCompanies([...companies, company]);
      onSelect(company);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'string' ? data
        : data?.error ? `${data.error.message || data.error}${data.details ? '\n' + data.details : ''}`
        : err?.message || 'Erreur serveur';
      alert(`Impossible de créer l'entreprise :\n${msg}`);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Extraire le display name de l'utilisateur connecté
  const displayName = user?.displayName || 'Utilisateur';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5]">

      {/* Header branded */}
      <div className="py-16 px-6 flex flex-col items-center bg-brand-gradient relative">
        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center gap-1.5 text-white/70 hover:text-white text-xs transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>

        <FinloopLogo size={64} variant="white" className="mb-4 drop-shadow" />
        <h1 className="text-5xl font-bold text-white tracking-brand-h2">Finloop</h1>
        <p className="text-white/70 mt-2 tracking-brand-wide text-sm uppercase font-light">Analyse financière</p>
        <p className="text-white/90 mt-3 text-sm">
          Bienvenue, <strong>{displayName}</strong>
        </p>
      </div>

      {/* Carte centrale */}
      <div className="flex-1 flex items-start justify-center pt-10 px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">

          {!showCreate ? (
            <div className="p-8">
              {/* Titre section entreprise */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-50">
                  <Building2 className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Sélectionner une entreprise</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Choisissez une société pour commencer</p>
                </div>
              </div>

              {companies.length > 0 ? (
                <>
                  <select
                    value={selected}
                    onChange={e => setSelected(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4 bg-gray-50"
                  >
                    <option value="">— Choisir une entreprise —</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <div className="relative flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">ou</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm mb-4">
                  Aucune entreprise enregistrée
                </div>
              )}

              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors mb-6"
              >
                <Plus className="w-4 h-4" /> Créer une nouvelle entreprise
              </button>

              {companies.length > 0 && (
                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all hover:opacity-90 active:scale-95 bg-brand-gradient"
                >
                  Accéder au tableau de bord <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-8">
              <button
                onClick={() => setShowCreate(false)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-50">
                  <Plus className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Nouvelle entreprise</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Entrez le SIREN pour auto-remplir</p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                {/* SIREN */}
                <div className="relative">
                  <input
                    type="text"
                    value={newSiren}
                    onChange={e => setNewSiren(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="SIREN (9 chiffres — recherche auto)"
                    maxLength={9}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {sirenLoading
                      ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                      : newSiren.length === 9 && sirenInfo
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <Search className="w-4 h-4" />}
                  </div>
                </div>
                {sirenError && <p className="text-xs text-red-500">{sirenError}</p>}

                {sirenInfo && (
                  <div className="rounded-xl px-3 py-2 text-xs space-y-0.5 bg-primary-50 border border-primary-200">
                    {sirenInfo.formeJuridique && <div><span className="text-primary-500">Forme :</span> <span className="text-gray-700">{sirenInfo.formeJuridique}</span></div>}
                    {sirenInfo.nafLibelle && <div><span className="text-primary-500">Activité :</span> <span className="text-gray-700">{sirenInfo.nafCode} — {sirenInfo.nafLibelle}</span></div>}
                    {sirenInfo.effectifLabel && <div><span className="text-primary-500">Effectif :</span> <span className="text-gray-700">{sirenInfo.effectifLabel}</span></div>}
                    {sirenInfo.dirigeants[0] && <div><span className="text-primary-500">Dirigeant :</span> <span className="text-gray-700">{sirenInfo.dirigeants[0].prenom} {sirenInfo.dirigeants[0].nom}</span></div>}
                  </div>
                )}

                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nom de l'entreprise *"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                />

                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all hover:opacity-90 active:scale-95 bg-brand-gradient"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? 'Création...' : 'Créer et continuer'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

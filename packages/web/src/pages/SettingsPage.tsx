import { useState, FormEvent, useEffect, useRef } from 'react';
import { useCompanyStore } from '@/store/companyStore';
import { createCompany, updateCompany, createFiscalYear, getFiscalYears, updateFiscalYear, deleteFiscalYear } from '@/api/company.api';
import { lookupSiren, type SirenResult } from '@/api/siren.api';
import { Plus, Search, Loader2, CheckCircle, Building2, Users, Calendar, Briefcase, Pencil, Trash2, X, Check, Save } from 'lucide-react';
import type { FiscalYear } from '@finthesis/shared';

export function SettingsPage() {
  const { selectedCompany, companies, setCompanies, selectCompany, updateCompanyInStore, fiscalYears, setFiscalYears, selectedFiscalYear, selectFiscalYear } = useCompanyStore();

  // Company form
  const [companySiren, setCompanySiren] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyNaf, setCompanyNaf] = useState('');
  const [companySiret, setCompanySiret] = useState('');

  // Dual-mode state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // SIREN lookup state
  const [sirenInfo, setSirenInfo] = useState<SirenResult | null>(null);
  const [sirenLoading, setSirenLoading] = useState(false);
  const [sirenError, setSirenError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fiscal year form
  const [fyLabel, setFyLabel] = useState('');
  const [fyStart, setFyStart] = useState('');
  const [fyEnd, setFyEnd] = useState('');

  // Fiscal year list state
  const [fyList, setFyList] = useState<FiscalYear[]>([]);
  const [editingFy, setEditingFy] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [deletingFy, setDeletingFy] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Pré-remplir les champs quand l'entreprise sélectionnée change
  useEffect(() => {
    setShowCreateForm(false);
    if (selectedCompany) {
      setCompanySiren(selectedCompany.siren || '');
      setCompanyName(selectedCompany.name || '');
      setCompanyAddress(selectedCompany.address || '');
      setCompanyNaf(selectedCompany.nafCode || '');
      setCompanySiret(selectedCompany.siret || '');
      setSirenInfo(null);
      setSirenError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id]);

  // Charger les exercices quand l'entreprise sélectionnée change
  useEffect(() => {
    if (!selectedCompany) {
      setFyList([]);
      return;
    }
    loadFiscalYears();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id]);

  async function loadFiscalYears() {
    if (!selectedCompany) return;
    try {
      const fys = await getFiscalYears(selectedCompany.id);
      setFyList(fys);
      setFiscalYears(fys);
    } catch {
      // silently fail
    }
  }

  // Lookup automatique dès que le SIREN est complet (9 chiffres)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSirenInfo(null);
    setSirenError('');

    if (companySiren.length !== 9) return;

    debounceRef.current = setTimeout(async () => {
      setSirenLoading(true);
      try {
        const result = await lookupSiren(companySiren);
        if (result) {
          setSirenInfo(result);
          if (!companyName) setCompanyName(result.nom);
          if (!companyAddress) setCompanyAddress(result.adresse || '');
          if (!companyNaf) setCompanyNaf(result.nafCode || '');
          if (!companySiret) setCompanySiret(result.siret || '');
        } else {
          setSirenError('Aucune entreprise trouvée pour ce SIREN.');
        }
      } catch {
        setSirenError('Erreur lors de la recherche. Vérifiez votre connexion.');
      } finally {
        setSirenLoading(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySiren]);

  const handleCreateCompany = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const company = await createCompany({
        name: companyName,
        siren: companySiren || undefined,
        siret: companySiret || undefined,
        nafCode: companyNaf || undefined,
        address: companyAddress || undefined,
      });
      const updated = [...companies, company];
      setCompanies(updated);
      selectCompany(company);
      setFiscalYears([]);
      setShowCreateForm(false);
      setMessage(`Entreprise "${company.name}" créée avec succès.`);
      setMessageType('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
      setMessageType('error');
    }
  };

  const handleUpdateCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setUpdateLoading(true);
    try {
      const updated = await updateCompany(selectedCompany.id, {
        name: companyName,
        siren: companySiren || undefined,
        siret: companySiret || undefined,
        nafCode: companyNaf || undefined,
        address: companyAddress || undefined,
      });
      updateCompanyInStore(updated);
      setMessage(`Entreprise "${updated.name}" mise à jour.`);
      setMessageType('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
      setMessageType('error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateFiscalYear = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      await createFiscalYear(selectedCompany.id, {
        label: fyLabel,
        startDate: fyStart,
        endDate: fyEnd,
      });
      setFyLabel('');
      setFyStart('');
      setFyEnd('');
      setMessage('Exercice fiscal créé.');
      setMessageType('success');
      await loadFiscalYears();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
      setMessageType('error');
    }
  };

  const startEditFy = (fy: FiscalYear) => {
    setEditingFy(fy.id);
    setEditLabel(fy.label);
    setEditStart(fy.start_date?.split('T')[0] || '');
    setEditEnd(fy.end_date?.split('T')[0] || '');
  };

  const cancelEditFy = () => {
    setEditingFy(null);
    setEditLabel('');
    setEditStart('');
    setEditEnd('');
  };

  const handleUpdateFy = async (fyId: string) => {
    if (!selectedCompany) return;
    try {
      await updateFiscalYear(selectedCompany.id, fyId, {
        label: editLabel,
        startDate: editStart,
        endDate: editEnd,
      });
      setEditingFy(null);
      setMessage('Exercice mis à jour.');
      setMessageType('success');
      await loadFiscalYears();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
      setMessageType('error');
    }
  };

  const handleDeleteFy = async (fyId: string) => {
    if (!selectedCompany) return;
    try {
      await deleteFiscalYear(selectedCompany.id, fyId);
      setDeletingFy(null);
      setMessage('Exercice supprimé avec toutes ses données.');
      setMessageType('success');
      if (selectedFiscalYear?.id === fyId) {
        selectFiscalYear(null);
      }
      await loadFiscalYears();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur');
      setMessageType('error');
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  };

  const switchToCreateMode = () => {
    setShowCreateForm(true);
    setCompanySiren('');
    setCompanyName('');
    setCompanyAddress('');
    setCompanyNaf('');
    setCompanySiret('');
    setSirenInfo(null);
    setSirenError('');
  };

  const cancelCreateMode = () => {
    setShowCreateForm(false);
    if (selectedCompany) {
      setCompanySiren(selectedCompany.siren || '');
      setCompanyName(selectedCompany.name || '');
      setCompanyAddress(selectedCompany.address || '');
      setCompanyNaf(selectedCompany.nafCode || '');
      setCompanySiret(selectedCompany.siret || '');
      setSirenInfo(null);
      setSirenError('');
    }
  };

  // Champs du formulaire entreprise — partagés entre mode édition et création
  const companyFormFields = (
    <>
      {/* Champ SIREN avec recherche auto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SIREN <span className="text-gray-400 font-normal">(9 chiffres — recherche automatique)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={companySiren}
            onChange={(e) => setCompanySiren(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="123456789"
            maxLength={9}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {sirenLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            ) : companySiren.length === 9 && sirenInfo ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        </div>
        {sirenError && <p className="text-xs text-red-500 mt-1">{sirenError}</p>}
      </div>

      {/* Fiche entreprise trouvée */}
      {sirenInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
            <Building2 className="w-4 h-4" />
            Informations trouvées — données INSEE
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {sirenInfo.categorie && (
              <div>
                <span className="text-gray-500 text-xs block">Catégorie</span>
                <span className="font-medium">{sirenInfo.categorie}</span>
              </div>
            )}
            {sirenInfo.formeJuridique && (
              <div>
                <span className="text-gray-500 text-xs block">Forme juridique</span>
                <span className="font-medium">{sirenInfo.formeJuridique}</span>
              </div>
            )}
            {sirenInfo.nafLibelle && (
              <div className="col-span-2">
                <span className="text-gray-500 text-xs block">Activité (NAF)</span>
                <span className="font-medium">{sirenInfo.nafCode} — {sirenInfo.nafLibelle}</span>
              </div>
            )}
            {sirenInfo.effectifLabel && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs block">Effectif</span>
                  <span className="font-medium">{sirenInfo.effectifLabel}</span>
                </div>
              </div>
            )}
            {sirenInfo.dateCreation && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs block">Création</span>
                  <span className="font-medium">{sirenInfo.dateCreation}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dirigeants */}
          {sirenInfo.dirigeants.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Briefcase className="w-3 h-3" /> Dirigeant(s)
              </div>
              <div className="space-y-0.5">
                {sirenInfo.dirigeants.slice(0, 3).map((d, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{d.prenom} {d.nom}</span>
                    {d.qualite && <span className="text-gray-500 ml-1 text-xs">— {d.qualite}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du siège</label>
        <input
          type="text"
          value={companyAddress}
          onChange={(e) => setCompanyAddress(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
          <input
            type="text"
            value={companySiret}
            onChange={(e) => setCompanySiret(e.target.value.replace(/\D/g, '').slice(0, 14))}
            maxLength={14}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code NAF</label>
          <input
            type="text"
            value={companyNaf}
            onChange={(e) => setCompanyNaf(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
    </>
  );

  // Mode édition = entreprise sélectionnée et pas en mode création
  const isEditMode = !!selectedCompany && !showCreateForm;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Bloc entreprise : édition ou création */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {isEditMode ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                Fiche entreprise — {selectedCompany.name}
              </span>
            </h3>
            <form onSubmit={handleUpdateCompany} className="space-y-4">
              {companyFormFields}
              <button
                type="submit"
                disabled={!companyName.trim() || updateLoading}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {updateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder les modifications
              </button>
            </form>

            {/* Action secondaire : créer une nouvelle entreprise */}
            <div className="mt-5 pt-5 border-t border-gray-200">
              <button
                onClick={switchToCreateMode}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Ajouter une nouvelle entreprise
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nouvelle entreprise</h3>
              {showCreateForm && (
                <button
                  onClick={cancelCreateMode}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" /> Retour à la fiche
                </button>
              )}
            </div>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              {companyFormFields}
              <button
                type="submit"
                disabled={!companyName.trim()}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Créer l'entreprise
              </button>
            </form>
          </>
        )}
      </div>

      {/* Exercices fiscaux existants */}
      {selectedCompany && fyList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exercices fiscaux — {selectedCompany.name}
          </h3>
          <div className="space-y-3">
            {fyList.map((fy) => (
              <div key={fy.id} className="border border-gray-200 rounded-lg p-4">
                {editingFy === fy.id ? (
                  /* Mode édition */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Label de l'exercice"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <input
                        type="date"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateFy(fy.id)}
                        className="flex items-center gap-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700"
                      >
                        <Check className="w-3.5 h-3.5" /> Enregistrer
                      </button>
                      <button
                        onClick={cancelEditFy}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : deletingFy === fy.id ? (
                  /* Mode confirmation suppression */
                  <div className="space-y-3">
                    <p className="text-sm text-red-700 font-medium">
                      Supprimer "{fy.label}" ? Toutes les écritures et imports liés seront définitivement supprimés.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteFy(fy.id)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Confirmer la suppression
                      </button>
                      <button
                        onClick={() => setDeletingFy(null)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Mode affichage */
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{fy.label}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(fy.start_date)} — {formatDate(fy.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditFy(fy)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingFy(fy.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Créer un exercice fiscal */}
      {selectedCompany && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvel exercice fiscal — {selectedCompany.name}
          </h3>
          <form onSubmit={handleCreateFiscalYear} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
              <input
                type="text"
                value={fyLabel}
                onChange={(e) => setFyLabel(e.target.value)}
                placeholder="ex: Exercice 2025"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                <input
                  type="date"
                  value={fyStart}
                  onChange={(e) => setFyStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
                <input
                  type="date"
                  value={fyEnd}
                  onChange={(e) => setFyEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
              <Plus className="w-4 h-4" /> Créer l'exercice
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

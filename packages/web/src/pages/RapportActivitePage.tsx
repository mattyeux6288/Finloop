import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getRapportActivite, getEcrituresByCompte, upsertAccountOverride, deleteAccountOverride, getAccountMapping } from '@/api/analysis.api';
import { formatPercent, SIG_COMPUTATION_ORDER } from '@finthesis/shared';
import { useCurrencyFormat } from '@/hooks/useCurrencyFormat';
import type {
  RatioFinancier,
  Bilan,
  BilanSection,
  BilanItem,
  Sig,
  SigLevel,
  SigDetail,
  RapportActiviteData,
  EcritureDetail,
  AccountOverride,
  UpdateOverrideDto,
  SigStepKey,
} from '@finthesis/shared';
import {
  Printer,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Building2,
  Calendar,
  BarChart3,
  Info,
  ArrowRight,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  GripVertical,
} from 'lucide-react';

// ════════════════════════════════════════════
// Utilitaires
// ════════════════════════════════════════════

function formatDateFr(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ════════════════════════════════════════════
// Composant : Infobulle Expert
// ════════════════════════════════════════════

function ExpertTooltip({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    }
    setShow(true);
  };

  return (
    <span className="inline-flex ml-2 print:hidden">
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        className="w-5 h-5 rounded-full bg-accent-100 text-accent-600 text-[10px] flex items-center justify-center cursor-help font-bold shrink-0"
      >
        <Info className="w-3 h-3" />
      </span>
      {show && (
        <div
          className="fixed w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-[9999] leading-relaxed pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
        >
          {children}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </span>
  );
}

// ════════════════════════════════════════════
// Composant : Modal Écritures par compte
// ════════════════════════════════════════════

function EcrituresModal({
  compteNum,
  compteLib,
  fiscalYearId,
  onClose,
}: {
  compteNum: string;
  compteLib: string;
  fiscalYearId: string;
  onClose: () => void;
}) {
  const { formatCurrency } = useCurrencyFormat();
  const backdropRef = useRef<HTMLDivElement>(null);

  const { data: ecritures, isLoading, error } = useQuery({
    queryKey: ['ecritures', fiscalYearId, compteNum],
    queryFn: () => getEcrituresByCompte(fiscalYearId, compteNum),
  });

  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Fermer au clic sur le fond
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const totalDebit = ecritures?.reduce((s, e) => s + e.debit, 0) ?? 0;
  const totalCredit = ecritures?.reduce((s, e) => s + e.credit, 0) ?? 0;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm bg-primary-100 text-primary-700 px-2.5 py-1 rounded font-semibold">
              {compteNum}
            </span>
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {compteLib}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 shrink-0 ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600" />
              <p className="text-sm text-gray-500">Chargement des écritures...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">
              Erreur lors du chargement des écritures.
            </div>
          )}

          {ecritures && ecritures.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              Aucune écriture trouvée pour ce compte.
            </p>
          )}

          {ecritures && ecritures.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Journal</th>
                  <th className="pb-2 pr-3">Pièce</th>
                  <th className="pb-2 pr-3">Libellé</th>
                  <th className="pb-2 pr-3 text-right">Débit</th>
                  <th className="pb-2 text-right">Crédit</th>
                </tr>
              </thead>
              <tbody>
                {ecritures.map((e, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">
                      {formatDateFr(e.ecritureDate)}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-xs text-gray-500" title={e.journalLib}>
                      {e.journalCode}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-500 text-xs">
                      {e.pieceRef || '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-700 max-w-xs truncate">
                      {e.ecritureLib}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {e.debit > 0 ? formatCurrency(e.debit) : ''}
                    </td>
                    <td className="py-1.5 text-right font-medium text-gray-900 whitespace-nowrap">
                      {e.credit > 0 ? formatCurrency(e.credit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td colSpan={4} className="py-2 pr-3 text-right text-gray-700">
                    Totaux ({ecritures.length} écriture{ecritures.length > 1 ? 's' : ''})
                  </td>
                  <td className="py-2 pr-3 text-right text-gray-900 whitespace-nowrap">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="py-2 text-right text-gray-900 whitespace-nowrap">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1 pr-3 text-right text-sm text-gray-500">
                    Solde
                  </td>
                  <td colSpan={2} className={`py-1 text-right font-bold ${
                    totalDebit - totalCredit >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {formatCurrency(totalDebit - totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// Composant : Badge Delta N-1
// ════════════════════════════════════════════

function DeltaBadge({ valueN, valueN1, className = '' }: { valueN: number; valueN1: number; className?: string }) {
  const { formatCurrency } = useCurrencyFormat();
  if (valueN1 === 0 && valueN === 0) return null;
  const delta = valueN1 !== 0 ? ((valueN - valueN1) / Math.abs(valueN1)) * 100 : null;
  if (delta === null) return null;

  const isPositive = delta >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full cursor-help ${
        isPositive
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-600'
      } ${className}`}
      title={`N-1 : ${formatCurrency(valueN1)}`}
    >
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

// ════════════════════════════════════════════
// Composant : Carte Ratio (réutilisable)
// ════════════════════════════════════════════

function RatioCard({ ratio }: { ratio: RatioFinancier }) {
  const interpretationStyles = {
    bon: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500', bar: '#6DC28A' },
    attention: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', bar: '#f59e0b' },
    alerte: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', bar: '#ef4444' },
  };

  const formatVal = (valeur: number, unite: string) =>
    unite === '%'
      ? formatPercent(valeur)
      : unite === 'jours'
        ? `${Math.round(valeur)} j`
        : valeur.toFixed(2);

  const style = interpretationStyles[ratio.interpretation];
  const formattedValue = formatVal(ratio.valeur, ratio.unite);
  const hasSecteur = ratio.secteurMoyenne !== undefined;
  const hasN1 = ratio.valeurN1 !== undefined;

  // Calculer les barres proportionnelles (3 barres max : société, N-1, secteur)
  const allBarValues = [ratio.valeur];
  if (hasN1) allBarValues.push(ratio.valeurN1!);
  if (hasSecteur) allBarValues.push(ratio.secteurMoyenne!);
  const maxBar = Math.max(...allBarValues.map(Math.abs), 1);

  let barPct = Math.round((Math.abs(ratio.valeur) / maxBar) * 100);
  let n1Pct = hasN1 ? Math.round((Math.abs(ratio.valeurN1!) / maxBar) * 100) : 0;
  let secteurPct = hasSecteur ? Math.round((Math.abs(ratio.secteurMoyenne!) / maxBar) * 100) : 0;

  return (
    <div className={`rounded-xl border p-4 ${style.bg} ${style.border} print:bg-white relative group`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <span className="text-xs font-medium text-gray-600 leading-tight">{ratio.label}</span>
      </div>
      <p
        className={`text-lg font-bold ${style.text} leading-snug`}
        title={hasN1 ? `N-1 : ${formatVal(ratio.valeurN1!, ratio.unite)}` : undefined}
      >
        {formattedValue}
      </p>

      {(hasSecteur || hasN1) && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 w-14 shrink-0">Société</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: style.bar }} />
            </div>
          </div>
          {hasN1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-accent-500 w-14 shrink-0">N-1</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-accent-400 rounded-full" style={{ width: `${n1Pct}%` }} />
              </div>
              <span className="text-xs text-accent-500 ml-1">
                {formatVal(ratio.valeurN1!, ratio.unite)}
              </span>
            </div>
          )}
          {hasSecteur && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 w-14 shrink-0">Secteur</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${secteurPct}%` }} />
              </div>
              <span className="text-xs text-gray-400 ml-1">
                {formatVal(ratio.secteurMoyenne!, ratio.unite)}
              </span>
            </div>
          )}
        </div>
      )}

      {ratio.formule && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-72 text-center print:hidden">
          <p className="font-medium mb-0.5">Formule :</p>
          <p className="text-gray-300">{ratio.formule}</p>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// En-tête du rapport
// ════════════════════════════════════════════

function RapportHeader({ data }: { data: RapportActiviteData }) {
  const dateStr = formatDateLong(data.genereA);
  const debut = formatDateFr(data.entreprise.dateDebut);
  const fin = formatDateFr(data.entreprise.dateFin);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-0 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary-700 via-primary-500 to-accent-500" />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-rc.jpg"
              alt="Raly Conseils"
              className="w-10 h-10 rounded-lg object-cover shadow-sm flex-shrink-0"
            />
            <div className="flex flex-col justify-center leading-none">
              <p className="text-sm font-semibold text-primary-700">Raly Conseils</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Rapport d'activité</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm print:hidden"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{data.entreprise.nom}</h1>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {data.entreprise.siren && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              SIREN {data.entreprise.siren}
            </span>
          )}
          {data.entreprise.dirigeant && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              {data.entreprise.dirigeant}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            {data.entreprise.exercice}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
            Du {debut} au {fin}
          </span>
          {data.entreprise.nafCode && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
              NAF {data.entreprise.nafCode}
              {data.entreprise.nafLibelle && ` — ${data.entreprise.nafLibelle}`}
            </span>
          )}
          {data.exerciceN1Label && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-700 bg-accent-50 px-3 py-1.5 rounded-full">
              <BarChart3 className="w-3.5 h-3.5" />
              Comparaison N-1 : {data.exerciceN1Label}
            </span>
          )}
        </div>

        <p className="text-[11px] text-gray-400 mt-4">Rapport généré le {dateStr}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// Dictionnaires d'infobulles expert-comptable
// ════════════════════════════════════════════

const SIG_TOOLTIPS: Record<string, string> = {
  'Marge commerciale':
    "Reflète le pouvoir de négociation achats et le positionnement prix. Une marge en baisse peut signaler une pression concurrentielle ou une hausse des coûts d'approvisionnement. Point de discussion : renégocier les conditions fournisseurs.",
  'Production de l\'exercice':
    "Inclut la production vendue, stockée et immobilisée. Une production stockée élevée mérite attention : est-ce volontaire (constitution de stocks) ou subi (mévente) ?",
  'Valeur ajoutée':
    "C'est la richesse réellement créée par l'entreprise. Elle rémunère le personnel, l'État (impôts), les prêteurs (intérêts) et les actionnaires (dividendes). Un taux de VA élevé traduit une forte création de valeur interne.",
  'EBE':
    "L'EBE est l'indicateur roi de la performance opérationnelle. Il mesure la rentabilité du cycle d'exploitation, hors politique d'investissement et de financement. Un EBE négatif signale une activité structurellement déficitaire.",
  'Résultat d\'exploitation':
    "Intègre les dotations aux amortissements et provisions. Un écart significatif avec l'EBE révèle un poids important des investissements (amortissements) ou des risques provisionnés.",
  'RCAI':
    "Le Résultat Courant Avant Impôts intègre le coût de la dette. Un RCAI très inférieur au résultat d'exploitation signale un endettement coûteux. Point de discussion : renégocier les conditions bancaires.",
  'Résultat exceptionnel':
    "Les éléments exceptionnels (cessions, pénalités, subventions) ne sont pas récurrents. Un résultat net fortement impacté par l'exceptionnel doit être relativisé pour juger la performance réelle.",
  'Résultat net':
    "Bénéfice ou perte de l'exercice après impôts. C'est le solde disponible pour les réserves et les dividendes. Attention : un résultat net positif peut masquer des difficultés opérationnelles si gonflé par l'exceptionnel.",
  'Plus ou moins-values de cession':
    "Les cessions d'actifs impactent le résultat exceptionnel. Des plus-values récurrentes peuvent indiquer une stratégie de cession d'actifs pour maintenir artificiellement la rentabilité.",
};

const BILAN_ACTIF_TOOLTIPS: Record<string, string> = {
  'Immobilisations':
    "Vérifier la vétusté du parc (taux d'amortissement). Des immobilisations fortement amorties peuvent nécessiter des investissements de renouvellement. Point de discussion : plan d'investissement à moyen terme.",
  'Stocks':
    "Un stock élevé immobilise de la trésorerie. Évaluer la rotation des stocks et identifier les éventuels stocks obsolètes ou à déprécier. Objectif : optimiser le niveau de stock sans rupture.",
  'Créances':
    "Un encours clients important impacte directement la trésorerie. Analyser l'ancienneté des créances et identifier les retards de paiement. Point de discussion : procédures de relance et conditions de règlement.",
  'Trésorerie':
    "La trésorerie active (banques + caisse). Un excédent prolongé peut être placé. Un déficit chronique nécessite une ligne de crédit ou un ajustement du BFR.",
};

const BILAN_PASSIF_TOOLTIPS: Record<string, string> = {
  'Capitaux propres':
    "Le matelas de sécurité de l'entreprise. Des capitaux propres solides rassurent les partenaires financiers et offrent une capacité d'endettement. En dessous de 50% du total passif, l'autonomie financière est fragile.",
  'Dettes financières':
    "Les emprunts bancaires et dettes à moyen/long terme. Vérifier la capacité de remboursement (CAF/dettes) et le calendrier des échéances. Point de discussion : possibilité de refinancement.",
  'Dettes fournisseurs':
    "Le crédit fournisseur est un financement gratuit du cycle d'exploitation. Des délais trop courts pénalisent la trésorerie, mais des délais trop longs peuvent détériorer la relation commerciale.",
  'Dettes fiscales et sociales':
    "Les dettes envers l'État et les organismes sociaux. Des retards de paiement peuvent entraîner des pénalités et signalent une tension de trésorerie.",
  'Autres dettes':
    "Comptes courants d'associés, créditeurs divers, produits constatés d'avance. Vérifier les échéances et les conditions de remboursement des comptes courants.",
};

// ════════════════════════════════════════════
// Section SIG
// ════════════════════════════════════════════

function SIGSection({
  sig,
  sigN1,
  ratios,
  nafLibelle,
  chiffreAffaires,
  chiffreAffairesN1,
  onOpenEcritures,
  companyId,
  overrides,
  onOverride,
  onDeleteOverride,
}: {
  sig: Sig;
  sigN1?: Sig;
  ratios: RatioFinancier[];
  nafLibelle?: string;
  chiffreAffaires: number;
  chiffreAffairesN1?: number;
  onOpenEcritures: (compteNum: string, compteLib: string) => void;
  companyId?: string;
  overrides?: AccountOverride[];
  onOverride: (dto: UpdateOverrideDto) => void;
  onDeleteOverride: (compteNum: string) => void;
}) {
  const { formatCurrency } = useCurrencyFormat();
  const [openLevels, setOpenLevels] = useState<Set<string>>(new Set());
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

  const toggleLevel = (label: string) => {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleDetail = (key: string) => {
    setOpenDetails((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Niveaux SIG dans l'ordre classique
  const sigSteps: { key: string; stepKey: string; level: SigLevel }[] = [
    { key: 'Marge commerciale', stepKey: 'margeCommerciale', level: sig.margeCommerciale },
    { key: 'Production de l\'exercice', stepKey: 'productionExercice', level: sig.productionExercice },
    { key: 'Valeur ajoutée', stepKey: 'valeurAjoutee', level: sig.valeurAjoutee },
    { key: 'EBE', stepKey: 'ebe', level: sig.ebe },
    { key: 'Résultat d\'exploitation', stepKey: 'resultatExploitation', level: sig.resultatExploitation },
    { key: 'RCAI', stepKey: 'rcai', level: sig.rcai },
    { key: 'Résultat exceptionnel', stepKey: 'resultatExceptionnel', level: sig.resultatExceptionnel },
    { key: 'Résultat net', stepKey: 'resultatNet', level: sig.resultatNet },
    { key: 'Plus ou moins-values de cession', stepKey: 'plusMoinsValuesCessions', level: sig.plusMoinsValuesCessions },
  ];

  // Lookup N-1 pour chaque step SIG
  const sigN1Map: Record<string, number> = sigN1 ? {
    'Marge commerciale': sigN1.margeCommerciale.montant,
    'Production de l\'exercice': sigN1.productionExercice.montant,
    'Valeur ajoutée': sigN1.valeurAjoutee.montant,
    'EBE': sigN1.ebe.montant,
    'Résultat d\'exploitation': sigN1.resultatExploitation.montant,
    'RCAI': sigN1.rcai.montant,
    'Résultat exceptionnel': sigN1.resultatExceptionnel.montant,
    'Résultat net': sigN1.resultatNet.montant,
    'Plus ou moins-values de cession': sigN1.plusMoinsValuesCessions.montant,
  } : {};

  // Identifier les 3 plus gros postes (en valeur absolue) parmi tous les niveaux SIG
  const allMontants = sigSteps
    .filter(s => s.key !== 'Résultat net' && s.key !== 'Plus ou moins-values de cession')
    .map(s => ({ key: s.key, montant: Math.abs(s.level.montant) }));
  allMontants.sort((a, b) => b.montant - a.montant);
  const top3Keys = new Set(allMontants.slice(0, 3).map(a => a.key));

  // Le CA est la référence pour les barres proportionnelles
  const maxAbsMontant = Math.max(...sigSteps.map(s => Math.abs(s.level.montant)), 1);

  // Filtrer les ratios SIG
  const sigRatios = ratios.filter(r => r.categorie === 'sig');

  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        Soldes Intermédiaires de Gestion (SIG)
      </h2>

      {/* Encart Chiffre d'Affaires */}
      <div className="rounded-xl border-2 border-primary-300 bg-primary-50 p-5 mb-6 print:bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="text-lg font-bold text-primary-800">
              Chiffre d'affaires
            </span>
            {chiffreAffairesN1 !== undefined && (
              <DeltaBadge valueN={chiffreAffaires} valueN1={chiffreAffairesN1} />
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary-700">
              {formatCurrency(chiffreAffaires)}
            </span>
            {chiffreAffairesN1 !== undefined && (
              <p className="text-xs text-primary-500 mt-0.5">
                N-1 : {formatCurrency(chiffreAffairesN1)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cascade SIG */}
      <div className="space-y-2 mb-8">
        {sigSteps.map(({ key, stepKey, level }) => {
          const isOpen = openLevels.has(key);
          const isPositive = level.montant >= 0;
          const isTop3 = top3Keys.has(key);
          const isResultatNet = key === 'Résultat net';
          const pct = (Math.abs(level.montant) / maxAbsMontant) * 100;
          const tooltip = SIG_TOOLTIPS[key];

          return (
            <div
              key={key}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm print:shadow-none ${
                isTop3 ? 'border-accent-300 ring-1 ring-accent-100' : 'border-gray-200'
              } ${isResultatNet ? 'mt-4' : ''}`}
            >
              {/* En-tête du niveau SIG — drop target */}
              <div
                onDragOver={(ev) => { ev.preventDefault(); ev.currentTarget.classList.add('ring-2', 'ring-accent-400'); }}
                onDragLeave={(ev) => { ev.currentTarget.classList.remove('ring-2', 'ring-accent-400'); }}
                onDrop={(ev) => {
                  ev.preventDefault();
                  ev.currentTarget.classList.remove('ring-2', 'ring-accent-400');
                  try {
                    const payload = JSON.parse(ev.dataTransfer.getData('application/json'));
                    onOverride({
                      compteNum: payload.compteNum,
                      compteLib: payload.compteLib,
                      target: { type: 'sig', sigStep: stepKey, sigItemIndex: 0 },
                    });
                  } catch {}
                }}
                className="transition-all rounded-xl"
              >
              <button
                onClick={() => toggleLevel(key)}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left print:hover:bg-white"
              >
                <span className="print:hidden">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold ${
                        isResultatNet ? 'text-gray-900 text-base' : 'text-gray-700'
                      }`}>
                        {level.label}
                      </span>
                      {isTop3 && (
                        <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full font-medium ml-1">
                          TOP 3
                        </span>
                      )}
                      {tooltip && isTop3 && (
                        <ExpertTooltip>
                          <p className="font-medium text-accent-300 mb-1">{key}</p>
                          <p>{tooltip}</p>
                        </ExpertTooltip>
                      )}
                    </div>
                    <span className="flex items-center gap-2 shrink-0 ml-4">
                      {sigN1 && sigN1Map[key] !== undefined && (
                        <DeltaBadge valueN={level.montant} valueN1={sigN1Map[key]} />
                      )}
                      <span
                        className={`text-sm font-bold ${
                          isResultatNet
                            ? (isPositive ? 'text-green-700 text-base' : 'text-red-600 text-base')
                            : (isPositive ? 'text-gray-900' : 'text-red-600')
                        }`}
                        title={sigN1 && sigN1Map[key] !== undefined ? `N-1 : ${formatCurrency(sigN1Map[key])}` : undefined}
                      >
                        {formatCurrency(level.montant)}
                      </span>
                    </span>
                  </div>

                  {/* Barre proportionnelle */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: isResultatNet
                          ? (isPositive ? '#E8621A' : '#ef4444')
                          : isTop3
                            ? '#E8621A'
                            : (isPositive ? '#6DC28A' : '#ef4444'),
                      }}
                    />
                  </div>
                </div>
              </button>
              </div>

              {/* Niveau 2 : détails dépliables */}
              {isOpen && level.details.length > 0 && (() => {
                const maxDetail = Math.max(...level.details.map(d => Math.abs(d.montant)));
                return (
                <div className="border-t border-gray-100 bg-gray-50 print:bg-white">
                  {level.details.map((d, i) => {
                    const isMax = Math.abs(d.montant) === maxDetail && maxDetail > 0;
                    const detailKey = `${key}_${i}`;
                    const isDetailOpen = openDetails.has(detailKey);
                    const hasComptes = d.comptes && d.comptes.length > 0;

                    return (
                      <div key={i} className="border-t border-gray-100 first:border-t-0">
                        {/* Ligne de détail — cliquable si comptes disponibles */}
                        <div
                          className={`flex items-center gap-2 px-5 py-2 ${isMax ? 'bg-accent-50/50' : ''} ${hasComptes ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                          onClick={() => hasComptes && toggleDetail(detailKey)}
                        >
                          {/* Icône dépli ou flèche statique */}
                          <span className="w-4 shrink-0 print:hidden">
                            {hasComptes ? (
                              isDetailOpen
                                ? <ChevronDown className="w-3.5 h-3.5 text-primary-400" />
                                : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                            ) : null}
                          </span>

                          {/* Badge racine */}
                          <span className="w-14 shrink-0 text-center">
                            {d.compteRacines ? (
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isMax ? 'text-accent-700 bg-accent-100 font-bold' : 'text-gray-400 bg-gray-100'}`}>
                                {d.compteRacines}
                              </span>
                            ) : (
                              <ArrowRight className="w-3 h-3 text-gray-300 mx-auto" />
                            )}
                          </span>

                          <span className={`flex-1 text-sm ${isMax ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                            {d.label}
                            {hasComptes && (
                              <span className="ml-1.5 text-[10px] text-gray-400 font-normal print:hidden">
                                ({d.comptes!.length} compte{d.comptes!.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </span>

                          <span className={`text-sm shrink-0 ${isMax ? 'font-bold' : 'font-medium'} ${
                            d.montant >= 0 ? (isMax ? 'text-accent-700' : 'text-gray-900') : 'text-red-600'
                          }`}>
                            {formatCurrency(d.montant)}
                          </span>
                        </div>

                        {/* Niveau 3 : comptes individuels */}
                        {isDetailOpen && hasComptes && (
                          <div className="mx-5 mb-2 rounded-lg border border-primary-100 bg-white overflow-hidden print:hidden">
                            <table className="w-full text-xs">
                              <tbody>
                                {d.comptes!.map((c, j) => {
                                  const isOverridden = overrides?.some(o => o.compteNum === c.compteNum);
                                  return (
                                  <tr
                                    key={j}
                                    draggable
                                    onDragStart={(ev) => {
                                      ev.dataTransfer.setData('application/json', JSON.stringify({
                                        compteNum: c.compteNum,
                                        compteLib: c.compteLib,
                                        sourceType: 'sig',
                                      }));
                                      ev.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className="border-t border-gray-100 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                                  >
                                    <td className="px-3 py-1.5 font-mono text-gray-500">
                                      <span className="inline-flex items-center gap-1.5">
                                        <GripVertical className="w-3 h-3 text-gray-300 print:hidden" />
                                        {c.compteNum}
                                        <button
                                          onClick={(ev) => { ev.stopPropagation(); onOpenEcritures(c.compteNum, c.compteLib); }}
                                          className="text-primary-400 hover:text-primary-600 transition-colors"
                                          title="Voir les écritures"
                                        >
                                          <Search className="w-3.5 h-3.5" />
                                        </button>
                                      </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700">
                                      <span className="inline-flex items-center gap-1.5">
                                        {c.compteLib}
                                        {isOverridden && (
                                          <>
                                            <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full font-medium">
                                              Reclassé
                                            </span>
                                            <button
                                              onClick={(ev) => { ev.stopPropagation(); onDeleteOverride(c.compteNum); }}
                                              className="text-accent-400 hover:text-accent-600 transition-colors"
                                              title="Annuler le reclassement"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                      </span>
                                    </td>
                                    <td className={`px-3 py-1.5 text-right font-medium ${
                                      c.montant >= 0 ? 'text-gray-900' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(c.montant)}
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Print niveau 3 : toujours visible */}
                        {hasComptes && (
                          <div className="hidden print:block mx-5 mb-1">
                            <table className="w-full text-xs">
                              <tbody>
                                {d.comptes!.map((c, j) => (
                                  <tr key={j} className="border-t border-gray-100">
                                    <td className="py-0.5 pl-4 font-mono text-gray-400 w-24">{c.compteNum}</td>
                                    <td className="py-0.5 text-gray-500">{c.compteLib}</td>
                                    <td className="py-0.5 text-right text-gray-700">{formatCurrency(c.montant)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                );
              })()}

              {/* En mode print, toujours afficher les détails niveau 2 */}
              {level.details.length > 0 && (
                <div className="hidden print:block border-t border-gray-100 px-5 py-3">
                  <table className="w-full text-sm">
                    <tbody>
                      {level.details.map((d, i) => (
                        <tr key={i} className="border-t border-gray-100 first:border-t-0">
                          <td className="py-1 w-12 text-center">
                            {d.compteRacines && (
                              <span className="text-xs font-mono text-gray-400">{d.compteRacines}</span>
                            )}
                          </td>
                          <td className="py-1 text-gray-600">{d.label}</td>
                          <td className="py-1 text-right font-medium text-gray-900">{formatCurrency(d.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ratios SIG */}
      {sigRatios.length > 0 && (
        <div>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              Ratios liés au SIG
            </h3>
            {nafLibelle && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                Réf. : {nafLibelle}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sigRatios.map((ratio, i) => (
              <RatioCard key={i} ratio={ratio} />
            ))}
          </div>
        </div>
      )}

      {/* Encart Résultat Net final */}
      <div className={`mt-6 rounded-xl border-2 p-5 ${
        sig.resultatNet.montant >= 0
          ? 'border-green-300 bg-green-50'
          : 'border-red-300 bg-red-50'
      } print:bg-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${
              sig.resultatNet.montant >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              Résultat net de l'exercice
            </span>
            {sigN1 && (
              <DeltaBadge valueN={sig.resultatNet.montant} valueN1={sigN1.resultatNet.montant} />
            )}
            <ExpertTooltip>
              <p className="font-medium text-accent-300 mb-1">Résultat net</p>
              <p>{SIG_TOOLTIPS['Résultat net']}</p>
            </ExpertTooltip>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${
              sig.resultatNet.montant >= 0 ? 'text-green-700' : 'text-red-600'
            }`}>
              {formatCurrency(sig.resultatNet.montant)}
            </span>
            {sigN1 && (
              <p className="text-xs text-gray-500 mt-0.5">
                N-1 : {formatCurrency(sigN1.resultatNet.montant)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section Bilan
// ════════════════════════════════════════════

function BilanSide({
  title,
  sections,
  total,
  totalN1,
  tooltips,
  top3Items,
  sectionsN1,
  onOpenEcritures,
  sectionKeys,
  bilanSide,
  overrides,
  onOverride,
  onDeleteOverride,
}: {
  title: string;
  sections: BilanSection[];
  total: number;
  totalN1?: number;
  tooltips: Record<string, string>;
  top3Items: Set<string>;
  sectionsN1?: BilanSection[];
  onOpenEcritures: (compteNum: string, compteLib: string) => void;
  sectionKeys: string[];
  bilanSide: 'actif' | 'passif';
  overrides?: AccountOverride[];
  onOverride: (dto: UpdateOverrideDto) => void;
  onDeleteOverride: (compteNum: string) => void;
}) {
  const { formatCurrency } = useCurrencyFormat();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Lookup N-1 par label de section
  const n1Map: Record<string, number> = {};
  if (sectionsN1) {
    for (const s of sectionsN1) n1Map[s.label] = s.total;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {title} <span className="text-sm font-normal text-gray-500">— {formatCurrency(total)}</span>
        {totalN1 !== undefined && (
          <DeltaBadge valueN={total} valueN1={totalN1} />
        )}
      </h3>

      <div className="space-y-3">
        {sections.map((section, sIdx) => {
          const isOpen = openSections.has(section.label);
          const isTop3 = top3Items.has(section.label);
          const tooltip = tooltips[section.label];
          const sectionN1Total = n1Map[section.label];
          const sectionKey = sectionKeys[sIdx];

          return (
            <div
              key={section.label}
              className={`rounded-lg border overflow-hidden ${
                isTop3 ? 'border-accent-300 bg-accent-50/30' : 'border-gray-100'
              }`}
            >
              {/* En-tête de section bilan — drop target */}
              <div
                onDragOver={(ev) => { ev.preventDefault(); ev.currentTarget.classList.add('ring-2', 'ring-accent-400'); }}
                onDragLeave={(ev) => { ev.currentTarget.classList.remove('ring-2', 'ring-accent-400'); }}
                onDrop={(ev) => {
                  ev.preventDefault();
                  ev.currentTarget.classList.remove('ring-2', 'ring-accent-400');
                  try {
                    const payload = JSON.parse(ev.dataTransfer.getData('application/json'));
                    onOverride({
                      compteNum: payload.compteNum,
                      compteLib: payload.compteLib,
                      target: { type: 'bilan', bilanSection: sectionKey, bilanSide },
                    });
                  } catch {}
                }}
                className="transition-all rounded-lg"
              >
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="print:hidden">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </span>
                  <span className={`text-sm font-medium ${isTop3 ? 'text-accent-800' : 'text-gray-700'}`}>
                    {section.label}
                  </span>
                  {isTop3 && (
                    <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full font-medium">
                      TOP 3
                    </span>
                  )}
                  {tooltip && isTop3 && (
                    <ExpertTooltip>
                      <p className="font-medium text-accent-300 mb-1">{section.label}</p>
                      <p>{tooltip}</p>
                    </ExpertTooltip>
                  )}
                </div>
                <span className="flex items-center gap-2 shrink-0 ml-3">
                  {sectionN1Total !== undefined && (
                    <DeltaBadge valueN={section.total} valueN1={sectionN1Total} />
                  )}
                  <span
                    className="text-sm font-bold text-gray-900"
                    title={sectionN1Total !== undefined ? `N-1 : ${formatCurrency(sectionN1Total)}` : undefined}
                  >
                    {formatCurrency(section.total)}
                  </span>
                </span>
              </button>
              </div>

              {/* Items détaillés — niveau 2 */}
              {isOpen && section.items.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {section.items.map((item, i) => {
                    const itemKey = `${section.label}_${i}`;
                    const isItemOpen = openItems.has(itemKey);
                    const hasComptes = item.comptes && item.comptes.length > 0;

                    return (
                      <div key={i} className="border-t border-gray-100 first:border-t-0">
                        <div
                          className={`flex items-center gap-2 px-4 py-2 ${hasComptes ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                          onClick={() => hasComptes && toggleItem(itemKey)}
                        >
                          <span className="w-4 shrink-0 print:hidden">
                            {hasComptes ? (
                              isItemOpen
                                ? <ChevronDown className="w-3.5 h-3.5 text-primary-400" />
                                : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                            ) : null}
                          </span>
                          <span className="text-gray-500 font-mono text-xs w-12 shrink-0">{item.compteRacine}</span>
                          <span className="flex-1 text-sm text-gray-700">
                            {item.label}
                            {hasComptes && (
                              <span className="ml-1.5 text-[10px] text-gray-400 font-normal print:hidden">
                                ({item.comptes!.length} compte{item.comptes!.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </span>
                          <span className={`text-sm font-medium shrink-0 ${
                            item.montant >= 0 ? 'text-gray-900' : 'text-red-600'
                          }`}>
                            {formatCurrency(item.montant)}
                          </span>
                        </div>

                        {/* Niveau 3 : comptes individuels */}
                        {isItemOpen && hasComptes && (
                          <div className="mx-4 mb-2 rounded-lg border border-primary-100 bg-white overflow-hidden print:hidden">
                            <table className="w-full text-xs">
                              <tbody>
                                {item.comptes!.map((c, j) => {
                                  const isOverridden = overrides?.some(o => o.compteNum === c.compteNum);
                                  return (
                                  <tr
                                    key={j}
                                    draggable
                                    onDragStart={(ev) => {
                                      ev.dataTransfer.setData('application/json', JSON.stringify({
                                        compteNum: c.compteNum,
                                        compteLib: c.compteLib,
                                        sourceType: 'bilan',
                                      }));
                                      ev.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className="border-t border-gray-100 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                                  >
                                    <td className="px-3 py-1.5 font-mono text-gray-500">
                                      <span className="inline-flex items-center gap-1.5">
                                        <GripVertical className="w-3 h-3 text-gray-300 print:hidden" />
                                        {c.compteNum}
                                        <button
                                          onClick={(ev) => { ev.stopPropagation(); onOpenEcritures(c.compteNum, c.compteLib); }}
                                          className="text-primary-400 hover:text-primary-600 transition-colors"
                                          title="Voir les écritures"
                                        >
                                          <Search className="w-3.5 h-3.5" />
                                        </button>
                                      </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-700">
                                      <span className="inline-flex items-center gap-1.5">
                                        {c.compteLib}
                                        {isOverridden && (
                                          <>
                                            <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full font-medium">
                                              Reclassé
                                            </span>
                                            <button
                                              onClick={(ev) => { ev.stopPropagation(); onDeleteOverride(c.compteNum); }}
                                              className="text-accent-400 hover:text-accent-600 transition-colors"
                                              title="Annuler le reclassement"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                      </span>
                                    </td>
                                    <td className={`px-3 py-1.5 text-right font-medium ${
                                      c.montant >= 0 ? 'text-gray-900' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(c.montant)}
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Print : toujours affiché */}
              {section.items.length > 0 && (
                <div className="hidden print:block border-t border-gray-100 px-4 py-2">
                  <table className="w-full text-sm">
                    <tbody>
                      {section.items.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100 first:border-t-0">
                          <td className="py-1 text-gray-500 font-mono text-xs w-16">{item.compteRacine}</td>
                          <td className="py-1 text-gray-700">{item.label}</td>
                          <td className="py-1 text-right font-medium text-gray-900">{formatCurrency(item.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t-2 border-gray-300 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">Total {title.toLowerCase()}</span>
        <span
          className="text-lg font-bold text-gray-900"
          title={totalN1 !== undefined ? `N-1 : ${formatCurrency(totalN1)}` : undefined}
        >
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

function BilanDetailSection({
  bilan,
  bilanN1,
  ratios,
  nafLibelle,
  onOpenEcritures,
  companyId,
  overrides,
  onOverride,
  onDeleteOverride,
}: {
  bilan: Bilan;
  bilanN1?: Bilan;
  ratios: RatioFinancier[];
  nafLibelle?: string;
  onOpenEcritures: (compteNum: string, compteLib: string) => void;
  companyId?: string;
  overrides?: AccountOverride[];
  onOverride: (dto: UpdateOverrideDto) => void;
  onDeleteOverride: (compteNum: string) => void;
}) {
  // Identifier les 3 plus gros postes actif et passif
  const actifSections: BilanSection[] = [
    bilan.actif.immobilisations,
    bilan.actif.stocks,
    bilan.actif.creances,
    bilan.actif.tresorerie,
  ];
  const actifSectionKeys = ['immobilisations', 'stocks', 'creances', 'tresorerie'];

  const passifSections: BilanSection[] = [
    bilan.passif.capitauxPropres,
    bilan.passif.dettesFinancieres,
    bilan.passif.dettesFournisseurs,
    bilan.passif.dettesFiscales,
    ...(bilan.passif.autresDettes.total !== 0 ? [bilan.passif.autresDettes] : []),
  ];
  const passifSectionKeys = [
    'capitauxPropres',
    'dettesFinancieres',
    'dettesFournisseurs',
    'dettesFiscales',
    ...(bilan.passif.autresDettes.total !== 0 ? ['autresDettes'] : []),
  ];

  // Sections N-1 pour comparaison
  const actifSectionsN1 = bilanN1 ? [
    bilanN1.actif.immobilisations,
    bilanN1.actif.stocks,
    bilanN1.actif.creances,
    bilanN1.actif.tresorerie,
  ] : undefined;

  const passifSectionsN1 = bilanN1 ? [
    bilanN1.passif.capitauxPropres,
    bilanN1.passif.dettesFinancieres,
    bilanN1.passif.dettesFournisseurs,
    bilanN1.passif.dettesFiscales,
    ...(bilanN1.passif.autresDettes.total !== 0 ? [bilanN1.passif.autresDettes] : []),
  ] : undefined;

  const sortedActif = [...actifSections].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const top3Actif = new Set(sortedActif.slice(0, 3).map(s => s.label));

  const sortedPassif = [...passifSections].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const top3Passif = new Set(sortedPassif.slice(0, 3).map(s => s.label));

  const bilanRatios = ratios.filter(r => r.categorie === 'bilan');

  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent-500" />
        Bilan détaillé
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <BilanSide
          title="Actif"
          sections={actifSections}
          total={bilan.actif.totalActif}
          totalN1={bilanN1?.actif.totalActif}
          tooltips={BILAN_ACTIF_TOOLTIPS}
          top3Items={top3Actif}
          sectionsN1={actifSectionsN1}
          onOpenEcritures={onOpenEcritures}
          sectionKeys={actifSectionKeys}
          bilanSide="actif"
          overrides={overrides}
          onOverride={onOverride}
          onDeleteOverride={onDeleteOverride}
        />
        <BilanSide
          title="Passif"
          sections={passifSections}
          total={bilan.passif.totalPassif}
          totalN1={bilanN1?.passif.totalPassif}
          tooltips={BILAN_PASSIF_TOOLTIPS}
          top3Items={top3Passif}
          sectionsN1={passifSectionsN1}
          onOpenEcritures={onOpenEcritures}
          sectionKeys={passifSectionKeys}
          bilanSide="passif"
          overrides={overrides}
          onOverride={onOverride}
          onDeleteOverride={onDeleteOverride}
        />
      </div>

      {/* Ratios Bilan */}
      {bilanRatios.length > 0 && (
        <div>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              Ratios liés au bilan
            </h3>
            {nafLibelle && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                Réf. : {nafLibelle}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {bilanRatios.map((ratio, i) => (
              <RatioCard key={i} ratio={ratio} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ════════════════════════════════════════════
// Page principale
// ════════════════════════════════════════════

export function RapportActivitePage() {
  const { selectedFiscalYear, selectedCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const [ecrituresModal, setEcrituresModal] = useState<{
    compteNum: string;
    compteLib: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-clear toast after 3s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openEcritures = (compteNum: string, compteLib: string) =>
    setEcrituresModal({ compteNum, compteLib });

  const { data, isLoading, error } = useQuery({
    queryKey: ['rapport-activite', selectedFiscalYear?.id],
    queryFn: () => getRapportActivite(selectedFiscalYear!.id),
    enabled: !!selectedFiscalYear,
  });

  // Mapping query
  const { data: mappingData } = useQuery({
    queryKey: ['account-mapping', selectedCompany?.id],
    queryFn: () => getAccountMapping(selectedCompany!.id),
    enabled: !!selectedCompany,
  });

  // Upsert override mutation
  const upsertMutation = useMutation({
    mutationFn: (dto: UpdateOverrideDto) => upsertAccountOverride(selectedCompany!.id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rapport-activite'] });
      queryClient.invalidateQueries({ queryKey: ['account-mapping'] });
      setToast(`Compte ${variables.compteNum} reclassé avec succès`);
    },
    onError: () => {
      setToast('Erreur lors du reclassement du compte');
    },
  });

  // Delete override mutation
  const deleteMutation = useMutation({
    mutationFn: (compteNum: string) => deleteAccountOverride(selectedCompany!.id, compteNum),
    onSuccess: (_data, compteNum) => {
      queryClient.invalidateQueries({ queryKey: ['rapport-activite'] });
      queryClient.invalidateQueries({ queryKey: ['account-mapping'] });
      setToast(`Reclassement du compte ${compteNum} annulé`);
    },
    onError: () => {
      setToast('Erreur lors de la suppression du reclassement');
    },
  });

  const handleOverride = (dto: UpdateOverrideDto) => {
    if (!selectedCompany) return;
    upsertMutation.mutate(dto);
  };

  const handleDeleteOverride = (compteNum: string) => {
    if (!selectedCompany) return;
    deleteMutation.mutate(compteNum);
  };

  const overrides = mappingData?.mappings;

  if (!selectedFiscalYear) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Sélectionnez une entreprise et un exercice fiscal pour générer le rapport.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="text-sm text-gray-500">Génération du rapport en cours...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-700 rounded-lg p-4">
        Erreur lors de la génération du rapport d'activité.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 rapport-activite-container">
      <RapportHeader data={data} />

      <SIGSection
        sig={data.sig}
        sigN1={data.sigN1}
        ratios={data.ratios}
        nafLibelle={data.entreprise.nafLibelle}
        chiffreAffaires={data.kpis.chiffreAffaires}
        chiffreAffairesN1={data.kpisN1?.chiffreAffaires}
        onOpenEcritures={openEcritures}
        companyId={selectedCompany?.id}
        overrides={overrides}
        onOverride={handleOverride}
        onDeleteOverride={handleDeleteOverride}
      />

      <BilanDetailSection
        bilan={data.bilan}
        bilanN1={data.bilanN1}
        ratios={data.ratios}
        nafLibelle={data.entreprise.nafLibelle}
        onOpenEcritures={openEcritures}
        companyId={selectedCompany?.id}
        overrides={overrides}
        onOverride={handleOverride}
        onDeleteOverride={handleDeleteOverride}
      />

      {/* Footer print */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
        <p>Rapport généré par Finloop — Raly Conseils — {new Date(data.genereA).toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Modal écritures */}
      {ecrituresModal && selectedFiscalYear && (
        <EcrituresModal
          compteNum={ecrituresModal.compteNum}
          compteLib={ecrituresModal.compteLib}
          fiscalYearId={selectedFiscalYear.id}
          onClose={() => setEcrituresModal(null)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-primary-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 print:hidden animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}

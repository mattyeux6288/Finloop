import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getRapportActivite } from '@/api/analysis.api';
import { formatPercent } from '@finthesis/shared';
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

  let barPct = 100;
  let secteurPct = 100;
  if (hasSecteur && ratio.secteurMoyenne! > 0 && ratio.valeur > 0) {
    const max = Math.max(ratio.valeur, ratio.secteurMoyenne!);
    barPct = Math.round((ratio.valeur / max) * 100);
    secteurPct = Math.round((ratio.secteurMoyenne! / max) * 100);
  }

  return (
    <div className={`rounded-xl border p-4 ${style.bg} ${style.border} print:bg-white relative group`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        <span className="text-xs font-medium text-gray-600 leading-tight">{ratio.label}</span>
      </div>
      <p className={`text-lg font-bold ${style.text} leading-snug`}>{formattedValue}</p>

      {hasSecteur && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 w-14 shrink-0">Société</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: style.bar }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 w-14 shrink-0">Secteur</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gray-400 rounded-full" style={{ width: `${secteurPct}%` }} />
            </div>
            <span className="text-xs text-gray-400 ml-1">
              {formatVal(ratio.secteurMoyenne!, ratio.unite)}
            </span>
          </div>
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
};

// ════════════════════════════════════════════
// Section SIG
// ════════════════════════════════════════════

function SIGSection({
  sig,
  ratios,
  nafLibelle,
  chiffreAffaires,
}: {
  sig: Sig;
  ratios: RatioFinancier[];
  nafLibelle?: string;
  chiffreAffaires: number;
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
  const sigSteps: { key: string; level: SigLevel }[] = [
    { key: 'Marge commerciale', level: sig.margeCommerciale },
    { key: 'Production de l\'exercice', level: sig.productionExercice },
    { key: 'Valeur ajoutée', level: sig.valeurAjoutee },
    { key: 'EBE', level: sig.ebe },
    { key: 'Résultat d\'exploitation', level: sig.resultatExploitation },
    { key: 'RCAI', level: sig.rcai },
    { key: 'Résultat exceptionnel', level: sig.resultatExceptionnel },
    { key: 'Résultat net', level: sig.resultatNet },
    { key: 'Plus ou moins-values de cession', level: sig.plusMoinsValuesCessions },
  ];

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
      {/* Encart Chiffre d'Affaires */}
      <div className="rounded-xl border-2 border-primary-300 bg-primary-50 p-5 mb-6 print:bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="text-lg font-bold text-primary-800">
              Chiffre d'affaires
            </span>
          </div>
          <span className="text-2xl font-bold text-primary-700">
            {formatCurrency(chiffreAffaires)}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        Soldes Intermédiaires de Gestion (SIG)
      </h2>

      {/* Cascade SIG */}
      <div className="space-y-2 mb-8">
        {sigSteps.map(({ key, level }) => {
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
              {/* En-tête du niveau SIG */}
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
                    <span className={`text-sm font-bold shrink-0 ml-4 ${
                      isResultatNet
                        ? (isPositive ? 'text-green-700 text-base' : 'text-red-600 text-base')
                        : (isPositive ? 'text-gray-900' : 'text-red-600')
                    }`}>
                      {formatCurrency(level.montant)}
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
                                {d.comptes!.map((c, j) => (
                                  <tr key={j} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-3 py-1.5 font-mono text-gray-500">{c.compteNum}</td>
                                    <td className="px-3 py-1.5 text-gray-700">{c.compteLib}</td>
                                    <td className={`px-3 py-1.5 text-right font-medium ${
                                      c.montant >= 0 ? 'text-gray-900' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(c.montant)}
                                    </td>
                                  </tr>
                                ))}
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
            <ExpertTooltip>
              <p className="font-medium text-accent-300 mb-1">Résultat net</p>
              <p>{SIG_TOOLTIPS['Résultat net']}</p>
            </ExpertTooltip>
          </div>
          <span className={`text-2xl font-bold ${
            sig.resultatNet.montant >= 0 ? 'text-green-700' : 'text-red-600'
          }`}>
            {formatCurrency(sig.resultatNet.montant)}
          </span>
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
  tooltips,
  top3Items,
}: {
  title: string;
  sections: BilanSection[];
  total: number;
  tooltips: Record<string, string>;
  top3Items: Set<string>;
}) {
  const { formatCurrency } = useCurrencyFormat();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title} <span className="text-sm font-normal text-gray-500">— {formatCurrency(total)}</span>
      </h3>

      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSections.has(section.label);
          const isTop3 = top3Items.has(section.label);
          const tooltip = tooltips[section.label];

          return (
            <div
              key={section.label}
              className={`rounded-lg border overflow-hidden ${
                isTop3 ? 'border-accent-300 bg-accent-50/30' : 'border-gray-100'
              }`}
            >
              {/* En-tête de section bilan */}
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
                <span className="text-sm font-bold text-gray-900 shrink-0 ml-3">
                  {formatCurrency(section.total)}
                </span>
              </button>

              {/* Items détaillés */}
              {isOpen && section.items.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                  <table className="w-full text-sm">
                    <tbody>
                      {section.items.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100 first:border-t-0">
                          <td className="py-1 text-gray-500 font-mono text-xs w-16">{item.compteRacine}</td>
                          <td className="py-1 text-gray-700">{item.label}</td>
                          <td className={`py-1 text-right font-medium ${
                            item.montant >= 0 ? 'text-gray-900' : 'text-red-600'
                          }`}>
                            {formatCurrency(item.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

function BilanDetailSection({
  bilan,
  ratios,
  nafLibelle,
}: {
  bilan: Bilan;
  ratios: RatioFinancier[];
  nafLibelle?: string;
}) {
  // Identifier les 3 plus gros postes actif et passif
  const actifSections: BilanSection[] = [
    bilan.actif.immobilisations,
    bilan.actif.stocks,
    bilan.actif.creances,
    bilan.actif.tresorerie,
  ];

  const passifSections: BilanSection[] = [
    bilan.passif.capitauxPropres,
    bilan.passif.dettesFinancieres,
    bilan.passif.dettesFournisseurs,
    bilan.passif.dettesFiscales,
  ];

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
          tooltips={BILAN_ACTIF_TOOLTIPS}
          top3Items={top3Actif}
        />
        <BilanSide
          title="Passif"
          sections={passifSections}
          total={bilan.passif.totalPassif}
          tooltips={BILAN_PASSIF_TOOLTIPS}
          top3Items={top3Passif}
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
  const { selectedFiscalYear } = useCompanyStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['rapport-activite', selectedFiscalYear?.id],
    queryFn: () => getRapportActivite(selectedFiscalYear!.id),
    enabled: !!selectedFiscalYear,
  });

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
        ratios={data.ratios}
        nafLibelle={data.entreprise.nafLibelle}
        chiffreAffaires={data.kpis.chiffreAffaires}
      />

      <BilanDetailSection
        bilan={data.bilan}
        ratios={data.ratios}
        nafLibelle={data.entreprise.nafLibelle}
      />

      {/* Footer print */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
        <p>Rapport généré par Finloop — Raly Conseils — {new Date(data.genereA).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCompanyStore } from '@/store/companyStore';
import { getRapportActivite } from '@/api/analysis.api';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueBarChart } from '@/components/charts/RevenueBarChart';
import { TresorerieChart } from '@/components/charts/TresorerieChart';
import { formatEur, formatPercent } from '@finthesis/shared';
import type {
  ChargeClassDetail,
  RatioFinancier,
  PointDiscussion,
  EquilibreFinancier,
  Bilan,
  Sig,
  RapportActiviteData,
} from '@finthesis/shared';
import {
  Printer,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Building2,
  Calendar,
  BarChart3,
  Wallet,
  Scale,
} from 'lucide-react';

// ── Couleurs SIG waterfall ──
const SIG_COLORS: Record<string, string> = {
  positive: '#6DC28A',
  negative: '#ef4444',
  neutral: '#94a3b8',
};

// ── Couleurs charges par classe ──
const CHARGE_COLORS: Record<string, string> = {
  '60': '#1E3A30',
  '61': '#2D6B48',
  '62': '#6DC28A',
  '63': '#E8621A',
  '64': '#c94f0e',
  '65': '#84caaa',
  '66': '#3a7d52',
  '67': '#f77c2e',
  '68': '#aedfc5',
  '69': '#4a9866',
};

// ════════════════════════════════════════════
// Section : En-tête du rapport
// ════════════════════════════════════════════
function RapportHeader({ data }: { data: RapportActiviteData }) {
  const date = new Date(data.genereA);
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm print:shadow-none print:border-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center print:bg-primary-800">
              <span className="text-white font-bold text-lg">RC</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 leading-tight">Raly Conseils</p>
              <p className="text-xs text-gray-400 leading-tight">Rapport d'activité 2.0</p>
            </div>
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

      <div className="mt-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary-600" />
          {data.entreprise.nom}
        </h1>
        <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
          {data.entreprise.siren && (
            <span>SIREN : {data.entreprise.siren}</span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {data.entreprise.exercice} ({data.entreprise.dateDebut} au {data.entreprise.dateFin})
          </span>
        </div>
        {data.entreprise.nafCode && (
          <p className="text-xs text-gray-400 mt-1">
            Code APE/NAF : {data.entreprise.nafCode}
            {data.entreprise.nafLibelle && ` — ${data.entreprise.nafLibelle}`}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Rapport généré le {dateStr}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// Section : Synthèse exécutive (KPIs)
// ════════════════════════════════════════════
function SyntheseExecutive({ data }: { data: RapportActiviteData }) {
  const { kpis } = data;
  const { caf, frng } = data.equilibreFinancier;
  return (
    <section className="print:break-before-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent-500" />
        Synthèse exécutive
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Chiffre d'affaires" value={kpis.chiffreAffaires} />
        <KpiCard label="Marge brute" value={kpis.margeBrute} />
        <KpiCard label="Taux de marge" value={kpis.tauxMargeBrute} format="percent" />
        <KpiCard label="EBE" value={kpis.ebe} />
        <KpiCard label="Résultat net" value={kpis.resultatNet} />
        <KpiCard label="Trésorerie" value={kpis.tresorerieNette} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
        <KpiCard label="BFR" value={kpis.bfr} />
        <KpiCard label="FRNG" value={frng} />
        <KpiCard label="CAF" value={caf} />
        <KpiCard label="Rentabilité nette" value={kpis.ratioRentabilite} format="percent" />
        <KpiCard label="Délai client" value={kpis.delaiClientMoyen} format="days" />
        <KpiCard label="Délai fournisseur" value={kpis.delaiFournisseurMoyen} format="days" />
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Évolution du CA
// ════════════════════════════════════════════
function EvolutionCA({ data }: { data: RapportActiviteData }) {
  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        Évolution du chiffre d'affaires
      </h2>
      <RevenueBarChart data={data.revenueMonthly} dataN1={data.revenueMonthlyN1} />
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Trésorerie & Équilibre financier
// ════════════════════════════════════════════
function TresorerieSection({ data }: { data: RapportActiviteData }) {
  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-accent-500" />
        Évolution de la trésorerie
      </h2>
      <TresorerieChart data={data.tresorerieMensuelle} />
    </section>
  );
}

function EquilibreFinancierSection({ equilibre }: { equilibre: EquilibreFinancier }) {
  const { frng, bfr, tresorerieNette, caf, joursCA } = equilibre;

  // Pour la visualisation de l'équation FRNG = BFR + Trésorerie
  const maxVal = Math.max(Math.abs(frng), Math.abs(bfr) + Math.abs(tresorerieNette), 1);

  const interpretFrng = frng > 0
    ? (frng >= bfr ? 'bon' : 'attention')
    : 'alerte';

  const interpretCaf = caf > 0
    ? (caf / Math.max(Math.abs(tresorerieNette), 1) >= 0.5 ? 'bon' : 'attention')
    : 'alerte';

  const styles = {
    bon: 'bg-green-50 border-green-200 text-green-700',
    attention: 'bg-amber-50 border-amber-200 text-amber-700',
    alerte: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <section className="print:break-before-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5 text-accent-500" />
        Équilibre financier
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Carte FRNG */}
        <div className={`rounded-xl border p-5 ${styles[interpretFrng]} print:bg-white`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium opacity-75">Fonds de Roulement Net Global</p>
              <p className="text-2xl font-bold mt-1">{formatEur(frng)}</p>
            </div>
            <div className="text-right text-xs opacity-75 space-y-0.5">
              <p>Capitaux permanents − Immobilisations</p>
            </div>
          </div>

          {/* Visualisation de l'équation FRNG = BFR + Trésorerie */}
          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="text-xs font-semibold mb-2 opacity-80">FRNG = BFR + Trésorerie nette</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0 opacity-70">FRNG</span>
                <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (Math.abs(frng) / maxVal) * 100)}%`,
                      backgroundColor: '#2D5A3D',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold w-20 text-right">{formatEur(frng)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0 opacity-70">BFR</span>
                <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (Math.abs(bfr) / maxVal) * 100)}%`,
                      backgroundColor: '#E8621A',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold w-20 text-right">{formatEur(bfr)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-24 shrink-0 opacity-70">Trésorerie</span>
                <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (Math.abs(tresorerieNette) / maxVal) * 100)}%`,
                      backgroundColor: tresorerieNette >= 0 ? '#6DC28A' : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold w-20 text-right">{formatEur(tresorerieNette)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carte CAF */}
        <div className={`rounded-xl border p-5 ${styles[interpretCaf]} print:bg-white`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium opacity-75">Capacité d'Autofinancement</p>
              <p className="text-2xl font-bold mt-1">{formatEur(caf)}</p>
            </div>
            <div className="text-right text-xs opacity-75 space-y-0.5">
              <p>Résultat net + Dotations</p>
              <p>− Reprises ± Cessions</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="opacity-70">Autonomie de trésorerie</span>
              <span className="font-bold text-base">{joursCA} jours de CA</span>
            </div>
            <p className="text-xs opacity-60">
              {joursCA >= 90
                ? 'Réserve confortable (> 3 mois de CA)'
                : joursCA >= 30
                  ? 'Réserve correcte (1-3 mois de CA)'
                  : joursCA >= 0
                    ? 'Réserve limitée (< 1 mois de CA)'
                    : 'Trésorerie négative — situation critique'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Détail des charges
// ════════════════════════════════════════════
function ChargesDetailSection({ charges }: { charges: ChargeClassDetail[] }) {
  const [openClasses, setOpenClasses] = useState<Set<string>>(new Set());

  const toggleClass = (code: string) => {
    setOpenClasses((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const totalCharges = charges.reduce((sum, c) => sum + c.montant, 0);

  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent-500" />
        Analyse détaillée des charges
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Total des charges : <span className="font-semibold text-gray-700">{formatEur(totalCharges)}</span>
      </p>

      <div className="space-y-3">
        {charges.map((classe) => {
          const isOpen = openClasses.has(classe.classeCode);
          const barColor = CHARGE_COLORS[classe.classeCode] || '#6DC28A';
          const barWidth = totalCharges > 0 ? Math.max(2, (classe.montant / totalCharges) * 100) : 0;

          return (
            <div
              key={classe.classeCode}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none"
            >
              {/* En-tête de classe */}
              <button
                onClick={() => toggleClass(classe.classeCode)}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left print:hover:bg-white"
              >
                <span className="print:hidden">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </span>
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: barColor }}
                >
                  {classe.classeCode}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {classe.classeLabel}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-sm font-bold text-gray-900">{formatEur(classe.montant)}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {classe.pourcentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Barre proportionnelle */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              </button>

              {/* Sous-comptes (dépliable) */}
              {(isOpen || false) && classe.sousComptes.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 print:bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs">
                        <th className="text-left pb-2 font-medium">Compte</th>
                        <th className="text-left pb-2 font-medium">Libellé</th>
                        <th className="text-right pb-2 font-medium">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classe.sousComptes.map((sc) => (
                        <tr key={sc.compteNum} className="border-t border-gray-100">
                          <td className="py-1.5 text-gray-500 font-mono text-xs">{sc.compteNum}</td>
                          <td className="py-1.5 text-gray-700">{sc.label}</td>
                          <td className="py-1.5 text-right font-medium text-gray-900">{formatEur(sc.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* En mode print, toujours afficher les sous-comptes */}
              <div className="hidden print:block border-t border-gray-100 px-5 py-3">
                {classe.sousComptes.length > 0 && (
                  <table className="w-full text-sm">
                    <tbody>
                      {classe.sousComptes.map((sc) => (
                        <tr key={sc.compteNum} className="border-t border-gray-100">
                          <td className="py-1 text-gray-500 font-mono text-xs">{sc.compteNum}</td>
                          <td className="py-1 text-gray-700">{sc.label}</td>
                          <td className="py-1 text-right font-medium text-gray-900">{formatEur(sc.montant)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Bilan visuel
// ════════════════════════════════════════════
function BilanVisualSection({ bilan }: { bilan: Bilan }) {
  const actifItems = [
    { label: 'Immobilisations', value: bilan.actif.immobilisations.total, color: '#1E3A30' },
    { label: 'Stocks', value: bilan.actif.stocks.total, color: '#2D6B48' },
    { label: 'Créances', value: bilan.actif.creances.total, color: '#6DC28A' },
    { label: 'Trésorerie', value: bilan.actif.tresorerie.total, color: '#84caaa' },
  ];

  const passifItems = [
    { label: 'Capitaux propres', value: bilan.passif.capitauxPropres.total, color: '#1E3A30' },
    { label: 'Dettes financières', value: bilan.passif.dettesFinancieres.total, color: '#E8621A' },
    { label: 'Fournisseurs', value: bilan.passif.dettesFournisseurs.total, color: '#c94f0e' },
    { label: 'Dettes fiscales', value: bilan.passif.dettesFiscales.total, color: '#f77c2e' },
  ];

  const renderBar = (items: typeof actifItems, total: number) => (
    <div className="space-y-2">
      <div className="flex h-10 rounded-lg overflow-hidden">
        {items.map((item, i) => {
          const pct = total > 0 ? (Math.abs(item.value) / total) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${pct}%`, backgroundColor: item.color, minWidth: pct > 3 ? 'auto' : '0' }}
              title={`${item.label}: ${formatEur(item.value)}`}
            >
              {pct > 8 && `${Math.round(pct)}%`}
            </div>
          );
        })}
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-gray-700">{item.label}</span>
            </div>
            <span className="font-medium text-gray-900">{formatEur(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-accent-500" />
        Structure du bilan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Actif <span className="text-sm font-normal text-gray-500">— {formatEur(bilan.actif.totalActif)}</span>
          </h3>
          {renderBar(actifItems, bilan.actif.totalActif)}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Passif <span className="text-sm font-normal text-gray-500">— {formatEur(bilan.passif.totalPassif)}</span>
          </h3>
          {renderBar(passifItems, bilan.passif.totalPassif)}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Cascade SIG
// ════════════════════════════════════════════
function SigCascadeSection({ sig }: { sig: Sig }) {
  const steps = [
    { label: 'Marge commerciale', value: sig.margeCommerciale.montant },
    { label: 'Production', value: sig.productionExercice.montant },
    { label: 'Valeur ajoutée', value: sig.valeurAjoutee.montant },
    { label: 'EBE', value: sig.ebe.montant },
    { label: "Résultat d'exploitation", value: sig.resultatExploitation.montant },
    { label: 'RCAI', value: sig.rcai.montant },
    { label: 'Résultat net', value: sig.resultatNet.montant },
  ];

  const maxAbs = Math.max(...steps.map((s) => Math.abs(s.value)), 1);

  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-accent-500" />
        Cascade des Soldes Intermédiaires de Gestion
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm print:shadow-none">
        <div className="space-y-3">
          {steps.map((step, i) => {
            const pct = (Math.abs(step.value) / maxAbs) * 100;
            const isPositive = step.value >= 0;
            const isLast = i === steps.length - 1;

            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-48 shrink-0 text-right">
                  <span className={`text-sm ${isLast ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                    {step.label}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-8 relative">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: isLast
                          ? (isPositive ? '#E8621A' : '#ef4444')
                          : (isPositive ? SIG_COLORS.positive : SIG_COLORS.negative),
                      }}
                    />
                  </div>
                  <span className={`text-sm font-semibold w-36 shrink-0 text-right ${
                    isPositive ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {formatEur(step.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Ratios clés
// ════════════════════════════════════════════
function RatiosSection({ ratios, nafLibelle }: { ratios: RatioFinancier[]; nafLibelle?: string }) {
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

  return (
    <section className="print:break-before-page">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-500" />
          Ratios et indicateurs clés
        </h2>
        {nafLibelle && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            Référence : {nafLibelle}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ratios.map((ratio, i) => {
          const style = interpretationStyles[ratio.interpretation];
          const formattedValue = formatVal(ratio.valeur, ratio.unite);
          const hasSecteur = ratio.secteurMoyenne !== undefined;

          // Largeur de la barre comparée (valeur entreprise vs secteur)
          let barPct = 100;
          let secteurPct = 100;
          if (hasSecteur && ratio.secteurMoyenne! > 0 && ratio.valeur > 0) {
            const max = Math.max(ratio.valeur, ratio.secteurMoyenne!);
            barPct = Math.round((ratio.valeur / max) * 100);
            secteurPct = Math.round((ratio.secteurMoyenne! / max) * 100);
          }

          return (
            <div
              key={i}
              className={`rounded-xl border p-4 ${style.bg} ${style.border} print:bg-white`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <span className="text-xs font-medium text-gray-600 leading-tight">{ratio.label}</span>
              </div>
              <p className={`text-lg font-bold ${style.text} leading-snug`}>{formattedValue}</p>

              {hasSecteur && (
                <div className="mt-2 space-y-1">
                  {/* Barre entreprise */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 w-14 shrink-0">Société</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: style.bar }} />
                    </div>
                  </div>
                  {/* Barre secteur */}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════
// Section : Points de discussion
// ════════════════════════════════════════════
function PointsDiscussionSection({ points }: { points: PointDiscussion[] }) {
  const forces = points.filter((p) => p.type === 'force');
  const vigilances = points.filter((p) => p.type === 'vigilance');
  const actions = points.filter((p) => p.type === 'action');

  const columns = [
    {
      title: 'Points forts',
      icon: CheckCircle2,
      items: forces,
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
    },
    {
      title: 'Points de vigilance',
      icon: AlertTriangle,
      items: vigilances,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-800',
    },
    {
      title: 'Actions recommandées',
      icon: AlertCircle,
      items: actions,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
    },
  ];

  return (
    <section className="print:break-before-page">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-accent-500" />
        Pistes de réflexion et points de discussion
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.title}
            className={`rounded-xl border p-5 ${col.bg} ${col.border} print:bg-white`}
          >
            <h3 className={`text-sm font-semibold ${col.titleColor} flex items-center gap-2 mb-4`}>
              <col.icon className={`w-5 h-5 ${col.iconColor}`} />
              {col.title}
            </h3>
            {col.items.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun point identifié</p>
            ) : (
              <ul className="space-y-3">
                {col.items.map((item, i) => (
                  <li key={i}>
                    <p className="text-sm font-semibold text-gray-900">{item.titre}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
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
      <SyntheseExecutive data={data} />
      <EvolutionCA data={data} />
      <TresorerieSection data={data} />
      <EquilibreFinancierSection equilibre={data.equilibreFinancier} />
      <ChargesDetailSection charges={data.chargesDetaillees} />
      <BilanVisualSection bilan={data.bilan} />
      <SigCascadeSection sig={data.sig} />
      <RatiosSection ratios={data.ratios} nafLibelle={data.entreprise.nafLibelle} />
      <PointsDiscussionSection points={data.pointsDiscussion} />

      {/* Footer print */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
        <p>Rapport généré par Finloop — Raly Conseils — {new Date(data.genereA).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  );
}

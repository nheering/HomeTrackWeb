'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAuthenticationStatus } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { format, subMonths, startOfYear, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart3, Table2, Loader2, Euro, Gauge, Download, ArrowLeftRight, Wrench } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import Navigation from '@/components/layout/Navigation';
import { GraphQLErrorBoundary } from '@/components/error';
import DateInput from '@/components/ui/DateInput';
import { GET_AUSWERTUNG_DATEN, GET_VERBRAUCHSTYPEN, GET_PREISPERIODEN_FOR_TYPEN, GET_HANDWERKERRECHNUNGEN } from '@/lib/graphql/queries';
import { Verbrauchstyp, Verbrauchswert, Handwerkerrechnung } from '@/types';

type ViewMode = 'chart' | 'table';
type DataMode = 'verbrauch' | 'kosten';

interface ChartDataPoint {
  datum: string;
  [key: string]: string | number;
}

const ZEITRAEUME = [
  { label: '3 Monate', months: 3 },
  { label: '6 Monate', months: 6 },
  { label: '1 Jahr', months: 12 },
  { label: 'Dieses Jahr', months: 0 },
];
const CUSTOM_IDX = 4;

export default function AuswertungenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [dataMode, setDataMode] = useState<DataMode>('verbrauch');
  const [zeitraumIdx, setZeitraumIdx] = useState(2);
  const [jahresvergleich, setJahresvergleich] = useState(false);
  const [selectedTypen, setSelectedTypen] = useState<string[]>([]);
  const [selectedStellen, setSelectedStellen] = useState<Record<string, string[]>>({});
  const [showHandwerker, setShowHandwerker] = useState(false);

  const now = new Date();
  const [customVon, setCustomVon] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [customBis, setCustomBis] = useState(format(now, 'yyyy-MM-dd'));

  const { data: typenData } = useQuery(GET_VERBRAUCHSTYPEN, { skip: !isAuthenticated });
  const verbrauchstypen: Verbrauchstyp[] = typenData?.verbrauchstyp ?? [];

  // Vorbelegen: Standardstelle je Typ, einmalig beim ersten Laden
  useEffect(() => {
    if (!verbrauchstypen.length) return;
    setSelectedStellen(prev => {
      const next = { ...prev };
      for (const typ of verbrauchstypen) {
        if (next[typ.id] !== undefined) continue;
        const standard = typ.verbrauchsstellen?.find(s => s.ist_standard)
          ?? typ.verbrauchsstellen?.[0];
        next[typ.id] = standard ? [standard.id] : [];
      }
      return next;
    });
  }, [verbrauchstypen]);

  const baseVon = zeitraumIdx === CUSTOM_IDX
    ? customVon
    : zeitraumIdx === 3
      ? format(startOfYear(now), 'yyyy-MM-dd')
      : format(subMonths(now, ZEITRAEUME[zeitraumIdx].months), 'yyyy-MM-dd');
  const baseBis = zeitraumIdx === CUSTOM_IDX ? customBis : format(now, 'yyyy-MM-dd');

  const von = jahresvergleich
    ? format(subMonths(new Date(baseVon), 12), 'yyyy-MM-dd')
    : baseVon;
  const bis = baseBis;

  const activeTypen = selectedTypen.length > 0 ? selectedTypen : verbrauchstypen.map((t) => t.id);

  // Alle ausgewählten Stellen für aktive Typen
  const activeStellen = activeTypen.flatMap(typId => selectedStellen[typId] ?? []);

  const { data, loading, refetch } = useQuery(GET_AUSWERTUNG_DATEN, {
    variables: { von, bis, typen: activeTypen },
    skip: !isAuthenticated || activeTypen.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  const { data: hwData } = useQuery(GET_HANDWERKERRECHNUNGEN, {
    variables: { jahr_von: von, jahr_bis: bis },
    skip: !isAuthenticated || !showHandwerker,
    fetchPolicy: 'cache-and-network',
  });
  const hwRechnungen: Handwerkerrechnung[] = hwData?.handwerkerrechnung ?? [];

  const { data: preisData } = useQuery(GET_PREISPERIODEN_FOR_TYPEN, {
    variables: { typen: activeTypen },
    skip: !isAuthenticated || activeTypen.length === 0 || dataMode !== 'kosten',
  });
  const vertraege = preisData?.vertrag ?? [];

  const allWerte: Verbrauchswert[] = data?.verbrauchswert ?? [];
  // Client-seitige Stellenfilterung
  const filteredWerte = activeStellen.length > 0
    ? allWerte.filter(w => activeStellen.includes(w.verbrauchsstelle?.id ?? ''))
    : allWerte;

  // Periodenlabels für Jahresvergleich
  const jvVonDate = new Date(baseVon);
  const jvBisDate = new Date(baseBis);
  const jvVonYear = jvVonDate.getFullYear();
  const jvBisYear = jvBisDate.getFullYear();
  const currentPeriodLabel = jvVonYear === jvBisYear
    ? `${jvVonYear}`
    : `${jvVonYear}/${String(jvBisYear).slice(2)}`;
  const prevPeriodLabel = jvVonYear === jvBisYear
    ? `${jvVonYear - 1}`
    : `${jvVonYear - 1}/${String(jvBisYear - 1).slice(2)}`;

  const handwerkerAktiv = showHandwerker && dataMode === 'kosten';
  const chartData = buildChartData(filteredWerte, verbrauchstypen, dataMode, vertraege, handwerkerAktiv ? hwRechnungen : []);
  const jvData = jahresvergleich ? buildJahresvergleichData(filteredWerte, verbrauchstypen, activeTypen, dataMode, vertraege, baseVon, baseBis, currentPeriodLabel, prevPeriodLabel) : [];

  const toggleTyp = (id: string) => {
    setSelectedTypen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStelle = (typId: string, stelleId: string) => {
    setSelectedStellen(prev => {
      const current = prev[typId] ?? [];
      const alreadySelected = current.includes(stelleId);
      // Mindestens eine Stelle muss ausgewählt bleiben
      if (alreadySelected && current.length === 1) return prev;
      return {
        ...prev,
        [typId]: alreadySelected
          ? current.filter(id => id !== stelleId)
          : [...current, stelleId],
      };
    });
  };

  // Typen mit mindestens einer Stelle (Stellenfilter immer anzeigen)
  const typenMitStellen = activeTypen.filter(typId => {
    const typ = verbrauchstypen.find(t => t.id === typId);
    return (typ?.verbrauchsstellen?.length ?? 0) > 0;
  });

  return (
    <div className="min-h-screen bg-bg-base bg-grid pb-24">
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-xl border-b border-bg-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-tx-primary">Auswertungen</h1>
            <p className="text-xs text-tx-muted">{von} – {bis}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {dataMode === 'kosten' && (
              <button
                onClick={() => setShowHandwerker(h => !h)}
                className={`ht-btn-ghost text-xs flex items-center gap-1.5 ${showHandwerker ? 'text-accent' : ''}`}
                title="Handwerkerkosten im Chart und in der Tabelle einblenden"
              >
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">Handwerker</span>
              </button>
            )}
            <button
              onClick={() => setJahresvergleich(j => !j)}
              className={`ht-btn-ghost text-xs flex items-center gap-1.5 ${jahresvergleich ? 'text-accent' : ''}`}
              title="Verbrauchsdaten mit dem Vorjahr vergleichen"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">Vergleich</span>
            </button>
            <button
              onClick={() => exportCSV(filteredWerte, dataMode, vertraege)}
              className="ht-btn-ghost text-xs flex items-center gap-1.5"
              title="Alle sichtbaren Daten als CSV-Datei herunterladen"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setDataMode((d) => (d === 'verbrauch' ? 'kosten' : 'verbrauch'))}
              className={`ht-btn-ghost text-xs flex items-center gap-1.5 ${dataMode === 'kosten' ? 'text-accent' : ''}`}
              title={dataMode === 'kosten' ? 'Zur Verbrauchsansicht wechseln' : 'Zur Kostenansicht wechseln (€)'}
            >
              {dataMode === 'kosten' ? <Euro className="w-4 h-4" /> : <Gauge className="w-4 h-4" />}
              <span className="hidden sm:inline">{dataMode === 'kosten' ? 'Kosten' : 'Verbrauch'}</span>
            </button>
            <div className="flex bg-bg-card border border-bg-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1.5 flex items-center gap-1.5 ${viewMode === 'chart' ? 'bg-accent text-white' : 'text-tx-muted hover:text-tx-primary'} transition-colors`}
                title="Daten als Chart anzeigen"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Chart</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-accent text-white' : 'text-tx-muted hover:text-tx-primary'} transition-colors`}
                title="Daten als Tabelle anzeigen"
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Tabelle</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {jahresvergleich && (
          <div className="ht-card">
            <p className="ht-section-title">Jahresvergleich</p>
            <p className="text-xs text-tx-muted">{prevPeriodLabel} vs. {currentPeriodLabel} — monatlich aggregiert</p>
          </div>
        )}

        {!jahresvergleich && (
          <div className="ht-card">
            <p className="ht-section-title">Zeitraum</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {ZEITRAEUME.map((z, i) => (
                <button
                  key={i}
                  onClick={() => setZeitraumIdx(i)}
                  className={`ht-badge cursor-pointer border transition-all duration-150
                    ${zeitraumIdx === i
                      ? 'bg-accent/10 border-accent/40 text-accent'
                      : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'
                    }`}
                >
                  {z.label}
                </button>
              ))}
              <button
                onClick={() => setZeitraumIdx(CUSTOM_IDX)}
                className={`ht-badge cursor-pointer border transition-all duration-150
                  ${zeitraumIdx === CUSTOM_IDX
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'
                  }`}
              >
                Eigener Zeitraum
              </button>
            </div>

            {zeitraumIdx === CUSTOM_IDX && (
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="ht-label">Von</label>
                  <DateInput value={customVon} onChange={setCustomVon} max={customBis} />
                </div>
                <div className="flex-1">
                  <label className="ht-label">Bis</label>
                  <DateInput value={customBis} onChange={setCustomBis} min={customVon} max={format(now, 'yyyy-MM-dd')} />
                </div>
              </div>
            )}
          </div>
        )}

        {verbrauchstypen.length > 0 && (
          <div className="ht-card">
            <p className="ht-section-title">Verbrauchstypen</p>
            <div className="flex gap-2 flex-wrap">
              {verbrauchstypen.map((typ) => {
                const active = activeTypen.includes(typ.id);
                return (
                  <button
                    key={typ.id}
                    onClick={() => toggleTyp(typ.id)}
                    className={`ht-badge cursor-pointer border transition-all duration-150
                      ${active
                        ? 'bg-accent/10 border-accent/40 text-accent'
                        : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'
                      }`}
                  >
                    {typ.symbol} {typ.name}
                  </button>
                );
              })}
            </div>

            {/* Stellenfilter – für alle aktiven Typen mit mindestens einer Stelle */}
            {typenMitStellen.length > 0 && (
              <div className="mt-4 pt-3 border-t border-bg-border/50">
                <p className="ht-section-title mb-2">Verbrauchsstellen</p>
                <div className="space-y-2">
                  {activeTypen.map(typId => {
                    const typ = verbrauchstypen.find(t => t.id === typId);
                    const stellen = typ?.verbrauchsstellen ?? [];
                    if (stellen.length === 0) return null;
                    return (
                      <div key={typId} className="flex items-start gap-3">
                        <span className="text-[11px] text-tx-muted shrink-0 pt-1 w-20 truncate">
                          {typ?.symbol} {typ?.name}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {stellen.map(stelle => {
                            const selected = (selectedStellen[typId] ?? []).includes(stelle.id);
                            return (
                              <button
                                key={stelle.id}
                                onClick={() => toggleStelle(typId, stelle.id)}
                                className={`ht-badge cursor-pointer border transition-all duration-150 text-[11px]
                                  ${selected
                                    ? 'bg-accent/10 border-accent/40 text-accent'
                                    : 'bg-bg-base border-bg-border text-tx-muted hover:border-accent/30'
                                  }`}
                              >
                                {stelle.bezeichnung}
                                {stelle.ist_standard && <span className="ml-1 opacity-50">★</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <GraphQLErrorBoundary onRetry={refetch}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : jahresvergleich ? (
            jvData.length === 0 ? (
              <div className="ht-card text-center py-12">
                <p className="text-tx-muted text-sm">Keine Daten für den Jahresvergleich.</p>
              </div>
            ) : (
              <JahresvergleichChart data={jvData} verbrauchstypen={verbrauchstypen} activeTypen={activeTypen} currentPeriodLabel={currentPeriodLabel} prevPeriodLabel={prevPeriodLabel} dataMode={dataMode} />
            )
          ) : chartData.length === 0 ? (
            <div className="ht-card text-center py-12">
              <p className="text-tx-muted text-sm">Keine Daten für den gewählten Zeitraum.</p>
            </div>
          ) : viewMode === 'chart' ? (
            <ChartView data={chartData} verbrauchstypen={verbrauchstypen} activeTypen={activeTypen} dataMode={dataMode} showHandwerker={handwerkerAktiv} />
          ) : (
            <TableView rawData={filteredWerte} dataMode={dataMode} vertraege={vertraege} hwRechnungen={handwerkerAktiv ? hwRechnungen : []} />
          )}
        </GraphQLErrorBoundary>
      </main>

      <Navigation />
    </div>
  );
}

interface ChartViewProps {
  data: ChartDataPoint[];
  verbrauchstypen: Verbrauchstyp[];
  activeTypen: string[];
  dataMode: DataMode;
  showHandwerker: boolean;
}

function ChartView({ data, verbrauchstypen, activeTypen, dataMode, showHandwerker }: ChartViewProps) {
  const activeTypes = verbrauchstypen.filter((t) => activeTypen.includes(t.id));
  const HW_COLOR = '#a855f7';

  return (
    <div className="ht-card animate-fade-in">
      <p className="ht-section-title">{dataMode === 'kosten' ? 'Kostenentwicklung (€)' : 'Verbrauchsverlauf'}</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            {activeTypes.map((typ) => (
              <linearGradient key={typ.id} id={`grad-${typ.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={typ.farbe || '#f97316'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={typ.farbe || '#f97316'} stopOpacity={0} />
              </linearGradient>
            ))}
            {showHandwerker && (
              <linearGradient id="grad-handwerker" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={HW_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={HW_COLOR} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
          <XAxis dataKey="datum" tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a2232',
              border: '1px solid #243044',
              borderRadius: '8px',
              color: '#e8edf5',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              const formatted = Number(value).toLocaleString('de-DE', { maximumFractionDigits: 2 });
              return dataMode === 'kosten' || name === 'Handwerker' ? [`${formatted} €`, name] : [formatted, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#8b9ab5', paddingTop: '12px' }} />
          {activeTypes.map((typ) => (
            <Area
              key={typ.id}
              type="monotone"
              dataKey={typ.name}
              stroke={typ.farbe || '#f97316'}
              strokeWidth={2}
              fill={`url(#grad-${typ.id})`}
              dot={false}
              activeDot={{ r: 4, fill: typ.farbe }}
              connectNulls
            />
          ))}
          {showHandwerker && (
            <Area
              type="monotone"
              dataKey="Handwerker"
              stroke={HW_COLOR}
              strokeWidth={2}
              fill="url(#grad-handwerker)"
              dot={false}
              activeDot={{ r: 4, fill: HW_COLOR }}
              connectNulls
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TableViewProps {
  rawData: Verbrauchswert[];
  dataMode: DataMode;
  vertraege: any[];
  hwRechnungen: Handwerkerrechnung[];
}

function TableView({ rawData, dataMode, vertraege, hwRechnungen }: TableViewProps) {
  const headers = dataMode === 'kosten'
    ? ['Datum', 'Typ', 'Stelle', 'Verbrauch', 'Kosten (€)']
    : ['Datum', 'Typ', 'Stelle', 'Zählerstand', 'Verbrauch'];

  const euroFmt = (v: number) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="ht-card animate-fade-in overflow-x-auto">
      <p className="ht-section-title">Rohdaten</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border">
            {headers.map((h) => (
              <th key={h} className="text-left text-xs text-tx-muted font-medium pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawData.map((row) => {
            const kosten = dataMode === 'kosten' && row.verbrauch != null
              ? berechneKosten(row.datum, row.verbrauchstyp?.id ?? '', row.verbrauch, vertraege)
              : null;
            return (
              <tr key={row.id} className="border-b border-bg-border/50 hover:bg-bg-hover transition-colors">
                <td className="py-2 pr-4 font-mono text-xs text-tx-secondary">
                  {format(new Date(row.datum), 'dd.MM.yyyy')}
                </td>
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-1.5">
                    <span>{row.verbrauchstyp?.symbol}</span>
                    <span className="text-tx-primary">{row.verbrauchstyp?.name}</span>
                  </span>
                </td>
                <td className="py-2 pr-4 text-tx-secondary text-xs">{row.verbrauchsstelle?.bezeichnung ?? '–'}</td>
                {dataMode === 'kosten' ? (
                  <>
                    <td className="py-2 pr-4 font-mono text-tx-secondary tabular-nums">
                      {row.verbrauch != null ? `${Number(row.verbrauch).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${row.verbrauchstyp?.einheit}` : '–'}
                    </td>
                    <td className="py-2 font-mono tabular-nums" style={{ color: row.verbrauchstyp?.farbe || '#f97316' }}>
                      {kosten != null ? `${kosten.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '–'}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-4 font-mono text-tx-primary tabular-nums">
                      {Number(row.zaehlerstand).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                      <span className="text-tx-muted text-xs ml-1">{row.verbrauchstyp?.einheit}</span>
                    </td>
                    <td className="py-2 font-mono tabular-nums" style={{ color: row.verbrauchstyp?.farbe || '#f97316' }}>
                      {row.verbrauch ? `${Number(row.verbrauch).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${row.verbrauchstyp?.einheit}` : '–'}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {hwRechnungen.map((r) => (
            <tr key={`hw-${r.id}`} className="border-b border-bg-border/50 hover:bg-bg-hover transition-colors bg-purple-500/5">
              <td className="py-2 pr-4 font-mono text-xs text-tx-secondary">
                {format(new Date(r.datum), 'dd.MM.yyyy')}
              </td>
              <td className="py-2 pr-4">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-tx-primary">{r.beschreibung}</span>
                </span>
              </td>
              <td className="py-2 pr-4 text-tx-secondary text-xs">{r.handwerker?.name ?? '–'}</td>
              <td className="py-2 pr-4 font-mono text-tx-secondary tabular-nums">–</td>
              <td className="py-2 font-mono tabular-nums text-purple-400">
                {euroFmt(r.betrag_gesamt)} €
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rawData.length === 0 && hwRechnungen.length === 0 && (
        <p className="text-center text-tx-muted text-sm py-6">Keine Einträge</p>
      )}
    </div>
  );
}

function berechneKosten(datum: string, typId: string, verbrauch: number, vertraege: any[]): number | null {
  const vertrag = vertraege.find((v: any) =>
    v.verbrauchstyp_id === typId &&
    v.beginn_datum <= datum &&
    (!v.ende_datum || v.ende_datum >= datum)
  );
  if (!vertrag) return null;

  const periode = [...vertrag.preisperioden]
    .filter((p: any) => p.gueltig_ab <= datum && (!p.gueltig_bis || p.gueltig_bis >= datum))
    .pop();
  if (!periode) return null;

  const steuer = periode.steuer ? (1 + periode.steuer / 100) : 1;
  return verbrauch * periode.einheitspreis * steuer;
}

function exportCSV(werte: Verbrauchswert[], dataMode: DataMode, vertraege: any[]) {
  const sep = ';';
  const num = (v: number, digits = 2) => v.toFixed(digits).replace('.', ',');

  const headers = dataMode === 'kosten'
    ? ['Datum', 'Typ', 'Stelle', 'Zählerstand', 'Verbrauch', 'Einheit', 'Kosten (€)']
    : ['Datum', 'Typ', 'Stelle', 'Zählerstand', 'Verbrauch', 'Einheit'];

  const rows = werte.map(w => {
    const kosten = dataMode === 'kosten' && w.verbrauch != null
      ? berechneKosten(w.datum, w.verbrauchstyp?.id ?? '', w.verbrauch, vertraege)
      : null;
    const base = [
      format(new Date(w.datum), 'dd.MM.yyyy'),
      w.verbrauchstyp?.name ?? '',
      w.verbrauchsstelle?.bezeichnung ?? '',
      num(Number(w.zaehlerstand), 3),
      w.verbrauch != null ? num(Number(w.verbrauch), 3) : '',
      w.verbrauchstyp?.einheit ?? '',
    ];
    if (dataMode === 'kosten') base.push(kosten != null ? num(kosten) : '');
    return base.join(sep);
  });

  const csv = '\uFEFF' + [headers.join(sep), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hometrack-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildChartData(verbrauchswerte: Verbrauchswert[], typen: Verbrauchstyp[], dataMode: DataMode, vertraege: any[], hwRechnungen: Handwerkerrechnung[] = []): ChartDataPoint[] {
  if (!verbrauchswerte.length && !hwRechnungen.length) return [];

  const groups: Record<string, Verbrauchswert[]> = {};
  for (const w of verbrauchswerte) {
    const key = `${w.verbrauchstyp?.id}-${w.verbrauchsstelle?.id ?? 'none'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }

  const byDate: Record<string, ChartDataPoint> = {};

  for (const werte of Object.values(groups)) {
    const sorted = [...werte].sort((a, b) => a.datum.localeCompare(b.datum));
    for (let i = 0; i < sorted.length; i++) {
      const w = sorted[i];
      if (!byDate[w.datum]) byDate[w.datum] = { datum: format(new Date(w.datum), 'dd.MM.yy', { locale: de }) };
      const typName = w.verbrauchstyp?.name;
      if (!typName) continue;

      const verbrauch = w.verbrauch != null
        ? w.verbrauch
        : i > 0
          ? Math.max(0, w.zaehlerstand - sorted[i - 1].zaehlerstand)
          : 0;

      let value: number;
      if (dataMode === 'kosten') {
        const kosten = berechneKosten(w.datum, w.verbrauchstyp?.id ?? '', verbrauch, vertraege);
        value = kosten ?? 0;
      } else {
        value = verbrauch;
      }

      byDate[w.datum][typName] = ((byDate[w.datum][typName] as number) ?? 0) + value;
    }
  }

  for (const r of hwRechnungen) {
    if (!byDate[r.datum]) byDate[r.datum] = { datum: format(new Date(r.datum), 'dd.MM.yy', { locale: de }) };
    byDate[r.datum]['Handwerker'] = ((byDate[r.datum]['Handwerker'] as number) ?? 0) + r.betrag_gesamt;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, point]) => point);
}

const MONATSNAMEN = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function buildJahresvergleichData(
  werte: Verbrauchswert[],
  typen: Verbrauchstyp[],
  activeTypen: string[],
  dataMode: DataMode,
  vertraege: any[],
  baseVon: string,
  baseBis: string,
  currentLabel: string,
  prevLabel: string,
): ChartDataPoint[] {
  const vonDate = new Date(baseVon);
  const bisDate = new Date(baseBis);

  // Monatsliste des aktuellen Zeitraums erstellen (geordnet)
  const monthKeys: string[] = []; // "YYYY-MM"
  const cursor = new Date(vonDate.getFullYear(), vonDate.getMonth(), 1);
  const endMonth = new Date(bisDate.getFullYear(), bisDate.getMonth(), 1);
  while (cursor <= endMonth) {
    monthKeys.push(format(cursor, 'yyyy-MM'));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Buckets für jeden Monat im aktuellen Zeitraum
  const buckets: Record<string, Record<string, number>> = {};
  for (const mk of monthKeys) buckets[mk] = {};

  for (const w of werte) {
    const typId = w.verbrauchstyp?.id;
    const typName = w.verbrauchstyp?.name;
    if (!typId || !typName || !activeTypen.includes(typId)) continue;

    const d = new Date(w.datum);
    const wKey = format(d, 'yyyy-MM');
    const verbrauch = w.verbrauch ?? 0;
    const value = dataMode === 'kosten'
      ? (berechneKosten(w.datum, typId, verbrauch, vertraege) ?? 0)
      : verbrauch;

    if (buckets[wKey]) {
      // Datum liegt im aktuellen Zeitraum
      const key = `${typName} ${currentLabel}`;
      buckets[wKey][key] = (buckets[wKey][key] ?? 0) + value;
    } else {
      // Prüfen ob Datum im Vorjahreszeitraum liegt (um 1 Jahr verschieben)
      const shifted = new Date(d);
      shifted.setFullYear(shifted.getFullYear() + 1);
      const shiftedKey = format(shifted, 'yyyy-MM');
      if (buckets[shiftedKey]) {
        const key = `${typName} ${prevLabel}`;
        buckets[shiftedKey][key] = (buckets[shiftedKey][key] ?? 0) + value;
      }
    }
  }

  return monthKeys.map(mk => ({
    datum: MONATSNAMEN[parseInt(mk.split('-')[1]) - 1],
    ...buckets[mk],
  }));
}

interface JVChartProps {
  data: ChartDataPoint[];
  verbrauchstypen: Verbrauchstyp[];
  activeTypen: string[];
  currentPeriodLabel: string;
  prevPeriodLabel: string;
  dataMode: DataMode;
}

function JahresvergleichChart({ data, verbrauchstypen, activeTypen, currentPeriodLabel, prevPeriodLabel, dataMode }: JVChartProps) {
  const activeTypes = verbrauchstypen.filter(t => activeTypen.includes(t.id));

  return (
    <div className="ht-card animate-fade-in">
      <p className="ht-section-title">{dataMode === 'kosten' ? 'Kostenvergleich (€)' : 'Verbrauchsvergleich'} — {prevPeriodLabel} vs. {currentPeriodLabel}</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
          <XAxis dataKey="datum" tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a2232',
              border: '1px solid #243044',
              borderRadius: '8px',
              color: '#e8edf5',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              const formatted = Number(value).toLocaleString('de-DE', { maximumFractionDigits: 2 });
              return dataMode === 'kosten' ? [`${formatted} €`, name] : [formatted, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#8b9ab5', paddingTop: '12px' }} />
          {activeTypes.map(typ => {
            const color = typ.farbe || '#f97316';
            return [
              <Line
                key={`${typ.id}-curr`}
                type="monotone"
                dataKey={`${typ.name} ${currentPeriodLabel}`}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
                connectNulls
              />,
              <Line
                key={`${typ.id}-prev`}
                type="monotone"
                dataKey={`${typ.name} ${prevPeriodLabel}`}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                dot={{ r: 2, fill: color, fillOpacity: 0.5 }}
                activeDot={{ r: 4 }}
                connectNulls
              />,
            ];
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

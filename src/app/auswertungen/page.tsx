'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuthenticationStatus } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format, subMonths, startOfYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart3, Table2, Loader2, Euro, Gauge } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import Navigation from '@/components/layout/Navigation';
import { GET_AUSWERTUNG_DATEN, GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';

type ViewMode = 'chart' | 'table';
type DataMode = 'verbrauch' | 'kosten';

const ZEITRAEUME = [
  { label: '3 Monate',  months: 3  },
  { label: '6 Monate',  months: 6  },
  { label: '1 Jahr',    months: 12 },
  { label: 'Dieses Jahr', months: 0 }, // startOfYear
];

export default function AuswertungenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const [viewMode, setViewMode]       = useState<ViewMode>('chart');
  const [dataMode, setDataMode]       = useState<DataMode>('verbrauch');
  const [zeitraumIdx, setZeitraumIdx] = useState(2);
  const [selectedTypen, setSelectedTypen] = useState<string[]>([]);

  const { data: typenData } = useQuery(GET_VERBRAUCHSTYPEN, { skip: !isAuthenticated });
  const verbrauchstypen = typenData?.verbrauchstyp ?? [];

  const now = new Date();
  const von = zeitraumIdx === 3
    ? format(startOfYear(now), 'yyyy-MM-dd')
    : format(subMonths(now, ZEITRAEUME[zeitraumIdx].months), 'yyyy-MM-dd');
  const bis = format(now, 'yyyy-MM-dd');

  const activeTypen = selectedTypen.length > 0 ? selectedTypen : verbrauchstypen.map((t: any) => t.id);

  const { data, loading } = useQuery(GET_AUSWERTUNG_DATEN, {
    variables: { von, bis, typen: activeTypen },
    skip: !isAuthenticated || activeTypen.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Daten für Charts aufbereiten
  const chartData = buildChartData(data?.verbrauchswert ?? [], verbrauchstypen);

  const toggleTyp = (id: string) => {
    setSelectedTypen(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-bg-base bg-grid pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-xl border-b border-bg-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-tx-primary">Auswertungen</h1>
            <p className="text-xs text-tx-muted">{von} – {bis}</p>
          </div>
          {/* View / Data Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDataMode(d => d === 'verbrauch' ? 'kosten' : 'verbrauch')}
              className={`ht-btn-ghost text-xs ${dataMode === 'kosten' ? 'text-accent' : ''}`}
            >
              {dataMode === 'kosten' ? <Euro className="w-4 h-4" /> : <Gauge className="w-4 h-4" />}
            </button>
            <div className="flex bg-bg-card border border-bg-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1.5 ${viewMode === 'chart' ? 'bg-accent text-white' : 'text-tx-muted hover:text-tx-primary'} transition-colors`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 ${viewMode === 'table' ? 'bg-accent text-white' : 'text-tx-muted hover:text-tx-primary'} transition-colors`}
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Filter Bar */}
        <div className="ht-card">
          {/* Zeitraum */}
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
          </div>

          {/* Verbrauchstypen Filter */}
          {verbrauchstypen.length > 0 && (
            <>
              <p className="ht-section-title">Verbrauchstypen</p>
              <div className="flex gap-2 flex-wrap">
                {verbrauchstypen.map((typ: any) => {
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
            </>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="ht-card text-center py-12">
            <p className="text-tx-muted text-sm">Keine Daten für den gewählten Zeitraum.</p>
          </div>
        ) : viewMode === 'chart' ? (
          <ChartView data={chartData} verbrauchstypen={verbrauchstypen} activeTypen={activeTypen} />
        ) : (
          <TableView rawData={data?.verbrauchswert ?? []} />
        )}
      </main>

      <Navigation />
    </div>
  );
}

// ============================================================
// Chart View
// ============================================================
function ChartView({ data, verbrauchstypen, activeTypen }: {
  data: any[];
  verbrauchstypen: any[];
  activeTypen: string[];
}) {
  const activeTypes = verbrauchstypen.filter((t: any) => activeTypen.includes(t.id));

  return (
    <div className="ht-card animate-fade-in">
      <p className="ht-section-title">Verbrauchsverlauf</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            {activeTypes.map((typ: any) => (
              <linearGradient key={typ.id} id={`grad-${typ.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={typ.farbe || '#f97316'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={typ.farbe || '#f97316'} stopOpacity={0} />
              </linearGradient>
            ))}
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
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#8b9ab5', paddingTop: '12px' }}
          />
          {activeTypes.map((typ: any) => (
            <Area
              key={typ.id}
              type="monotone"
              dataKey={typ.name}
              stroke={typ.farbe || '#f97316'}
              strokeWidth={2}
              fill={`url(#grad-${typ.id})`}
              dot={false}
              activeDot={{ r: 4, fill: typ.farbe }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// Table View
// ============================================================
function TableView({ rawData }: { rawData: any[] }) {
  return (
    <div className="ht-card animate-fade-in overflow-x-auto">
      <p className="ht-section-title">Rohdaten</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border">
            {['Datum', 'Typ', 'Stelle', 'Zählerstand', 'Verbrauch'].map(h => (
              <th key={h} className="text-left text-xs text-tx-muted font-medium pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawData.map((row: any) => (
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
              <td className="py-2 pr-4 font-mono text-tx-primary tabular-nums">
                {Number(row.zaehlerstand).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                <span className="text-tx-muted text-xs ml-1">{row.verbrauchstyp?.einheit}</span>
              </td>
              <td className="py-2 font-mono tabular-nums" style={{ color: row.verbrauchstyp?.farbe || '#f97316' }}>
                {row.verbrauch ? `${Number(row.verbrauch).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${row.verbrauchstyp?.einheit}` : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rawData.length === 0 && (
        <p className="text-center text-tx-muted text-sm py-6">Keine Einträge</p>
      )}
    </div>
  );
}

// ============================================================
// Hilfsfunktion: Chart-Daten aufbereiten
// ============================================================
function buildChartData(verbrauchswerte: any[], typen: any[]) {
  if (!verbrauchswerte.length) return [];

  // Gruppiere nach Datum
  const byDate: Record<string, any> = {};
  for (const w of verbrauchswerte) {
    const d = w.datum;
    if (!byDate[d]) byDate[d] = { datum: format(new Date(d), 'dd.MM.') };
    const typName = w.verbrauchstyp?.name;
    if (typName) {
      byDate[d][typName] = (byDate[d][typName] ?? 0) + (w.verbrauch ?? 0);
    }
  }

  return Object.values(byDate).sort((a: any, b: any) => a.datum.localeCompare(b.datum));
}

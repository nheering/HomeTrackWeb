'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useAuthenticationStatus } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Loader2, ChevronLeft, ChevronRight, Download, FileText,
  Receipt, BarChart3, ChevronDown, ChevronUp, Edit3, Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { useMutation } from '@apollo/client';
import Navigation from '@/components/layout/Navigation';
import { GraphQLErrorBoundary } from '@/components/error';
import { usePlusAction } from '@/lib/plus-action-context';
import HandwerkerrechnungModal from '@/components/modals/HandwerkerrechnungModal';
import StorageImage from '@/components/ui/StorageImage';
import { GET_HANDWERKERRECHNUNGEN, GET_HANDWERKER_STEUER_JAHR } from '@/lib/graphql/queries';
import { DELETE_HANDWERKERRECHNUNG } from '@/lib/graphql/mutations';
import { Handwerkerrechnung } from '@/types';
import { STEUER_PROZENTSATZ, STEUER_MAX_ABSETZBAR, HANDWERKER_KATEGORIEN, ZAHLUNGSARTEN } from '@/lib/handwerker-constants';
import { exportHandwerkerCSV, exportSteuerZusammenfassung } from '@/lib/handwerker-export';

type ViewMode = 'rechnungen' | 'steuer';

const MONATSNAMEN = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function HandwerkerPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const [viewMode, setViewMode] = useState<ViewMode>('rechnungen');
  const [jahr, setJahr] = useState(new Date().getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterKategorie, setFilterKategorie] = useState<string>('');

  usePlusAction(() => setShowCreate(true), []);

  const jahrVon = `${jahr}-01-01`;
  const jahrBis = `${jahr}-12-31`;

  const { data, loading, refetch } = useQuery(GET_HANDWERKERRECHNUNGEN, {
    variables: { jahr_von: jahrVon, jahr_bis: jahrBis },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const { data: steuerData, refetch: refetchSteuer } = useQuery(GET_HANDWERKER_STEUER_JAHR, {
    variables: { jahr_von: jahrVon, jahr_bis: jahrBis },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const [deleteRechnung] = useMutation(DELETE_HANDWERKERRECHNUNG, { onCompleted: () => refetch() });

  const rechnungen: Handwerkerrechnung[] = data?.handwerkerrechnung ?? [];
  const filtered = filterKategorie
    ? rechnungen.filter(r => r.kategorie === filterKategorie)
    : rechnungen;

  // Steuer-Aggregation
  const absetzbarSum = steuerData?.absetzbar?.aggregate?.sum;
  const gesamtSum = steuerData?.gesamt?.aggregate?.sum;
  const lohnFahrtSumme = Number(absetzbarSum?.betrag_lohn ?? 0) + Number(absetzbarSum?.betrag_fahrtkosten ?? 0);
  const steuerErmaessigung = Math.min(lohnFahrtSumme * STEUER_PROZENTSATZ, STEUER_MAX_ABSETZBAR);
  const gesamtAusgaben = Number(gesamtSum?.betrag_gesamt ?? 0);
  const materialSumme = Number(gesamtSum?.betrag_material ?? 0);
  const fortschrittProzent = Math.min((steuerErmaessigung / STEUER_MAX_ABSETZBAR) * 100, 100);

  const fortschrittFarbe = fortschrittProzent >= 100
    ? 'bg-red-500' : fortschrittProzent >= 75
    ? 'bg-yellow-500' : 'bg-green-500';

  // Monatsdaten für Chart
  const monatsChart = buildMonatsChart(rechnungen);

  const euroFmt = (v: number) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const zahlungsLabel = (val: string) => ZAHLUNGSARTEN.find(z => z.value === val)?.label ?? val;

  const handleModalClose = () => {
    setShowCreate(false);
    setEditItem(null);
    refetch();
    refetchSteuer();
  };

  return (
    <div className="min-h-screen bg-bg-base bg-grid pb-24">
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-xl border-b border-bg-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-tx-primary">Handwerkerrechnungen</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <button onClick={() => setJahr(j => j - 1)} className="ht-btn-ghost p-0.5"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-mono text-tx-secondary">{jahr}</span>
              <button onClick={() => setJahr(j => j + 1)} className="ht-btn-ghost p-0.5" disabled={jahr >= new Date().getFullYear()}><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportHandwerkerCSV(rechnungen as Handwerkerrechnung[], jahr)}
              className="ht-btn-ghost text-xs"
              title="CSV exportieren"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="flex bg-bg-card border border-bg-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('rechnungen')}
                className={`px-2.5 py-1.5 ${viewMode === 'rechnungen' ? 'bg-accent text-white' : 'text-tx-muted hover:text-tx-primary'} transition-colors`}
              >
                <Receipt className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('steuer')}
                className={`px-2.5 py-1.5 ${viewMode === 'steuer' ? 'bg-accent text-white' : 'text-tx-muted hover:text-tx-primary'} transition-colors`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Steuer-Fortschritt – immer sichtbar */}
        <div className="ht-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-tx-muted">Steuerermäßigung {jahr}</p>
            <p className="text-sm font-mono font-medium text-tx-primary">{euroFmt(steuerErmaessigung)} / {euroFmt(STEUER_MAX_ABSETZBAR)} €</p>
          </div>
          <div className="w-full h-2.5 bg-bg-base rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fortschrittFarbe}`}
              style={{ width: `${fortschrittProzent}%` }}
            />
          </div>
          <p className="text-[10px] text-tx-muted mt-1">20% der Lohn- und Fahrtkosten, max. 1.200 €/Jahr (§35a EStG)</p>
        </div>

        <GraphQLErrorBoundary onRetry={refetch}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : viewMode === 'rechnungen' ? (
            <>
              {/* Kategorie-Filter */}
              {rechnungen.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterKategorie('')}
                    className={`ht-badge cursor-pointer border transition-all ${!filterKategorie ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'}`}
                  >
                    Alle ({rechnungen.length})
                  </button>
                  {Array.from(new Set(rechnungen.map(r => r.kategorie).filter(Boolean))).map(k => (
                    <button
                      key={k}
                      onClick={() => setFilterKategorie(k!)}
                      className={`ht-badge cursor-pointer border transition-all ${filterKategorie === k ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}

              {/* Rechnungsliste */}
              {filtered.length === 0 ? (
                <div className="ht-card text-center py-12">
                  <p className="text-tx-muted text-sm mb-1">Keine Rechnungen für {jahr}</p>
                  <button onClick={() => setShowCreate(true)} className="text-accent text-xs hover:underline">
                    Erste Rechnung erfassen →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(r => (
                    <div key={r.id} className="ht-card">
                      {deleteConfirm === r.id ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-tx-secondary">Rechnung löschen?</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeleteConfirm(null)} className="ht-btn-secondary text-xs py-1 px-2.5">Abbrechen</button>
                            <button onClick={() => { deleteRechnung({ variables: { id: r.id } }); setDeleteConfirm(null); }} className="ht-btn-danger text-xs py-1 px-2.5">Löschen</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-tx-muted">{format(new Date(r.datum), 'dd.MM.yy')}</span>
                                {r.kategorie && <span className="ht-badge bg-accent/10 border border-accent/30 text-accent text-[10px]">{r.kategorie}</span>}
                                {r.verbrauchstyp && <span className="text-[10px] text-tx-muted">{r.verbrauchstyp.symbol}</span>}
                              </div>
                              <p className="text-sm font-medium text-tx-primary mt-0.5 truncate">{r.beschreibung}</p>
                              {r.handwerker && <p className="text-xs text-tx-secondary">{r.handwerker.name}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-mono text-sm font-medium text-tx-primary">{euroFmt(r.betrag_gesamt)} €</p>
                              {r.ist_absetzbar && (r.betrag_lohn > 0 || r.betrag_fahrtkosten > 0) && (
                                <p className="font-mono text-[10px] text-green-400">
                                  -{euroFmt((Number(r.betrag_lohn) + Number(r.betrag_fahrtkosten)) * STEUER_PROZENTSATZ)} € Steuer
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-bg-border/50">
                            <div className="flex items-center gap-2">
                              {r.dokument_url && (
                                <span className="inline-flex items-center gap-1 ht-badge bg-accent/10 border border-accent/30 text-accent text-[10px] px-1.5">
                                  <FileText className="w-3 h-3" /> Dokument
                                </span>
                              )}
                              {!r.ist_absetzbar && (
                                <span className="ht-badge bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px]">nicht absetzbar</span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="ht-btn-ghost p-1.5">
                                {expanded === r.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => setEditItem(r)} className="ht-btn-ghost p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteConfirm(r.id)} className="ht-btn-ghost p-1.5 text-red-400/50 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>

                          {expanded === r.id && (
                            <div className="mt-2 pt-2 border-t border-bg-border/50 space-y-2 text-xs">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-tx-muted">Lohnkosten</span>
                                  <p className="font-mono text-tx-primary">{euroFmt(r.betrag_lohn)} €</p>
                                </div>
                                <div>
                                  <span className="text-tx-muted">Material</span>
                                  <p className="font-mono text-tx-primary">{euroFmt(r.betrag_material)} €</p>
                                </div>
                                <div>
                                  <span className="text-tx-muted">Fahrtkosten</span>
                                  <p className="font-mono text-tx-primary">{euroFmt(r.betrag_fahrtkosten)} €</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-tx-muted">
                                <span>Zahlung: {zahlungsLabel(r.zahlungsart)}</span>
                                {r.rechnungsnummer && <span>Nr. {r.rechnungsnummer}</span>}
                              </div>
                              {r.notizen && <p className="text-tx-muted">{r.notizen}</p>}
                              {r.dokument_url && (
                                <div className="mt-1">
                                  <StorageImage src={r.dokument_url} alt="Rechnung" className="max-h-48 rounded-lg border border-bg-border" />
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Steuerzusammenfassung */
            <SteuerView
              rechnungen={rechnungen}
              jahr={jahr}
              gesamtAusgaben={gesamtAusgaben}
              lohnFahrtSumme={lohnFahrtSumme}
              materialSumme={materialSumme}
              steuerErmaessigung={steuerErmaessigung}
              monatsChart={monatsChart}
            />
          )}
        </GraphQLErrorBoundary>
      </main>

      <Navigation />

      {(showCreate || editItem) && (
        <HandwerkerrechnungModal
          editData={editItem}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

interface SteuerViewProps {
  rechnungen: Handwerkerrechnung[];
  jahr: number;
  gesamtAusgaben: number;
  lohnFahrtSumme: number;
  materialSumme: number;
  steuerErmaessigung: number;
  monatsChart: { monat: string; lohn: number; kumulativ: number }[];
}

function SteuerView({ rechnungen, jahr, gesamtAusgaben, lohnFahrtSumme, materialSumme, steuerErmaessigung, monatsChart }: SteuerViewProps) {
  const euroFmt = (v: number) => Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Übersichtskarten */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ht-card">
          <p className="text-[10px] text-tx-muted uppercase tracking-wide">Gesamtausgaben</p>
          <p className="text-lg font-mono font-bold text-tx-primary mt-1">{euroFmt(gesamtAusgaben)} €</p>
        </div>
        <div className="ht-card">
          <p className="text-[10px] text-tx-muted uppercase tracking-wide">Steuerermäßigung</p>
          <p className="text-lg font-mono font-bold text-green-400 mt-1">{euroFmt(steuerErmaessigung)} €</p>
        </div>
        <div className="ht-card">
          <p className="text-[10px] text-tx-muted uppercase tracking-wide">Arbeitskosten (absetzbar)</p>
          <p className="text-lg font-mono font-bold text-tx-primary mt-1">{euroFmt(lohnFahrtSumme)} €</p>
        </div>
        <div className="ht-card">
          <p className="text-[10px] text-tx-muted uppercase tracking-wide">Materialkosten</p>
          <p className="text-lg font-mono font-bold text-tx-secondary mt-1">{euroFmt(materialSumme)} €</p>
        </div>
      </div>

      {/* Monats-Chart */}
      {monatsChart.some(m => m.lohn > 0) && (
        <div className="ht-card">
          <p className="ht-section-title">Monatliche Steuerermäßigung</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monatsChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
              <XAxis dataKey="monat" tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b9ab5', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a2232', border: '1px solid #243044', borderRadius: '8px', color: '#e8edf5', fontSize: '12px' }}
                formatter={(value: number, name: string) => [`${euroFmt(value)} €`, name === 'lohn' ? 'Ermäßigung (20%)' : 'Kumulativ']}
              />
              <ReferenceLine y={STEUER_MAX_ABSETZBAR} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '1.200 €', fill: '#ef4444', fontSize: 10, position: 'right' }} />
              <Bar dataKey="lohn" fill="#22c55e" radius={[4, 4, 0, 0]} name="lohn" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Export */}
      <div className="ht-card flex gap-3">
        <button
          onClick={() => exportHandwerkerCSV(rechnungen as Handwerkerrechnung[], jahr)}
          className="ht-btn-secondary flex-1 justify-center text-sm"
        >
          <Download className="w-4 h-4" /> CSV-Export
        </button>
        <button
          onClick={() => exportSteuerZusammenfassung(rechnungen as Handwerkerrechnung[], jahr)}
          className="ht-btn-primary flex-1 justify-center text-sm"
        >
          <FileText className="w-4 h-4" /> Steuerzusammenfassung
        </button>
      </div>
    </div>
  );
}

function buildMonatsChart(rechnungen: Handwerkerrechnung[]) {
  const buckets = Array.from({ length: 12 }, () => 0);

  for (const r of rechnungen) {
    if (!r.ist_absetzbar) continue;
    const month = new Date(r.datum).getMonth();
    const basis = Number(r.betrag_lohn) + Number(r.betrag_fahrtkosten);
    buckets[month] += basis * STEUER_PROZENTSATZ;
  }

  let kumulativ = 0;
  return buckets.map((lohn, i) => {
    kumulativ += lohn;
    return { monat: MONATSNAMEN[i], lohn: Math.round(lohn * 100) / 100, kumulativ: Math.round(kumulativ * 100) / 100 };
  });
}

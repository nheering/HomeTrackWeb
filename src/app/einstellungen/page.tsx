'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuthenticationStatus } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Trash2, Edit3, ChevronDown, ChevronUp, Loader2, LogOut, Star } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { GET_VERBRAUCHSTYPEN, GET_ANBIETER, GET_VERTRAEGE } from '@/lib/graphql/queries';
import { DELETE_VERBRAUCHSTYP, DELETE_ANBIETER, DELETE_VERTRAG, SET_STANDARD_STELLE, DELETE_VERBRAUCHSSTELLE } from '@/lib/graphql/mutations';
import VerbrauchstypModal from '@/components/modals/VerbrauchstypModal';
import VerbrauchsstellenModal from '@/components/modals/VerbrauchsstellenModal';
import AnbieterModal from '@/components/modals/AnbieterModal';
import VertragModal from '@/components/modals/VertragModal';
import PreisperiodeModal from '@/components/modals/PreisperiodeModal';
import { useSignOut } from '@nhost/nextjs';

type Tab = 'verbrauchstypen' | 'anbieter' | 'vertraege';

export default function EinstellungenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();
  const { signOut } = useSignOut();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const [activeTab, setActiveTab] = useState<Tab>('verbrauchstypen');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'verbrauchstypen', label: 'Typen'    },
    { id: 'anbieter',        label: 'Anbieter' },
    { id: 'vertraege',       label: 'Verträge' },
  ];

  return (
    <div className="min-h-screen bg-bg-base bg-grid pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-xl border-b border-bg-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-tx-primary">Einstellungen</h1>
          <button
            onClick={() => signOut()}
            className="ht-btn-ghost text-xs"
          >
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-3xl mx-auto flex gap-1 mt-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-tx-muted hover:text-tx-primary hover:bg-bg-card'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4">
        {activeTab === 'verbrauchstypen' && <VerbrauchstypenTab />}
        {activeTab === 'anbieter'        && <AnbieterTab />}
        {activeTab === 'vertraege'       && <VertraegeTab />}
      </main>

      <Navigation />
    </div>
  );
}

// ============================================================
// Verbrauchstypen Tab
// ============================================================
function VerbrauchstypenTab() {
  const { data, loading, refetch } = useQuery(GET_VERBRAUCHSTYPEN);
  const [deleteTyp] = useMutation(DELETE_VERBRAUCHSTYP, { onCompleted: () => refetch() });
  const [setStandard] = useMutation(SET_STANDARD_STELLE, { onCompleted: () => refetch() });
  const [deleteStelle] = useMutation(DELETE_VERBRAUCHSSTELLE, { onCompleted: () => refetch() });
  
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const [editStelle, setEditStelle] = useState<any | null>(null);
  const [showCreateStelle, setShowCreateStelle] = useState<string | null>(null);

  const typen = data?.verbrauchstyp ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ht-section-title">Verbrauchstypen ({typen.length})</p>
        <button onClick={() => setShowCreate(true)} className="ht-btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Neu
        </button>
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>}

      {typen.map((typ: any) => (
        <div key={typ.id} className="ht-card">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${typ.farbe || '#f97316'}20`, border: `1px solid ${typ.farbe || '#f97316'}40` }}
              >
                {typ.symbol || '⚡'}
              </span>
              <div>
                <p className="font-medium text-tx-primary text-sm">{typ.name}</p>
                <p className="text-xs text-tx-muted">{typ.einheit || '–'} · {typ.verbrauchsstellen?.length ?? 0} Stellen</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditItem(typ)} className="ht-btn-ghost p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteTyp({ variables: { id: typ.id } })} className="ht-btn-ghost p-1.5 text-red-400/70 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setExpanded(expanded === typ.id ? null : typ.id)} className="ht-btn-ghost p-1.5">
                {expanded === typ.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded: Verbrauchsstellen */}
          {expanded === typ.id && (
            <div className="mt-3 pt-3 border-t border-bg-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="ht-section-title">Verbrauchsstellen</p>
                <button 
                  onClick={() => setShowCreateStelle(typ.id)} 
                  className="ht-btn-ghost text-xs py-1"
                >
                  <Plus className="w-3 h-3" /> Stelle
                </button>
              </div>
              
              {typ.verbrauchsstellen?.map((stelle: any) => (
                <div key={stelle.id} className="flex items-center justify-between bg-bg-base/60 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-sm text-tx-primary truncate">{stelle.bezeichnung}</p>
                    {stelle.zaehler_nummer && <p className="text-[10px] text-tx-muted truncate">#{stelle.zaehler_nummer}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stelle.ist_standard && (
                      <span className="ht-badge bg-accent/10 border border-accent/20 text-accent text-[10px] px-1.5">
                        Standard
                      </span>
                    )}
                    {!stelle.ist_standard && (
                      <button
                        onClick={() => setStandard({ variables: { typ_id: typ.id, stelle_id: stelle.id } })}
                        className="ht-btn-ghost p-1 text-tx-muted"
                        title="Als Standard setzen"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                    <button 
                      onClick={() => setEditStelle(stelle)} 
                      className="ht-btn-ghost p-1"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => deleteStelle({ variables: { id: stelle.id } })} 
                      className="ht-btn-ghost p-1 text-red-400/50 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stelle.ist_aktiv ? 'bg-status-active' : 'bg-status-inactive'}`} />
                  </div>
                </div>
              ))}
              {(!typ.verbrauchsstellen || typ.verbrauchsstellen.length === 0) && (
                <p className="text-xs text-tx-muted text-center py-2">Noch keine Verbrauchsstellen angelegt</p>
              )}
            </div>
          )}
        </div>
      ))}

      {(showCreate || editItem) && (
        <VerbrauchstypModal
          editData={editItem}
          onClose={() => { setShowCreate(false); setEditItem(null); refetch(); }}
        />
      )}

      {(showCreateStelle || editStelle) && (
        <VerbrauchsstellenModal
          verbrauchstypId={showCreateStelle || undefined}
          editData={editStelle}
          onClose={() => { setShowCreateStelle(null); setEditStelle(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// Anbieter Tab
// ============================================================
function AnbieterTab() {
  const { data, loading, refetch } = useQuery(GET_ANBIETER);
  const [deleteAnbieter] = useMutation(DELETE_ANBIETER, { onCompleted: () => refetch() });
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const anbieter = data?.anbieter ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ht-section-title">Anbieter ({anbieter.length})</p>
        <button onClick={() => setShowCreate(true)} className="ht-btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Neu
        </button>
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>}

      {anbieter.map((a: any) => (
        <div key={a.id} className="ht-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-tx-primary text-sm">{a.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                {a.kundennummer && <span className="text-xs text-tx-muted">KD#{a.kundennummer}</span>}
                {a.verbrauchstyp && (
                  <span className="text-xs text-tx-secondary">{a.verbrauchstyp.symbol} {a.verbrauchstyp.name}</span>
                )}
                <span className="text-xs text-tx-muted">{a.vertraege?.length ?? 0} Verträge</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditItem(a)} className="ht-btn-ghost p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteAnbieter({ variables: { id: a.id } })} className="ht-btn-ghost p-1.5 text-red-400/70 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="ht-btn-ghost p-1.5">
                {expanded === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded === a.id && (
            <div className="mt-3 pt-3 border-t border-bg-border space-y-1 text-xs text-tx-secondary">
              {a.email    && <p>✉️ {a.email}</p>}
              {a.telefon  && <p>📞 {a.telefon}</p>}
              {a.webseite && <p>🌐 {a.webseite}</p>}
              {a.notizen  && <p className="text-tx-muted">{a.notizen}</p>}
            </div>
          )}
        </div>
      ))}

      {(showCreate || editItem) && (
        <AnbieterModal
          editData={editItem}
          onClose={() => { setShowCreate(false); setEditItem(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// Verträge Tab
// ============================================================
function VertraegeTab() {
  const { data, loading, refetch } = useQuery(GET_VERTRAEGE);
  const [deleteVertrag] = useMutation(DELETE_VERTRAG, { onCompleted: () => refetch() });
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPreis, setShowPreis] = useState<string | null>(null);

  const vertraege = data?.vertrag ?? [];

  const isActive = (v: any) => !v.ende_datum || new Date(v.ende_datum) >= new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ht-section-title">Verträge ({vertraege.length})</p>
        <button onClick={() => setShowCreate(true)} className="ht-btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Neu
        </button>
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-accent animate-spin" /></div>}

      {vertraege.map((v: any) => {
        const aktuellerPreis = v.preisperioden?.[0];
        const active = isActive(v);
        return (
          <div key={v.id} className="ht-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-status-active' : 'bg-status-inactive'}`} />
                  <p className="font-medium text-tx-primary text-sm">{v.bezeichnung}</p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-tx-muted">
                  {v.anbieter    && <span>{v.anbieter.name}</span>}
                  {v.verbrauchstyp && <span>{v.verbrauchstyp.symbol} {v.verbrauchstyp.name}</span>}
                  {v.vertragsnummer && <span>#{v.vertragsnummer}</span>}
                </div>
                {aktuellerPreis && (
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-tx-secondary">
                      Grundpreis: <span className="font-mono text-tx-primary">{Number(aktuellerPreis.grundpreis).toFixed(2)} €</span>
                    </span>
                    <span className="text-tx-secondary">
                      Arbeitspreis: <span className="font-mono text-tx-primary">{Number(aktuellerPreis.einheitspreis).toFixed(4)} €</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => setEditItem(v)} className="ht-btn-ghost p-1.5"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteVertrag({ variables: { id: v.id } })} className="ht-btn-ghost p-1.5 text-red-400/70 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setExpanded(expanded === v.id ? null : v.id)} className="ht-btn-ghost p-1.5">
                  {expanded === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Preisperioden */}
            {expanded === v.id && (
              <div className="mt-3 pt-3 border-t border-bg-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="ht-section-title">Preisperioden</p>
                  <button onClick={() => setShowPreis(v.id)} className="ht-btn-ghost text-xs">
                    <Plus className="w-3 h-3" /> Preis
                  </button>
                </div>
                {v.preisperioden?.map((p: any) => (
                  <div key={p.id} className="bg-bg-base/60 rounded-lg px-3 py-2 mb-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-tx-muted">ab {p.gueltig_ab}</span>
                      {p.gueltig_bis && <span className="text-tx-muted">bis {p.gueltig_bis}</span>}
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-tx-secondary">GP: <span className="font-mono text-tx-primary">{Number(p.grundpreis).toFixed(2)} €/{p.grundpreis_intervall || 'Mon.'}</span></span>
                      <span className="text-tx-secondary">AP: <span className="font-mono text-tx-primary">{Number(p.einheitspreis).toFixed(4)} €</span></span>
                      {p.steuer && <span className="text-tx-muted">MwSt: {p.steuer}%</span>}
                    </div>
                  </div>
                ))}
                {(!v.preisperioden || v.preisperioden.length === 0) && (
                  <p className="text-xs text-tx-muted text-center py-2">Noch keine Preise hinterlegt</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {(showCreate || editItem) && (
        <VertragModal
          editData={editItem}
          onClose={() => { setShowCreate(false); setEditItem(null); refetch(); }}
        />
      )}
      {showPreis && (
        <PreisperiodeModal
          vertragId={showPreis}
          onClose={() => { setShowPreis(null); refetch(); }}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useAuthenticationStatus, useSignOut, useChangePassword, useUserDisplayName, useUserAvatarUrl, useUserEmail, useUserId } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Loader2, LogOut, Star, RefreshCw, Check, Camera, Eye, EyeOff } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { usePlusAction } from '@/lib/plus-action-context';
import { GET_VERBRAUCHSTYPEN, GET_ANBIETER, GET_VERTRAEGE, GET_VERBRAUCHSWERTE_FOR_RECALC, GET_USER_SETTINGS } from '@/lib/graphql/queries';
import { DELETE_VERBRAUCHSTYP, DELETE_ANBIETER, DELETE_VERTRAG, SET_STANDARD_STELLE, DELETE_VERBRAUCHSSTELLE, UPDATE_VERBRAUCHSWERT, UPSERT_USER_SETTINGS, UPDATE_USER_PROFILE } from '@/lib/graphql/mutations';
import VerbrauchstypModal from '@/components/modals/VerbrauchstypModal';
import VerbrauchsstellenModal from '@/components/modals/VerbrauchsstellenModal';
import AnbieterModal from '@/components/modals/AnbieterModal';
import VertragModal from '@/components/modals/VertragModal';
import PreisperiodeModal from '@/components/modals/PreisperiodeModal';
import { useNavSettings } from '@/lib/nav-settings-context';
import nhost, { storageUrl } from '@/lib/nhost';
import { uploadFehlerText } from '@/lib/upload';
import StorageImage from '@/components/ui/StorageImage';

type Tab = 'verbrauchstypen' | 'anbieter' | 'vertraege' | 'konto';

export default function EinstellungenPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();
  const { signOut } = useSignOut();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, authLoading, router]);

  const [activeTab, setActiveTab] = useState<Tab>('verbrauchstypen');
  const [showCreate, setShowCreate] = useState(false);

  usePlusAction(activeTab !== 'konto' ? () => setShowCreate(true) : null, [activeTab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'verbrauchstypen', label: 'Typen'    },
    { id: 'anbieter',        label: 'Anbieter' },
    { id: 'vertraege',       label: 'Verträge' },
    { id: 'konto',           label: 'Konto'    },
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
        {activeTab === 'verbrauchstypen' && (
          <VerbrauchstypenTab showCreate={showCreate} onCreateClose={() => setShowCreate(false)} />
        )}
        {activeTab === 'anbieter' && (
          <AnbieterTab showCreate={showCreate} onCreateClose={() => setShowCreate(false)} />
        )}
        {activeTab === 'vertraege' && (
          <VertraegeTab showCreate={showCreate} onCreateClose={() => setShowCreate(false)} />
        )}
        {activeTab === 'konto' && <KontoTab />}
      </main>

      <Navigation />
    </div>
  );
}

// ============================================================
// Verbrauchstypen Tab
// ============================================================
function VerbrauchstypenTab({ showCreate, onCreateClose }: { showCreate: boolean; onCreateClose: () => void }) {
  const { data, loading, refetch } = useQuery(GET_VERBRAUCHSTYPEN);
  const [deleteTyp] = useMutation(DELETE_VERBRAUCHSTYP, { onCompleted: () => refetch() });
  const [setStandard] = useMutation(SET_STANDARD_STELLE, { onCompleted: () => refetch() });
  const [deleteStelle] = useMutation(DELETE_VERBRAUCHSSTELLE, { onCompleted: () => refetch() });

  const [editItem, setEditItem]               = useState<any | null>(null);
  const [expanded, setExpanded]               = useState<string | null>(null);
  const [editStelle, setEditStelle]           = useState<any | null>(null);
  const [showCreateStelle, setShowCreateStelle] = useState<string | null>(null);

  const typen = data?.verbrauchstyp ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ht-section-title">Verbrauchstypen ({typen.length})</p>
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

              <div className="pt-2 border-t border-bg-border/50">
                <VerbrauchNeuBerechnenButton typId={typ.id} />
              </div>
            </div>
          )}
        </div>
      ))}

      {(showCreate || editItem) && (
        <VerbrauchstypModal
          editData={editItem}
          onClose={() => { onCreateClose(); setEditItem(null); refetch(); }}
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
function AnbieterTab({ showCreate, onCreateClose }: { showCreate: boolean; onCreateClose: () => void }) {
  const { data, loading, refetch } = useQuery(GET_ANBIETER);
  const [deleteAnbieter] = useMutation(DELETE_ANBIETER, { onCompleted: () => refetch() });
  const [editItem, setEditItem] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const anbieter = data?.anbieter ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ht-section-title">Anbieter ({anbieter.length})</p>
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
          onClose={() => { onCreateClose(); setEditItem(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// Verträge Tab
// ============================================================
function VertraegeTab({ showCreate, onCreateClose }: { showCreate: boolean; onCreateClose: () => void }) {
  const { data, loading, refetch } = useQuery(GET_VERTRAEGE);
  const [deleteVertrag] = useMutation(DELETE_VERTRAG, { onCompleted: () => refetch() });
  const [editItem, setEditItem] = useState<any | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPreis, setShowPreis] = useState<string | null>(null);

  const vertraege = data?.vertrag ?? [];

  const isActive = (v: any) => !v.ende_datum || new Date(v.ende_datum) >= new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="ht-section-title">Verträge ({vertraege.length})</p>
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
          onClose={() => { onCreateClose(); setEditItem(null); refetch(); }}
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

// ============================================================
// Verbrauch Neuberechnen Button
// ============================================================
function VerbrauchNeuBerechnenButton({ typId }: { typId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const [fetchWerte] = useLazyQuery(GET_VERBRAUCHSWERTE_FOR_RECALC, { fetchPolicy: 'network-only' });
  const [updateWert] = useMutation(UPDATE_VERBRAUCHSWERT);

  const handleRecalc = async () => {
    setStatus('loading');
    setProgress({ done: 0, total: 0 });

    try {
      const { data } = await fetchWerte({ variables: { typ_id: typId } });
      const werte: { id: string; datum: string; zaehlerstand: number; verbrauchsstelle_id: string | null }[] =
        data?.verbrauchswert ?? [];

      if (werte.length === 0) {
        setStatus('done');
        return;
      }

      // Gruppieren nach verbrauchsstelle_id
      const groups: Record<string, typeof werte> = {};
      for (const w of werte) {
        const key = w.verbrauchsstelle_id ?? 'none';
        if (!groups[key]) groups[key] = [];
        groups[key].push(w);
      }

      const updates: { id: string; verbrauch: number }[] = [];
      for (const gruppe of Object.values(groups)) {
        const sorted = [...gruppe].sort((a, b) => a.datum.localeCompare(b.datum));
        for (let i = 0; i < sorted.length; i++) {
          const verbrauch = i === 0 ? 0 : Math.max(0, sorted[i].zaehlerstand - sorted[i - 1].zaehlerstand);
          updates.push({ id: sorted[i].id, verbrauch });
        }
      }

      setProgress({ done: 0, total: updates.length });

      for (let i = 0; i < updates.length; i++) {
        await updateWert({ variables: { id: updates[i].id, set: { verbrauch: updates[i].verbrauch } } });
        setProgress({ done: i + 1, total: updates.length });
      }

      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={handleRecalc}
      disabled={status === 'loading'}
      className={`w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border transition-colors
        ${status === 'done'
          ? 'border-green-500/30 bg-green-500/10 text-green-400'
          : status === 'error'
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-bg-border bg-bg-base/60 text-tx-muted hover:text-tx-primary hover:border-accent/30'
        }`}
    >
      {status === 'loading' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {progress.total > 0 ? `${progress.done} / ${progress.total} neu berechnet…` : 'Lade Daten…'}
        </>
      ) : status === 'done' ? (
        <><Check className="w-3.5 h-3.5" /> Verbrauch neu berechnet</>
      ) : status === 'error' ? (
        <><RefreshCw className="w-3.5 h-3.5" /> Fehler – erneut versuchen</>
      ) : (
        <><RefreshCw className="w-3.5 h-3.5" /> Verbrauch neu berechnen</>
      )}
    </button>
  );
}

// ============================================================
// Konto Tab (Profil + Passwort + Darstellung)
// ============================================================
function KontoTab() {
  return (
    <div className="space-y-4 pb-4">
      <ProfilSection />
      <PasswortSection />
      <DarstellungSection />
    </div>
  );
}

function ProfilSection() {
  const userId             = useUserId();
  const currentDisplayName = useUserDisplayName();
  const currentAvatarUrl   = useUserAvatarUrl();
  const email              = useUserEmail();

  const [displayName, setDisplayName] = useState(currentDisplayName ?? '');
  const [avatarUrl,   setAvatarUrl]   = useState(currentAvatarUrl   ?? '');
  const [uploading,   setUploading]   = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { loading: saving }] = useMutation(UPDATE_USER_PROFILE, {
    onCompleted: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(`Profil konnte nicht gespeichert werden. (${err.message})`),
  });

  useEffect(() => {
    if (currentDisplayName) setDisplayName(currentDisplayName);
    if (currentAvatarUrl)   setAvatarUrl(currentAvatarUrl);
  }, [currentDisplayName, currentAvatarUrl]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const token = nhost.auth.getAccessToken();
      const { fileMetadata, error: uploadError } = await nhost.storage.upload({
        file,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (uploadError || !fileMetadata) throw uploadError ?? new Error('Upload fehlgeschlagen');
      setAvatarUrl(`${storageUrl}/files/${fileMetadata.id}`);
    } catch (err) {
      setError(`Bild-Upload fehlgeschlagen: ${uploadFehlerText(err)}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    setError('');
    setSuccess(false);
    updateProfile({
      variables: {
        id: userId,
        displayName,
        avatarUrl: avatarUrl || null,
      },
    });
  };

  const initials = (displayName || email || '?').charAt(0).toUpperCase();

  return (
    <div className="ht-card">
      <p className="ht-section-title mb-4">Profil</p>

      {/* Avatar + E-Mail */}
      <div className="flex items-center gap-4 mb-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-bg-border hover:border-accent/50 transition-colors flex-shrink-0"
        >
          {avatarUrl ? (
            <StorageImage src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent/10 flex items-center justify-center text-accent text-2xl font-bold">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />}
          </div>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-tx-primary truncate">{email}</p>
          <p className="text-xs text-tx-muted mt-0.5">Tippe auf das Bild zum Ändern</p>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileInputRef}
        onChange={handleAvatarChange}
      />

      {/* Display name */}
      <div className="mb-4">
        <label className="ht-label">Anzeigename</label>
        <input
          type="text"
          className="ht-input"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Dein Name"
        />
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="ht-btn-primary w-full flex items-center justify-center gap-2"
      >
        {saving
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichern…</>
          : success
            ? <><Check className="w-4 h-4" /> Gespeichert</>
            : 'Profil speichern'}
      </button>
    </div>
  );
}

function PasswortSection() {
  const { changePassword, isLoading, isSuccess, isError, error } = useChangePassword();
  const [newPassword, setNewPassword] = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [mismatch,    setMismatch]    = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirm) { setMismatch(true); return; }
    setMismatch(false);
    const result = await changePassword(newPassword);
    if (!result.error) { setNewPassword(''); setConfirm(''); }
  };

  return (
    <div className="ht-card">
      <p className="ht-section-title mb-4">Passwort ändern</p>

      <div className="space-y-3 mb-4">
        <div>
          <label className="ht-label">Neues Passwort</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="ht-input pr-10"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-muted hover:text-tx-primary"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="ht-label">Passwort bestätigen</label>
          <input
            type={showPw ? 'text' : 'password'}
            className="ht-input"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setMismatch(false); }}
            placeholder="Wiederholen"
          />
        </div>
      </div>

      {mismatch  && <p className="text-xs text-red-400 mb-3">Die Passwörter stimmen nicht überein.</p>}
      {isError   && <p className="text-xs text-red-400 mb-3">{error?.message ?? 'Fehler beim Ändern des Passworts.'}</p>}
      {isSuccess && <p className="text-xs text-green-400 mb-3">Passwort erfolgreich geändert.</p>}

      <button
        onClick={handleSubmit}
        disabled={isLoading || !newPassword || !confirm}
        className="ht-btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ändern…</> : 'Passwort ändern'}
      </button>
    </div>
  );
}

function DarstellungSection() {
  const { navPosition } = useNavSettings();
  const { data, refetch } = useQuery(GET_USER_SETTINGS);
  const [upsertSettings] = useMutation(UPSERT_USER_SETTINGS, { onCompleted: () => refetch() });

  const current: string = data?.user_settings?.[0]?.nav_position ?? navPosition;

  const options = [
    { value: 'bottom', label: 'Menü unten',  description: 'Navigationsleiste am unteren Rand – Standard auf allen Geräten.' },
    { value: 'left',   label: 'Menü links',  description: 'Auf dem Desktop wird die Navigation als schmale Seitenleiste links angezeigt. Auf Mobilgeräten bleibt das Menü immer unten.' },
  ];

  return (
    <div className="ht-card">
      <p className="ht-section-title mb-3">Darstellung</p>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => upsertSettings({ variables: { nav_position: opt.value } })}
            className={`w-full text-left ht-card transition-all duration-200
              ${current === opt.value
                ? 'border border-accent/50 bg-accent/5'
                : 'border border-transparent hover:border-bg-border'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                ${current === opt.value ? 'border-accent' : 'border-bg-border'}`}>
                {current === opt.value && <div className="w-2 h-2 rounded-full bg-accent" />}
              </div>
              <div>
                <p className="text-sm font-medium text-tx-primary">{opt.label}</p>
                <p className="text-xs text-tx-muted mt-0.5">{opt.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

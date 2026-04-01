'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { X, Plus, Edit3, Trash2, Loader2, FileText, Image } from 'lucide-react';
import { GET_VERBRAUCHSWERTE_LIST } from '@/lib/graphql/queries';
import { DELETE_VERBRAUCHSWERT } from '@/lib/graphql/mutations';
import VerbrauchswertModal from '@/components/modals/VerbrauchswertModal';
import StorageImage from '@/components/ui/StorageImage';
import { Verbrauchstyp, Verbrauchswert } from '@/types';

interface Props {
  verbrauchstyp: Verbrauchstyp;
  onClose: () => void;
}

export default function VerbrauchsDetailDrawer({ verbrauchstyp, onClose }: Props) {
  const color = verbrauchstyp.farbe || '#f97316';

  const { data, loading, refetch } = useQuery(GET_VERBRAUCHSWERTE_LIST, {
    variables: { typ_id: verbrauchstyp.id },
    fetchPolicy: 'cache-and-network',
  });

  const [deleteWert] = useMutation(DELETE_VERBRAUCHSWERT, {
    onCompleted: () => refetch(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem]     = useState<Verbrauchswert | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterStelle, setFilterStelle]   = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl]     = useState<string | null>(null);

  const werte: Verbrauchswert[] = data?.verbrauchswert ?? [];

  // Deduplicate stellen from the loaded data
  const stellenMap = new Map<string, { id: string; bezeichnung: string }>();
  for (const w of werte) {
    if (w.verbrauchsstelle) {
      stellenMap.set(w.verbrauchsstelle.id, w.verbrauchsstelle as { id: string; bezeichnung: string });
    }
  }
  const stellen = Array.from(stellenMap.values());

  const filtered = filterStelle
    ? werte.filter(w => w.verbrauchsstelle?.id === filterStelle)
    : werte;

  const handleModalClose = () => {
    setShowCreate(false);
    setEditItem(null);
    refetch();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col bg-bg-base rounded-t-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
            >
              {verbrauchstyp.symbol || '⚡'}
            </span>
            <div>
              <p className="font-semibold text-tx-primary text-sm leading-tight">{verbrauchstyp.name}</p>
              <p className="text-xs text-tx-muted">{werte.length} Einträge</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="ht-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Neu
            </button>
            <button onClick={onClose} className="ht-btn-ghost p-1.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stelle filter (only when multiple stellen exist) */}
        {stellen.length > 1 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0 border-b border-bg-border/50">
            <button
              onClick={() => setFilterStelle(null)}
              className={`ht-badge border cursor-pointer whitespace-nowrap transition-all ${
                !filterStelle
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'
              }`}
            >
              Alle
            </button>
            {stellen.map(s => (
              <button
                key={s.id}
                onClick={() => setFilterStelle(s.id)}
                className={`ht-badge border cursor-pointer whitespace-nowrap transition-all ${
                  filterStelle === s.id
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-bg-base border-bg-border text-tx-secondary hover:border-accent/30'
                }`}
              >
                {s.bezeichnung}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-8">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-tx-muted text-sm mb-1">Noch keine Einträge vorhanden</p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-accent text-xs hover:underline"
              >
                Ersten Zählerstand erfassen →
              </button>
            </div>
          )}

          {filtered.map(wert => (
            <div key={wert.id} className="bg-bg-card border border-bg-border rounded-xl px-3 py-2.5">
              {deleteConfirm === wert.id ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-tx-secondary">Wirklich löschen?</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="ht-btn-secondary text-xs py-1 px-2.5"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => {
                        deleteWert({ variables: { id: wert.id } });
                        setDeleteConfirm(null);
                      }}
                      className="ht-btn-danger text-xs py-1 px-2.5"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Date */}
                  <div className="w-16 flex-shrink-0">
                    <p className="font-mono text-xs text-tx-muted leading-tight">
                      {format(new Date(wert.datum), 'dd.MM.yy', { locale: de })}
                    </p>
                  </div>

                  {/* Values */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-mono text-sm font-medium text-tx-primary tabular-nums">
                        {Number(wert.zaehlerstand).toLocaleString('de-DE', { maximumFractionDigits: 3 })}
                      </span>
                      <span className="text-xs text-tx-muted">{verbrauchstyp.einheit}</span>
                      {wert.verbrauch != null && (
                        <span
                          className="font-mono text-xs tabular-nums"
                          style={{ color: wert.verbrauch > 0 ? color : '#4a5568' }}
                        >
                          {wert.verbrauch > 0 ? '+' : ''}{Number(wert.verbrauch).toLocaleString('de-DE', { maximumFractionDigits: 3 })}
                        </span>
                      )}
                    </div>
                    {(wert.verbrauchsstelle || wert.notizen || wert.bild_url) && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {wert.verbrauchsstelle && (
                          <span className="ht-badge bg-bg-base border border-bg-border/60 text-tx-muted text-[10px] px-1.5">
                            {wert.verbrauchsstelle.bezeichnung}
                          </span>
                        )}
                        {wert.notizen && (
                          <span title={wert.notizen} className="text-tx-muted/60">
                            <FileText className="w-2.5 h-2.5" />
                          </span>
                        )}
                        {wert.bild_url && (
                          <button
                            onClick={() => setLightboxUrl(wert.bild_url!)}
                            className="text-tx-muted/60 hover:text-accent transition-colors"
                          >
                            <Image className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => setEditItem(wert)}
                      className="ht-btn-ghost p-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(wert.id)}
                      className="ht-btn-ghost p-1.5 text-red-400/50 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit / Create modal */}
      {(showCreate || editItem) && (
        <VerbrauchswertModal
          defaultTypId={verbrauchstyp.id}
          editData={editItem ?? undefined}
          onClose={handleModalClose}
        />
      )}

      {/* Foto-Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 ht-btn-ghost p-2 text-white/70 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <StorageImage
            src={lightboxUrl}
            alt="Zählerstandsfoto"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}

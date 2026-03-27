'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNhostClient } from '@nhost/nextjs';
import { Loader2, Camera, X, Plus } from 'lucide-react';
import Modal from './Modal';
import DateInput from '@/components/ui/DateInput';
import VerbrauchsstellenModal from './VerbrauchsstellenModal';
import { INSERT_VERBRAUCHSWERT, UPDATE_VERBRAUCHSWERT } from '@/lib/graphql/mutations';
import { GET_DASHBOARD_DATA, GET_LETZTER_VERBRAUCHSWERT, GET_VORHERIGER_VERBRAUCHSWERT, GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';
import { Verbrauchswert } from '@/types';

interface Props {
  onClose: () => void;
  editData?: Verbrauchswert;
  defaultTypId?: string;
}

export default function VerbrauchswertModal({ onClose, editData, defaultTypId }: Props) {
  const isEdit = !!editData;
  const nhost = useNhostClient();
  const { data: typenData } = useQuery(GET_VERBRAUCHSTYPEN);
  const typen = typenData?.verbrauchstyp ?? [];

  const [form, setForm] = useState({
    verbrauchstyp_id:    editData?.verbrauchstyp_id    || defaultTypId || '',
    verbrauchsstelle_id: editData?.verbrauchsstelle_id || '',
    datum:               editData?.datum               || new Date().toISOString().split('T')[0],
    zaehlerstand:        editData ? String(editData.zaehlerstand) : '',
    notizen:             editData?.notizen             || '',
  });

  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editData?.bild_url ?? null);
  const [uploading, setUploading]       = useState(false);
  const [stelleError, setStelleError]   = useState(false);
  const [showCreateStelle, setShowCreateStelle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTyp = typen.find((t: any) => t.id === form.verbrauchstyp_id);
  const stellen = selectedTyp?.verbrauchsstellen ?? [];

  // Verbrauchsstelle auto-selektieren, sobald nach Neuanlage Stellen verfügbar werden
  useEffect(() => {
    if (!form.verbrauchsstelle_id && stellen.length > 0) {
      const standard = stellen.find((s: any) => s.ist_standard) ?? stellen[0];
      setForm(f => ({ ...f, verbrauchsstelle_id: standard.id }));
    }
  }, [stellen]);

  const canQuery = !!form.verbrauchstyp_id && !!form.verbrauchsstelle_id;

  // Insert mode: fetch the most recent entry for this type+stelle up to (and including) the selected date
  const { data: letzterData } = useQuery(GET_LETZTER_VERBRAUCHSWERT, {
    variables: { typ_id: form.verbrauchstyp_id, stelle_id: form.verbrauchsstelle_id, datum: form.datum },
    skip: isEdit || !canQuery || !form.datum,
    fetchPolicy: 'network-only',
  });

  // Edit mode: fetch the entry just before (or on) the current datum, excluding the entry being edited
  const { data: vorherigerData } = useQuery(GET_VORHERIGER_VERBRAUCHSWERT, {
    variables: {
      typ_id:     form.verbrauchstyp_id,
      stelle_id:  form.verbrauchsstelle_id,
      datum:      form.datum,
      exclude_id: editData?.id ?? '00000000-0000-0000-0000-000000000000',
    },
    skip: !isEdit || !canQuery || !form.datum,
    fetchPolicy: 'network-only',
  });

  const letzterWert = isEdit
    ? (vorherigerData?.verbrauchswert?.[0] ?? null)
    : (letzterData?.verbrauchswert?.[0] ?? null);

  const aktuellerStand = parseFloat(form.zaehlerstand);
  const verbrauch = letzterWert && form.zaehlerstand && !isNaN(aktuellerStand)
    ? aktuellerStand - letzterWert.zaehlerstand
    : null;

  const refetchQueries = [{ query: GET_DASHBOARD_DATA }];

  const [insertWert, { loading: insertLoading }] = useMutation(INSERT_VERBRAUCHSWERT, {
    refetchQueries,
    onCompleted: onClose,
  });

  const [updateWert, { loading: updateLoading }] = useMutation(UPDATE_VERBRAUCHSWERT, {
    refetchQueries,
    onCompleted: onClose,
  });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.verbrauchsstelle_id) {
      setStelleError(true);
      return;
    }
    setStelleError(false);
    let bild_url: string | undefined = editData?.bild_url;

    if (imageFile) {
      setUploading(true);
      try {
        const { fileMetadata, error } = await nhost.storage.upload({
          file: imageFile,
          bucketId: 'default',
        });
        if (!error && fileMetadata) {
          bild_url = nhost.storage.getPublicUrl({ fileId: fileMetadata.id });
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
      setUploading(false);
    }

    const berechneterVerbrauch = verbrauch !== null ? Math.max(0, verbrauch) : null;

    if (isEdit) {
      updateWert({
        variables: {
          id: editData!.id,
          set: {
            verbrauchstyp_id:    form.verbrauchstyp_id,
            verbrauchsstelle_id: form.verbrauchsstelle_id || null,
            datum:               form.datum,
            zaehlerstand:        parseFloat(form.zaehlerstand),
            verbrauch:           berechneterVerbrauch,
            notizen:             form.notizen || null,
            bild_url,
          },
        },
      });
    } else {
      insertWert({
        variables: {
          obj: {
            verbrauchstyp_id:    form.verbrauchstyp_id,
            verbrauchsstelle_id: form.verbrauchsstelle_id || null,
            datum:               form.datum,
            zaehlerstand:        parseFloat(form.zaehlerstand),
            verbrauch:           berechneterVerbrauch,
            notizen:             form.notizen || null,
            bild_url,
          },
        },
      });
    }
  };

  const loading = insertLoading || updateLoading || uploading;

  return (
    <>
    <Modal title={isEdit ? 'Eintrag bearbeiten' : 'Zählerstand erfassen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verbrauchstyp */}
        <div>
          <label className="ht-label">Verbrauchstyp *</label>
          <select
            className="ht-input"
            value={form.verbrauchstyp_id}
            onChange={e => {
              const typ = typen.find((t: any) => t.id === e.target.value);
              const standardStelle = typ?.verbrauchsstellen?.find((s: any) => s.ist_standard);
              setForm(f => ({ ...f, verbrauchstyp_id: e.target.value, verbrauchsstelle_id: standardStelle?.id ?? '' }));
            }}
            required
          >
            <option value="">– Typ wählen –</option>
            {typen.map((t: any) => (
              <option key={t.id} value={t.id}>{t.symbol} {t.name} ({t.einheit})</option>
            ))}
          </select>
        </div>

        {/* Verbrauchsstelle – immer anzeigen wenn ein Typ gewählt ist */}
        {form.verbrauchstyp_id && (
          <div>
            <label className="ht-label">Verbrauchsstelle *</label>
            <div className="flex gap-2">
              <select
                className={`ht-input flex-1 ${stelleError ? 'border-red-500' : ''}`}
                value={form.verbrauchsstelle_id}
                onChange={e => { setForm(f => ({ ...f, verbrauchsstelle_id: e.target.value })); setStelleError(false); }}
                disabled={stellen.length === 0}
              >
                <option value="">{stellen.length === 0 ? 'Noch keine Stelle vorhanden' : '– Stelle wählen –'}</option>
                {stellen.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.bezeichnung}{s.ist_standard ? ' ★' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCreateStelle(true)}
                className="ht-btn-ghost px-2.5 border border-bg-border rounded-lg flex-shrink-0"
                title="Neue Verbrauchsstelle anlegen"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {stelleError && (
              <p className="text-xs text-red-400 mt-1">Bitte eine Verbrauchsstelle auswählen.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Datum *</label>
            <DateInput value={form.datum} onChange={v => setForm(f => ({ ...f, datum: v }))} required />
          </div>
          <div>
            <label className="ht-label">Zählerstand *</label>
            <input
              type="number"
              step="0.001"
              className="ht-input"
              placeholder="0.000"
              value={form.zaehlerstand}
              onChange={e => setForm(f => ({ ...f, zaehlerstand: e.target.value }))}
              required
            />
          </div>
        </div>

        {letzterWert && (
          <div className="rounded-lg bg-bg-base/60 border border-bg-border px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between text-tx-muted">
              <span>Vorheriger Stand</span>
              <span className="font-mono">{Number(letzterWert.zaehlerstand).toLocaleString('de-DE', { maximumFractionDigits: 3 })} {selectedTyp?.einheit}</span>
            </div>
            {verbrauch !== null && (
              <div className="flex justify-between">
                <span className="text-tx-muted">Verbrauch</span>
                <span className={`font-mono font-medium ${verbrauch < 0 ? 'text-red-400' : 'text-accent'}`}>
                  {verbrauch < 0 ? '⚠ ' : ''}{Number(verbrauch).toLocaleString('de-DE', { maximumFractionDigits: 3 })} {selectedTyp?.einheit}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Foto */}
        <div>
          <label className="ht-label">Foto (optional)</label>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Vorschau" className="w-full h-40 object-cover rounded-lg border border-bg-border" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-bg-border rounded-lg flex flex-col items-center justify-center gap-2 text-tx-muted hover:border-accent/40 hover:text-accent transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Foto aufnehmen oder auswählen</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} />
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <input type="text" className="ht-input" placeholder="Besonderheiten..." value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ht-btn-secondary flex-1 justify-center">Abbrechen</button>
          <button type="submit" disabled={loading} className="ht-btn-primary flex-1 justify-center">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? 'Foto wird hochgeladen...' : 'Speichern...'}</>
              : isEdit ? 'Speichern' : 'Erfassen'}
          </button>
        </div>
      </form>
    </Modal>

    {showCreateStelle && (
      <VerbrauchsstellenModal
        verbrauchstypId={form.verbrauchstyp_id}
        onClose={() => setShowCreateStelle(false)}
      />
    )}
  </>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Camera, X, Plus, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import DateInput from '@/components/ui/DateInput';
import StorageImage from '@/components/ui/StorageImage';
import VerbrauchsstellenModal from './VerbrauchsstellenModal';
import { useDatabase } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { createStorageProvider } from '@/lib/storage';
import type { CreateVerbrauchswert, UpdateVerbrauchswert, Verbrauchswert, Verbrauchstyp, Verbrauchsstelle } from '@/lib/db/types';

interface Props {
  onClose: () => void;
  editData?: any;
  defaultTypId?: string;
}

export default function VerbrauchswertModal({ onClose, editData, defaultTypId }: Props) {
  const isEdit = !!editData;
  const db = useDatabase();
  const auth = useAuth();
  const storage = createStorageProvider();

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
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [stelleError, setStelleError]   = useState(false);
  const [showCreateStelle, setShowCreateStelle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typen, setTypen] = useState<Verbrauchstyp[]>([]);
  const [stellen, setStellen] = useState<Verbrauchsstelle[]>([]);
  const [letzterWert, setLetzterWert] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTyp = typen.find((t) => t.id === form.verbrauchstyp_id);

  // Daten laden
  const loadData = useCallback(async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user?.id) return;
      
      const typenList = await db.getVerbrauchstypen(user.id);
      setTypen(typenList);
      
      if (form.verbrauchstyp_id) {
        const stellenList = await db.getVerbrauchsstellenByTyp(form.verbrauchstyp_id, user.id);
        setStellen(stellenList);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }, [auth, db, form.verbrauchstyp_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Verbrauchsstelle auto-selektieren
  useEffect(() => {
    if (!form.verbrauchsstelle_id && stellen.length > 0) {
      const standard = stellen.find((s) => s.ist_standard) ?? stellen[0];
      setForm(f => ({ ...f, verbrauchsstelle_id: standard.id }));
    }
  }, [stellen]);

  // Letzten Verbrauchswert laden
  useEffect(() => {
    const loadLetzterWert = async () => {
      if (!form.verbrauchstyp_id || !form.verbrauchsstelle_id || !form.datum) return;
      
      try {
        const wert = isEdit
          ? await db.getPreviousVerbrauchswert(form.verbrauchstyp_id, form.verbrauchsstelle_id, form.datum, editData.id)
          : await db.getLastVerbrauchswert(form.verbrauchstyp_id, form.verbrauchsstelle_id, form.datum);
        setLetzterWert(wert);
      } catch (error) {
        console.error('Fehler beim Laden des letzten Wertes:', error);
      }
    };
    
    loadLetzterWert();
  }, [db, form.verbrauchstyp_id, form.verbrauchsstelle_id, form.datum, isEdit, editData?.id]);

  const canQuery = !!form.verbrauchstyp_id && !!form.verbrauchsstelle_id;
  const aktuellerStand = parseFloat(form.zaehlerstand);
  const verbrauch = letzterWert && form.zaehlerstand && !isNaN(aktuellerStand)
    ? aktuellerStand - letzterWert.zaehlerstand
    : null;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleTypChange = async (typId: string) => {
    setForm(f => ({ ...f, verbrauchstyp_id: typId, verbrauchsstelle_id: '' }));
    
    try {
      const user = await auth.getCurrentUser();
      if (!user?.id) return;
      
      const stellenList = await db.getVerbrauchsstellenByTyp(typId, user.id);
      setStellen(stellenList);
    } catch (error) {
      console.error('Fehler beim Laden der Stellen:', error);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.verbrauchsstelle_id) {
      setStelleError(true);
      return;
    }
    setStelleError(false);
    setLoading(true);

    try {
      const user = await auth.getCurrentUser();
      if (!user?.id) {
        throw new Error('Benutzer nicht authentifiziert');
      }

      let bildUrl: string | undefined = editData?.bild_url;

      // Bild hochladen falls vorhanden
      if (imageFile) {
        setUploading(true);
        setUploadError(null);
        try {
          const result = await storage.upload(imageFile, {
            directory: 'verbrauchswerte',
            filename: `zaehlerstand_${user.id}_${Date.now()}.jpg`,
          });
          bildUrl = result.url;
        } catch (err) {
          setUploadError(`Bild-Upload fehlgeschlagen: ${err}`);
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const berechneterVerbrauch = verbrauch !== null ? Math.max(0, verbrauch) : undefined;

      const payload: CreateVerbrauchswert | UpdateVerbrauchswert = {
        verbrauchstypId: form.verbrauchstyp_id,
        verbrauchsstelleId: form.verbrauchsstelle_id || undefined,
        datum: form.datum,
        zaehlerstand: parseFloat(form.zaehlerstand),
        verbrauch: berechneterVerbrauch,
        notizen: form.notizen || undefined,
        bildUrl,
      };

      if (isEdit) {
        await db.updateVerbrauchswert(editData.id, payload as UpdateVerbrauchswert);
      } else {
        await db.createVerbrauchswert({ 
          userId: user.id,
          verbrauchstypId: form.verbrauchstyp_id,
          verbrauchsstelleId: form.verbrauchsstelle_id || undefined,
          datum: form.datum,
          zaehlerstand: parseFloat(form.zaehlerstand),
          verbrauch: berechneterVerbrauch,
          notizen: form.notizen || undefined,
          bildUrl,
        });
      }

      onClose();
    } catch (error: any) {
      const message = error.message || 'Ein Fehler ist aufgetreten';
      setUploadError(message);
    } finally {
      setLoading(false);
    }
  }, [auth, db, storage, form, imageFile, verbrauch, editData, isEdit, onClose]);

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
            onChange={e => handleTypChange(e.target.value)}
            required
          >
            <option value="">– Typ wählen –</option>
            {typen.map((t) => (
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
                {stellen.map((s) => (
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
              <StorageImage src={imagePreview} alt="Vorschau" className="w-full h-40 object-cover rounded-lg border border-bg-border" />
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
          {uploadError && (
            <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{uploadError}</p>
            </div>
          )}
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <input type="text" className="ht-input" placeholder="Besonderheiten..." value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading} className="ht-btn-secondary flex-1 justify-center">Abbrechen</button>
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
        onClose={() => {
          setShowCreateStelle(false);
          loadData();
        }}
        onSuccess={loadData}
      />
    )}
  </>
  );
}

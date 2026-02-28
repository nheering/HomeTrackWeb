'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNhostClient } from '@nhost/nextjs';
import { Loader2, Upload, Camera, X } from 'lucide-react';
import Modal from './Modal';
import { INSERT_VERBRAUCHSWERT } from '@/lib/graphql/mutations';
import { GET_DASHBOARD_DATA, GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';

interface Props {
  onClose: () => void;
}

export default function VerbrauchswertModal({ onClose }: Props) {
  const nhost = useNhostClient();
  const { data: typenData } = useQuery(GET_VERBRAUCHSTYPEN);
  const typen = typenData?.verbrauchstyp ?? [];

  const [form, setForm] = useState({
    verbrauchstyp_id:    '',
    verbrauchsstelle_id: '',
    datum:               new Date().toISOString().split('T')[0],
    zaehlerstand:        '',
    notizen:             '',
  });
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTyp = typen.find((t: any) => t.id === form.verbrauchstyp_id);
  const stellen = selectedTyp?.verbrauchsstellen ?? [];

  const [insertWert, { loading: insertLoading }] = useMutation(INSERT_VERBRAUCHSWERT, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
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
    let bild_url: string | undefined;

    // Bild hochladen wenn vorhanden
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

    insertWert({
      variables: {
        obj: {
          verbrauchstyp_id:    form.verbrauchstyp_id,
          verbrauchsstelle_id: form.verbrauchsstelle_id || null,
          datum:               form.datum,
          zaehlerstand:        parseFloat(form.zaehlerstand),
          notizen:             form.notizen || null,
          bild_url,
        },
      },
    });
  };

  const loading = insertLoading || uploading;

  return (
    <Modal title="Zählerstand erfassen" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verbrauchstyp */}
        <div>
          <label className="ht-label">Verbrauchstyp *</label>
          <select
            className="ht-input"
            value={form.verbrauchstyp_id}
            onChange={e => setForm(f => ({ ...f, verbrauchstyp_id: e.target.value, verbrauchsstelle_id: '' }))}
            required
          >
            <option value="">– Typ wählen –</option>
            {typen.map((t: any) => (
              <option key={t.id} value={t.id}>{t.symbol} {t.name} ({t.einheit})</option>
            ))}
          </select>
        </div>

        {/* Verbrauchsstelle */}
        {stellen.length > 0 && (
          <div>
            <label className="ht-label">Verbrauchsstelle</label>
            <select
              className="ht-input"
              value={form.verbrauchsstelle_id}
              onChange={e => setForm(f => ({ ...f, verbrauchsstelle_id: e.target.value }))}
            >
              <option value="">– Stelle wählen –</option>
              {stellen.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.bezeichnung}{s.ist_standard ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Datum *</label>
            <input type="date" className="ht-input" value={form.datum} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))} required />
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
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? 'Foto wird hochgeladen...' : 'Speichern...'}</> : 'Speichern'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

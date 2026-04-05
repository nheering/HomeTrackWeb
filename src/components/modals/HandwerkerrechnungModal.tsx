'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNhostClient } from '@nhost/nextjs';
import { storageUrl } from '@/lib/nhost';
import { Loader2, Camera, X, Plus, AlertCircle, FileText, AlertTriangle } from 'lucide-react';
import { uploadFehlerText } from '@/lib/upload';
import Modal from './Modal';
import DateInput from '@/components/ui/DateInput';
import StorageImage from '@/components/ui/StorageImage';
import HandwerkerModal from './HandwerkerModal';
import { INSERT_HANDWERKERRECHNUNG, UPDATE_HANDWERKERRECHNUNG } from '@/lib/graphql/mutations';
import { GET_HANDWERKER, GET_HANDWERKERRECHNUNGEN, GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';
import { HANDWERKER_KATEGORIEN, ZAHLUNGSARTEN, STEUER_PROZENTSATZ } from '@/lib/handwerker-constants';

interface Props {
  onClose: () => void;
  editData?: any;
}

export default function HandwerkerrechnungModal({ onClose, editData }: Props) {
  const isEdit = !!editData;
  const nhost = useNhostClient();

  const { data: hwData } = useQuery(GET_HANDWERKER);
  const handwerker = hwData?.handwerker ?? [];
  const { data: typenData } = useQuery(GET_VERBRAUCHSTYPEN);
  const typen = typenData?.verbrauchstyp ?? [];

  const [form, setForm] = useState({
    handwerker_id:      editData?.handwerker_id      || '',
    verbrauchstyp_id:   editData?.verbrauchstyp_id   || '',
    datum:              editData?.datum               || new Date().toISOString().split('T')[0],
    beschreibung:       editData?.beschreibung        || '',
    kategorie:          editData?.kategorie           || '',
    kategorieFreitext:  '',
    betrag_gesamt:      editData ? String(editData.betrag_gesamt) : '',
    betrag_lohn:        editData ? String(editData.betrag_lohn)   : '0',
    betrag_material:    editData ? String(editData.betrag_material) : '0',
    betrag_fahrtkosten: editData ? String(editData.betrag_fahrtkosten) : '0',
    zahlungsart:        editData?.zahlungsart         || 'ueberweisung',
    rechnungsnummer:    editData?.rechnungsnummer     || '',
    ist_absetzbar:      editData?.ist_absetzbar       ?? true,
    notizen:            editData?.notizen             || '',
  });

  const [docFile, setDocFile]           = useState<File | null>(null);
  const [docPreview, setDocPreview]     = useState<string | null>(editData?.dokument_url ?? null);
  const [docIsImage, setDocIsImage]     = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [showCreateHW, setShowCreateHW] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBarzahlung = form.zahlungsart === 'bar';

  // Absetzbarkeit automatisch setzen bei Zahlungsartwechsel
  const handleZahlungsart = (value: string) => {
    setForm(f => ({
      ...f,
      zahlungsart: value,
      ist_absetzbar: value === 'bar' ? false : f.ist_absetzbar,
    }));
  };

  // Betragsberechnung
  const lohn = parseFloat(form.betrag_lohn) || 0;
  const material = parseFloat(form.betrag_material) || 0;
  const fahrt = parseFloat(form.betrag_fahrtkosten) || 0;
  const gesamt = parseFloat(form.betrag_gesamt) || 0;
  const einzelSumme = Math.round((lohn + material + fahrt) * 100) / 100;
  const summenFehler = gesamt > 0 && einzelSumme > 0 && Math.abs(einzelSumme - gesamt) > 0.009;
  const absetzbareBasis = lohn + fahrt;
  const steuerErmaessigung = absetzbareBasis * STEUER_PROZENTSATZ;

  const refetchQueries = [{ query: GET_HANDWERKERRECHNUNGEN }];
  const [insertRechnung, { loading: il }] = useMutation(INSERT_HANDWERKERRECHNUNG, { refetchQueries, onCompleted: onClose });
  const [updateRechnung, { loading: ul }] = useMutation(UPDATE_HANDWERKERRECHNUNG, { refetchQueries, onCompleted: onClose });

  const handleDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    const isImg = file.type.startsWith('image/');
    setDocIsImage(isImg);
    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocPreview(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let dokument_url: string | undefined = editData?.dokument_url;

    if (docFile) {
      setUploading(true);
      setUploadError(null);
      try {
        const token = nhost.auth.getAccessToken();
        const { fileMetadata, error } = await nhost.storage.upload({
          file: docFile,
          bucketId: 'default',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (error || !fileMetadata) {
          setUploadError(`Upload fehlgeschlagen: ${uploadFehlerText(error)}`);
          setUploading(false);
          return;
        }
        dokument_url = `${storageUrl}/files/${fileMetadata.id}`;
      } catch (err) {
        setUploadError(`Upload fehlgeschlagen: ${uploadFehlerText(err)}`);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const kategorie = form.kategorie === 'Sonstige' ? form.kategorieFreitext : form.kategorie;

    const obj = {
      handwerker_id:      form.handwerker_id || null,
      verbrauchstyp_id:   form.verbrauchstyp_id || null,
      datum:              form.datum,
      beschreibung:       form.beschreibung,
      kategorie:          kategorie || null,
      betrag_gesamt:      parseFloat(form.betrag_gesamt),
      betrag_lohn:        lohn,
      betrag_material:    material,
      betrag_fahrtkosten: fahrt,
      zahlungsart:        form.zahlungsart,
      rechnungsnummer:    form.rechnungsnummer || null,
      dokument_url,
      ist_absetzbar:      form.ist_absetzbar,
      notizen:            form.notizen || null,
    };

    if (isEdit) updateRechnung({ variables: { id: editData.id, set: obj } });
    else        insertRechnung({ variables: { obj } });
  };

  const loading = il || ul || uploading;

  const euroFmt = (v: number) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
    <Modal title={isEdit ? 'Rechnung bearbeiten' : 'Rechnung erfassen'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Handwerker */}
        <div>
          <label className="ht-label">Handwerker</label>
          <div className="flex gap-2">
            <select
              className="ht-input flex-1"
              value={form.handwerker_id}
              onChange={e => setForm(f => ({ ...f, handwerker_id: e.target.value }))}
            >
              <option value="">– kein Handwerker –</option>
              {handwerker.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}{h.gewerk ? ` (${h.gewerk})` : ''}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateHW(true)}
              className="ht-btn-ghost px-2.5 border border-bg-border rounded-lg flex-shrink-0"
              title="Neuen Handwerker anlegen"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Datum + Beschreibung */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Datum *</label>
            <DateInput value={form.datum} onChange={v => setForm(f => ({ ...f, datum: v }))} required />
          </div>
          <div>
            <label className="ht-label">Rechnungsnr.</label>
            <input type="text" className="ht-input" placeholder="R-2026-001" value={form.rechnungsnummer} onChange={e => setForm(f => ({ ...f, rechnungsnummer: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="ht-label">Beschreibung *</label>
          <input type="text" className="ht-input" placeholder="z.B. Heizungswartung, Rohrreparatur" value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} required />
        </div>

        {/* Kategorie */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Kategorie</label>
            <select className="ht-input" value={form.kategorie} onChange={e => setForm(f => ({ ...f, kategorie: e.target.value }))}>
              <option value="">– keine –</option>
              {HANDWERKER_KATEGORIEN.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          {form.kategorie === 'Sonstige' && (
            <div>
              <label className="ht-label">Kategorie (Freitext)</label>
              <input type="text" className="ht-input" placeholder="z.B. Klimaanlage" value={form.kategorieFreitext} onChange={e => setForm(f => ({ ...f, kategorieFreitext: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="ht-label">Verbrauchstyp</label>
            <select className="ht-input" value={form.verbrauchstyp_id} onChange={e => setForm(f => ({ ...f, verbrauchstyp_id: e.target.value }))}>
              <option value="">– keiner –</option>
              {typen.map((t: any) => (
                <option key={t.id} value={t.id}>{t.symbol} {t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beträge */}
        <div>
          <label className="ht-label">Gesamtbetrag (€) *</label>
          <input type="number" step="0.01" min="0" className="ht-input" placeholder="0,00" value={form.betrag_gesamt} onChange={e => setForm(f => ({ ...f, betrag_gesamt: e.target.value }))} required />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="ht-label">Lohnkosten (€)</label>
            <input type="number" step="0.01" min="0" className="ht-input" placeholder="0,00" value={form.betrag_lohn} onChange={e => setForm(f => ({ ...f, betrag_lohn: e.target.value }))} />
          </div>
          <div>
            <label className="ht-label">Material (€)</label>
            <input type="number" step="0.01" min="0" className="ht-input" placeholder="0,00" value={form.betrag_material} onChange={e => setForm(f => ({ ...f, betrag_material: e.target.value }))} />
          </div>
          <div>
            <label className="ht-label">Fahrtkosten (€)</label>
            <input type="number" step="0.01" min="0" className="ht-input" placeholder="0,00" value={form.betrag_fahrtkosten} onChange={e => setForm(f => ({ ...f, betrag_fahrtkosten: e.target.value }))} />
          </div>
        </div>

        {summenFehler && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">
              Die Summe der Einzelpositionen ({euroFmt(einzelSumme)} €) stimmt nicht mit dem Gesamtbetrag ({euroFmt(gesamt)} €) überein.
            </p>
          </div>
        )}

        {/* Steuer-Vorschau */}
        {absetzbareBasis > 0 && form.ist_absetzbar && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between text-tx-muted">
              <span>Absetzbare Arbeitskosten (Lohn + Fahrt)</span>
              <span className="font-mono">{euroFmt(absetzbareBasis)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">Steuerermäßigung (20% gem. §35a EStG)</span>
              <span className="font-mono font-medium text-green-400">{euroFmt(steuerErmaessigung)} €</span>
            </div>
          </div>
        )}

        {/* Zahlungsart */}
        <div>
          <label className="ht-label">Zahlungsart *</label>
          <select className="ht-input" value={form.zahlungsart} onChange={e => handleZahlungsart(e.target.value)} required>
            {ZAHLUNGSARTEN.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </div>

        {isBarzahlung && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">Barzahlungen sind nicht steuerlich absetzbar (§35a EStG). Nur unbare Zahlungen werden vom Finanzamt anerkannt.</p>
          </div>
        )}

        {/* Absetzbar Toggle (manuell überschreibbar) */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.ist_absetzbar}
            onChange={e => setForm(f => ({ ...f, ist_absetzbar: e.target.checked }))}
            className="w-4 h-4 rounded border-bg-border accent-accent"
          />
          <span className="text-sm text-tx-secondary">Steuerlich absetzbar</span>
        </label>

        {/* Dokument-Upload */}
        <div>
          <label className="ht-label">Rechnung/Foto (optional)</label>
          {docPreview ? (
            <div className="relative">
              {docIsImage ? (
                <StorageImage src={docPreview} alt="Vorschau" className="w-full h-40 object-cover rounded-lg border border-bg-border" />
              ) : (
                <div className="w-full h-24 rounded-lg border border-bg-border bg-bg-card flex items-center justify-center gap-2 text-tx-muted">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">{docPreview}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setDocFile(null); setDocPreview(null); }}
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
              <span className="text-xs">Rechnung fotografieren oder PDF wählen</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDoc} />
          {uploadError && (
            <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{uploadError}</p>
            </div>
          )}
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <input type="text" className="ht-input" placeholder="Weitere Informationen..." value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ht-btn-secondary flex-1 justify-center">Abbrechen</button>
          <button type="submit" disabled={loading || summenFehler} className={`${loading || summenFehler ? 'ht-btn-secondary opacity-50 cursor-not-allowed' : 'ht-btn-primary'} flex-1 justify-center`}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? 'Upload...' : 'Speichern...'}</>
              : isEdit ? 'Speichern' : 'Erfassen'}
          </button>
        </div>
      </form>
    </Modal>

    {showCreateHW && (
      <HandwerkerModal onClose={() => setShowCreateHW(false)} />
    )}
    </>
  );
}

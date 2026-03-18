'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { INSERT_VERBRAUCHSSTELLE, UPDATE_VERBRAUCHSSTELLE } from '@/lib/graphql/mutations';
import { GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';

interface Props {
  editData?: any;
  verbrauchstypId?: string;
  onClose: () => void;
}

export default function VerbrauchsstellenModal({ editData, verbrauchstypId, onClose }: Props) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    bezeichnung:      editData?.bezeichnung    || '',
    zaehler_nummer:   editData?.zaehler_nummer || '',
    zaehler_typ:      editData?.zaehler_typ    || '',
    standort:         editData?.standort       || '',
    marke_hersteller: editData?.marke_hersteller || '',
    einbau_datum:     editData?.einbau_datum   || '',
    ist_aktiv:        editData?.ist_aktiv      ?? true,
    ist_standard:     editData?.ist_standard   ?? false,
    notizen:          editData?.notizen        || '',
  });

  const [insertStelle, { loading: insertLoading }] = useMutation(INSERT_VERBRAUCHSSTELLE, {
    refetchQueries: [{ query: GET_VERBRAUCHSTYPEN }],
    onCompleted: onClose,
  });

  const [updateStelle, { loading: updateLoading }] = useMutation(UPDATE_VERBRAUCHSSTELLE, {
    refetchQueries: [{ query: GET_VERBRAUCHSTYPEN }],
    onCompleted: onClose,
  });

  const loading = insertLoading || updateLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const typId = editData?.verbrauchstyp_id || verbrauchstypId;
    if (!typId && !isEdit) {
      console.error("No verbrauchstypId provided");
      return;
    }

    if (isEdit) {
      updateStelle({ 
        variables: { 
          id: editData.id, 
          set: form 
        } 
      });
    } else {
      insertStelle({ 
        variables: { 
          obj: { 
            ...form, 
            verbrauchstyp_id: typId 
          } 
        } 
      });
    }
  };

  return (
    <Modal title={isEdit ? 'Verbrauchsstelle bearbeiten' : 'Verbrauchsstelle anlegen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="ht-label">Bezeichnung *</label>
            <input
              type="text"
              className="ht-input"
              placeholder="z.B. Hauptzähler, Keller, Wohnung OG"
              value={form.bezeichnung}
              onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="ht-label">Zählernummer</label>
            <input
              type="text"
              className="ht-input"
              placeholder="z.B. 12345678"
              value={form.zaehler_nummer}
              onChange={e => setForm(f => ({ ...f, zaehler_nummer: e.target.value }))}
            />
          </div>

          <div>
            <label className="ht-label">Zählertyp</label>
            <input
              type="text"
              className="ht-input"
              placeholder="z.B. Eintarif, Zweitarif"
              value={form.zaehler_typ}
              onChange={e => setForm(f => ({ ...f, zaehler_typ: e.target.value }))}
            />
          </div>

          <div>
            <label className="ht-label">Standort</label>
            <input
              type="text"
              className="ht-input"
              placeholder="z.B. Hausanschlussraum"
              value={form.standort}
              onChange={e => setForm(f => ({ ...f, standort: e.target.value }))}
            />
          </div>

          <div>
            <label className="ht-label">Marke / Hersteller</label>
            <input
              type="text"
              className="ht-input"
              placeholder="z.B. Siemens, Itron"
              value={form.marke_hersteller}
              onChange={e => setForm(f => ({ ...f, marke_hersteller: e.target.value }))}
            />
          </div>

          <div>
            <label className="ht-label">Einbaudatum</label>
            <input
              type="date"
              className="ht-input"
              value={form.einbau_datum}
              onChange={e => setForm(f => ({ ...f, einbau_datum: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3 rounded-xl bg-bg-base/40 border border-bg-border">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-bg-border bg-bg-base text-accent focus:ring-accent"
              checked={form.ist_aktiv}
              onChange={e => setForm(f => ({ ...f, ist_aktiv: e.target.checked }))}
            />
            <span className="text-sm font-medium text-tx-primary">Diese Stelle ist aktiv</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-bg-border bg-bg-base text-accent focus:ring-accent"
              checked={form.ist_standard}
              onChange={e => setForm(f => ({ ...f, ist_standard: e.target.checked }))}
            />
            <span className="text-sm font-medium text-tx-primary">Als Standardstelle für diesen Typ festlegen</span>
          </label>
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <textarea
            className="ht-input min-h-[80px]"
            placeholder="Weitere Details..."
            value={form.notizen}
            onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ht-btn-secondary flex-1 justify-center">
            Abbrechen
          </button>
          <button type="submit" disabled={loading} className="ht-btn-primary flex-1 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

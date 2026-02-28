'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { INSERT_ANBIETER, UPDATE_ANBIETER } from '@/lib/graphql/mutations';
import { GET_ANBIETER, GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';

interface Props {
  editData?: any;
  onClose: () => void;
}

export default function AnbieterModal({ editData, onClose }: Props) {
  const isEdit = !!editData;
  const { data: typenData } = useQuery(GET_VERBRAUCHSTYPEN);
  const typen = typenData?.verbrauchstyp ?? [];

  const [form, setForm] = useState({
    name:             editData?.name             || '',
    verbrauchstyp_id: editData?.verbrauchstyp_id || '',
    strasse:          editData?.strasse          || '',
    hausnummer:       editData?.hausnummer       || '',
    plz:              editData?.plz              || '',
    ort:              editData?.ort              || '',
    telefon:          editData?.telefon          || '',
    email:            editData?.email            || '',
    webseite:         editData?.webseite         || '',
    kundennummer:     editData?.kundennummer     || '',
    notizen:          editData?.notizen          || '',
  });

  const refetchQueries = [{ query: GET_ANBIETER }];
  const [insertAnbieter, { loading: il }] = useMutation(INSERT_ANBIETER, { refetchQueries, onCompleted: onClose });
  const [updateAnbieter, { loading: ul }] = useMutation(UPDATE_ANBIETER, { refetchQueries, onCompleted: onClose });
  const loading = il || ul;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { ...form, verbrauchstyp_id: form.verbrauchstyp_id || null };
    if (isEdit) updateAnbieter({ variables: { id: editData.id, set: clean } });
    else        insertAnbieter({ variables: { obj: clean } });
  };

  const field = (key: keyof typeof form, label: string, opts?: { type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="ht-label">{label}{opts?.required ? ' *' : ''}</label>
      <input
        type={opts?.type || 'text'}
        className="ht-input"
        placeholder={opts?.placeholder}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={opts?.required}
      />
    </div>
  );

  return (
    <Modal title={isEdit ? 'Anbieter bearbeiten' : 'Anbieter hinzufügen'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Verbrauchstyp */}
        <div>
          <label className="ht-label">Verbrauchstyp</label>
          <select
            className="ht-input"
            value={form.verbrauchstyp_id}
            onChange={e => setForm(f => ({ ...f, verbrauchstyp_id: e.target.value }))}
          >
            <option value="">– kein Typ –</option>
            {typen.map((t: any) => (
              <option key={t.id} value={t.id}>{t.symbol} {t.name}</option>
            ))}
          </select>
        </div>

        {field('name', 'Firmenname', { required: true, placeholder: 'z.B. Stadtwerke Musterstadt' })}

        <div className="grid grid-cols-2 gap-3">
          {field('kundennummer', 'Kundennummer', { placeholder: '123456789' })}
          {field('telefon', 'Telefon', { placeholder: '0800 123 456' })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('email', 'E-Mail', { type: 'email', placeholder: 'service@anbieter.de' })}
          {field('webseite', 'Webseite', { placeholder: 'https://...' })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">{field('strasse', 'Straße', { placeholder: 'Musterstr.' })}</div>
          {field('hausnummer', 'Nr.', { placeholder: '1' })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {field('plz', 'PLZ', { placeholder: '12345' })}
          <div className="col-span-2">{field('ort', 'Ort', { placeholder: 'Musterstadt' })}</div>
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <textarea
            className="ht-input min-h-[80px] resize-none"
            placeholder="Weitere Informationen..."
            value={form.notizen}
            onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ht-btn-secondary flex-1 justify-center">Abbrechen</button>
          <button type="submit" disabled={loading} className="ht-btn-primary flex-1 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

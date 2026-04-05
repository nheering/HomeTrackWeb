'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { INSERT_HANDWERKER, UPDATE_HANDWERKER } from '@/lib/graphql/mutations';
import { GET_HANDWERKER } from '@/lib/graphql/queries';
import { HANDWERKER_KATEGORIEN } from '@/lib/handwerker-constants';

interface Props {
  editData?: any;
  onClose: () => void;
}

export default function HandwerkerModal({ editData, onClose }: Props) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    name:       editData?.name       || '',
    gewerk:     editData?.gewerk     || '',
    strasse:    editData?.strasse    || '',
    hausnummer: editData?.hausnummer || '',
    plz:        editData?.plz        || '',
    ort:        editData?.ort        || '',
    telefon:    editData?.telefon    || '',
    email:      editData?.email      || '',
    webseite:   editData?.webseite   || '',
    notizen:    editData?.notizen    || '',
  });

  const refetchQueries = [{ query: GET_HANDWERKER }];
  const [insertHW, { loading: il }] = useMutation(INSERT_HANDWERKER, { refetchQueries, onCompleted: onClose });
  const [updateHW, { loading: ul }] = useMutation(UPDATE_HANDWERKER, { refetchQueries, onCompleted: onClose });
  const loading = il || ul;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { ...form, gewerk: form.gewerk || null };
    if (isEdit) updateHW({ variables: { id: editData.id, set: clean } });
    else        insertHW({ variables: { obj: clean } });
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
    <Modal title={isEdit ? 'Handwerker bearbeiten' : 'Handwerker hinzufügen'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {field('name', 'Name / Firma', { required: true, placeholder: 'z.B. Müller Sanitär GmbH' })}

        <div>
          <label className="ht-label">Gewerk</label>
          <select
            className="ht-input"
            value={form.gewerk}
            onChange={e => setForm(f => ({ ...f, gewerk: e.target.value }))}
          >
            <option value="">– kein Gewerk –</option>
            {HANDWERKER_KATEGORIEN.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('telefon', 'Telefon', { placeholder: '0800 123 456' })}
          {field('email', 'E-Mail', { type: 'email', placeholder: 'info@handwerker.de' })}
        </div>

        {field('webseite', 'Webseite', { placeholder: 'https://...' })}

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

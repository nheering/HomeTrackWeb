'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import DateInput from '@/components/ui/DateInput';
import { INSERT_PREISPERIODE, UPDATE_PREISPERIODE } from '@/lib/graphql/mutations';
import { GET_VERTRAEGE } from '@/lib/graphql/queries';

interface Props {
  vertragId: string;
  editData?: any;
  onClose: () => void;
}

export default function PreisperiodeModal({ vertragId, editData, onClose }: Props) {
  const isEdit = !!editData?.id;

  const [form, setForm] = useState({
    gueltig_ab:           editData?.gueltig_ab           || new Date().toISOString().split('T')[0],
    gueltig_bis:          editData?.gueltig_bis          || '',
    grundpreis:           editData?.grundpreis != null ? String(editData.grundpreis) : '',
    grundpreis_intervall: editData?.grundpreis_intervall || 'monatlich',
    einheitspreis:        editData?.einheitspreis != null ? String(editData.einheitspreis) : '',
    steuer:               editData?.steuer != null ? String(editData.steuer) : '19',
    notizen:              editData?.notizen              || '',
  });

  const refetchOpts = { refetchQueries: [{ query: GET_VERTRAEGE }], onCompleted: onClose };
  const [insertPreis, { loading: inserting }] = useMutation(INSERT_PREISPERIODE, refetchOpts);
  const [updatePreis, { loading: updating }] = useMutation(UPDATE_PREISPERIODE, refetchOpts);
  const loading = inserting || updating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      gueltig_ab:           form.gueltig_ab,
      gueltig_bis:          form.gueltig_bis || null,
      grundpreis:           parseFloat(form.grundpreis as any) || 0,
      grundpreis_intervall: form.grundpreis_intervall,
      einheitspreis:        parseFloat(form.einheitspreis as any) || 0,
      steuer:               parseFloat(form.steuer as any) || 19,
      notizen:              form.notizen || null,
    };
    if (isEdit) {
      updatePreis({ variables: { id: editData.id, set: clean } });
    } else {
      insertPreis({ variables: { obj: { ...clean, vertrag_id: vertragId } } });
    }
  };

  return (
    <Modal title={isEdit ? 'Preisperiode bearbeiten' : 'Preisperiode hinzufügen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Gültig ab *</label>
            <DateInput value={form.gueltig_ab} onChange={v => setForm(f => ({ ...f, gueltig_ab: v }))} required />
          </div>
          <div>
            <label className="ht-label">Gültig bis</label>
            <DateInput value={form.gueltig_bis} onChange={v => setForm(f => ({ ...f, gueltig_bis: v }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Grundpreis (€) *</label>
            <input type="number" step="0.01" className="ht-input" placeholder="8.50" value={form.grundpreis} onChange={e => setForm(f => ({ ...f, grundpreis: e.target.value }))} required />
          </div>
          <div>
            <label className="ht-label">Intervall</label>
            <select className="ht-input" value={form.grundpreis_intervall} onChange={e => setForm(f => ({ ...f, grundpreis_intervall: e.target.value }))}>
              <option value="monatlich">Monatlich</option>
              <option value="jährlich">Jährlich</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Arbeitspreis (€/Einheit) *</label>
            <input type="number" step="0.0001" className="ht-input" placeholder="0.3456" value={form.einheitspreis} onChange={e => setForm(f => ({ ...f, einheitspreis: e.target.value }))} required />
          </div>
          <div>
            <label className="ht-label">MwSt. (%)</label>
            <input type="number" step="0.01" className="ht-input" placeholder="19.0" value={form.steuer} onChange={e => setForm(f => ({ ...f, steuer: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <input type="text" className="ht-input" placeholder="z.B. Preiserhöhung ab Jan. 2025" value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} />
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

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { INSERT_VERTRAG, UPDATE_VERTRAG } from '@/lib/graphql/mutations';
import { GET_VERTRAEGE, GET_ANBIETER, GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';

interface Props {
  editData?: any;
  onClose: () => void;
}

export default function VertragModal({ editData, onClose }: Props) {
  const isEdit = !!editData;
  const { data: anbieterData } = useQuery(GET_ANBIETER);
  const { data: typenData    } = useQuery(GET_VERBRAUCHSTYPEN);
  const anbieter = anbieterData?.anbieter    ?? [];
  const typen    = typenData?.verbrauchstyp  ?? [];

  const [form, setForm] = useState({
    bezeichnung:      editData?.bezeichnung      || '',
    anbieter_id:      editData?.anbieter_id      || '',
    verbrauchstyp_id: editData?.verbrauchstyp_id || '',
    vertragsnummer:   editData?.vertragsnummer   || '',
    beginn_datum:     editData?.beginn_datum     || new Date().toISOString().split('T')[0],
    ende_datum:       editData?.ende_datum       || '',
    kuendigungsfrist: editData?.kuendigungsfrist || '',
    zahlungsintervall:editData?.zahlungsintervall|| 'monatlich',
    notizen:          editData?.notizen          || '',
  });

  const refetchQueries = [{ query: GET_VERTRAEGE }];
  const [insertVertrag, { loading: il }] = useMutation(INSERT_VERTRAG, { refetchQueries, onCompleted: onClose });
  const [updateVertrag, { loading: ul }] = useMutation(UPDATE_VERTRAG, { refetchQueries, onCompleted: onClose });
  const loading = il || ul;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      ...form,
      anbieter_id:       form.anbieter_id       || null,
      verbrauchstyp_id:  form.verbrauchstyp_id  || null,
      ende_datum:        form.ende_datum         || null,
      kuendigungsfrist:  form.kuendigungsfrist   ? parseInt(form.kuendigungsfrist as any) : null,
    };
    if (isEdit) updateVertrag({ variables: { id: editData.id, set: clean } });
    else        insertVertrag({ variables: { obj: clean } });
  };

  return (
    <Modal title={isEdit ? 'Vertrag bearbeiten' : 'Vertrag erstellen'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="ht-label">Bezeichnung *</label>
          <input type="text" className="ht-input" placeholder="z.B. Grundversorgung Strom 2024" value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Anbieter</label>
            <select className="ht-input" value={form.anbieter_id} onChange={e => setForm(f => ({ ...f, anbieter_id: e.target.value }))}>
              <option value="">– kein Anbieter –</option>
              {anbieter.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="ht-label">Verbrauchstyp</label>
            <select className="ht-input" value={form.verbrauchstyp_id} onChange={e => setForm(f => ({ ...f, verbrauchstyp_id: e.target.value }))}>
              <option value="">– kein Typ –</option>
              {typen.map((t: any) => <option key={t.id} value={t.id}>{t.symbol} {t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Vertragsbeginn *</label>
            <input type="date" className="ht-input" value={form.beginn_datum} onChange={e => setForm(f => ({ ...f, beginn_datum: e.target.value }))} required />
          </div>
          <div>
            <label className="ht-label">Vertragsende</label>
            <input type="date" className="ht-input" value={form.ende_datum} onChange={e => setForm(f => ({ ...f, ende_datum: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="ht-label">Vertragsnummer</label>
            <input type="text" className="ht-input" value={form.vertragsnummer} onChange={e => setForm(f => ({ ...f, vertragsnummer: e.target.value }))} />
          </div>
          <div>
            <label className="ht-label">Kündigungsfrist (Tage)</label>
            <input type="number" className="ht-input" placeholder="30" value={form.kuendigungsfrist} onChange={e => setForm(f => ({ ...f, kuendigungsfrist: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="ht-label">Zahlungsintervall</label>
          <select className="ht-input" value={form.zahlungsintervall} onChange={e => setForm(f => ({ ...f, zahlungsintervall: e.target.value }))}>
            {['monatlich', 'vierteljährlich', 'halbjährlich', 'jährlich'].map(v => (
              <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="ht-label">Notizen</label>
          <textarea className="ht-input min-h-[70px] resize-none" placeholder="Notizen zum Vertrag..." value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ht-btn-secondary flex-1 justify-center">Abbrechen</button>
          <button type="submit" disabled={loading} className="ht-btn-primary flex-1 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

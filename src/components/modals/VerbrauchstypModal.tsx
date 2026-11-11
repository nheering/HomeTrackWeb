'use client';

import { useState, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, Pipette } from 'lucide-react';
import Modal from './Modal';
import { useDatabase } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import type { CreateVerbrauchstyp, UpdateVerbrauchstyp, Verbrauchstyp } from '@/lib/db/types';

const SYMBOLE = ['⚡', '🔥', '💧', '♨️', '🌡️', '☀️', '🌿', '🏠', '🔌', '🛢️'];
const FARBEN  = ['#f97316', '#eab308', '#38bdf8', '#f43f5e', '#a78bfa', '#34d399', '#22c55e', '#fb923c', '#e879f9', '#60a5fa'];

interface Props {
  editData?: Verbrauchstyp;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VerbrauchstypModal({ editData, onClose, onSuccess }: Props) {
  const isEdit = !!editData;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const db = useDatabase();
  const auth = useAuth();

  const [form, setForm] = useState({
    name:    editData?.name    || '',
    einheit: editData?.einheit || '',
    symbol:  editData?.symbol  || '⚡',
    farbe:   editData?.farbe   || '#f97316',
  });

  const colorInputRef = useRef<HTMLInputElement>(null);
  const isCustomColor = !FARBEN.includes(form.farbe);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    
    try {
      const user = await auth.getCurrentUser();
      if (!user?.id) {
        throw new Error('Benutzer nicht authentifiziert');
      }
      
      const payload: CreateVerbrauchstyp | UpdateVerbrauchstyp = {
        name: form.name,
        einheit: form.einheit || undefined,
        symbol: form.symbol || undefined,
        farbe: form.farbe,
      };
      
      if (isEdit) {
        await db.updateVerbrauchstyp(editData.id, payload as UpdateVerbrauchstyp);
      } else {
        await db.createVerbrauchstyp({ 
          userId: user.id,
          name: form.name,
          einheit: form.einheit || undefined,
          symbol: form.symbol || undefined,
          farbe: form.farbe,
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message = error.message || 'Ein Fehler ist aufgetreten';
      if (message.includes('no mutations exist') || message.includes('permission denied')) {
        setErrorMsg('Fehlende Berechtigungen: Bitte Berechtigungen prüfen');
      } else {
        setErrorMsg(message);
      }
    } finally {
      setLoading(false);
    }
  }, [form, isEdit, editData?.id, auth, db, onClose, onSuccess]);

  return (
    <Modal title={isEdit ? 'Verbrauchstyp bearbeiten' : 'Verbrauchstyp anlegen'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{errorMsg}</p>
          </div>
        )}

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-base/60 border border-bg-border">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${form.farbe}20`, border: `1px solid ${form.farbe}40` }}
          >
            {form.symbol}
          </div>
          <div>
            <p className="font-medium text-tx-primary">{form.name || 'Name'}</p>
            <p className="text-xs text-tx-muted">{form.einheit || 'Einheit'}</p>
          </div>
        </div>

        <div>
          <label className="ht-label">Name *</label>
          <input
            type="text"
            className="ht-input"
            placeholder="z.B. Strom, Gas, Wasser"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="ht-label">Einheit</label>
          <input
            type="text"
            className="ht-input"
            placeholder="z.B. kWh, m³, Liter"
            value={form.einheit}
            onChange={e => setForm(f => ({ ...f, einheit: e.target.value }))}
          />
        </div>

        {/* Symbol Picker */}
        <div>
          <label className="ht-label">Symbol</label>
          <div className="flex gap-2 flex-wrap">
            {SYMBOLE.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setForm(f => ({ ...f, symbol: s }))}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all
                  ${form.symbol === s
                    ? 'bg-accent/20 border-2 border-accent'
                    : 'bg-bg-base border border-bg-border hover:border-accent/30'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Farb-Picker */}
        <div>
          <label className="ht-label">Farbe</label>
          <div className="flex gap-2 flex-wrap justify-center p-1">
            {FARBEN.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, farbe: c }))}
                className={`w-7 h-7 rounded-full transition-all ${form.farbe === c ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-white scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            {/* Custom color button */}
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className={`w-7 h-7 rounded-full transition-all flex items-center justify-center overflow-hidden ${isCustomColor ? 'ring-2 ring-offset-2 ring-offset-bg-card ring-white scale-110' : 'hover:scale-105 border border-bg-border'}`}
              style={isCustomColor ? { backgroundColor: form.farbe } : undefined}
              title="Eigene Farbe wählen"
            >
              {!isCustomColor && <Pipette className="w-3.5 h-3.5 text-tx-muted" />}
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className="sr-only"
              value={form.farbe}
              onChange={e => setForm(f => ({ ...f, farbe: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading} className="ht-btn-secondary flex-1 justify-center">
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

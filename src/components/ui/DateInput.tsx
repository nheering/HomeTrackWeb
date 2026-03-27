'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';

interface Props {
  value: string;                    // yyyy-MM-dd or ''
  onChange: (value: string) => void; // emits yyyy-MM-dd or ''
  required?: boolean;
  min?: string;                     // yyyy-MM-dd
  max?: string;                     // yyyy-MM-dd
  className?: string;
}

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + 'T00:00:00');
  return isValid(d) ? d : undefined;
}

export default function DateInput({ value, onChange, required, min, max, className }: Props) {
  const toDisplay = useCallback((iso: string) => {
    const d = parseIso(iso);
    return d ? format(d, 'dd.MM.yyyy') : '';
  }, []);

  const [text, setText] = useState(() => toDisplay(value));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display when value changes externally
  useEffect(() => {
    setText(toDisplay(value));
  }, [value, toDisplay]);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Nur Ziffern behalten, max. 8 Stellen (TTMMJJJJ)
    const digits = e.target.value.replace(/\D/g, '').substring(0, 8);

    // Punkte automatisch einfügen: TT.MM.JJJJ
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.substring(0, 2)}.${digits.substring(2, 4)}.${digits.substring(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.substring(0, 2)}.${digits.substring(2)}`;
    }

    setText(formatted);

    if (digits.length === 0) {
      onChange('');
    } else if (digits.length === 8) {
      try {
        const d = parse(formatted, 'dd.MM.yyyy', new Date());
        if (isValid(d)) onChange(format(d, 'yyyy-MM-dd'));
      } catch {
        // ungültige Eingabe – warten
      }
    }
  };

  const handleBlur = () => {
    const digits = text.replace(/\D/g, '');
    if (digits.length === 0 || digits.length >= 5) return; // leer oder Jahr wird noch getippt

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let completed: Date | null = null;

    if (digits.length <= 2) {
      // Nur Tag: nächstes Auftreten dieses Tages ab heute suchen
      const day = parseInt(digits, 10);
      if (day < 1 || day > 31) return;

      let m = today.getMonth();
      let y = today.getFullYear();
      for (let attempt = 0; attempt < 13; attempt++) {
        const candidate = new Date(y, m, day);
        if (candidate.getDate() === day && candidate >= today) {
          completed = candidate;
          break;
        }
        m++;
        if (m > 11) { m = 0; y++; }
      }
    } else {
      // 3–4 Ziffern: erste zwei = Tag, nächste = Monat, Jahr = aktuell
      const day   = parseInt(digits.substring(0, 2), 10);
      const month = parseInt(digits.substring(2, 4), 10) - 1; // 0-basiert
      if (month < 0 || month > 11 || day < 1 || day > 31) return;

      const candidate = new Date(today.getFullYear(), month, day);
      if (candidate.getDate() === day && candidate.getMonth() === month) {
        completed = candidate;
      }
    }

    if (completed) {
      const iso = format(completed, 'yyyy-MM-dd');
      setText(format(completed, 'dd.MM.yyyy'));
      onChange(iso);
    }
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (day) {
      onChange(format(day, 'yyyy-MM-dd'));
      setText(format(day, 'dd.MM.yyyy'));
    }
    setOpen(false);
  };

  const selectedDate = parseIso(value);
  const fromDate    = parseIso(min ?? '');
  const toDate      = parseIso(max ?? '');

  return (
    <div ref={containerRef} className="relative">
      {/* Text input + calendar button */}
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          required={required}
          placeholder="TT.MM.JJJJ"
          className={`${className ?? 'ht-input'} pr-8`}
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-tx-muted hover:text-accent transition-colors"
          tabIndex={-1}
        >
          <CalendarDays className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar popover */}
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-bg-border bg-bg-card shadow-card animate-fade-in">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            locale={de}
            defaultMonth={selectedDate ?? (fromDate ? undefined : new Date())}
            fromDate={fromDate}
            toDate={toDate}
            classNames={{
              months:               'p-3',
              month:                '',
              caption:              'flex justify-center items-center relative mb-2 h-7',
              caption_label:        'text-sm font-medium text-tx-primary',
              nav:                  'flex items-center',
              nav_button:           'absolute flex items-center justify-center w-6 h-6 rounded-lg text-tx-muted hover:text-tx-primary hover:bg-bg-hover transition-colors',
              nav_button_previous:  'left-0',
              nav_button_next:      'right-0',
              table:                'border-collapse w-full',
              head_row:             '',
              head_cell:            'text-tx-muted text-xs font-medium w-8 h-8 text-center',
              row:                  '',
              cell:                 'p-0',
              day:                  'w-8 h-8 text-sm rounded-lg hover:bg-bg-hover text-tx-primary transition-colors cursor-pointer flex items-center justify-center mx-auto',
              day_selected:         '!bg-accent !text-white hover:!bg-accent-dark',
              day_today:            'font-bold !text-accent',
              day_outside:          'opacity-30',
              day_disabled:         'opacity-20 cursor-not-allowed pointer-events-none',
              day_hidden:           'invisible',
            }}
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { format, subMonths, startOfYear } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Verbrauchstyp, Verbrauchswert } from '@/types';

interface KachelProps {
  verbrauchstyp: Verbrauchstyp;
  letzterWert?: Verbrauchswert;
  dreiMonatsDurchschnitt?: number;
  jahresgesamt?: number;
  onClick?: () => void;
}

export default function VerbrauchsKachel({
  verbrauchstyp,
  letzterWert,
  dreiMonatsDurchschnitt,
  jahresgesamt,
  onClick,
}: KachelProps) {
  const { name, symbol, farbe, einheit } = verbrauchstyp;
  const color = farbe || '#f97316';

  // Trend-Berechnung (vereinfacht)
  const trend = letzterWert?.verbrauch
    ? letzterWert.verbrauch > (dreiMonatsDurchschnitt ?? 0) ? 'up' : letzterWert.verbrauch < (dreiMonatsDurchschnitt ?? 0) ? 'down' : 'neutral'
    : 'neutral';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-status-active' : 'text-tx-muted';

  return (
    <div className="ht-kachel animate-fade-in" onClick={onClick}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {/* Symbol / Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            {symbol || '⚡'}
          </div>
          <div>
            <h3 className="font-semibold text-tx-primary text-sm">{name}</h3>
            <p className="text-xs text-tx-muted">{einheit || '–'}</p>
          </div>
        </div>
        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
      </div>

      {/* Letzter Verbrauchswert */}
      <div className="ht-divider" />

      {letzterWert ? (
        <>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="ht-stat-label mb-0.5">Letzter Zählerstand</p>
              <p className="ht-stat-value" style={{ color }}>
                {Number(letzterWert.zaehlerstand).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                <span className="text-xs text-tx-muted ml-1">{einheit}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-tx-muted text-xs">
              <Clock className="w-3 h-3" />
              {format(new Date(letzterWert.datum), 'dd.MM.yyyy', { locale: de })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              label="Ø 3 Monate"
              value={dreiMonatsDurchschnitt}
              unit={einheit}
              color={color}
            />
            <StatBox
              label={`Gesamt ${new Date().getFullYear()}`}
              value={jahresgesamt}
              unit={einheit}
              color={color}
            />
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-tx-muted">Noch keine Ablesungen</p>
          <p className="text-xs text-accent mt-1">Zählerstand erfassen →</p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, color }: { label: string; value?: number; unit?: string; color: string }) {
  return (
    <div className="bg-bg-base/60 rounded-lg p-2.5">
      <p className="text-[10px] text-tx-muted mb-1">{label}</p>
      {value !== undefined ? (
        <p className="font-mono text-sm font-medium tabular-nums" style={{ color }}>
          {value.toLocaleString('de-DE', { maximumFractionDigits: 1 })}
          <span className="text-[10px] text-tx-muted ml-1">{unit}</span>
        </p>
      ) : (
        <p className="font-mono text-sm text-tx-muted">–</p>
      )}
    </div>
  );
}

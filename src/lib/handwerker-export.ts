import { format } from 'date-fns';
import { Handwerkerrechnung } from '@/types';
import { STEUER_PROZENTSATZ, STEUER_MAX_ABSETZBAR } from './handwerker-constants';

const num = (v: number, digits = 2) => v.toFixed(digits).replace('.', ',');
const sep = ';';

export function exportHandwerkerCSV(rechnungen: Handwerkerrechnung[], jahr: number) {
  const headers = [
    'Datum', 'Handwerker', 'Gewerk', 'Beschreibung', 'Kategorie',
    'Rechnungsnr.', 'Gesamt (€)', 'Lohnkosten (€)', 'Fahrtkosten (€)',
    'Materialkosten (€)', 'Zahlungsart', 'Absetzbar', 'Steuerermäßigung (€)',
  ];

  const rows = rechnungen.map(r => {
    const absetzbar = r.ist_absetzbar ? (r.betrag_lohn + r.betrag_fahrtkosten) * STEUER_PROZENTSATZ : 0;
    return [
      format(new Date(r.datum), 'dd.MM.yyyy'),
      r.handwerker?.name ?? '',
      r.handwerker?.gewerk ?? '',
      r.beschreibung,
      r.kategorie ?? '',
      r.rechnungsnummer ?? '',
      num(Number(r.betrag_gesamt)),
      num(Number(r.betrag_lohn)),
      num(Number(r.betrag_fahrtkosten)),
      num(Number(r.betrag_material)),
      r.zahlungsart,
      r.ist_absetzbar ? 'Ja' : 'Nein',
      num(absetzbar),
    ].join(sep);
  });

  const csv = '\uFEFF' + [headers.join(sep), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `handwerkerrechnungen-${jahr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSteuerZusammenfassung(rechnungen: Handwerkerrechnung[], jahr: number) {
  const absetzbare = rechnungen.filter(r => r.ist_absetzbar);
  const gesamtAusgaben = rechnungen.reduce((s, r) => s + Number(r.betrag_gesamt), 0);
  const lohnSumme = absetzbare.reduce((s, r) => s + Number(r.betrag_lohn) + Number(r.betrag_fahrtkosten), 0);
  const materialSumme = rechnungen.reduce((s, r) => s + Number(r.betrag_material), 0);
  const ermaessigung = Math.min(lohnSumme * STEUER_PROZENTSATZ, STEUER_MAX_ABSETZBAR);

  const pad = (label: string, value: string, width = 40) =>
    label.padEnd(width) + value;

  const lines = [
    `Zusammenfassung haushaltsnahe Handwerkerleistungen ${jahr}`,
    `gem. §35a Abs. 3 EStG`,
    `Erstellt am: ${format(new Date(), 'dd.MM.yyyy')}`,
    '',
    '═'.repeat(55),
    '',
    pad('Anzahl Rechnungen:', `${rechnungen.length}`),
    pad('  davon absetzbar:', `${absetzbare.length}`),
    '',
    pad('Gesamtausgaben:', `${num(gesamtAusgaben)} EUR`),
    pad('Materialkosten:', `${num(materialSumme)} EUR`),
    pad('Absetzbare Arbeitskosten:', `${num(lohnSumme)} EUR`),
    '  (Lohn- und Fahrtkosten)',
    '',
    pad('Steuerermäßigung (20%):', `${num(ermaessigung)} EUR`),
    '  (max. 1.200,00 EUR/Jahr)',
    '',
    '═'.repeat(55),
    '',
    'Einzelaufstellung:',
    '',
    'Datum       Handwerker                  Lohn+Fahrt    20%',
    '─'.repeat(55),
  ];

  for (const r of absetzbare) {
    const basis = Number(r.betrag_lohn) + Number(r.betrag_fahrtkosten);
    const erm = basis * STEUER_PROZENTSATZ;
    const datum = format(new Date(r.datum), 'dd.MM.yyyy');
    const hw = (r.handwerker?.name ?? 'Unbekannt').substring(0, 26).padEnd(28);
    lines.push(`${datum}  ${hw}${num(basis).padStart(8)} €  ${num(erm).padStart(8)} €`);
    lines.push(`            ${r.beschreibung.substring(0, 42)}`);
  }

  lines.push('─'.repeat(55));
  lines.push(`${'Summe'.padEnd(40)}${num(lohnSumme).padStart(8)} €  ${num(ermaessigung).padStart(8)} €`);
  lines.push('');
  lines.push('Hinweis: Die Steuerermäßigung beträgt 20% der Arbeitskosten,');
  lines.push('maximal 1.200 EUR pro Jahr (§35a Abs. 3 EStG).');
  lines.push('Nur unbare Zahlungen sind absetzbar.');

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `steuer-handwerker-${jahr}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export const HANDWERKER_KATEGORIEN = [
  'Heizung',
  'Sanitär',
  'Elektro',
  'Dach',
  'Garten',
  'Malerarbeiten',
  'Schreiner',
  'Bodenleger',
  'Schornsteinfeger',
  'Fenster/Türen',
  'Fassade',
  'Sonstige',
] as const;

export const ZAHLUNGSARTEN = [
  { value: 'ueberweisung', label: 'Überweisung' },
  { value: 'lastschrift', label: 'Lastschrift' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bar', label: 'Barzahlung (nicht absetzbar!)' },
] as const;

export const STEUER_MAX_ABSETZBAR = 1200;
export const STEUER_PROZENTSATZ = 0.20;
export const STEUER_MAX_LOHNKOSTEN = 6000;

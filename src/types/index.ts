// HomeTrack Typen

export interface Verbrauchstyp {
  id: string;
  user_id: string;
  name: string;
  einheit?: string;
  symbol?: string;
  farbe?: string;
  bild_url?: string;
  erstellt_am: string;
  verbrauchsstellen?: Verbrauchsstelle[];
  anbieter?: Anbieter[];
  verbrauchswerte?: Verbrauchswert[];
}

export interface Verbrauchsstelle {
  id: string;
  user_id: string;
  verbrauchstyp_id: string;
  bezeichnung: string;
  zaehler_nummer?: string;
  zaehler_typ?: string;
  einbau_datum?: string;
  standort?: string;
  marke_hersteller?: string;
  ist_aktiv: boolean;
  ist_standard: boolean;
  notizen?: string;
  erstellt_am: string;
  verbrauchstyp?: Verbrauchstyp;
  verbrauchswerte?: Verbrauchswert[];
}

export interface Anbieter {
  id: string;
  user_id: string;
  verbrauchstyp_id?: string;
  name: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  webseite?: string;
  kundennummer?: string;
  notizen?: string;
  erstellt_am: string;
  vertraege?: Vertrag[];
}

export interface Vertrag {
  id: string;
  user_id: string;
  anbieter_id?: string;
  verbrauchstyp_id?: string;
  bezeichnung: string;
  vertragsnummer?: string;
  beginn_datum: string;
  ende_datum?: string;
  kuendigungsfrist?: number;
  zahlungsintervall?: string;
  notizen?: string;
  erstellt_am: string;
  preisperioden?: Preisperiode[];
  anbieter?: Anbieter;
}

export interface Preisperiode {
  id: string;
  user_id: string;
  vertrag_id: string;
  gueltig_ab: string;
  gueltig_bis?: string;
  grundpreis: number;
  grundpreis_intervall?: string;
  einheitspreis: number;
  steuer?: number;
  notizen?: string;
  erstellt_am: string;
}

export interface Verbrauchswert {
  id: string;
  user_id: string;
  verbrauchstyp_id: string;
  verbrauchsstelle_id?: string;
  datum: string;
  zaehlerstand: number;
  verbrauch?: number;
  bild_url?: string;
  notizen?: string;
  erstellt_am: string;
  verbrauchstyp?: Verbrauchstyp;
  verbrauchsstelle?: Verbrauchsstelle;
}

export interface Handwerker {
  id: string;
  user_id: string;
  name: string;
  gewerk?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  webseite?: string;
  notizen?: string;
  erstellt_am: string;
  handwerkerrechnungen?: Handwerkerrechnung[];
}

export interface Handwerkerrechnung {
  id: string;
  user_id: string;
  handwerker_id?: string;
  verbrauchstyp_id?: string;
  datum: string;
  beschreibung: string;
  kategorie?: string;
  betrag_gesamt: number;
  betrag_lohn: number;
  betrag_material: number;
  betrag_fahrtkosten: number;
  zahlungsart: string;
  rechnungsnummer?: string;
  dokument_url?: string;
  ist_absetzbar: boolean;
  notizen?: string;
  erstellt_am: string;
  handwerker?: Handwerker;
  verbrauchstyp?: Verbrauchstyp;
}

// UI-Hilfstypes
export type TabName = 'home' | 'auswertungen' | 'handwerker' | 'einstellungen';
export type EinstellungenTab = 'verbrauchstypen' | 'anbieter' | 'vertraege' | 'handwerker';

export interface KachelData {
  verbrauchstyp: Verbrauchstyp;
  letzterWert?: Verbrauchswert;
  dreiMonatsDurchschnitt?: number;
  jahresgesamt?: number;
}

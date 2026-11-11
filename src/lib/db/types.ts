/**
 * Typdefinitionen für die Datenbank
 */

import { User } from '../auth/types';

// ============================================================
// Verbrauchstyp
// ============================================================

export interface Verbrauchstyp {
  id: string;
  user_id: string;
  name: string;
  einheit: string | null;
  symbol: string | null;
  farbe: string;
  bild_url: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateVerbrauchstyp {
  userId: string;
  name: string;
  einheit?: string;
  symbol?: string;
  farbe?: string;
  bildUrl?: string;
}

export interface UpdateVerbrauchstyp {
  name?: string;
  einheit?: string;
  symbol?: string;
  farbe?: string;
  bildUrl?: string;
}

// ============================================================
// Verbrauchsstelle (Zähler)
// ============================================================

export interface Verbrauchsstelle {
  id: string;
  user_id: string;
  verbrauchstyp_id: string;
  bezeichnung: string;
  zaehler_nummer: string | null;
  zaehler_typ: string | null;
  einbau_datum: string | null;
  standort: string | null;
  marke_hersteller: string | null;
  ist_aktiv: boolean;
  ist_standard: boolean;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateVerbrauchsstelle {
  userId: string;
  verbrauchstypId: string;
  bezeichnung: string;
  zaehlerNummer?: string;
  zaehlerTyp?: string;
  einbauDatum?: string;
  standort?: string;
  markeHersteller?: string;
  istAktiv?: boolean;
  istStandard?: boolean;
  notizen?: string;
}

export interface UpdateVerbrauchsstelle {
  bezeichnung?: string;
  zaehlerNummer?: string;
  zaehlerTyp?: string;
  einbauDatum?: string;
  standort?: string;
  markeHersteller?: string;
  istAktiv?: boolean;
  istStandard?: boolean;
  notizen?: string;
}

// ============================================================
// Anbieter
// ============================================================

export interface Anbieter {
  id: string;
  user_id: string;
  verbrauchstyp_id: string | null;
  name: string;
  strasse: string | null;
  hausnummer: string | null;
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  email: string | null;
  webseite: string | null;
  kundennummer: string | null;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateAnbieter {
  userId: string;
  verbrauchstypId?: string;
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
}

export interface UpdateAnbieter {
  verbrauchstypId?: string;
  name?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  webseite?: string;
  kundennummer?: string;
  notizen?: string;
}

// ============================================================
// Vertrag
// ============================================================

export interface Vertrag {
  id: string;
  user_id: string;
  anbieter_id: string | null;
  verbrauchstyp_id: string | null;
  bezeichnung: string;
  vertragsnummer: string | null;
  beginn_datum: string;
  ende_datum: string | null;
  kuendigungsfrist: number | null;
  zahlungsintervall: string | null;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateVertrag {
  userId: string;
  anbieterId?: string;
  verbrauchstypId?: string;
  bezeichnung: string;
  vertragsnummer?: string;
  beginnDatum: string;
  endeDatum?: string;
  kuendigungsfrist?: number;
  zahlungsintervall?: string;
  notizen?: string;
}

export interface UpdateVertrag {
  anbieterId?: string;
  verbrauchstypId?: string;
  bezeichnung?: string;
  vertragsnummer?: string;
  beginnDatum?: string;
  endeDatum?: string;
  kuendigungsfrist?: number;
  zahlungsintervall?: string;
  notizen?: string;
}

// ============================================================
// Preisperiode
// ============================================================

export interface Preisperiode {
  id: string;
  user_id: string;
  vertrag_id: string;
  gueltig_ab: string;
  gueltig_bis: string | null;
  grundpreis: number;
  grundpreis_intervall: string;
  einheitspreis: number;
  steuer: number;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreatePreisperiode {
  userId: string;
  vertragId: string;
  gueltigAb: string;
  gueltigBis?: string;
  grundpreis: number;
  grundpreisIntervall?: string;
  einheitspreis: number;
  steuer?: number;
  notizen?: string;
}

export interface UpdatePreisperiode {
  gueltigAb?: string;
  gueltigBis?: string;
  grundpreis?: number;
  grundpreisIntervall?: string;
  einheitspreis?: number;
  steuer?: number;
  notizen?: string;
}

// ============================================================
// Verbrauchswert
// ============================================================

export interface Verbrauchswert {
  id: string;
  user_id: string;
  verbrauchstyp_id: string;
  verbrauchsstelle_id: string | null;
  datum: string;
  zaehlerstand: number;
  verbrauch: number | null;
  bild_url: string | null;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateVerbrauchswert {
  userId: string;
  verbrauchstypId: string;
  verbrauchsstelleId?: string;
  datum: string;
  zaehlerstand: number;
  verbrauch?: number;
  bildUrl?: string;
  notizen?: string;
}

export interface UpdateVerbrauchswert {
  verbrauchstypId?: string;
  verbrauchsstelleId?: string;
  datum?: string;
  zaehlerstand?: number;
  verbrauch?: number;
  bildUrl?: string;
  notizen?: string;
}

// ============================================================
// User Settings
// ============================================================

export interface UserSettings {
  id: string;
  user_id: string;
  key: string;
  value: unknown;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateUserSettings {
  userId: string;
  key: string;
  value: unknown;
}

export interface UpdateUserSettings {
  value: unknown;
}

// ============================================================
// Handwerker
// ============================================================

export interface Handwerker {
  id: string;
  user_id: string;
  name: string;
  firma: string | null;
  strasse: string | null;
  hausnummer: string | null;
  plz: string | null;
  ort: string | null;
  telefon: string | null;
  mobil: string | null;
  email: string | null;
  webseite: string | null;
  gewerk: string | null;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateHandwerker {
  userId: string;
  name: string;
  firma?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  mobil?: string;
  email?: string;
  webseite?: string;
  gewerk?: string;
  notizen?: string;
}

export interface UpdateHandwerker {
  name?: string;
  firma?: string;
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  mobil?: string;
  email?: string;
  webseite?: string;
  gewerk?: string;
  notizen?: string;
}

// ============================================================
// Handwerkerrechnung
// ============================================================

export interface Handwerkerrechnung {
  id: string;
  user_id: string;
  handwerker_id: string | null;
  rechnungsnummer: string | null;
  datum: string;
  faelligkeitsdatum: string | null;
  betrag: number;
  steuer: number;
  beschreibung: string | null;
  datei_url: string | null;
  bezahlt: boolean;
  bezahlungsdatum: string | null;
  zahlungsmethode: string | null;
  notizen: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

export interface CreateHandwerkerrechnung {
  userId: string;
  handwerkerId?: string;
  rechnungsnummer?: string;
  datum: string;
  faelligkeitsdatum?: string;
  betrag: number;
  steuer?: number;
  beschreibung?: string;
  dateiUrl?: string;
  bezahlt?: boolean;
  bezahlungsdatum?: string;
  zahlungsmethode?: string;
  notizen?: string;
}

export interface UpdateHandwerkerrechnung {
  handwerkerId?: string;
  rechnungsnummer?: string;
  datum?: string;
  faelligkeitsdatum?: string;
  betrag?: number;
  steuer?: number;
  beschreibung?: string;
  dateiUrl?: string;
  bezahlt?: boolean;
  bezahlungsdatum?: string;
  zahlungsmethode?: string;
  notizen?: string;
}

// ============================================================
// Filter- und Sortieroptionen
// ============================================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// ============================================================
// Aggregationsergebnisse
// ============================================================

export interface AggregationResult {
  count?: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
}

export default {
  Verbrauchstyp,
  CreateVerbrauchstyp,
  UpdateVerbrauchstyp,
  Verbrauchsstelle,
  CreateVerbrauchsstelle,
  UpdateVerbrauchsstelle,
  Anbieter,
  CreateAnbieter,
  UpdateAnbieter,
  Vertrag,
  CreateVertrag,
  UpdateVertrag,
  Preisperiode,
  CreatePreisperiode,
  UpdatePreisperiode,
  Verbrauchswert,
  CreateVerbrauchswert,
  UpdateVerbrauchswert,
  UserSettings,
  CreateUserSettings,
  UpdateUserSettings,
  Handwerker,
  CreateHandwerker,
  UpdateHandwerker,
  Handwerkerrechnung,
  CreateHandwerkerrechnung,
  UpdateHandwerkerrechnung,
  QueryOptions,
  DateRangeFilter,
  AggregationResult,
};

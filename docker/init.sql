-- HomeTrack Datenbankschema
-- ========================
-- 
-- Dieses Skript wird automatisch beim ersten Start des PostgreSQL Containers
-- ausgefuehrt (wenn die Datenbank noch leer ist).
--
-- Enthaelt:
-- 1. Er'te Extensions
-- 2. Auth-Tabellen (vereinfacht fuer lokale Entwicklung)
-- 3. Alle Anwendungstabellen aus dem Nhost Schema
-- 4. Indizes und Constraints
-- 5. RLS Policies (Row Level Security)
-- 6. Trigger fuer aktualisiert_am

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. AUTH TABELLEN (vereinfacht)
-- ============================================================
-- 
-- In Nhost werden die Auth-Tabellen automatisch erstellt.
-- Hier erstellen wir eine vereinfachte Version fuer lokale Entwicklung.

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index fuer schnelleren Email-Lookup
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);

-- ============================================================
-- 2. ANWENDUNGSTABELLEN (aus Nhost Migration)
-- ============================================================

-- VERBRAUCHSTYP: Verbrauchskategorien (Strom, Gas, Wasser, etc.)
CREATE TABLE IF NOT EXISTS verbrauchstyp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  einheit TEXT,
  symbol TEXT,
  farbe TEXT DEFAULT '#f97316',
  bild_url TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- VERBRAUCHSSTELLE: Zaehler
CREATE TABLE IF NOT EXISTS verbrauchsstelle (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  verbrauchstyp_id UUID NOT NULL REFERENCES verbrauchstyp(id) ON DELETE CASCADE,
  bezeichnung TEXT NOT NULL,
  zaehler_nummer TEXT,
  zaehler_typ TEXT,
  einbau_datum DATE,
  standort TEXT,
  marke_hersteller TEXT,
  ist_aktiv BOOLEAN DEFAULT true NOT NULL,
  ist_standard BOOLEAN DEFAULT false NOT NULL,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Constraint: max. 1 Standardstelle je Verbrauchstyp
CREATE UNIQUE INDEX IF NOT EXISTS uix_standard_stelle_per_typ
  ON verbrauchsstelle(verbrauchstyp_id)
  WHERE ist_standard = true;

-- ANBIETER: Energieanbieter
CREATE TABLE IF NOT EXISTS anbieter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  verbrauchstyp_id UUID REFERENCES verbrauchstyp(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  strasse TEXT,
  hausnummer TEXT,
  plz TEXT,
  ort TEXT,
  telefon TEXT,
  email TEXT,
  webseite TEXT,
  kundennummer TEXT,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- VERTRAG: Vertraege mit Anbietern
CREATE TABLE IF NOT EXISTS vertrag (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  anbieter_id UUID REFERENCES anbieter(id) ON DELETE SET NULL,
  verbrauchstyp_id UUID REFERENCES verbrauchstyp(id) ON DELETE SET NULL,
  bezeichnung TEXT NOT NULL,
  vertragsnummer TEXT,
  beginn_datum DATE NOT NULL,
  ende_datum DATE,
  kuendigungsfrist INTEGER,
  zahlungsintervall TEXT,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Constraint: je Anbieter+Verbrauchstyp max. 1 aktiver Vertrag (ende_datum IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uix_aktiver_vertrag
  ON vertrag(anbieter_id, verbrauchstyp_id)
  WHERE ende_datum IS NULL;

-- PREISPERIODE: Preisinformationen pro Vertrag
CREATE TABLE IF NOT EXISTS preisperiode (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  vertrag_id UUID NOT NULL REFERENCES vertrag(id) ON DELETE CASCADE,
  gueltig_ab DATE NOT NULL,
  gueltig_bis DATE,
  grundpreis NUMERIC(10,4) NOT NULL DEFAULT 0,
  grundpreis_intervall TEXT DEFAULT 'monatlich',
  einheitspreis NUMERIC(10,6) NOT NULL DEFAULT 0,
  steuer NUMERIC(5,2) DEFAULT 19.0,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- VERBRAUCHSWERT: Zaehlerstaende und Verbrauchsdaten
CREATE TABLE IF NOT EXISTS verbrauchswert (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  verbrauchstyp_id UUID NOT NULL REFERENCES verbrauchstyp(id) ON DELETE CASCADE,
  verbrauchsstelle_id UUID REFERENCES verbrauchsstelle(id) ON DELETE SET NULL,
  datum DATE NOT NULL,
  zaehlerstand NUMERIC(14,3) NOT NULL,
  verbrauch NUMERIC(14,3),
  bild_url TEXT,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- USER_SETTINGS: Nutzerpraeferenzen
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Constraint: Eindeutiger Key pro Nutzer
CREATE UNIQUE INDEX IF NOT EXISTS uix_user_settings_key
  ON user_settings(user_id, key);

-- HANDWERKER: Handwerker-Daten
CREATE TABLE IF NOT EXISTS handwerker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  firma TEXT,
  strasse TEXT,
  hausnummer TEXT,
  plz TEXT,
  ort TEXT,
  telefon TEXT,
  mobil TEXT,
  email TEXT,
  webseite TEXT,
  gewerk TEXT,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- HANDWERKERRECHNUNG: Rechnungen von Handwerkern
CREATE TABLE IF NOT EXISTS handwerkerrechnung (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  handwerker_id UUID REFERENCES handwerker(id) ON DELETE SET NULL,
  rechnungsnummer TEXT,
  datum DATE NOT NULL,
  faelligkeitsdatum DATE,
  betrag NUMERIC(12,2) NOT NULL DEFAULT 0,
  steuer NUMERIC(5,2) DEFAULT 19.0,
  beschreibung TEXT,
  datei_url TEXT,
  bezahlt BOOLEAN DEFAULT false,
  bezahlungsdatum DATE,
  zahlungsmethode TEXT,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. INDIZES FUER PERFORMANCE
-- ============================================================

-- Verbrauchstyp
CREATE INDEX IF NOT EXISTS idx_verbrauchstyp_user ON verbrauchstyp(user_id);

-- Verbrauchsstelle
CREATE INDEX IF NOT EXISTS idx_verbrauchsstelle_user ON verbrauchsstelle(user_id);
CREATE INDEX IF NOT EXISTS idx_verbrauchsstelle_typ ON verbrauchsstelle(verbrauchstyp_id);

-- Anbieter
CREATE INDEX IF NOT EXISTS idx_anbieter_user ON anbieter(user_id);
CREATE INDEX IF NOT EXISTS idx_anbieter_typ ON anbieter(verbrauchstyp_id);

-- Vertrag
CREATE INDEX IF NOT EXISTS idx_vertrag_user ON vertrag(user_id);
CREATE INDEX IF NOT EXISTS idx_vertrag_anbieter ON vertrag(anbieter_id);
CREATE INDEX IF NOT EXISTS idx_vertrag_typ ON vertrag(verbrauchstyp_id);

-- Preisperiode
CREATE INDEX IF NOT EXISTS idx_preisperiode_user ON preisperiode(user_id);
CREATE INDEX IF NOT EXISTS idx_preisperiode_vertrag ON preisperiode(vertrag_id);
CREATE INDEX IF NOT EXISTS idx_preisperiode_dates ON preisperiode(gueltig_ab DESC, gueltig_bis);

-- Verbrauchswert
CREATE INDEX IF NOT EXISTS idx_verbrauchswert_user ON verbrauchswert(user_id);
CREATE INDEX IF NOT EXISTS idx_verbrauchswert_typ ON verbrauchswert(verbrauchstyp_id);
CREATE INDEX IF NOT EXISTS idx_verbrauchswert_stelle ON verbrauchswert(verbrauchsstelle_id);
CREATE INDEX IF NOT EXISTS idx_verbrauchswert_typ_datum ON verbrauchswert(verbrauchstyp_id, datum DESC);
CREATE INDEX IF NOT EXISTS idx_verbrauchswert_stelle_datum ON verbrauchswert(verbrauchsstelle_id, datum DESC);
CREATE INDEX IF NOT EXISTS idx_verbrauchswert_datum ON verbrauchswert(datum DESC);

-- User Settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- Handwerker
CREATE INDEX IF NOT EXISTS idx_handwerker_user ON handwerker(user_id);

-- Handwerkerrechnung
CREATE INDEX IF NOT EXISTS idx_handwerkerrechnung_user ON handwerkerrechnung(user_id);
CREATE INDEX IF NOT EXISTS idx_handwerkerrechnung_handwerker ON handwerkerrechnung(handwerker_id);
CREATE INDEX IF NOT EXISTS idx_handwerkerrechnung_datum ON handwerkerrechnung(datum DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- 
-- RLS stellt sicher, dass Nutzer nur auf ihre eigenen Daten zugreifen koennen.
-- Dies ersetzt die Hasura-Permissions aus Nhost.

-- Funktion zum Setzen des aktuellen Nutzers
CREATE OR REPLACE FUNCTION set_current_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS fuer alle Tabellen aktivieren
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbrauchstyp ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbrauchsstelle ENABLE ROW LEVEL SECURITY;
ALTER TABLE anbieter ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertrag ENABLE ROW LEVEL SECURITY;
ALTER TABLE preisperiode ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbrauchswert ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE handwerker ENABLE ROW LEVEL SECURITY;
ALTER TABLE handwerkerrechnung ENABLE ROW LEVEL SECURITY;

-- Policy fuer auth_users: Alle Nutzer koennen sich selbst sehen
CREATE POLICY auth_users_self_policy ON auth_users
  USING (id = current_setting('app.current_user_id')::UUID);

-- Policy fuer verbrauchstyp
CREATE POLICY verbrauchstyp_user_policy ON verbrauchstyp
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer verbrauchsstelle
CREATE POLICY verbrauchsstelle_user_policy ON verbrauchsstelle
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer anbieter
CREATE POLICY anbieter_user_policy ON anbieter
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer vertrag
CREATE POLICY vertrag_user_policy ON vertrag
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer preisperiode
CREATE POLICY preisperiode_user_policy ON preisperiode
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer verbrauchswert
CREATE POLICY verbrauchswert_user_policy ON verbrauchswert
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer user_settings
CREATE POLICY user_settings_user_policy ON user_settings
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer handwerker
CREATE POLICY handwerker_user_policy ON handwerker
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy fuer handwerkerrechnung
CREATE POLICY handwerkerrechnung_user_policy ON handwerkerrechnung
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- ============================================================
-- 5. TRIGGER FUER AKTUALISIERT_AM
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger fuer alle Tabellen mit aktualisiert_am
CREATE TRIGGER trg_verbrauchstyp_updated
  BEFORE UPDATE ON verbrauchstyp
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_verbrauchsstelle_updated
  BEFORE UPDATE ON verbrauchsstelle
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_anbieter_updated
  BEFORE UPDATE ON anbieter
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vertrag_updated
  BEFORE UPDATE ON vertrag
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_preisperiode_updated
  BEFORE UPDATE ON preisperiode
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_verbrauchswert_updated
  BEFORE UPDATE ON verbrauchswert
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_settings_updated
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_handwerker_updated
  BEFORE UPDATE ON handwerker
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_handwerkerrechnung_updated
  BEFORE UPDATE ON handwerkerrechnung
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_auth_users_updated
  BEFORE UPDATE ON auth_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. STANDARDDATEN (Beispieldaten fuer lokale Entwicklung)
-- ============================================================

-- Test-Nutzer erstellen (nur wenn keine Nutzer existieren)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth_users) THEN
    -- Testnutzer mit Passwort-Hash für 'password'
    INSERT INTO auth_users (email, password_hash, display_name, email_verified)
    VALUES (
      'demo@hometrack.local',
      '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H3Q6fQ5J8dJQ1W7p1n4JtGjYc4WS', -- bcrypt hash von 'password'
      'Demo Nutzer',
      true
    );
  END IF;
END $$;

-- ============================================================
-- ENDE
-- ============================================================
COMMENT ON TABLE verbrauchstyp IS 'Verbrauchskategorien (Strom, Gas, Wasser, etc.)';
COMMENT ON TABLE verbrauchsstelle IS 'Zaehler/Verbrauchsstellen';
COMMENT ON TABLE anbieter IS 'Energieanbieter';
COMMENT ON TABLE vertrag IS 'Verтраege mit Anbietern';
COMMENT ON TABLE preisperiode IS 'Preisinformationen pro Vertrag';
COMMENT ON TABLE verbrauchswert IS 'Zaehlerstaende und Verbrauchsdaten';
COMMENT ON TABLE user_settings IS 'Nutzerpraeferenzen';
COMMENT ON TABLE handwerker IS 'Handwerker-Daten';
COMMENT ON TABLE handwerkerrechnung IS 'Rechnungen von Handwerkern';

-- Handwerker & Handwerkerrechnungen
-- Für die Verwaltung von Handwerkerleistungen und steuerliche Absetzbarkeit (§35a EStG)

-- ============================================================
-- 1. HANDWERKER (Kontakte)
-- ============================================================
CREATE TABLE handwerker (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID         NOT NULL,
  name            TEXT         NOT NULL,
  gewerk          TEXT,
  strasse         TEXT,
  hausnummer      TEXT,
  plz             TEXT,
  ort             TEXT,
  telefon         TEXT,
  email           TEXT,
  webseite        TEXT,
  notizen         TEXT,
  erstellt_am     TIMESTAMPTZ  DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ  DEFAULT now() NOT NULL
);

ALTER TABLE handwerker
  ADD CONSTRAINT fk_handwerker_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- 2. HANDWERKERRECHNUNG (Rechnungen)
-- ============================================================
CREATE TABLE handwerkerrechnung (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID          NOT NULL,
  handwerker_id      UUID          REFERENCES handwerker(id) ON DELETE SET NULL,
  verbrauchstyp_id   UUID          REFERENCES verbrauchstyp(id) ON DELETE SET NULL,
  datum              DATE          NOT NULL,
  beschreibung       TEXT          NOT NULL,
  kategorie          TEXT,
  betrag_gesamt      NUMERIC(10,2) NOT NULL,
  betrag_lohn        NUMERIC(10,2) NOT NULL DEFAULT 0,
  betrag_material    NUMERIC(10,2) NOT NULL DEFAULT 0,
  betrag_fahrtkosten NUMERIC(10,2) NOT NULL DEFAULT 0,
  zahlungsart        TEXT          NOT NULL DEFAULT 'ueberweisung',
  rechnungsnummer    TEXT,
  dokument_url       TEXT,
  ist_absetzbar      BOOLEAN       DEFAULT true NOT NULL,
  notizen            TEXT,
  erstellt_am        TIMESTAMPTZ   DEFAULT now() NOT NULL,
  aktualisiert_am    TIMESTAMPTZ   DEFAULT now() NOT NULL
);

ALTER TABLE handwerkerrechnung
  ADD CONSTRAINT fk_handwerkerrechnung_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- INDIZES
-- ============================================================
CREATE INDEX idx_handwerkerrechnung_datum      ON handwerkerrechnung(user_id, datum DESC);
CREATE INDEX idx_handwerkerrechnung_handwerker ON handwerkerrechnung(handwerker_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE TRIGGER trg_handwerker_updated
  BEFORE UPDATE ON handwerker
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_handwerkerrechnung_updated
  BEFORE UPDATE ON handwerkerrechnung
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

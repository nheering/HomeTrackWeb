-- HomeTrack Datenbankschema
-- Hasura Migration: 1_init

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. VERBRAUCHSTYP
-- ============================================================
CREATE TABLE verbrauchstyp (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID         NOT NULL,
  name         TEXT         NOT NULL,
  einheit      TEXT,
  symbol       TEXT,
  farbe        TEXT         DEFAULT '#f97316',
  bild_url     TEXT,
  erstellt_am  TIMESTAMPTZ  DEFAULT now() NOT NULL,
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. VERBRAUCHSSTELLE
-- ============================================================
CREATE TABLE verbrauchsstelle (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID         NOT NULL,
  verbrauchstyp_id UUID         NOT NULL REFERENCES verbrauchstyp(id) ON DELETE CASCADE,
  bezeichnung      TEXT         NOT NULL,
  zaehler_nummer   TEXT,
  zaehler_typ      TEXT,
  einbau_datum     DATE,
  standort         TEXT,
  marke_hersteller TEXT,
  ist_aktiv        BOOLEAN      DEFAULT true NOT NULL,
  ist_standard     BOOLEAN      DEFAULT false NOT NULL,
  notizen          TEXT,
  erstellt_am      TIMESTAMPTZ  DEFAULT now() NOT NULL,
  aktualisiert_am  TIMESTAMPTZ  DEFAULT now() NOT NULL
);

-- Sicherstellen: max. 1 Standardstelle je Verbrauchstyp (partial unique index)
CREATE UNIQUE INDEX uix_standard_stelle_per_typ
  ON verbrauchsstelle(verbrauchstyp_id)
  WHERE ist_standard = true;

-- ============================================================
-- 3. ANBIETER
-- ============================================================
CREATE TABLE anbieter (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID         NOT NULL,
  verbrauchstyp_id UUID         REFERENCES verbrauchstyp(id) ON DELETE SET NULL,
  name             TEXT         NOT NULL,
  strasse          TEXT,
  hausnummer       TEXT,
  plz              TEXT,
  ort              TEXT,
  telefon          TEXT,
  email            TEXT,
  webseite         TEXT,
  kundennummer     TEXT,
  notizen          TEXT,
  erstellt_am      TIMESTAMPTZ  DEFAULT now() NOT NULL,
  aktualisiert_am  TIMESTAMPTZ  DEFAULT now() NOT NULL
);

-- ============================================================
-- 4. VERTRAG
-- ============================================================
CREATE TABLE vertrag (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID         NOT NULL,
  anbieter_id       UUID         REFERENCES anbieter(id) ON DELETE SET NULL,
  verbrauchstyp_id  UUID         REFERENCES verbrauchstyp(id) ON DELETE SET NULL,
  bezeichnung       TEXT         NOT NULL,
  vertragsnummer    TEXT,
  beginn_datum      DATE         NOT NULL,
  ende_datum        DATE,
  kuendigungsfrist  INTEGER,
  zahlungsintervall TEXT,
  notizen           TEXT,
  erstellt_am       TIMESTAMPTZ  DEFAULT now() NOT NULL,
  aktualisiert_am   TIMESTAMPTZ  DEFAULT now() NOT NULL
);

-- Constraint: je Anbieter+Verbrauchstyp max. 1 aktiver Vertrag (ende_datum IS NULL)
CREATE UNIQUE INDEX uix_aktiver_vertrag
  ON vertrag(anbieter_id, verbrauchstyp_id)
  WHERE ende_datum IS NULL;

-- ============================================================
-- 5. PREISPERIODE
-- ============================================================
CREATE TABLE preisperiode (
  id                      UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID         NOT NULL,
  vertrag_id              UUID         NOT NULL REFERENCES vertrag(id) ON DELETE CASCADE,
  gueltig_ab              DATE         NOT NULL,
  gueltig_bis             DATE,
  grundpreis              NUMERIC(10,4) NOT NULL DEFAULT 0,
  grundpreis_intervall    TEXT          DEFAULT 'monatlich',
  einheitspreis           NUMERIC(10,6) NOT NULL DEFAULT 0,
  steuer                  NUMERIC(5,2)  DEFAULT 19.0,
  notizen                 TEXT,
  erstellt_am             TIMESTAMPTZ   DEFAULT now() NOT NULL,
  aktualisiert_am         TIMESTAMPTZ   DEFAULT now() NOT NULL
);

-- ============================================================
-- 6. VERBRAUCHSWERT
-- ============================================================
CREATE TABLE verbrauchswert (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID          NOT NULL,
  verbrauchstyp_id   UUID          NOT NULL REFERENCES verbrauchstyp(id) ON DELETE CASCADE,
  verbrauchsstelle_id UUID          REFERENCES verbrauchsstelle(id) ON DELETE SET NULL,
  datum              DATE          NOT NULL,
  zaehlerstand       NUMERIC(14,3) NOT NULL,
  verbrauch          NUMERIC(14,3),
  bild_url           TEXT,
  notizen            TEXT,
  erstellt_am        TIMESTAMPTZ   DEFAULT now() NOT NULL,
  aktualisiert_am    TIMESTAMPTZ   DEFAULT now() NOT NULL
);

-- ============================================================
-- INDIZES für Performance
-- ============================================================
CREATE INDEX idx_verbrauchswert_typ_datum    ON verbrauchswert(verbrauchstyp_id, datum DESC);
CREATE INDEX idx_verbrauchswert_stelle_datum ON verbrauchswert(verbrauchsstelle_id, datum DESC);
CREATE INDEX idx_verbrauchsstelle_typ        ON verbrauchsstelle(verbrauchstyp_id);
CREATE INDEX idx_vertrag_anbieter            ON vertrag(anbieter_id);
CREATE INDEX idx_preisperiode_vertrag        ON preisperiode(vertrag_id, gueltig_ab DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Nutzer sehen nur eigene Daten
-- ============================================================
ALTER TABLE verbrauchstyp      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbrauchsstelle   ENABLE ROW LEVEL SECURITY;
ALTER TABLE anbieter           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertrag            ENABLE ROW LEVEL SECURITY;
ALTER TABLE preisperiode       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verbrauchswert     ENABLE ROW LEVEL SECURITY;

-- Policies (Hasura verwendet auth.uid() via x-hasura-user-id)
CREATE POLICY "user_owns_verbrauchstyp"    ON verbrauchstyp    USING (user_id = auth.uid());
CREATE POLICY "user_owns_verbrauchsstelle" ON verbrauchsstelle  USING (user_id = auth.uid());
CREATE POLICY "user_owns_anbieter"         ON anbieter          USING (user_id = auth.uid());
CREATE POLICY "user_owns_vertrag"          ON vertrag           USING (user_id = auth.uid());
CREATE POLICY "user_owns_preisperiode"     ON preisperiode      USING (user_id = auth.uid());
CREATE POLICY "user_owns_verbrauchswert"   ON verbrauchswert    USING (user_id = auth.uid());

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verbrauchstyp_updated    BEFORE UPDATE ON verbrauchstyp    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_verbrauchsstelle_updated BEFORE UPDATE ON verbrauchsstelle  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_anbieter_updated         BEFORE UPDATE ON anbieter          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vertrag_updated          BEFORE UPDATE ON vertrag           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_preisperiode_updated     BEFORE UPDATE ON preisperiode      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_verbrauchswert_updated   BEFORE UPDATE ON verbrauchswert    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

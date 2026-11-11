-- HomeTrack Beispieldaten
-- =======================
-- 
-- Diese Datei wird NACH init.sql ausgefuehrt und fuellt die Datenbank
-- mit Beispieldaten fuer die lokale Entwicklung.
-- 
-- WICHTIG: Diese Daten werden nur beim ERSTEN Start des Containers
-- eingefuegt (wenn die Tabellen noch leer sind).
--
-- Um die Daten neu zu laden, fuehre manuell aus:
--   docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db -f /docker-entrypoint-initdb.d/02-seed.sql

-- Pruefe ob schon Daten existieren
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth_users WHERE email = 'demo@hometrack.local') THEN
    RAISE NOTICE 'Beispieldaten bereits vorhanden, ueberspringe Seed.';
    RETURN;
  END IF;

  -- ============================================================
  -- Test-Nutzer
  -- ============================================================
  -- Nutzer wurde bereits in init.sql erstellt
  -- Hier nur weitere Nutzer falls benoetigt

  -- ============================================================
  -- VERBRAUCHSTYPEN
  -- ============================================================
  INSERT INTO verbrauchstyp (user_id, name, einheit, symbol, farbe)
  VALUES
    -- Strom
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'Strom', 'kWh', '⚡', '#fbbf24'),
    -- Gas
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'Gas', 'm³', '🔥', '#f97316'),
    -- Wasser
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'Wasser', 'm³', '💧', '#3b82f6'),
    -- Heizöl
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'Heizöl', 'L', '⛽', '#1f2937'),
    -- Fernwärme
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'Fernwärme', 'kWh', '🌡️', '#ec4899')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- VERBRAUCHSSTELLEN
  -- ============================================================
  INSERT INTO verbrauchsstelle (user_id, verbrauchstyp_id, bezeichnung, zaehler_nummer, zaehler_typ, standort, ist_aktiv, ist_standard)
  VALUES
    -- Strom
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Hauptzähler Strom',
      '123456789',
      'Digital',
      'Keller',
      true,
      true
    ),
    -- Gas
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Gaszähler',
      '987654321',
      'Balgen',
      'Keller',
      true,
      true
    ),
    -- Wasser
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Wasser' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Wasserzähler',
      '555555555',
      'Digital',
      'Keller',
      true,
      true
    )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- ANBIETER
  -- ============================================================
  INSERT INTO anbieter (user_id, verbrauchstyp_id, name, strasse, hausnummer, plz, ort, telefon, email, webseite, kundennummer)
  VALUES
    -- Stromanbieter
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Stadtwerke Musterstadt',
      'Hauptstraße',
      '1',
      '12345',
      'Musterstadt',
      '+49 123 456789',
      'service@stadtwerke-musterstadt.de',
      'https://www.stadtwerke-musterstadt.de',
      'K12345678'
    ),
    -- Gasanbieter
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'E.ON Gas',
      'Industriestraße',
      '10',
      '54321',
      'Musterstadt',
      '+49 123 987654',
      'info@eon-gas.de',
      'https://www.eon.de',
      'G78901234'
    ),
    -- Wasserversorger
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Wasser' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Wasserwerk Musterstadt',
      'Bahnhofstraße',
      '42',
      '12345',
      'Musterstadt',
      '+49 123 123456',
      'kontakt@wasserwerk-musterstadt.de',
      'https://www.wasserwerk-musterstadt.de',
      'W99999999'
    )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- VERTRÄGE
  -- ============================================================
  INSERT INTO vertrag (user_id, anbieter_id, verbrauchstyp_id, bezeichnung, vertragsnummer, beginn_datum, ende_datum, kuendigungsfrist, zahlungsintervall)
  VALUES
    -- Stromvertrag
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM anbieter WHERE name = 'Stadtwerke Musterstadt' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Strom Grundversorgung',
      'SV-2024-12345',
      '2024-01-01',
      NULL,
      30,
      'monatlich'
    ),
    -- Gasvertrag
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM anbieter WHERE name = 'E.ON Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchstyp WHERE name = 'Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Gas Sondervertrag',
      'EON-2024-67890',
      '2024-01-01',
      NULL,
      90,
      'monatlich'
    ),
    -- Wasservertrag
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM anbieter WHERE name = 'Wasserwerk Musterstadt' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchstyp WHERE name = 'Wasser' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      'Wasser Grundversorgung',
      'WW-2024-11111',
      '2024-01-01',
      NULL,
      NULL,
      'jährlich'
    )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- PREISPERIODEN
  -- ============================================================
  INSERT INTO preisperiode (user_id, vertrag_id, gueltig_ab, gueltig_bis, grundpreis, grundpreis_intervall, einheitspreis, steuer)
  VALUES
    -- Strom Preise
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM vertrag WHERE bezeichnung = 'Strom Grundversorgung' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-01-01',
      '2024-12-31',
      12.95,
      'monatlich',
      0.345,
      19.0
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM vertrag WHERE bezeichnung = 'Strom Grundversorgung' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2025-01-01',
      NULL,
      14.95,
      'monatlich',
      0.375,
      19.0
    ),
    -- Gas Preise
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM vertrag WHERE bezeichnung = 'Gas Sondervertrag' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-01-01',
      '2024-12-31',
      8.50,
      'monatlich',
      0.125,
      19.0
    ),
    -- Wasser Preise
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM vertrag WHERE bezeichnung = 'Wasser Grundversorgung' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-01-01',
      NULL,
      2.50,
      'monatlich',
      2.35,
      7.0
    );

  -- ============================================================
  -- VERBRAUCHSWERTE (Beispieldaten fuer die letzten Monate)
  -- ============================================================
  INSERT INTO verbrauchswert (user_id, verbrauchstyp_id, verbrauchsstelle_id, datum, zaehlerstand, verbrauch)
  VALUES
    -- Stromverbrauch (monatlich)
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Hauptzähler Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-10-01',
      45000.500,
      NULL
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Hauptzähler Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-11-01',
      45800.250,
      800.000
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Hauptzähler Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-12-01',
      46550.100,
      750.000
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Hauptzähler Strom' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2025-01-01',
      47200.450,
      650.000
    ),
    
    -- Gasverbrauch (monatlich)
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Gaszähler' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-10-01',
      12500.000,
      NULL
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Gaszähler' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-11-01',
      12850.150,
      350.000
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Gas' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Gaszähler' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-12-01',
      13200.300,
      350.000
    ),
    
    -- Wasserverbrauch (monatlich)
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Wasser' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Wasserzähler' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-10-01',
      1500.500,
      NULL
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Wasser' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Wasserzähler' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-11-01',
      1525.750,
      25.000
    ),
    (
      (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'),
      (SELECT id FROM verbrauchstyp WHERE name = 'Wasser' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      (SELECT id FROM verbrauchsstelle WHERE bezeichnung = 'Wasserzähler' AND user_id = (SELECT id FROM auth_users WHERE email = 'demo@hometrack.local')),
      '2024-12-01',
      1550.250,
      25.000
    )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- USER SETTINGS
  -- ============================================================
  INSERT INTO user_settings (user_id, key, value)
  VALUES
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'navigation', '{"position": "bottom"}'),
    ((SELECT id FROM auth_users WHERE email = 'demo@hometrack.local'), 'theme', '{"mode": "system"}')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Beispieldaten erfolgreich eingefuegt!';
END $$;

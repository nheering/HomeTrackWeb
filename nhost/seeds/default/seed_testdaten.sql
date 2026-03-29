-- ============================================================
-- HomeTrack Testdaten
-- User: bac78a82-ab12-42a5-a981-d7ab46c45cdd
-- Zeitraum: Jan 2024 – Mär 2026
-- ============================================================

DO $$
DECLARE
  v_user_id       UUID := 'bac78a82-ab12-42a5-a981-d7ab46c45cdd';

  -- Verbrauchstypen (Strom + Wasser existieren bereits)
  v_typ_strom     UUID := '92272cd9-8054-41df-b066-2ff5920ac66b';
  v_typ_wasser    UUID := 'cb91a9e7-6a9d-4314-b15d-9ee5e06541ee';
  v_typ_gas       UUID;

  -- Verbrauchsstellen
  v_stelle_strom  UUID := 'd4f7f6d2-aa26-4205-91eb-ba622349d281';
  v_stelle_wasser UUID;
  v_stelle_gas    UUID;

  -- Anbieter
  v_anb_strom     UUID := '25a4a052-60d0-4f4a-9585-171573689048';
  v_anb_wasser    UUID := 'c83c2a10-0f80-4c0a-8883-8fecce76a2d5';
  v_anb_gas       UUID;

  -- Verträge
  v_vertrag_strom UUID := '4c46364d-ad75-4e0c-b7cc-d6e0e6e622d0';
  v_vertrag_wasser UUID;
  v_vertrag_gas   UUID;

  -- Preisperioden
  v_pp_strom      UUID := '8309bd12-e7c0-49cd-9fb9-f221bbcdbbf5';
  v_pp_wasser     UUID;
  v_pp_gas_2024   UUID;
  v_pp_gas_2025   UUID;

BEGIN

  -- ============================================================
  -- GAS: Verbrauchstyp
  -- ============================================================
  INSERT INTO verbrauchstyp (id, user_id, name, einheit, symbol, farbe)
  VALUES (gen_random_uuid(), v_user_id, 'Gas', 'm³', '🔥', '#ef4444')
  RETURNING id INTO v_typ_gas;

  -- ============================================================
  -- VERBRAUCHSSTELLEN
  -- ============================================================

  -- Wasser: Hauptanschluss (ist_standard = true)
  INSERT INTO verbrauchsstelle (id, user_id, verbrauchstyp_id, bezeichnung, zaehler_nummer, standort, ist_aktiv, ist_standard)
  VALUES (gen_random_uuid(), v_user_id, v_typ_wasser, 'Hauptanschluss', 'W-2024-00471', 'Keller', true, true)
  RETURNING id INTO v_stelle_wasser;

  -- Gas: Hauptzähler (ist_standard = true)
  INSERT INTO verbrauchsstelle (id, user_id, verbrauchstyp_id, bezeichnung, zaehler_nummer, standort, ist_aktiv, ist_standard)
  VALUES (gen_random_uuid(), v_user_id, v_typ_gas, 'Hauptzähler', 'G-2022-01834', 'Keller', true, true)
  RETURNING id INTO v_stelle_gas;

  -- ============================================================
  -- ANBIETER: Gas
  -- ============================================================
  INSERT INTO anbieter (id, user_id, verbrauchstyp_id, name, strasse, hausnummer, plz, ort, telefon, webseite, kundennummer)
  VALUES (gen_random_uuid(), v_user_id, v_typ_gas,
    'Stadtwerke Wuppertal Gas', 'Bromberger Str.', '39–41', '42281', 'Wuppertal',
    '0202 569-0', 'www.wsw-energie-wasser.de', 'KD-G-088142')
  RETURNING id INTO v_anb_gas;

  -- Kundennummer für Wasser-Anbieter nachtragen
  UPDATE anbieter SET kundennummer = 'KD-W-034519', telefon = '0202 569-0',
    webseite = 'www.wsw-energie-wasser.de', strasse = 'Bromberger Str.', hausnummer = '39–41',
    plz = '42281', ort = 'Wuppertal'
  WHERE id = v_anb_wasser;

  -- ============================================================
  -- VERTRÄGE
  -- ============================================================

  -- Wasser
  INSERT INTO vertrag (id, user_id, anbieter_id, verbrauchstyp_id, bezeichnung, vertragsnummer, beginn_datum, zahlungsintervall)
  VALUES (gen_random_uuid(), v_user_id, v_anb_wasser, v_typ_wasser,
    'Wasserversorgung Haushalt', 'VT-W-2019-4421', '2019-01-01', 'monatlich')
  RETURNING id INTO v_vertrag_wasser;

  -- Gas
  INSERT INTO vertrag (id, user_id, anbieter_id, verbrauchstyp_id, bezeichnung, vertragsnummer, beginn_datum, ende_datum, kuendigungsfrist, zahlungsintervall)
  VALUES (gen_random_uuid(), v_user_id, v_anb_gas, v_typ_gas,
    'Gastarif Basis 2022–2024', 'VT-G-2022-8814', '2022-01-01', '2024-12-31', 3, 'monatlich')
  RETURNING id INTO v_vertrag_gas;

  -- Gas ab 2025 (neuer Vertrag nach Preissenkung)
  -- Wir brauchen einen neuen Vertrag für 2025 (alter ist beendet)
  -- Aber der unique index verhindert 2 aktive Verträge für gleichen Anbieter+Typ
  -- Also nutzen wir denselben Vertrag für beide Preisperioden

  -- ============================================================
  -- PREISPERIODEN
  -- ============================================================

  -- Strom: Preisperiode 2024 (vor dem aktuellen Vertrag, separater Altvertrag nötig)
  -- Strom-Vertrag beginnt erst 2025-01-01, daher keine 2024-Kosten für Strom

  -- Wasser: 2,80 €/m³ netto + 7% MwSt (Grundpreis 8,50€/Monat)
  INSERT INTO preisperiode (id, user_id, vertrag_id, gueltig_ab, grundpreis, grundpreis_intervall, einheitspreis, steuer)
  VALUES (gen_random_uuid(), v_user_id, v_vertrag_wasser, '2019-01-01', 8.5, 'monatlich', 2.80, 7.0)
  RETURNING id INTO v_pp_wasser;

  -- Gas 2024: 0,95 €/m³ netto + 19% MwSt (nach Energiekrise-Hochpreisphase, Grundpreis 12€/Monat)
  INSERT INTO preisperiode (id, user_id, vertrag_id, gueltig_ab, gueltig_bis, grundpreis, grundpreis_intervall, einheitspreis, steuer, notizen)
  VALUES (gen_random_uuid(), v_user_id, v_vertrag_gas, '2022-01-01', '2024-12-31', 12.0, 'monatlich', 0.95, 19.0, 'Preis nach Energiekrise-Erhöhung')
  RETURNING id INTO v_pp_gas_2024;

  -- Gas 2025: neuer Tarif (Preissenkung), separater Vertrag benötigt
  -- Wir legen einen weiteren aktiven Vertrag für Gas ab 2025 an
  INSERT INTO vertrag (id, user_id, anbieter_id, verbrauchstyp_id, bezeichnung, vertragsnummer, beginn_datum, kuendigungsfrist, zahlungsintervall)
  VALUES (gen_random_uuid(), v_user_id, v_anb_gas, v_typ_gas,
    'Gastarif Smart 2025', 'VT-G-2025-1156', '2025-01-01', 3, 'monatlich')
  RETURNING id INTO v_vertrag_gas; -- überschreibt v_vertrag_gas mit dem neuen Vertrag

  INSERT INTO preisperiode (id, user_id, vertrag_id, gueltig_ab, grundpreis, grundpreis_intervall, einheitspreis, steuer, notizen)
  VALUES (gen_random_uuid(), v_user_id, v_vertrag_gas, '2025-01-01', 10.50, 'monatlich', 0.82, 19.0, 'Günstigerer Tarif ab 2025')
  RETURNING id INTO v_pp_gas_2025;

  -- ============================================================
  -- VERBRAUCHSWERTE: STROM (Fortsetzung ab Apr 2025)
  -- ============================================================
  -- Bestehend: Jan 500 | Feb 630 (+130) | Mär 715 (+85)
  -- Saisonales Muster: Frühjahr/Sommer weniger, Herbst/Winter mehr

  INSERT INTO verbrauchswert (user_id, verbrauchstyp_id, verbrauchsstelle_id, datum, zaehlerstand, verbrauch) VALUES
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-04-01', 790,   75),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-05-01', 855,   65),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-06-01', 908,   53),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-07-01', 957,   49),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-08-01', 1007,  50),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-09-01', 1073,  66),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-10-01', 1160,  87),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-11-01', 1265, 105),
    (v_user_id, v_typ_strom, v_stelle_strom, '2025-12-01', 1400, 135),
    (v_user_id, v_typ_strom, v_stelle_strom, '2026-01-01', 1548, 148),
    (v_user_id, v_typ_strom, v_stelle_strom, '2026-02-01', 1683, 135),
    (v_user_id, v_typ_strom, v_stelle_strom, '2026-03-01', 1788,  105);

  -- ============================================================
  -- VERBRAUCHSWERTE: WASSER (Jan 2024 – Mär 2026)
  -- ============================================================
  -- 2-Personen-Haushalt: ~100 m³/Jahr, mehr im Sommer (Garten)
  -- Startzähler: 1.247 m³

  INSERT INTO verbrauchswert (user_id, verbrauchstyp_id, verbrauchsstelle_id, datum, zaehlerstand, verbrauch) VALUES
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-01-01', 1247,  0),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-02-01', 1255,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-03-01', 1263,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-04-01', 1272,  9),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-05-01', 1283, 11),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-06-01', 1295, 12),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-07-01', 1307, 12),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-08-01', 1319, 12),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-09-01', 1329, 10),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-10-01', 1338,  9),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-11-01', 1346,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2024-12-01', 1354,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-01-01', 1362,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-02-01', 1369,  7),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-03-01', 1378,  9),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-04-01', 1387,  9),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-05-01', 1399, 12),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-06-01', 1411, 12),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-07-01', 1424, 13),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-08-01', 1436, 12),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-09-01', 1446, 10),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-10-01', 1455,  9),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-11-01', 1463,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2025-12-01', 1471,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2026-01-01', 1479,  8),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2026-02-01', 1486,  7),
    (v_user_id, v_typ_wasser, v_stelle_wasser, '2026-03-01', 1495,  9);

  -- ============================================================
  -- VERBRAUCHSWERTE: GAS (Jan 2024 – Mär 2026)
  -- ============================================================
  -- Gasheizung, 70m²-Wohnung: ~700 m³/Jahr, stark saisonal
  -- Sommer fast 0, Winter Jan/Feb bis 150 m³/Monat
  -- Startzähler: 4.820 m³ (Bestandszähler)

  INSERT INTO verbrauchswert (user_id, verbrauchstyp_id, verbrauchsstelle_id, datum, zaehlerstand, verbrauch) VALUES
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-01-01', 4820,   0),   -- Erstzählerstand
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-02-01', 4965, 145),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-03-01', 5090, 125),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-04-01', 5170,  80),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-05-01', 5213,  43),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-06-01', 5225,  12),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-07-01', 5229,   4),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-08-01', 5232,   3),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-09-01', 5238,   6),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-10-01', 5280,  42),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-11-01', 5368,  88),
    (v_user_id, v_typ_gas, v_stelle_gas, '2024-12-01', 5498, 130),
    -- 2025: neuer Tarif
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-01-01', 5648, 150),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-02-01', 5788, 140),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-03-01', 5898, 110),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-04-01', 5960,  62),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-05-01', 5992,  32),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-06-01', 6002,  10),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-07-01', 6006,   4),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-08-01', 6009,   3),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-09-01', 6015,   6),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-10-01', 6058,  43),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-11-01', 6148,  90),
    (v_user_id, v_typ_gas, v_stelle_gas, '2025-12-01', 6280, 132),
    (v_user_id, v_typ_gas, v_stelle_gas, '2026-01-01', 6433, 153),
    (v_user_id, v_typ_gas, v_stelle_gas, '2026-02-01', 6568, 135),
    (v_user_id, v_typ_gas, v_stelle_gas, '2026-03-01', 6658,  90);

END $$;

#!/usr/bin/env node
/**
 * Seed-Script: Demodaten für HomeTrack (Strom + Gas, 2 Jahre)
 *
 * Verwendung:
 *   node scripts/seed-demo-data.mjs
 *
 * Voraussetzung: nHost lokal läuft (nhost dev)
 * Nutzt den Admin-Secret um Daten direkt einzufügen.
 */

const HASURA_URL = 'https://local.hasura.nhost.run/v1/graphql';
const ADMIN_SECRET = 'nhost-admin-secret';

// Wir brauchen eine user_id – hole den ersten registrierten User
async function gql(query, variables = {}) {
  const res = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Fehler:', JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

// ─── User-ID ermitteln ───────────────────────────────────────
async function getUserId() {
  const data = await gql(`query { users(limit: 1) { id displayName } }`);
  if (!data.users?.length) {
    throw new Error('Kein User gefunden! Bitte erst in der App registrieren/einloggen.');
  }
  console.log(`Verwende User: ${data.users[0].displayName || data.users[0].id}`);
  return data.users[0].id;
}

// ─── Verbrauchstyp anlegen ───────────────────────────────────
async function createVerbrauchstyp(obj) {
  const data = await gql(
    `mutation($obj: verbrauchstyp_insert_input!) {
      insert_verbrauchstyp_one(object: $obj) { id name }
    }`,
    { obj }
  );
  console.log(`  Verbrauchstyp: ${data.insert_verbrauchstyp_one.name}`);
  return data.insert_verbrauchstyp_one.id;
}

// ─── Verbrauchsstelle anlegen ────────────────────────────────
async function createVerbrauchsstelle(obj) {
  const data = await gql(
    `mutation($obj: verbrauchsstelle_insert_input!) {
      insert_verbrauchsstelle_one(object: $obj) { id bezeichnung }
    }`,
    { obj }
  );
  console.log(`  Verbrauchsstelle: ${data.insert_verbrauchsstelle_one.bezeichnung}`);
  return data.insert_verbrauchsstelle_one.id;
}

// ─── Anbieter anlegen ────────────────────────────────────────
async function createAnbieter(obj) {
  const data = await gql(
    `mutation($obj: anbieter_insert_input!) {
      insert_anbieter_one(object: $obj) { id name }
    }`,
    { obj }
  );
  console.log(`  Anbieter: ${data.insert_anbieter_one.name}`);
  return data.insert_anbieter_one.id;
}

// ─── Vertrag anlegen ─────────────────────────────────────────
async function createVertrag(obj) {
  const data = await gql(
    `mutation($obj: vertrag_insert_input!) {
      insert_vertrag_one(object: $obj) { id bezeichnung }
    }`,
    { obj }
  );
  console.log(`  Vertrag: ${data.insert_vertrag_one.bezeichnung}`);
  return data.insert_vertrag_one.id;
}

// ─── Preisperiode anlegen ────────────────────────────────────
async function createPreisperiode(obj) {
  const data = await gql(
    `mutation($obj: preisperiode_insert_input!) {
      insert_preisperiode_one(object: $obj) { id gueltig_ab }
    }`,
    { obj }
  );
  console.log(`  Preisperiode ab: ${data.insert_preisperiode_one.gueltig_ab}`);
  return data.insert_preisperiode_one.id;
}

// ─── Verbrauchswerte bulk-insert ─────────────────────────────
async function insertVerbrauchswerte(objects) {
  const data = await gql(
    `mutation($objects: [verbrauchswert_insert_input!]!) {
      insert_verbrauchswert(objects: $objects) { affected_rows }
    }`,
    { objects }
  );
  console.log(`  ${data.insert_verbrauchswert.affected_rows} Verbrauchswerte eingefügt`);
}

// ─── Verbrauchswerte generieren ──────────────────────────────
function generateVerbrauchswerte({ userId, typId, stelleId, startZaehlerstand, months, avgMonthly, seasonalFn }) {
  const values = [];
  let zaehlerstand = startZaehlerstand;

  // Startdatum: vor 24 Monaten, jeweils zum ~1. des Monats
  const startDate = new Date(2024, 3, 1); // April 2024

  for (let i = 0; i <= months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    // Leichte Variation beim Tag (1-5)
    date.setDate(1 + Math.floor(Math.random() * 5));

    const datum = date.toISOString().split('T')[0];

    // Verbrauch mit saisonaler Schwankung
    const month = date.getMonth(); // 0-11
    const seasonal = seasonalFn(month);
    const variation = 0.8 + Math.random() * 0.4; // ±20%
    const verbrauch = i === 0 ? 0 : Math.round(avgMonthly * seasonal * variation);

    zaehlerstand += verbrauch;

    values.push({
      user_id: userId,
      verbrauchstyp_id: typId,
      verbrauchsstelle_id: stelleId,
      datum,
      zaehlerstand,
      verbrauch,
    });
  }

  return values;
}

// ─── Saisonale Funktionen ────────────────────────────────────
// Strom: Höher im Winter (Beleuchtung, Heizlüfter), niedriger im Sommer
function stromSeasonal(month) {
  const factors = [1.3, 1.25, 1.1, 0.9, 0.8, 0.7, 0.7, 0.75, 0.85, 1.0, 1.15, 1.3];
  return factors[month];
}

// Gas: Stark saisonal – Heizung im Winter, kaum im Sommer
function gasSeasonal(month) {
  const factors = [1.8, 1.6, 1.2, 0.6, 0.2, 0.05, 0.05, 0.05, 0.3, 0.8, 1.3, 1.7];
  return factors[month];
}

// ─── Hauptprogramm ───────────────────────────────────────────
async function main() {
  console.log('🏠 HomeTrack Demo-Daten Seed\n');

  const userId = await getUserId();

  // ── STROM ──────────────────────────────────────────────────
  console.log('\n⚡ Strom anlegen...');
  const stromTypId = await createVerbrauchstyp({
    user_id: userId,
    name: 'Strom',
    einheit: 'kWh',
    symbol: '⚡',
    farbe: '#f59e0b', // amber
  });

  const stromStelleId = await createVerbrauchsstelle({
    user_id: userId,
    verbrauchstyp_id: stromTypId,
    bezeichnung: 'Hauptzähler',
    zaehler_nummer: 'DE-STR-2024-001',
    zaehler_typ: 'Drehstromzähler',
    standort: 'Keller, Sicherungskasten',
    ist_aktiv: true,
    ist_standard: true,
  });

  const stromAnbieterId = await createAnbieter({
    user_id: userId,
    verbrauchstyp_id: stromTypId,
    name: 'Stadtwerke Musterstadt',
    kundennummer: 'SW-2024-87654',
    email: 'service@stadtwerke-musterstadt.de',
    telefon: '0800 123 4567',
    webseite: 'https://www.stadtwerke-musterstadt.de',
  });

  const stromVertragId = await createVertrag({
    user_id: userId,
    anbieter_id: stromAnbieterId,
    verbrauchstyp_id: stromTypId,
    bezeichnung: 'Strom Basis 2024',
    vertragsnummer: 'V-STR-2024-001',
    beginn_datum: '2024-04-01',
    zahlungsintervall: 'monatlich',
  });

  await createPreisperiode({
    user_id: userId,
    vertrag_id: stromVertragId,
    gueltig_ab: '2024-04-01',
    gueltig_bis: '2025-03-31',
    grundpreis: 12.50,
    grundpreis_intervall: 'monatlich',
    einheitspreis: 0.32,
    steuer: 19,
  });

  await createPreisperiode({
    user_id: userId,
    vertrag_id: stromVertragId,
    gueltig_ab: '2025-04-01',
    grundpreis: 13.00,
    grundpreis_intervall: 'monatlich',
    einheitspreis: 0.34,
    steuer: 19,
  });

  // Strom-Verbrauchswerte: ~280 kWh/Monat Durchschnitt
  const stromWerte = generateVerbrauchswerte({
    userId,
    typId: stromTypId,
    stelleId: stromStelleId,
    startZaehlerstand: 45230,
    months: 24,
    avgMonthly: 280,
    seasonalFn: stromSeasonal,
  });
  await insertVerbrauchswerte(stromWerte);

  // ── GAS ────────────────────────────────────────────────────
  console.log('\n🔥 Gas anlegen...');
  const gasTypId = await createVerbrauchstyp({
    user_id: userId,
    name: 'Gas',
    einheit: 'm³',
    symbol: '🔥',
    farbe: '#3b82f6', // blue
  });

  const gasStelleId = await createVerbrauchsstelle({
    user_id: userId,
    verbrauchstyp_id: gasTypId,
    bezeichnung: 'Gaszähler Keller',
    zaehler_nummer: 'DE-GAS-2024-042',
    zaehler_typ: 'Balgenzähler',
    standort: 'Keller, neben Heizung',
    ist_aktiv: true,
    ist_standard: true,
  });

  const gasAnbieterId = await createAnbieter({
    user_id: userId,
    verbrauchstyp_id: gasTypId,
    name: 'EnergiePlus GmbH',
    kundennummer: 'EP-GAS-55123',
    email: 'kundenservice@energieplus.de',
    telefon: '0800 765 4321',
    webseite: 'https://www.energieplus.de',
  });

  const gasVertragId = await createVertrag({
    user_id: userId,
    anbieter_id: gasAnbieterId,
    verbrauchstyp_id: gasTypId,
    bezeichnung: 'Gas Komfort 2024',
    vertragsnummer: 'V-GAS-2024-003',
    beginn_datum: '2024-04-01',
    zahlungsintervall: 'monatlich',
  });

  await createPreisperiode({
    user_id: userId,
    vertrag_id: gasVertragId,
    gueltig_ab: '2024-04-01',
    gueltig_bis: '2025-03-31',
    grundpreis: 15.00,
    grundpreis_intervall: 'monatlich',
    einheitspreis: 0.12,
    steuer: 19,
  });

  await createPreisperiode({
    user_id: userId,
    vertrag_id: gasVertragId,
    gueltig_ab: '2025-04-01',
    grundpreis: 16.00,
    grundpreis_intervall: 'monatlich',
    einheitspreis: 0.13,
    steuer: 19,
  });

  // Gas-Verbrauchswerte: ~120 m³/Monat Durchschnitt (stark saisonal)
  const gasWerte = generateVerbrauchswerte({
    userId,
    typId: gasTypId,
    stelleId: gasStelleId,
    startZaehlerstand: 12450,
    months: 24,
    avgMonthly: 120,
    seasonalFn: gasSeasonal,
  });
  await insertVerbrauchswerte(gasWerte);

  console.log('\n✅ Demodaten erfolgreich eingefügt!');
  console.log('   - 2 Verbrauchstypen (Strom, Gas)');
  console.log('   - 2 Verbrauchsstellen');
  console.log('   - 2 Anbieter');
  console.log('   - 2 Verträge mit je 2 Preisperioden');
  console.log(`   - ${stromWerte.length + gasWerte.length} Verbrauchswerte (je 25 Monate)`);
}

main().catch((err) => {
  console.error('\n❌ Fehler:', err.message);
  process.exit(1);
});

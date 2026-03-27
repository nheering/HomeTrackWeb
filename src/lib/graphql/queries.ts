import { gql } from '@apollo/client';

// ============================================================
// ALLE VERBRAUCHSWERTE EINES TYPS (für Neuberechnung)
// ============================================================
export const GET_VERBRAUCHSWERTE_FOR_RECALC = gql`
  query GetVerbrauchswerteForRecalc($typ_id: uuid!) {
    verbrauchswert(
      where: { verbrauchstyp_id: { _eq: $typ_id } }
      order_by: [{ verbrauchsstelle_id: asc }, { datum: asc }]
    ) {
      id
      datum
      zaehlerstand
      verbrauchsstelle_id
    }
  }
`;

// ============================================================
// LETZTER VERBRAUCHSWERT (für Verbrauchsberechnung beim Erfassen)
// ============================================================
export const GET_LETZTER_VERBRAUCHSWERT = gql`
  query GetLetzterVerbrauchswert($typ_id: uuid!, $stelle_id: uuid!, $datum: date!) {
    verbrauchswert(
      where: {
        verbrauchstyp_id: { _eq: $typ_id }
        verbrauchsstelle_id: { _eq: $stelle_id }
        datum: { _lte: $datum }
      }
      order_by: { datum: desc }
      limit: 1
    ) {
      id datum zaehlerstand
    }
  }
`;

// ============================================================
// VORHERIGER VERBRAUCHSWERT (für Verbrauchsberechnung beim Editieren)
// Sucht den letzten Eintrag VOR dem aktuellen Datum, ohne den aktuellen Eintrag
// ============================================================
export const GET_VORHERIGER_VERBRAUCHSWERT = gql`
  query GetVorherigerVerbrauchswert($typ_id: uuid!, $stelle_id: uuid!, $datum: date!, $exclude_id: uuid!) {
    verbrauchswert(
      where: {
        verbrauchstyp_id: { _eq: $typ_id }
        verbrauchsstelle_id: { _eq: $stelle_id }
        datum: { _lte: $datum }
        id: { _neq: $exclude_id }
      }
      order_by: { datum: desc }
      limit: 1
    ) {
      id datum zaehlerstand
    }
  }
`;

// ============================================================
// VERBRAUCHSTYPEN
// ============================================================
export const GET_VERBRAUCHSTYPEN = gql`
  query GetVerbrauchstypen {
    verbrauchstyp(order_by: { name: asc }) {
      id name einheit symbol farbe bild_url erstellt_am
      verbrauchsstellen(order_by: { bezeichnung: asc }) {
        id bezeichnung ist_aktiv ist_standard zaehler_nummer
      }
      verbrauchswerte_aggregate {
        aggregate { count }
      }
    }
  }
`;

export const GET_VERBRAUCHSTYP_DETAIL = gql`
  query GetVerbrauchstypDetail($id: uuid!) {
    verbrauchstyp_by_pk(id: $id) {
      id name einheit symbol farbe bild_url
      verbrauchsstellen(order_by: { bezeichnung: asc }) {
        id bezeichnung zaehler_nummer zaehler_typ standort ist_aktiv ist_standard
        einbau_datum marke_hersteller notizen
      }
      anbieter(order_by: { name: asc }) {
        id name kundennummer
        vertraege(order_by: { beginn_datum: desc }) {
          id bezeichnung beginn_datum ende_datum
          preisperioden(order_by: { gueltig_ab: desc }) {
            id gueltig_ab gueltig_bis grundpreis einheitspreis steuer
          }
        }
      }
    }
  }
`;

// ============================================================
// DASHBOARD / KACHELN
// ============================================================
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    verbrauchstyp(order_by: { name: asc }) {
      id name einheit symbol farbe
      verbrauchsstellen(order_by: { ist_standard: desc, erstellt_am: asc }, limit: 1) {
        id bezeichnung
        verbrauchswerte(order_by: { datum: desc }, limit: 200) {
          id datum zaehlerstand verbrauch
        }
      }
    }
  }
`;

export const GET_VERBRAUCHSWERTE_STATS = gql`
  query GetVerbrauchswerteStats($typ_id: uuid!, $von: date!, $bis: date!) {
    verbrauchswert(
      where: {
        verbrauchstyp_id: { _eq: $typ_id }
        datum: { _gte: $von, _lte: $bis }
      }
      order_by: { datum: asc }
    ) {
      id datum zaehlerstand verbrauch
    }
  }
`;

// ============================================================
// ANBIETER
// ============================================================
export const GET_ANBIETER = gql`
  query GetAnbieter {
    anbieter(order_by: { name: asc }) {
      id name kundennummer email telefon webseite notizen erstellt_am
      verbrauchstyp_id
      verbrauchstyp { id name symbol farbe }
      vertraege(order_by: { beginn_datum: desc }) {
        id bezeichnung beginn_datum ende_datum zahlungsintervall
        preisperioden(order_by: { gueltig_ab: desc }, limit: 1) {
          grundpreis einheitspreis steuer gueltig_ab
        }
      }
    }
  }
`;

// ============================================================
// VERTRAEGE
// ============================================================
export const GET_VERTRAEGE = gql`
  query GetVertraege {
    vertrag(order_by: { beginn_datum: desc }) {
      id bezeichnung vertragsnummer beginn_datum ende_datum
      kuendigungsfrist zahlungsintervall notizen erstellt_am
      anbieter { id name }
      verbrauchstyp { id name symbol farbe }
      preisperioden(order_by: { gueltig_ab: desc }) {
        id gueltig_ab gueltig_bis grundpreis grundpreis_intervall
        einheitspreis steuer notizen
      }
    }
  }
`;

// ============================================================
// AUSWERTUNGEN
// ============================================================
export const GET_AUSWERTUNG_DATEN = gql`
  query GetAuswertungDaten(
    $von: date!
    $bis: date!
    $typen: [uuid!]
  ) {
    verbrauchswert(
      where: {
        datum: { _gte: $von, _lte: $bis }
        verbrauchstyp_id: { _in: $typen }
      }
      order_by: [{ verbrauchstyp_id: asc }, { datum: asc }]
    ) {
      id datum zaehlerstand verbrauch
      verbrauchstyp { id name symbol farbe einheit }
      verbrauchsstelle { id bezeichnung }
    }
  }
`;

// ============================================================
// USER SETTINGS
// ============================================================
export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    user_settings {
      nav_position
    }
  }
`;

export const GET_VERBRAUCHSWERTE_LIST = gql`
  query GetVerbrauchswerteList($typ_id: uuid) {
    verbrauchswert(
      where: { verbrauchstyp_id: { _eq: $typ_id } }
      order_by: { datum: desc }
      limit: 100
    ) {
      id datum zaehlerstand verbrauch bild_url notizen erstellt_am
      verbrauchstyp_id verbrauchsstelle_id
      verbrauchstyp { id name symbol farbe einheit }
      verbrauchsstelle { id bezeichnung }
    }
  }
`;

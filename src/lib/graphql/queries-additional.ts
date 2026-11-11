/**
 * Zusätzliche GraphQL-Queries für den HasuraDatabaseProvider
 * 
 * Diese Queries werden von der HasuraDatabaseProvider-Klasse verwendet
 * und ergänzen die bestehenden Queries in queries.ts.
 */

import { gql } from '@apollo/client';

// ============================================================
// VERBRAUCHSSTELLEN
// ============================================================

export const GET_VERBRAUCHSSTELLEN = gql`
  query GetVerbrauchsstellen($user_id: uuid!, $limit: Int, $offset: Int) {
    verbrauchsstelle(
      where: { user_id: { _eq: $user_id } }
      limit: $limit
      offset: $offset
      order_by: { bezeichnung: asc }
    ) {
      id
      user_id
      verbrauchstyp_id
      bezeichnung
      zaehler_nummer
      zaehler_typ
      einbau_datum
      standort
      marke_hersteller
      ist_aktiv
      ist_standard
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_VERBRAUCHSSTELLEN_BY_TYP = gql`
  query GetVerbrauchsstellenByTyp($typ_id: uuid!, $limit: Int, $offset: Int) {
    verbrauchsstelle(
      where: { verbrauchstyp_id: { _eq: $typ_id } }
      limit: $limit
      offset: $offset
      order_by: { bezeichnung: asc }
    ) {
      id
      user_id
      verbrauchstyp_id
      bezeichnung
      zaehler_nummer
      zaehler_typ
      einbau_datum
      standort
      marke_hersteller
      ist_aktiv
      ist_standard
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_VERBRAUCHSSTELLE_BY_ID = gql`
  query GetVerbrauchsstelleById($id: uuid!) {
    verbrauchsstelle_by_pk(id: $id) {
      id
      user_id
      verbrauchstyp_id
      bezeichnung
      zaehler_nummer
      zaehler_typ
      einbau_datum
      standort
      marke_hersteller
      ist_aktiv
      ist_standard
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// VERBRAUCHSWERTE
// ============================================================

export const GET_VERBRAUCHSWERTE_BY_TYP = gql`
  query GetVerbrauchswerteByTyp(
    $typ_id: uuid!
    $start_date: date
    $end_date: date
    $limit: Int
    $offset: Int
  ) {
    verbrauchswert(
      where: {
        verbrauchstyp_id: { _eq: $typ_id }
        _and: [
          { datum: { _gte: $start_date } }
          { datum: { _lte: $end_date } }
        ]
      }
      limit: $limit
      offset: $offset
      order_by: { datum: desc }
    ) {
      id
      user_id
      verbrauchstyp_id
      verbrauchsstelle_id
      datum
      zaehlerstand
      verbrauch
      bild_url
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_VERBRAUCHSWERTE_BY_STELLE = gql`
  query GetVerbrauchswerteByStelle(
    $stelle_id: uuid!
    $start_date: date
    $end_date: date
    $limit: Int
    $offset: Int
  ) {
    verbrauchswert(
      where: {
        verbrauchsstelle_id: { _eq: $stelle_id }
        _and: [
          { datum: { _gte: $start_date } }
          { datum: { _lte: $end_date } }
        ]
      }
      limit: $limit
      offset: $offset
      order_by: { datum: desc }
    ) {
      id
      user_id
      verbrauchstyp_id
      verbrauchsstelle_id
      datum
      zaehlerstand
      verbrauch
      bild_url
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_VERBRAUCHSWERT_BY_ID = gql`
  query GetVerbrauchswertById($id: uuid!) {
    verbrauchswert_by_pk(id: $id) {
      id
      user_id
      verbrauchstyp_id
      verbrauchsstelle_id
      datum
      zaehlerstand
      verbrauch
      bild_url
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// ANBIETER
// ============================================================

export const GET_ANBIETER_BY_TYP = gql`
  query GetAnbieterByTyp($verbrauchstyp_id: uuid!, $limit: Int, $offset: Int) {
    anbieter(
      where: { verbrauchstyp_id: { _eq: $verbrauchstyp_id } }
      limit: $limit
      offset: $offset
      order_by: { name: asc }
    ) {
      id
      user_id
      verbrauchstyp_id
      name
      strasse
      hausnummer
      plz
      ort
      telefon
      email
      webseite
      kundennummer
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_ANBIETER_BY_ID = gql`
  query GetAnbieterById($id: uuid!) {
    anbieter_by_pk(id: $id) {
      id
      user_id
      verbrauchstyp_id
      name
      strasse
      hausnummer
      plz
      ort
      telefon
      email
      webseite
      kundennummer
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// VERTRÄGE
// ============================================================

export const GET_VERTRAG_BY_ID = gql`
  query GetVertragById($id: uuid!) {
    vertrag_by_pk(id: $id) {
      id
      user_id
      anbieter_id
      verbrauchstyp_id
      bezeichnung
      vertragsnummer
      beginn_datum
      ende_datum
      kuendigungsfrist
      zahlungsintervall
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_VERTRAG_BY_ANBIETER = gql`
  query GetVerträgeByAnbieter($anbieter_id: uuid!, $limit: Int, $offset: Int) {
    vertrag(
      where: { anbieter_id: { _eq: $anbieter_id } }
      limit: $limit
      offset: $offset
      order_by: { beginn_datum: desc }
    ) {
      id
      user_id
      anbieter_id
      verbrauchstyp_id
      bezeichnung
      vertragsnummer
      beginn_datum
      ende_datum
      kuendigungsfrist
      zahlungsintervall
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_ACTIVE_VERTRÄGE_BY_TYP = gql`
  query GetActiveVerträgeByTyp($verbrauchstyp_id: uuid!) {
    vertrag(
      where: {
        verbrauchstyp_id: { _eq: $verbrauchstyp_id }
        _or: [
          { ende_datum: { _is_null: true } }
          { ende_datum: { _gte: "today" } }
        ]
      }
      order_by: { beginn_datum: desc }
    ) {
      id
      user_id
      anbieter_id
      verbrauchstyp_id
      bezeichnung
      vertragsnummer
      beginn_datum
      ende_datum
      kuendigungsfrist
      zahlungsintervall
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// PREISPERIODE
// ============================================================

export const GET_PREISPERIODE_BY_ID = gql`
  query GetPreisperiodeById($id: uuid!) {
    preisperiode_by_pk(id: $id) {
      id
      user_id
      vertrag_id
      gueltig_ab
      gueltig_bis
      grundpreis
      grundpreis_intervall
      einheitspreis
      steuer
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// USER SETTINGS
// ============================================================

export const GET_USER_SETTING = gql`
  query GetUserSetting($user_id: uuid!, $key: String!) {
    user_settings(
      where: {
        user_id: { _eq: $user_id }
        key: { _eq: $key }
      }
      limit: 1
    ) {
      id
      user_id
      key
      value
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_USER_SETTINGS = gql`
  query GetUserSettings($user_id: uuid!) {
    user_settings(
      where: { user_id: { _eq: $user_id } }
      order_by: { key: asc }
    ) {
      id
      user_id
      key
      value
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// HANDWERKER
// ============================================================

export const GET_HANDWERKER_BY_ID = gql`
  query GetHandwerkerById($id: uuid!) {
    handwerker_by_pk(id: $id) {
      id
      user_id
      name
      firma
      strasse
      hausnummer
      plz
      ort
      telefon
      mobil
      email
      webseite
      gewerk
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

// ============================================================
// HANDWERKERRECHNUNGEN
// ============================================================

export const GET_HANDWERKERRECHNUNG_BY_ID = gql`
  query GetHandwerkerrechnungById($id: uuid!) {
    handwerkerrechnung_by_pk(id: $id) {
      id
      user_id
      handwerker_id
      rechnungsnummer
      datum
      faelligkeitsdatum
      betrag
      steuer
      beschreibung
      datei_url
      bezahlt
      bezahlungsdatum
      zahlungsmethode
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const GET_HANDWERKERRECHNUNGEN_BY_HANDWERKER = gql`
  query GetHandwerkerrechnungenByHandwerker($handwerker_id: uuid!, $limit: Int, $offset: Int) {
    handwerkerrechnung(
      where: { handwerker_id: { _eq: $handwerker_id } }
      limit: $limit
      offset: $offset
      order_by: { datum: desc }
    ) {
      id
      user_id
      handwerker_id
      rechnungsnummer
      datum
      faelligkeitsdatum
      betrag
      steuer
      beschreibung
      datei_url
      bezahlt
      bezahlungsdatum
      zahlungsmethode
      notizen
      erstellt_am
      aktualisiert_am
    }
  }
`;

export default {
  // Verbrauchsstellen
  GET_VERBRAUCHSSTELLEN,
  GET_VERBRAUCHSSTELLEN_BY_TYP,
  GET_VERBRAUCHSSTELLE_BY_ID,
  
  // Verbrauchswerte
  GET_VERBRAUCHSWERTE_BY_TYP,
  GET_VERBRAUCHSWERTE_BY_STELLE,
  GET_VERBRAUCHSWERT_BY_ID,
  
  // Anbieter
  GET_ANBIETER_BY_TYP,
  GET_ANBIETER_BY_ID,
  
  // Verträge
  GET_VERTRAG_BY_ID,
  GET_VERTRAG_BY_ANBIETER,
  GET_ACTIVE_VERTRÄGE_BY_TYP,
  
  // Preisperioden
  GET_PREISPERIODE_BY_ID,
  
  // User Settings
  GET_USER_SETTING,
  GET_USER_SETTINGS,
  
  // Handwerker
  GET_HANDWERKER_BY_ID,
  
  // Handwerkerrechnungen
  GET_HANDWERKERRECHNUNG_BY_ID,
  GET_HANDWERKERRECHNUNGEN_BY_HANDWERKER,
};

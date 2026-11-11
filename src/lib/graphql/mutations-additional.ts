/**
 * Zusätzliche GraphQL-Mutations für den HasuraDatabaseProvider
 * 
 * Diese Mutations werden von der HasuraDatabaseProvider-Klasse verwendet
 * und ergänzen die bestehenden Mutations in mutations.ts.
 */

import { gql } from '@apollo/client';

// ============================================================
// VERBRAUCHSWERT - Vollständige Version
// ============================================================

export const INSERT_VERBRAUCHSWERT_FULL = gql`
  mutation InsertVerbrauchswertFull($obj: verbrauchswert_insert_input!) {
    insert_verbrauchswert_one(object: $obj) {
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

export const UPDATE_VERBRAUCHSWERT_FULL = gql`
  mutation UpdateVerbrauchswertFull($id: uuid!, $set: verbrauchswert_set_input!) {
    update_verbrauchswert_by_pk(pk_columns: { id: $id }, _set: $set) {
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
// PREISPERIODE - Vollständige Version
// ============================================================

export const INSERT_PREISPERIODE_FULL = gql`
  mutation InsertPreisperiodeFull($obj: preisperiode_insert_input!) {
    insert_preisperiode_one(object: $obj) {
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

export const UPDATE_PREISPERIODE_FULL = gql`
  mutation UpdatePreisperiodeFull($id: uuid!, $set: preisperiode_set_input!) {
    update_preisperiode_by_pk(pk_columns: { id: $id }, _set: $set) {
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

export const INSERT_USER_SETTING = gql`
  mutation InsertUserSetting($user_id: uuid!, $key: String!, $value: jsonb!) {
    insert_user_settings_one(object: { user_id: $user_id, key: $key, value: $value }) {
      id
      user_id
      key
      value
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const UPDATE_USER_SETTING = gql`
  mutation UpdateUserSetting($id: uuid!, $value: jsonb!) {
    update_user_settings_by_pk(pk_columns: { id: $id }, _set: { value: $value }) {
      id
      user_id
      key
      value
      erstellt_am
      aktualisiert_am
    }
  }
`;

export const DELETE_USER_SETTING = gql`
  mutation DeleteUserSetting($id: uuid!) {
    delete_user_settings_by_pk(id: $id) {
      id
    }
  }
`;

// ============================================================
// VERBRAUCHSSTELLE - Vollständige Version
// ============================================================

export const INSERT_VERBRAUCHSSTELLE_FULL = gql`
  mutation InsertVerbrauchsstelleFull($obj: verbrauchsstelle_insert_input!) {
    insert_verbrauchsstelle_one(object: $obj) {
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

export const UPDATE_VERBRAUCHSSTELLE_FULL = gql`
  mutation UpdateVerbrauchsstelleFull($id: uuid!, $set: verbrauchsstelle_set_input!) {
    update_verbrauchsstelle_by_pk(pk_columns: { id: $id }, _set: $set) {
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
// ANBIETER - Vollständige Version
// ============================================================

export const INSERT_ANBIETER_FULL = gql`
  mutation InsertAnbieterFull($obj: anbieter_insert_input!) {
    insert_anbieter_one(object: $obj) {
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

export const UPDATE_ANBIETER_FULL = gql`
  mutation UpdateAnbieterFull($id: uuid!, $set: anbieter_set_input!) {
    update_anbieter_by_pk(pk_columns: { id: $id }, _set: $set) {
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
// VERTRAG - Vollständige Version
// ============================================================

export const INSERT_VERTRAG_FULL = gql`
  mutation InsertVertragFull($obj: vertrag_insert_input!) {
    insert_vertrag_one(object: $obj) {
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

export const UPDATE_VERTRAG_FULL = gql`
  mutation UpdateVertragFull($id: uuid!, $set: vertrag_set_input!) {
    update_vertrag_by_pk(pk_columns: { id: $id }, _set: $set) {
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
// HANDWERKER - Vollständige Version
// ============================================================

export const INSERT_HANDWERKER_FULL = gql`
  mutation InsertHandwerkerFull($obj: handwerker_insert_input!) {
    insert_handwerker_one(object: $obj) {
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

export const UPDATE_HANDWERKER_FULL = gql`
  mutation UpdateHandwerkerFull($id: uuid!, $set: handwerker_set_input!) {
    update_handwerker_by_pk(pk_columns: { id: $id }, _set: $set) {
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
// HANDWERKERRECHNUNG - Vollständige Version
// ============================================================

export const INSERT_HANDWERKERRECHNUNG_FULL = gql`
  mutation InsertHandwerkerrechnungFull($obj: handwerkerrechnung_insert_input!) {
    insert_handwerkerrechnung_one(object: $obj) {
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

export const UPDATE_HANDWERKERRECHNUNG_FULL = gql`
  mutation UpdateHandwerkerrechnungFull($id: uuid!, $set: handwerkerrechnung_set_input!) {
    update_handwerkerrechnung_by_pk(pk_columns: { id: $id }, _set: $set) {
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
  // Verbrauchswerte
  INSERT_VERBRAUCHSWERT_FULL,
  UPDATE_VERBRAUCHSWERT_FULL,
  
  // Preisperioden
  INSERT_PREISPERIODE_FULL,
  UPDATE_PREISPERIODE_FULL,
  
  // User Settings
  INSERT_USER_SETTING,
  UPDATE_USER_SETTING,
  DELETE_USER_SETTING,
  
  // Verbrauchsstellen
  INSERT_VERBRAUCHSSTELLE_FULL,
  UPDATE_VERBRAUCHSSTELLE_FULL,
  
  // Anbieter
  INSERT_ANBIETER_FULL,
  UPDATE_ANBIETER_FULL,
  
  // Verträge
  INSERT_VERTRAG_FULL,
  UPDATE_VERTRAG_FULL,
  
  // Handwerker
  INSERT_HANDWERKER_FULL,
  UPDATE_HANDWERKER_FULL,
  
  // Handwerkerrechnungen
  INSERT_HANDWERKERRECHNUNG_FULL,
  UPDATE_HANDWERKERRECHNUNG_FULL,
};

import { gql } from '@apollo/client';

// ============================================================
// VERBRAUCHSTYP
// ============================================================
export const INSERT_VERBRAUCHSTYP = gql`
  mutation InsertVerbrauchstyp($obj: verbrauchstyp_insert_input!) {
    insert_verbrauchstyp_one(object: $obj) {
      id name einheit symbol farbe
    }
  }
`;

export const UPDATE_VERBRAUCHSTYP = gql`
  mutation UpdateVerbrauchstyp($id: uuid!, $set: verbrauchstyp_set_input!) {
    update_verbrauchstyp_by_pk(pk_columns: { id: $id }, _set: $set) {
      id name einheit symbol farbe
    }
  }
`;

export const DELETE_VERBRAUCHSTYP = gql`
  mutation DeleteVerbrauchstyp($id: uuid!) {
    delete_verbrauchstyp_by_pk(id: $id) { id }
  }
`;

// ============================================================
// VERBRAUCHSSTELLE
// ============================================================
export const INSERT_VERBRAUCHSSTELLE = gql`
  mutation InsertVerbrauchsstelle($obj: verbrauchsstelle_insert_input!) {
    insert_verbrauchsstelle_one(object: $obj) {
      id bezeichnung ist_aktiv ist_standard
    }
  }
`;

export const UPDATE_VERBRAUCHSSTELLE = gql`
  mutation UpdateVerbrauchsstelle($id: uuid!, $set: verbrauchsstelle_set_input!) {
    update_verbrauchsstelle_by_pk(pk_columns: { id: $id }, _set: $set) {
      id bezeichnung ist_aktiv ist_standard
    }
  }
`;

export const SET_STANDARD_STELLE = gql`
  mutation SetStandardStelle($typ_id: uuid!, $stelle_id: uuid!) {
    # Alle anderen zurücksetzen
    reset: update_verbrauchsstelle(
      where: { verbrauchstyp_id: { _eq: $typ_id }, ist_standard: { _eq: true } }
      _set: { ist_standard: false }
    ) { affected_rows }
    # Neue Standardstelle setzen
    set: update_verbrauchsstelle_by_pk(
      pk_columns: { id: $stelle_id }
      _set: { ist_standard: true }
    ) { id ist_standard }
  }
`;

export const DELETE_VERBRAUCHSSTELLE = gql`
  mutation DeleteVerbrauchsstelle($id: uuid!) {
    delete_verbrauchsstelle_by_pk(id: $id) { id }
  }
`;

// ============================================================
// ANBIETER
// ============================================================
export const INSERT_ANBIETER = gql`
  mutation InsertAnbieter($obj: anbieter_insert_input!) {
    insert_anbieter_one(object: $obj) {
      id name kundennummer
    }
  }
`;

export const UPDATE_ANBIETER = gql`
  mutation UpdateAnbieter($id: uuid!, $set: anbieter_set_input!) {
    update_anbieter_by_pk(pk_columns: { id: $id }, _set: $set) {
      id name kundennummer
    }
  }
`;

export const DELETE_ANBIETER = gql`
  mutation DeleteAnbieter($id: uuid!) {
    delete_anbieter_by_pk(id: $id) { id }
  }
`;

// ============================================================
// VERTRAG
// ============================================================
export const INSERT_VERTRAG = gql`
  mutation InsertVertrag($obj: vertrag_insert_input!) {
    insert_vertrag_one(object: $obj) {
      id bezeichnung beginn_datum
    }
  }
`;

export const UPDATE_VERTRAG = gql`
  mutation UpdateVertrag($id: uuid!, $set: vertrag_set_input!) {
    update_vertrag_by_pk(pk_columns: { id: $id }, _set: $set) {
      id bezeichnung
    }
  }
`;

export const DELETE_VERTRAG = gql`
  mutation DeleteVertrag($id: uuid!) {
    delete_vertrag_by_pk(id: $id) { id }
  }
`;

// ============================================================
// PREISPERIODE
// ============================================================
export const INSERT_PREISPERIODE = gql`
  mutation InsertPreisperiode($obj: preisperiode_insert_input!) {
    insert_preisperiode_one(object: $obj) {
      id gueltig_ab grundpreis einheitspreis
    }
  }
`;

export const UPDATE_PREISPERIODE = gql`
  mutation UpdatePreisperiode($id: uuid!, $set: preisperiode_set_input!) {
    update_preisperiode_by_pk(pk_columns: { id: $id }, _set: $set) {
      id gueltig_ab grundpreis einheitspreis
    }
  }
`;

export const DELETE_PREISPERIODE = gql`
  mutation DeletePreisperiode($id: uuid!) {
    delete_preisperiode_by_pk(id: $id) { id }
  }
`;

// ============================================================
// VERBRAUCHSWERT
// ============================================================
export const INSERT_VERBRAUCHSWERT = gql`
  mutation InsertVerbrauchswert($obj: verbrauchswert_insert_input!) {
    insert_verbrauchswert_one(object: $obj) {
      id datum zaehlerstand verbrauch
    }
  }
`;

export const UPDATE_VERBRAUCHSWERT = gql`
  mutation UpdateVerbrauchswert($id: uuid!, $set: verbrauchswert_set_input!) {
    update_verbrauchswert_by_pk(pk_columns: { id: $id }, _set: $set) {
      id datum zaehlerstand verbrauch
    }
  }
`;

export const DELETE_VERBRAUCHSWERT = gql`
  mutation DeleteVerbrauchswert($id: uuid!) {
    delete_verbrauchswert_by_pk(id: $id) { id }
  }
`;

/**
 * PostgreSQL Provider für Verbrauchsstellen
 */

import { query, toSnakeCase, buildWhereClause, buildOrderBy, buildPagination } from './base-provider';
import type {
  Verbrauchsstelle,
  CreateVerbrauchsstelle,
  UpdateVerbrauchsstelle,
  QueryOptions,
} from '../types';

const TABLE = 'verbrauchsstelle';

// ============================================================
// Mapping-Funktionen
// ============================================================

function mapRowToVerbrauchsstelle(row: any): Verbrauchsstelle {
  return {
    id: row.id,
    user_id: row.user_id,
    verbrauchstyp_id: row.verbrauchstyp_id,
    bezeichnung: row.bezeichnung,
    zaehler_nummer: row.zaehler_nummer,
    zaehler_typ: row.zaehler_typ,
    einbau_datum: row.einbau_datum,
    standort: row.standort,
    marke_hersteller: row.marke_hersteller,
    ist_aktiv: row.ist_aktiv,
    ist_standard: row.ist_standard,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapCreateToDb(data: CreateVerbrauchsstelle): Record<string, any> {
  return {
    user_id: data.userId,
    verbrauchstyp_id: data.verbrauchstypId,
    bezeichnung: data.bezeichnung,
    zaehler_nummer: data.zaehlerNummer,
    zaehler_typ: data.zaehlerTyp,
    einbau_datum: data.einbauDatum,
    standort: data.standort,
    marke_hersteller: data.markeHersteller,
    ist_aktiv: data.istAktiv !== undefined ? data.istAktiv : true,
    ist_standard: data.istStandard !== undefined ? data.istStandard : false,
    notizen: data.notizen,
  };
}

function mapUpdateToDb(data: UpdateVerbrauchsstelle): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.bezeichnung !== undefined) result.bezeichnung = data.bezeichnung;
  if (data.zaehlerNummer !== undefined) result.zaehler_nummer = data.zaehlerNummer;
  if (data.zaehlerTyp !== undefined) result.zaehler_typ = data.zaehlerTyp;
  if (data.einbauDatum !== undefined) result.einbau_datum = data.einbauDatum;
  if (data.standort !== undefined) result.standort = data.standort;
  if (data.markeHersteller !== undefined) result.marke_hersteller = data.markeHersteller;
  if (data.istAktiv !== undefined) result.ist_aktiv = data.istAktiv;
  if (data.istStandard !== undefined) result.ist_standard = data.istStandard;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

// ============================================================
// CRUD-Operationen
// ============================================================

export async function getVerbrauchsstellen(userId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ userId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToVerbrauchsstelle);
}

export async function getVerbrauchsstellenByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ verbrauchstypId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToVerbrauchsstelle);
}

export async function getVerbrauchsstelle(id: string): Promise<Verbrauchsstelle | null> {
  const result = await query(
    `SELECT * FROM ${TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToVerbrauchsstelle(result.rows[0]) : null;
}

export async function createVerbrauchsstelle(data: CreateVerbrauchsstelle): Promise<Verbrauchsstelle> {
  const dbData = mapCreateToDb(data);
  const columns = Object.keys(dbData).join(', ');
  const placeholders = Object.keys(dbData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(dbData);
  
  const queryText = `
    INSERT INTO ${TABLE} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return mapRowToVerbrauchsstelle(result.rows[0]);
}

export async function updateVerbrauchsstelle(id: string, data: UpdateVerbrauchsstelle): Promise<Verbrauchsstelle> {
  const dbData = mapUpdateToDb(data);
  const setClause = Object.keys(dbData).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
  const values = [...Object.values(dbData), id];
  
  const queryText = `
    UPDATE ${TABLE}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows.length > 0 ? mapRowToVerbrauchsstelle(result.rows[0]) : null;
}

export async function deleteVerbrauchsstelle(id: string): Promise<void> {
  await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
}

export async function setStandardVerbrauchsstelle(verbrauchstypId: string, verbrauchsstelleId: string): Promise<void> {
  await query(
    `UPDATE ${TABLE} SET ist_standard = false WHERE verbrauchstyp_id = $1`,
    [verbrauchstypId]
  );
  await query(
    `UPDATE ${TABLE} SET ist_standard = true WHERE id = $1 AND verbrauchstyp_id = $2`,
    [verbrauchsstelleId, verbrauchstypId]
  );
}

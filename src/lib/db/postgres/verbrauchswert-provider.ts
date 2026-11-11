/**
 * PostgreSQL Provider für Verbrauchswerte
 */

import { query, toSnakeCase, buildWhereClause, buildOrderBy, buildPagination } from './base-provider';
import type {
  Verbrauchswert,
  CreateVerbrauchswert,
  UpdateVerbrauchswert,
  QueryOptions,
  DateRangeFilter,
} from '../types';

const TABLE = 'verbrauchswert';

// ============================================================
// Mapping-Funktionen
// ============================================================

function mapRowToVerbrauchswert(row: any): Verbrauchswert {
  return {
    id: row.id,
    user_id: row.user_id,
    verbrauchstyp_id: row.verbrauchstyp_id,
    verbrauchsstelle_id: row.verbrauchsstelle_id,
    datum: row.datum,
    zaehlerstand: row.zaehlerstand,
    verbrauch: row.verbrauch,
    bild_url: row.bild_url,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapCreateToDb(data: CreateVerbrauchswert): Record<string, any> {
  return {
    user_id: data.userId,
    verbrauchstyp_id: data.verbrauchstypId,
    verbrauchsstelle_id: data.verbrauchsstelleId,
    datum: data.datum,
    zaehlerstand: data.zaehlerstand,
    verbrauch: data.verbrauch,
    bild_url: data.bildUrl,
    notizen: data.notizen,
  };
}

function mapUpdateToDb(data: UpdateVerbrauchswert): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.verbrauchstypId !== undefined) result.verbrauchstyp_id = data.verbrauchstypId;
  if (data.verbrauchsstelleId !== undefined) result.verbrauchsstelle_id = data.verbrauchsstelleId;
  if (data.datum !== undefined) result.datum = data.datum;
  if (data.zaehlerstand !== undefined) result.zaehlerstand = data.zaehlerstand;
  if (data.verbrauch !== undefined) result.verbrauch = data.verbrauch;
  if (data.bildUrl !== undefined) result.bild_url = data.bildUrl;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

// ============================================================
// CRUD-Operationen
// ============================================================

export async function getVerbrauchswerteByTyp(
  verbrauchstypId: string,
  options?: QueryOptions & DateRangeFilter
): Promise<Verbrauchswert[]> {
  const filters: Record<string, any> = { verbrauchstypId };
  if (options?.startDate) filters.datum_gte = options.startDate;
  if (options?.endDate) filters.datum_lte = options.endDate;
  
  const { clause: whereClause, params: whereParams } = buildWhereClause(filters);
  const orderByClause = buildOrderBy(options?.orderBy || 'datum', options?.orderDirection || 'desc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToVerbrauchswert);
}

export async function getVerbrauchswerteByStelle(
  verbrauchsstelleId: string,
  options?: QueryOptions & DateRangeFilter
): Promise<Verbrauchswert[]> {
  const filters: Record<string, any> = { verbrauchsstelleId };
  if (options?.startDate) filters.datum_gte = options.startDate;
  if (options?.endDate) filters.datum_lte = options.endDate;
  
  const { clause: whereClause, params: whereParams } = buildWhereClause(filters);
  const orderByClause = buildOrderBy(options?.orderBy || 'datum', options?.orderDirection || 'desc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToVerbrauchswert);
}

export async function getLastVerbrauchswert(
  verbrauchstypId: string,
  verbrauchsstelleId: string,
  date: string
): Promise<Verbrauchswert | null> {
  const queryText = `
    SELECT * FROM ${TABLE}
    WHERE verbrauchstyp_id = $1
      AND verbrauchsstelle_id = $2
      AND datum <= $3
    ORDER BY datum DESC
    LIMIT 1
  `;
  const result = await query(queryText, [verbrauchstypId, verbrauchsstelleId, date]);
  return result.rows.length > 0 ? mapRowToVerbrauchswert(result.rows[0]) : null;
}

export async function getPreviousVerbrauchswert(
  verbrauchstypId: string,
  verbrauchsstelleId: string,
  date: string,
  excludeId: string
): Promise<Verbrauchswert | null> {
  const queryText = `
    SELECT * FROM ${TABLE}
    WHERE verbrauchstyp_id = $1
      AND verbrauchsstelle_id = $2
      AND datum < $3
      AND id != $4
    ORDER BY datum DESC
    LIMIT 1
  `;
  const result = await query(queryText, [verbrauchstypId, verbrauchsstelleId, date, excludeId]);
  return result.rows.length > 0 ? mapRowToVerbrauchswert(result.rows[0]) : null;
}

export async function getVerbrauchswert(id: string): Promise<Verbrauchswert | null> {
  const result = await query(
    `SELECT * FROM ${TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToVerbrauchswert(result.rows[0]) : null;
}

export async function createVerbrauchswert(data: CreateVerbrauchswert): Promise<Verbrauchswert> {
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
  return mapRowToVerbrauchswert(result.rows[0]);
}

export async function updateVerbrauchswert(id: string, data: UpdateVerbrauchswert): Promise<Verbrauchswert> {
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
  return result.rows.length > 0 ? mapRowToVerbrauchswert(result.rows[0]) : null;
}

export async function deleteVerbrauchswert(id: string): Promise<void> {
  await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
}

export async function recalculateVerbrauchForTyp(verbrauchstypId: string): Promise<void> {
  // Hole alle Verbrauchswerte für diesen Typ
  const queryText = `
    SELECT * FROM ${TABLE}
    WHERE verbrauchstyp_id = $1
    AND verbrauchsstelle_id IS NOT NULL
    ORDER BY verbrauchsstelle_id, datum
  `;
  const result = await query(queryText, [verbrauchstypId]);
  
  // Rechne Verbrauch für jede Stelle neu
  const valuesByStelle: Record<string, any[]> = {};
  for (const row of result.rows) {
    if (!valuesByStelle[row.verbrauchsstelle_id]) {
      valuesByStelle[row.verbrauchsstelle_id] = [];
    }
    valuesByStelle[row.verbrauchsstelle_id].push(row);
  }
  
  // Aktualisiere Verbrauchswerte
  for (const stelleId of Object.keys(valuesByStelle)) {
    const values = valuesByStelle[stelleId];
    let previousValue = null;
    for (let i = 0; i < values.length; i++) {
      const current = values[i];
      if (i > 0 && previousValue !== null) {
        const verbrauch = current.zaehlerstand - previousValue.zaehlerstand;
        await query(
          `UPDATE ${TABLE} SET verbrauch = $1 WHERE id = $2`,
          [verbrauch, current.id]
        );
      }
      previousValue = current;
    }
  }
}

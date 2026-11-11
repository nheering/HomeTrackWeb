/**
 * PostgreSQL Provider für Verbrauchstypen
 */

import { query, mapToCamelCase, toSnakeCase, buildWhereClause, buildOrderBy, buildPagination } from './base-provider';
import type {
  Verbrauchstyp,
  CreateVerbrauchstyp,
  UpdateVerbrauchstyp,
  QueryOptions,
} from '../types';

const TABLE = 'verbrauchstyp';

// ============================================================
// Mapping-Funktionen
// ============================================================

function mapRowToVerbrauchstyp(row: any): Verbrauchstyp {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    einheit: row.einheit,
    symbol: row.symbol,
    farbe: row.farbe,
    bild_url: row.bild_url,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapCreateToDb(data: CreateVerbrauchstyp): Record<string, any> {
  return {
    user_id: data.userId,
    name: data.name,
    einheit: data.einheit,
    symbol: data.symbol,
    farbe: data.farbe || '#f97316',
    bild_url: data.bildUrl,
  };
}

function mapUpdateToDb(data: UpdateVerbrauchstyp): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.einheit !== undefined) result.einheit = data.einheit;
  if (data.symbol !== undefined) result.symbol = data.symbol;
  if (data.farbe !== undefined) result.farbe = data.farbe;
  if (data.bildUrl !== undefined) result.bild_url = data.bildUrl;
  return result;
}

// ============================================================
// CRUD-Operationen
// ============================================================

export async function getVerbrauchstypen(userId: string, options?: QueryOptions): Promise<Verbrauchstyp[]> {
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
  return result.rows.map(mapRowToVerbrauchstyp);
}

export async function getVerbrauchstyp(id: string): Promise<Verbrauchstyp | null> {
  const result = await query(
    `SELECT * FROM ${TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToVerbrauchstyp(result.rows[0]) : null;
}

export async function createVerbrauchstyp(data: CreateVerbrauchstyp): Promise<Verbrauchstyp> {
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
  return mapRowToVerbrauchstyp(result.rows[0]);
}

export async function updateVerbrauchstyp(id: string, data: UpdateVerbrauchstyp): Promise<Verbrauchstyp> {
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
  return result.rows.length > 0 ? mapRowToVerbrauchstyp(result.rows[0]) : null;
}

export async function deleteVerbrauchstyp(id: string): Promise<void> {
  await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
}

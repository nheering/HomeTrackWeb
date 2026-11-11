/**
 * PostgreSQL Provider für Handwerker und Handwerkerrechnungen
 */

import { query, toSnakeCase, buildWhereClause, buildOrderBy, buildPagination } from './base-provider';
import type {
  Handwerker,
  CreateHandwerker,
  UpdateHandwerker,
  Handwerkerrechnung,
  CreateHandwerkerrechnung,
  UpdateHandwerkerrechnung,
  QueryOptions,
  DateRangeFilter,
} from '../types';

// ============================================================
// Handwerker
// ============================================================

const HANDWERKER_TABLE = 'handwerker';

function mapRowToHandwerker(row: any): Handwerker {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    firma: row.firma,
    strasse: row.strasse,
    hausnummer: row.hausnummer,
    plz: row.plz,
    ort: row.ort,
    telefon: row.telefon,
    mobil: row.mobil,
    email: row.email,
    webseite: row.webseite,
    gewerk: row.gewerk,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapHandwerkerCreateToDb(data: CreateHandwerker): Record<string, any> {
  return {
    user_id: data.userId,
    name: data.name,
    firma: data.firma,
    strasse: data.strasse,
    hausnummer: data.hausnummer,
    plz: data.plz,
    ort: data.ort,
    telefon: data.telefon,
    mobil: data.mobil,
    email: data.email,
    webseite: data.webseite,
    gewerk: data.gewerk,
    notizen: data.notizen,
  };
}

function mapHandwerkerUpdateToDb(data: UpdateHandwerker): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.firma !== undefined) result.firma = data.firma;
  if (data.strasse !== undefined) result.strasse = data.strasse;
  if (data.hausnummer !== undefined) result.hausnummer = data.hausnummer;
  if (data.plz !== undefined) result.plz = data.plz;
  if (data.ort !== undefined) result.ort = data.ort;
  if (data.telefon !== undefined) result.telefon = data.telefon;
  if (data.mobil !== undefined) result.mobil = data.mobil;
  if (data.email !== undefined) result.email = data.email;
  if (data.webseite !== undefined) result.webseite = data.webseite;
  if (data.gewerk !== undefined) result.gewerk = data.gewerk;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

export async function getHandwerker(userId: string, options?: QueryOptions): Promise<Handwerker[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ userId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${HANDWERKER_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToHandwerker);
}

export async function getHandwerker(id: string): Promise<Handwerker | null> {
  const result = await query(
    `SELECT * FROM ${HANDWERKER_TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToHandwerker(result.rows[0]) : null;
}

export async function createHandwerker(data: CreateHandwerker): Promise<Handwerker> {
  const dbData = mapHandwerkerCreateToDb(data);
  const columns = Object.keys(dbData).join(', ');
  const placeholders = Object.keys(dbData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(dbData);
  
  const queryText = `
    INSERT INTO ${HANDWERKER_TABLE} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return mapRowToHandwerker(result.rows[0]);
}

export async function updateHandwerker(id: string, data: UpdateHandwerker): Promise<Handwerker> {
  const dbData = mapHandwerkerUpdateToDb(data);
  const setClause = Object.keys(dbData).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
  const values = [...Object.values(dbData), id];
  
  const queryText = `
    UPDATE ${HANDWERKER_TABLE}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows.length > 0 ? mapRowToHandwerker(result.rows[0]) : null;
}

export async function deleteHandwerker(id: string): Promise<void> {
  await query(`DELETE FROM ${HANDWERKER_TABLE} WHERE id = $1`, [id]);
}

// ============================================================
// Handwerkerrechnungen
// ============================================================

const HANDWERKERRECHNUNG_TABLE = 'handwerkerrechnung';

function mapRowToHandwerkerrechnung(row: any): Handwerkerrechnung {
  return {
    id: row.id,
    user_id: row.user_id,
    handwerker_id: row.handwerker_id,
    rechnungsnummer: row.rechnungsnummer,
    datum: row.datum,
    faelligkeitsdatum: row.faelligkeitsdatum,
    betrag: row.betrag,
    steuer: row.steuer,
    beschreibung: row.beschreibung,
    datei_url: row.datei_url,
    bezahlt: row.bezahlt,
    bezahlungsdatum: row.bezahlungsdatum,
    zahlungsmethode: row.zahlungsmethode,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapHandwerkerrechnungCreateToDb(data: CreateHandwerkerrechnung): Record<string, any> {
  return {
    user_id: data.userId,
    handwerker_id: data.handwerkerId,
    rechnungsnummer: data.rechnungsnummer,
    datum: data.datum,
    faelligkeitsdatum: data.faelligkeitsdatum,
    betrag: data.betrag,
    steuer: data.steuer || 19,
    beschreibung: data.beschreibung,
    datei_url: data.dateiUrl,
    bezahlt: data.bezahlt || false,
    bezahlungsdatum: data.bezahlungsdatum,
    zahlungsmethode: data.zahlungsmethode,
    notizen: data.notizen,
  };
}

function mapHandwerkerrechnungUpdateToDb(data: UpdateHandwerkerrechnung): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.handwerkerId !== undefined) result.handwerker_id = data.handwerkerId;
  if (data.rechnungsnummer !== undefined) result.rechnungsnummer = data.rechnungsnummer;
  if (data.datum !== undefined) result.datum = data.datum;
  if (data.faelligkeitsdatum !== undefined) result.faelligkeitsdatum = data.faelligkeitsdatum;
  if (data.betrag !== undefined) result.betrag = data.betrag;
  if (data.steuer !== undefined) result.steuer = data.steuer;
  if (data.beschreibung !== undefined) result.beschreibung = data.beschreibung;
  if (data.dateiUrl !== undefined) result.datei_url = data.dateiUrl;
  if (data.bezahlt !== undefined) result.bezahlt = data.bezahlt;
  if (data.bezahlungsdatum !== undefined) result.bezahlungsdatum = data.bezahlungsdatum;
  if (data.zahlungsmethode !== undefined) result.zahlungsmethode = data.zahlungsmethode;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

export async function getHandwerkerrechnungen(userId: string, options?: QueryOptions & DateRangeFilter): Promise<Handwerkerrechnung[]> {
  const filters: Record<string, any> = { userId };
  if (options?.startDate) filters.datum_gte = options.startDate;
  if (options?.endDate) filters.datum_lte = options.endDate;
  
  const { clause: whereClause, params: whereParams } = buildWhereClause(filters);
  const orderByClause = buildOrderBy(options?.orderBy || 'datum', options?.orderDirection || 'desc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${HANDWERKERRECHNUNG_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToHandwerkerrechnung);
}

export async function getHandwerkerrechnungenByHandwerker(handwerkerId: string, options?: QueryOptions): Promise<Handwerkerrechnung[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ handwerkerId });
  const orderByClause = buildOrderBy(options?.orderBy || 'datum', options?.orderDirection || 'desc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${HANDWERKERRECHNUNG_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToHandwerkerrechnung);
}

export async function getHandwerkerrechnung(id: string): Promise<Handwerkerrechnung | null> {
  const result = await query(
    `SELECT * FROM ${HANDWERKERRECHNUNG_TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToHandwerkerrechnung(result.rows[0]) : null;
}

export async function createHandwerkerrechnung(data: CreateHandwerkerrechnung): Promise<Handwerkerrechnung> {
  const dbData = mapHandwerkerrechnungCreateToDb(data);
  const columns = Object.keys(dbData).join(', ');
  const placeholders = Object.keys(dbData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(dbData);
  
  const queryText = `
    INSERT INTO ${HANDWERKERRECHNUNG_TABLE} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return mapRowToHandwerkerrechnung(result.rows[0]);
}

export async function updateHandwerkerrechnung(id: string, data: UpdateHandwerkerrechnung): Promise<Handwerkerrechnung> {
  const dbData = mapHandwerkerrechnungUpdateToDb(data);
  const setClause = Object.keys(dbData).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
  const values = [...Object.values(dbData), id];
  
  const queryText = `
    UPDATE ${HANDWERKERRECHNUNG_TABLE}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows.length > 0 ? mapRowToHandwerkerrechnung(result.rows[0]) : null;
}

export async function deleteHandwerkerrechnung(id: string): Promise<void> {
  await query(`DELETE FROM ${HANDWERKERRECHNUNG_TABLE} WHERE id = $1`, [id]);
}

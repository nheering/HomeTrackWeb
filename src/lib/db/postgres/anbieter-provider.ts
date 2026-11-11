/**
 * PostgreSQL Provider für Anbieter, Verträge und Preisperioden
 */

import { query, toSnakeCase, buildWhereClause, buildOrderBy, buildPagination } from './base-provider';
import type {
  Anbieter,
  CreateAnbieter,
  UpdateAnbieter,
  Vertrag,
  CreateVertrag,
  UpdateVertrag,
  Preisperiode,
  CreatePreisperiode,
  UpdatePreisperiode,
  QueryOptions,
} from '../types';

// ============================================================
// Anbieter
// ============================================================

const ANBIETER_TABLE = 'anbieter';

function mapRowToAnbieter(row: any): Anbieter {
  return {
    id: row.id,
    user_id: row.user_id,
    verbrauchstyp_id: row.verbrauchstyp_id,
    name: row.name,
    strasse: row.strasse,
    hausnummer: row.hausnummer,
    plz: row.plz,
    ort: row.ort,
    telefon: row.telefon,
    email: row.email,
    webseite: row.webseite,
    kundennummer: row.kundennummer,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapAnbieterCreateToDb(data: CreateAnbieter): Record<string, any> {
  return {
    user_id: data.userId,
    verbrauchstyp_id: data.verbrauchstypId,
    name: data.name,
    strasse: data.strasse,
    hausnummer: data.hausnummer,
    plz: data.plz,
    ort: data.ort,
    telefon: data.telefon,
    email: data.email,
    webseite: data.webseite,
    kundennummer: data.kundennummer,
    notizen: data.notizen,
  };
}

function mapAnbieterUpdateToDb(data: UpdateAnbieter): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.verbrauchstypId !== undefined) result.verbrauchstyp_id = data.verbrauchstypId;
  if (data.name !== undefined) result.name = data.name;
  if (data.strasse !== undefined) result.strasse = data.strasse;
  if (data.hausnummer !== undefined) result.hausnummer = data.hausnummer;
  if (data.plz !== undefined) result.plz = data.plz;
  if (data.ort !== undefined) result.ort = data.ort;
  if (data.telefon !== undefined) result.telefon = data.telefon;
  if (data.email !== undefined) result.email = data.email;
  if (data.webseite !== undefined) result.webseite = data.webseite;
  if (data.kundennummer !== undefined) result.kundennummer = data.kundennummer;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

export async function getAnbieter(userId: string, options?: QueryOptions): Promise<Anbieter[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ userId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${ANBIETER_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToAnbieter);
}

export async function getAnbieterByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Anbieter[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ verbrauchstypId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${ANBIETER_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToAnbieter);
}

export async function getAnbieter(id: string): Promise<Anbieter | null> {
  const result = await query(
    `SELECT * FROM ${ANBIETER_TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToAnbieter(result.rows[0]) : null;
}

export async function createAnbieter(data: CreateAnbieter): Promise<Anbieter> {
  const dbData = mapAnbieterCreateToDb(data);
  const columns = Object.keys(dbData).join(', ');
  const placeholders = Object.keys(dbData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(dbData);
  
  const queryText = `
    INSERT INTO ${ANBIETER_TABLE} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return mapRowToAnbieter(result.rows[0]);
}

export async function updateAnbieter(id: string, data: UpdateAnbieter): Promise<Anbieter> {
  const dbData = mapAnbieterUpdateToDb(data);
  const setClause = Object.keys(dbData).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
  const values = [...Object.values(dbData), id];
  
  const queryText = `
    UPDATE ${ANBIETER_TABLE}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows.length > 0 ? mapRowToAnbieter(result.rows[0]) : null;
}

export async function deleteAnbieter(id: string): Promise<void> {
  await query(`DELETE FROM ${ANBIETER_TABLE} WHERE id = $1`, [id]);
}

// ============================================================
// Verträge
// ============================================================

const VERTRAG_TABLE = 'vertrag';

function mapRowToVertrag(row: any): Vertrag {
  return {
    id: row.id,
    user_id: row.user_id,
    anbieter_id: row.anbieter_id,
    verbrauchstyp_id: row.verbrauchstyp_id,
    bezeichnung: row.bezeichnung,
    vertragsnummer: row.vertragsnummer,
    beginn_datum: row.beginn_datum,
    ende_datum: row.ende_datum,
    kuendigungsfrist: row.kuendigungsfrist,
    zahlungsintervall: row.zahlungsintervall,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapVertragCreateToDb(data: CreateVertrag): Record<string, any> {
  return {
    user_id: data.userId,
    anbieter_id: data.anbieterId,
    verbrauchstyp_id: data.verbrauchstypId,
    bezeichnung: data.bezeichnung,
    vertragsnummer: data.vertragsnummer,
    beginn_datum: data.beginnDatum,
    ende_datum: data.endeDatum,
    kuendigungsfrist: data.kuendigungsfrist,
    zahlungsintervall: data.zahlungsintervall,
    notizen: data.notizen,
  };
}

function mapVertragUpdateToDb(data: UpdateVertrag): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.anbieterId !== undefined) result.anbieter_id = data.anbieterId;
  if (data.verbrauchstypId !== undefined) result.verbrauchstyp_id = data.verbrauchstypId;
  if (data.bezeichnung !== undefined) result.bezeichnung = data.bezeichnung;
  if (data.vertragsnummer !== undefined) result.vertragsnummer = data.vertragsnummer;
  if (data.beginnDatum !== undefined) result.beginn_datum = data.beginnDatum;
  if (data.endeDatum !== undefined) result.ende_datum = data.endeDatum;
  if (data.kuendigungsfrist !== undefined) result.kuendigungsfrist = data.kuendigungsfrist;
  if (data.zahlungsintervall !== undefined) result.zahlungsintervall = data.zahlungsintervall;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

export async function getVerträge(userId: string, options?: QueryOptions): Promise<Vertrag[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ userId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${VERTRAG_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToVertrag);
}

export async function getVerträgeByAnbieter(anbieterId: string, options?: QueryOptions): Promise<Vertrag[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ anbieterId });
  const orderByClause = buildOrderBy(options?.orderBy, options?.orderDirection || 'asc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${VERTRAG_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToVertrag);
}

export async function getActiveVerträgeByTyp(verbrauchstypId: string): Promise<Vertrag[]> {
  const queryText = `
    SELECT * FROM ${VERTRAG_TABLE}
    WHERE verbrauchstyp_id = $1
      AND (ende_datum IS NULL OR ende_datum >= CURRENT_DATE)
    ORDER BY beginn_datum DESC
  `;
  const result = await query(queryText, [verbrauchstypId]);
  return result.rows.map(mapRowToVertrag);
}

export async function getVertrag(id: string): Promise<Vertrag | null> {
  const result = await query(
    `SELECT * FROM ${VERTRAG_TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToVertrag(result.rows[0]) : null;
}

export async function createVertrag(data: CreateVertrag): Promise<Vertrag> {
  const dbData = mapVertragCreateToDb(data);
  const columns = Object.keys(dbData).join(', ');
  const placeholders = Object.keys(dbData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(dbData);
  
  const queryText = `
    INSERT INTO ${VERTRAG_TABLE} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return mapRowToVertrag(result.rows[0]);
}

export async function updateVertrag(id: string, data: UpdateVertrag): Promise<Vertrag> {
  const dbData = mapVertragUpdateToDb(data);
  const setClause = Object.keys(dbData).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
  const values = [...Object.values(dbData), id];
  
  const queryText = `
    UPDATE ${VERTRAG_TABLE}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows.length > 0 ? mapRowToVertrag(result.rows[0]) : null;
}

export async function deleteVertrag(id: string): Promise<void> {
  await query(`DELETE FROM ${VERTRAG_TABLE} WHERE id = $1`, [id]);
}

// ============================================================
// Preisperioden
// ============================================================

const PREISPERIODE_TABLE = 'preisperiode';

function mapRowToPreisperiode(row: any): Preisperiode {
  return {
    id: row.id,
    user_id: row.user_id,
    vertrag_id: row.vertrag_id,
    gueltig_ab: row.gueltig_ab,
    gueltig_bis: row.gueltig_bis,
    grundpreis: row.grundpreis,
    grundpreis_intervall: row.grundpreis_intervall,
    einheitspreis: row.einheitspreis,
    steuer: row.steuer,
    notizen: row.notizen,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

function mapPreisperiodeCreateToDb(data: CreatePreisperiode): Record<string, any> {
  return {
    user_id: data.userId,
    vertrag_id: data.vertragId,
    gueltig_ab: data.gueltigAb,
    gueltig_bis: data.gueltigBis,
    grundpreis: data.grundpreis,
    grundpreis_intervall: data.grundpreisIntervall || 'Monat',
    einheitspreis: data.einheitspreis,
    steuer: data.steuer || 19,
    notizen: data.notizen,
  };
}

function mapPreisperiodeUpdateToDb(data: UpdatePreisperiode): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.gueltigAb !== undefined) result.gueltig_ab = data.gueltigAb;
  if (data.gueltigBis !== undefined) result.gueltig_bis = data.gueltigBis;
  if (data.grundpreis !== undefined) result.grundpreis = data.grundpreis;
  if (data.grundpreisIntervall !== undefined) result.grundpreis_intervall = data.grundpreisIntervall;
  if (data.einheitspreis !== undefined) result.einheitspreis = data.einheitspreis;
  if (data.steuer !== undefined) result.steuer = data.steuer;
  if (data.notizen !== undefined) result.notizen = data.notizen;
  return result;
}

export async function getPreisperiodenByVertrag(vertragId: string, options?: QueryOptions): Promise<Preisperiode[]> {
  const { clause: whereClause, params: whereParams } = buildWhereClause({ vertragId });
  const orderByClause = buildOrderBy(options?.orderBy || 'gueltig_ab', options?.orderDirection || 'desc');
  const { clause: paginationClause, params: paginationParams } = buildPagination(options?.limit, options?.offset, whereParams);
  
  const queryText = `
    SELECT * FROM ${PREISPERIODE_TABLE}
    ${whereClause}
    ${orderByClause}
    ${paginationClause}
  `;
  
  const result = await query(queryText, [...whereParams, ...paginationParams]);
  return result.rows.map(mapRowToPreisperiode);
}

export async function getCurrentPreisperiode(vertragId: string, date?: string): Promise<Preisperiode | null> {
  const checkDate = date || new Date().toISOString().split('T')[0];
  const queryText = `
    SELECT * FROM ${PREISPERIODE_TABLE}
    WHERE vertrag_id = $1
      AND gueltig_ab <= $2
      AND (gueltig_bis IS NULL OR gueltig_bis >= $2)
    ORDER BY gueltig_ab DESC
    LIMIT 1
  `;
  const result = await query(queryText, [vertragId, checkDate]);
  return result.rows.length > 0 ? mapRowToPreisperiode(result.rows[0]) : null;
}

export async function getPreisperiode(id: string): Promise<Preisperiode | null> {
  const result = await query(
    `SELECT * FROM ${PREISPERIODE_TABLE} WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? mapRowToPreisperiode(result.rows[0]) : null;
}

export async function createPreisperiode(data: CreatePreisperiode): Promise<Preisperiode> {
  const dbData = mapPreisperiodeCreateToDb(data);
  const columns = Object.keys(dbData).join(', ');
  const placeholders = Object.keys(dbData).map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(dbData);
  
  const queryText = `
    INSERT INTO ${PREISPERIODE_TABLE} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return mapRowToPreisperiode(result.rows[0]);
}

export async function updatePreisperiode(id: string, data: UpdatePreisperiode): Promise<Preisperiode> {
  const dbData = mapPreisperiodeUpdateToDb(data);
  const setClause = Object.keys(dbData).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
  const values = [...Object.values(dbData), id];
  
  const queryText = `
    UPDATE ${PREISPERIODE_TABLE}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  return result.rows.length > 0 ? mapRowToPreisperiode(result.rows[0]) : null;
}

export async function deletePreisperiode(id: string): Promise<void> {
  await query(`DELETE FROM ${PREISPERIODE_TABLE} WHERE id = $1`, [id]);
}

/**
 * Basis-PostgreSQL-Provider
 * 
 * Enthält die Grundfunktionalität für die PostgreSQL-Verbindung
 * und gemeinsame Hilfsfunktionen.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { config, getPostgresConnectionString } from '../../config';
import type { DatabaseProvider } from '../db-provider';
import { DatabaseError, DatabaseErrorCode, createDatabaseError } from '../errors';

export interface PgRow {
  [key: string]: any;
}

// ============================================================
// PostgreSQL Verbindung Pool
// ============================================================

let pool: Pool | null = null;

/**
 * Initialisiert den PostgreSQL Verbindungspool
 */
export function initPostgresPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = getPostgresConnectionString();
  
  pool = new Pool({
    connectionString,
    ssl: config.postgres.ssl ? {
      rejectUnauthorized: false,
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unerwarteter PostgreSQL Fehler:', err);
  });

  return pool;
}

/**
 * Gibt den aktuellen Verbindungspool zurück
 */
export function getPostgresPool(): Pool {
  if (!pool) {
    initPostgresPool();
  }
  return pool!;
}

/**
 * Schließt den Verbindungspool (für Tests)
 */
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Führt eine Query mit einem Client aus
 */
export async function queryWithClient<T>(
  client: PoolClient,
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    return await client.query(text, params);
  } catch (error) {
    throw createDatabaseError(error, 'PostgreSQL Query Error');
  }
}

/**
 * Führt eine Query mit dem Pool aus
 */
export async function query<T>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const client = getPostgresPool();
  try {
    return await client.query(text, params);
  } catch (error) {
    throw createDatabaseError(error, 'PostgreSQL Query Error');
  }
}

/**
 * Führt eine Transaktion aus
 */
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPostgresPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw createDatabaseError(error, 'PostgreSQL Transaction Error');
  } finally {
    client.release();
  }
}

// ============================================================
// Mapping-Funktionen
// ============================================================

/**
 * Konvertiert snake_case zu camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Konvertiert ein PostgreSQL-Ergebnisobjekt von snake_case zu camelCase
 */
export function mapToCamelCase(obj: PgRow): PgRow {
  const result: PgRow = {};
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = obj[key];
  }
  return result;
}

/**
 * Konvertiert camelCase zu snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Konvertiert ein Objekt von camelCase zu snake_case für Datenbank-Operationen
 */
export function mapToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = obj[key];
  }
  return result;
}

// ============================================================
// Query-Builder-Hilfsfunktionen
// ============================================================

export interface WhereClause {
  column: string;
  operator: string;
  value: any;
}

export interface OrderBy {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Erstellt eine WHERE-Klausel aus Filtern
 */
export function buildWhereClause(
  filters: Record<string, any>,
  params: any[] = [],
  paramIndex: number = 1
): { clause: string; params: any[]; newIndex: number } {
  const conditions: string[] = [];
  
  for (const key of Object.keys(filters)) {
    const snakeKey = toSnakeCase(key);
    const value = filters[key];
    
    if (value === undefined || value === null) {
      continue;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Komplexe Filter (z.B. { gt: 10 })
      for (const op of Object.keys(value)) {
        conditions.push(`${snakeKey} ${op} $${paramIndex}`);
        params.push(value[op]);
        paramIndex++;
      }
    } else {
      conditions.push(`${snakeKey} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }
  
  if (conditions.length === 0) {
    return { clause: '', params, newIndex: paramIndex };
  }
  
  return {
    clause: `WHERE ${conditions.join(' AND ')}`,
    params,
    newIndex: paramIndex,
  };
}

/**
 * Erstellt eine ORDER BY-Klausel
 */
export function buildOrderBy(
  orderBy?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): string {
  if (!orderBy) {
    return '';
  }
  const snakeCol = toSnakeCase(orderBy);
  return `ORDER BY ${snakeCol} ${orderDirection}`;
}

/**
 * Erstellt LIMIT und OFFSET Klauseln
 */
export function buildPagination(
  limit?: number,
  offset?: number,
  params: any[] = [],
  paramIndex: number = 1
): { clause: string; params: any[]; newIndex: number } {
  const parts: string[] = [];
  
  if (limit !== undefined) {
    parts.push(`LIMIT $${paramIndex}`);
    params.push(limit);
    paramIndex++;
  }
  
  if (offset !== undefined) {
    parts.push(`OFFSET $${paramIndex}`);
    params.push(offset);
    paramIndex++;
  }
  
  return {
    clause: parts.length > 0 ? parts.join(' ') : '',
    params,
    newIndex: paramIndex,
  };
}

/**
 * PostgreSQL Provider für User Settings und Statistiken
 */

import { query, toSnakeCase } from './base-provider';
import type {
  UserSettings,
  QueryOptions,
  DateRangeFilter,
  AggregationResult,
} from '../types';
import type { Verbrauchstyp, Verbrauchswert } from '../types';

const SETTINGS_TABLE = 'user_settings';

// ============================================================
// User Settings
// ============================================================

function mapRowToUserSettings(row: any): UserSettings {
  return {
    id: row.id,
    user_id: row.user_id,
    key: row.key,
    value: row.value,
    erstellt_am: row.erstellt_am,
    aktualisiert_am: row.aktualisiert_am,
  };
}

export async function getUserSetting(userId: string, key: string): Promise<UserSettings | null> {
  const result = await query(
    `SELECT * FROM ${SETTINGS_TABLE} WHERE user_id = $1 AND key = $2`,
    [userId, key]
  );
  return result.rows.length > 0 ? mapRowToUserSettings(result.rows[0]) : null;
}

export async function getUserSettings(userId: string): Promise<UserSettings[]> {
  const result = await query(
    `SELECT * FROM ${SETTINGS_TABLE} WHERE user_id = $1 ORDER BY key`,
    [userId]
  );
  return result.rows.map(mapRowToUserSettings);
}

export async function setUserSetting(userId: string, key: string, value: unknown): Promise<UserSettings> {
  // Erst prüfen ob die Einstellung existiert
  const existing = await getUserSetting(userId, key);
  
  if (existing) {
    const result = await query(
      `UPDATE ${SETTINGS_TABLE} SET value = $1, aktualisiert_am = NOW() WHERE id = $2 RETURNING *`,
      [value, existing.id]
    );
    return mapRowToUserSettings(result.rows[0]);
  } else {
    const result = await query(
      `INSERT INTO ${SETTINGS_TABLE} (user_id, key, value) VALUES ($1, $2, $3) RETURNING *`,
      [userId, key, value]
    );
    return mapRowToUserSettings(result.rows[0]);
  }
}

export async function deleteUserSetting(userId: string, key: string): Promise<void> {
  await query(
    `DELETE FROM ${SETTINGS_TABLE} WHERE user_id = $1 AND key = $2`,
    [userId, key]
  );
}

// ============================================================
// Aggregationen und Statistiken
// ============================================================

export async function getVerbrauchstypenStats(userId: string): Promise<{
  typ: Verbrauchstyp;
  count: number;
  latestValue?: Verbrauchswert;
}[]> {
  // Hole alle Verbrauchstypen
  const typenResult = await query(
    `SELECT * FROM verbrauchstyp WHERE user_id = $1 ORDER BY name`,
    [userId]
  );
  
  const result: { typ: Verbrauchstyp; count: number; latestValue?: Verbrauchswert }[] = [];
  
  for (const typRow of typenResult.rows) {
    const typ: Verbrauchstyp = {
      id: typRow.id,
      user_id: typRow.user_id,
      name: typRow.name,
      einheit: typRow.einheit,
      symbol: typRow.symbol,
      farbe: typRow.farbe,
      bild_url: typRow.bild_url,
      erstellt_am: typRow.erstellt_am,
      aktualisiert_am: typRow.aktualisiert_am,
    };
    
    // Zähle Verbrauchswerte
    const countResult = await query(
      `SELECT COUNT(*) as count FROM verbrauchswert WHERE verbrauchstyp_id = $1`,
      [typ.id]
    );
    const count = parseInt(countResult.rows[0].count, 10);
    
    // Hole letzten Verbrauchswert
    let latestValue: Verbrauchswert | undefined;
    const latestResult = await query(
      `SELECT * FROM verbrauchswert WHERE verbrauchstyp_id = $1 ORDER BY datum DESC LIMIT 1`,
      [typ.id]
    );
    if (latestResult.rows.length > 0) {
      latestValue = {
        id: latestResult.rows[0].id,
        user_id: latestResult.rows[0].user_id,
        verbrauchstyp_id: latestResult.rows[0].verbrauchstyp_id,
        verbrauchsstelle_id: latestResult.rows[0].verbrauchsstelle_id,
        datum: latestResult.rows[0].datum,
        zaehlerstand: latestResult.rows[0].zaehlerstand,
        verbrauch: latestResult.rows[0].verbrauch,
        bild_url: latestResult.rows[0].bild_url,
        notizen: latestResult.rows[0].notizen,
        erstellt_am: latestResult.rows[0].erstellt_am,
        aktualisiert_am: latestResult.rows[0].aktualisiert_am,
      };
    }
    
    result.push({ typ, count, latestValue });
  }
  
  return result;
}

export async function getVerbrauchStats(
  userId: string,
  verbrauchstypId: string,
  filter: DateRangeFilter
): Promise<AggregationResult> {
  const whereClauses: string[] = ['user_id = $1', 'verbrauchstyp_id = $2'];
  const params: any[] = [userId, verbrauchstypId];
  let paramIndex = 3;
  
  if (filter.startDate) {
    whereClauses.push(`datum >= $${paramIndex}`);
    params.push(filter.startDate);
    paramIndex++;
  }
  if (filter.endDate) {
    whereClauses.push(`datum <= $${paramIndex}`);
    params.push(filter.endDate);
    paramIndex++;
  }
  
  const whereClause = whereClauses.join(' AND ');
  
  const result = await query(
    `SELECT 
      COUNT(*) as count,
      COALESCE(SUM(verbrauch), 0) as sum,
      COALESCE(AVG(verbrauch), 0) as avg,
      COALESCE(MIN(verbrauch), 0) as min,
      COALESCE(MAX(verbrauch), 0) as max
    FROM verbrauchswert
    WHERE ${whereClause}`,
    params
  );
  
  const row = result.rows[0];
  return {
    count: parseInt(row.count, 10),
    sum: parseFloat(row.sum),
    avg: parseFloat(row.avg),
    min: parseFloat(row.min),
    max: parseFloat(row.max),
  };
}

export async function getVerbrauchByMonth(
  userId: string,
  verbrauchstypId: string,
  year: number
): Promise<{ month: number; verbrauch: number; kosten: number }[]> {
  // Hole alle Verbrauchswerte für den Typ und Jahr
  const result = await query(
    `SELECT 
      EXTRACT(MONTH FROM datum) as month,
      COALESCE(SUM(verbrauch), 0) as verbrauch
    FROM verbrauchswert
    WHERE user_id = $1 AND verbrauchstyp_id = $2
      AND EXTRACT(YEAR FROM datum) = $3
    GROUP BY EXTRACT(MONTH FROM datum)
    ORDER BY month`,
    [userId, verbrauchstypId, year]
  );
  
  // Für jeden Monat, berechne Kosten
  // (Hier vereinfacht - in der echten Implementierung müsste man die Preisperiode berücksichtigen)
  return result.rows.map((row: any) => ({
    month: parseInt(row.month, 10),
    verbrauch: parseFloat(row.verbrauch),
    kosten: 0, // Kostenberechnung fehlt - braucht Preisperiode
  }));
}

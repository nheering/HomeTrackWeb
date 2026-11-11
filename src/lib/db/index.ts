/**
 * Datenbank-Modul
 * 
 * Dieses Modul bietet eine Abstraktionsschicht für die Datenbank,
 * die das einfache Umschalten zwischen verschiedenen Providern ermöglicht.
 * 
 * @example
 * ```typescript
 * import { createDatabaseProvider } from '@/lib/db';
 * 
 * const db = createDatabaseProvider();
 * 
 * // Verbrauchstypen abrufen
 * const typen = await db.getVerbrauchstypen(userId);
 * 
 * // neuen Verbrauchstyp erstellen
 * const neuerTyp = await db.createVerbrauchstyp({
 *   userId,
 *   name: 'Strom',
 *   einheit: 'kWh',
 * });
 * ```
 */

// Types
export type {
  Verbrauchstyp,
  CreateVerbrauchstyp,
  UpdateVerbrauchstyp,
  Verbrauchsstelle,
  CreateVerbrauchsstelle,
  UpdateVerbrauchsstelle,
  Anbieter,
  CreateAnbieter,
  UpdateAnbieter,
  Vertrag,
  CreateVertrag,
  UpdateVertrag,
  Preisperiode,
  CreatePreisperiode,
  UpdatePreisperiode,
  Verbrauchswert,
  CreateVerbrauchswert,
  UpdateVerbrauchswert,
  UserSettings,
  CreateUserSettings,
  UpdateUserSettings,
  Handwerker,
  CreateHandwerker,
  UpdateHandwerker,
  Handwerkerrechnung,
  CreateHandwerkerrechnung,
  UpdateHandwerkerrechnung,
  QueryOptions,
  DateRangeFilter,
  AggregationResult,
} from './types';

// Errors
export {
  DatabaseError,
  DatabaseErrorCode,
  isDatabaseError,
  isNotFoundError,
  isValidationError,
  isConnectionError,
  createDatabaseError,
} from './errors';

// Provider
export type { DatabaseProvider } from './db-provider';
export {
  createDatabaseProvider,
  resetDatabaseProvider,
  getDatabaseProvider,
} from './db-provider';

// Implementierungen
export { HasuraDatabaseProvider } from './hasura-db-provider';
export { PostgresDatabaseProvider } from './postgres-db-provider';

// Konfiguration
export { config as dbConfig } from '../config';

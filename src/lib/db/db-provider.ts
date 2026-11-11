/**
 * Datenbank-Provider Schnittstelle
 * 
 * Diese Schnittstelle definiert den Vertrag für Datenbank-Provider.
 * Sie ermöglicht das einfache Umschalten zwischen verschiedenen Datenbank-Backends
 * (Nhost/Hasura GraphQL, direktes PostgreSQL, etc.).
 */

import {
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
import { DatabaseError, DatabaseErrorCode } from './errors';

// ============================================================
// DatabaseProvider Schnittstelle
// ============================================================

export interface DatabaseProvider {
  // ==========================================================
  // Verbrauchstypen
  // ==========================================================
  
  /**
   * Gibt alle Verbrauchstypen eines Benutzers zurück
   */
  getVerbrauchstypen(userId: string, options?: QueryOptions): Promise<Verbrauchstyp[]>;
  
  /**
   * Gibt einen bestimmten Verbrauchstyp zurück
   */
  getVerbrauchstyp(id: string): Promise<Verbrauchstyp | null>;
  
  /**
   * Erstellt einen neuen Verbrauchstyp
   */
  createVerbrauchstyp(data: CreateVerbrauchstyp): Promise<Verbrauchstyp>;
  
  /**
   * Aktualisiert einen Verbrauchstyp
   */
  updateVerbrauchstyp(id: string, data: UpdateVerbrauchstyp): Promise<Verbrauchstyp>;
  
  /**
   * Löscht einen Verbrauchstyp
   */
  deleteVerbrauchstyp(id: string): Promise<void>;

  // ==========================================================
  // Verbrauchsstellen
  // ==========================================================
  
  /**
   * Gibt alle Verbrauchsstellen eines Benutzers zurück
   */
  getVerbrauchsstellen(userId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]>;
  
  /**
   * Gibt alle Verbrauchsstellen für einen bestimmten Verbrauchstyp zurück
   */
  getVerbrauchsstellenByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]>;
  
  /**
   * Gibt eine bestimmte Verbrauchsstelle zurück
   */
  getVerbrauchsstelle(id: string): Promise<Verbrauchsstelle | null>;
  
  /**
   * Erstellt eine neue Verbrauchsstelle
   */
  createVerbrauchsstelle(data: CreateVerbrauchsstelle): Promise<Verbrauchsstelle>;
  
  /**
   * Aktualisiert eine Verbrauchsstelle
   */
  updateVerbrauchsstelle(id: string, data: UpdateVerbrauchsstelle): Promise<Verbrauchsstelle>;
  
  /**
   * Löscht eine Verbrauchsstelle
   */
  deleteVerbrauchsstelle(id: string): Promise<void>;
  
  /**
   * Setzt eine Verbrauchsstelle als Standard für ihren Typ
   */
  setStandardVerbrauchsstelle(verbrauchstypId: string, verbrauchsstelleId: string): Promise<void>;

  // ==========================================================
  // Anbieter
  // ==========================================================
  
  /**
   * Gibt alle Anbieter eines Benutzers zurück
   */
  getAnbieter(userId: string, options?: QueryOptions): Promise<Anbieter[]>;
  
  /**
   * Gibt alle Anbieter für einen bestimmten Verbrauchstyp zurück
   */
  getAnbieterByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Anbieter[]>;
  
  /**
   * Gibt einen bestimmten Anbieter zurück
   */
  getAnbieter(id: string): Promise<Anbieter | null>;
  
  /**
   * Erstellt einen neuen Anbieter
   */
  createAnbieter(data: CreateAnbieter): Promise<Anbieter>;
  
  /**
   * Aktualisiert einen Anbieter
   */
  updateAnbieter(id: string, data: UpdateAnbieter): Promise<Anbieter>;
  
  /**
   * Löscht einen Anbieter
   */
  deleteAnbieter(id: string): Promise<void>;

  // ==========================================================
  // Verträge
  // ==========================================================
  
  /**
   * Gibt alle Verträge eines Benutzers zurück
   */
  getVerträge(userId: string, options?: QueryOptions): Promise<Vertrag[]>;
  
  /**
   * Gibt alle Verträge für einen bestimmten Anbieter zurück
   */
  getVerträgeByAnbieter(anbieterId: string, options?: QueryOptions): Promise<Vertrag[]>;
  
  /**
   * Gibt alle aktiven Verträge für einen bestimmten Verbrauchstyp zurück
   */
  getActiveVerträgeByTyp(verbrauchstypId: string): Promise<Vertrag[]>;
  
  /**
   * Gibt einen bestimmten Vertrag zurück
   */
  getVertrag(id: string): Promise<Vertrag | null>;
  
  /**
   * Erstellt einen neuen Vertrag
   */
  createVertrag(data: CreateVertrag): Promise<Vertrag>;
  
  /**
   * Aktualisiert einen Vertrag
   */
  updateVertrag(id: string, data: UpdateVertrag): Promise<Vertrag>;
  
  /**
   * Löscht einen Vertrag
   */
  deleteVertrag(id: string): Promise<void>;

  // ==========================================================
  // Preisperioden
  // ==========================================================
  
  /**
   * Gibt alle Preisperioden für einen Vertrag zurück
   */
  getPreisperiodenByVertrag(vertragId: string, options?: QueryOptions): Promise<Preisperiode[]>;
  
  /**
   * Gibt die aktuelle Preisperiode für einen Vertrag zurück
   */
  getCurrentPreisperiode(vertragId: string, date?: string): Promise<Preisperiode | null>;
  
  /**
   * Gibt eine bestimmte Preisperiode zurück
   */
  getPreisperiode(id: string): Promise<Preisperiode | null>;
  
  /**
   * Erstellt eine neue Preisperiode
   */
  createPreisperiode(data: CreatePreisperiode): Promise<Preisperiode>;
  
  /**
   * Aktualisiert eine Preisperiode
   */
  updatePreisperiode(id: string, data: UpdatePreisperiode): Promise<Preisperiode>;
  
  /**
   * Löscht eine Preisperiode
   */
  deletePreisperiode(id: string): Promise<void>;

  // ==========================================================
  // Verbrauchswerte
  // ==========================================================
  
  /**
   * Gibt alle Verbrauchswerte für einen Verbrauchstyp zurück
   */
  getVerbrauchswerteByTyp(verbrauchstypId: string, options?: QueryOptions & DateRangeFilter): Promise<Verbrauchswert[]>;
  
  /**
   * Gibt alle Verbrauchswerte für eine Verbrauchsstelle zurück
   */
  getVerbrauchswerteByStelle(verbrauchsstelleId: string, options?: QueryOptions & DateRangeFilter): Promise<Verbrauchswert[]>;
  
  /**
   * Gibt den letzten Verbrauchswert für eine Verbrauchsstelle vor einem bestimmten Datum zurück
   */
  getLastVerbrauchswert(verbrauchstypId: string, verbrauchsstelleId: string, date: string): Promise<Verbrauchswert | null>;
  
  /**
   * Gibt den vorherigen Verbrauchswert (für Verbrauchsberechnung) zurück
   */
  getPreviousVerbrauchswert(verbrauchstypId: string, verbrauchsstelleId: string, date: string, excludeId: string): Promise<Verbrauchswert | null>;
  
  /**
   * Gibt einen bestimmten Verbrauchswert zurück
   */
  getVerbrauchswert(id: string): Promise<Verbrauchswert | null>;
  
  /**
   * Erstellt einen neuen Verbrauchswert
   */
  createVerbrauchswert(data: CreateVerbrauchswert): Promise<Verbrauchswert>;
  
  /**
   * Aktualisiert einen Verbrauchswert
   */
  updateVerbrauchswert(id: string, data: UpdateVerbrauchswert): Promise<Verbrauchswert>;
  
  /**
   * Löscht einen Verbrauchswert
   */
  deleteVerbrauchswert(id: string): Promise<void>;
  
  /**
   * Berechnet den Verbrauch für alle Werte eines Typs neu
   * (wird aufgerufen wenn sich Werte ändern)
   */
  recalculateVerbrauchForTyp(verbrauchstypId: string): Promise<void>;

  // ==========================================================
  // User Settings
  // ==========================================================
  
  /**
   * Gibt eine bestimmte User-Einstellung zurück
   */
  getUserSetting(userId: string, key: string): Promise<UserSettings | null>;
  
  /**
   * Gibt alle User-Einstellungen zurück
   */
  getUserSettings(userId: string): Promise<UserSettings[]>;
  
  /**
   * Erstellt oder aktualisiert eine User-Einstellung
   */
  setUserSetting(userId: string, key: string, value: unknown): Promise<UserSettings>;
  
  /**
   * Löscht eine User-Einstellung
   */
  deleteUserSetting(userId: string, key: string): Promise<void>;

  // ==========================================================
  // Handwerker
  // ==========================================================
  
  /**
   * Gibt alle Handwerker eines Benutzers zurück
   */
  getHandwerker(userId: string, options?: QueryOptions): Promise<Handwerker[]>;
  
  /**
   * Gibt einen bestimmten Handwerker zurück
   */
  getHandwerker(id: string): Promise<Handwerker | null>;
  
  /**
   * Erstellt einen neuen Handwerker
   */
  createHandwerker(data: CreateHandwerker): Promise<Handwerker>;
  
  /**
   * Aktualisiert einen Handwerker
   */
  updateHandwerker(id: string, data: UpdateHandwerker): Promise<Handwerker>;
  
  /**
   * Löscht einen Handwerker
   */
  deleteHandwerker(id: string): Promise<void>;

  // ==========================================================
  // Handwerkerrechnungen
  // ==========================================================
  
  /**
   * Gibt alle Handwerkerrechnungen eines Benutzers zurück
   */
  getHandwerkerrechnungen(userId: string, options?: QueryOptions & DateRangeFilter): Promise<Handwerkerrechnung[]>;
  
  /**
   * Gibt alle Handwerkerrechnungen für einen Handwerker zurück
   */
  getHandwerkerrechnungenByHandwerker(handwerkerId: string, options?: QueryOptions): Promise<Handwerkerrechnung[]>;
  
  /**
   * Gibt eine bestimmte Handwerkerrechnung zurück
   */
  getHandwerkerrechnung(id: string): Promise<Handwerkerrechnung | null>;
  
  /**
   * Erstellt eine neue Handwerkerrechnung
   */
  createHandwerkerrechnung(data: CreateHandwerkerrechnung): Promise<Handwerkerrechnung>;
  
  /**
   * Aktualisiert eine Handwerkerrechnung
   */
  updateHandwerkerrechnung(id: string, data: UpdateHandwerkerrechnung): Promise<Handwerkerrechnung>;
  
  /**
   * Löscht eine Handwerkerrechnung
   */
  deleteHandwerkerrechnung(id: string): Promise<void>;

  // ==========================================================
  // Aggregationen und Statistiken
  // ==========================================================
  
  /**
   * Gibt aggregierte Daten für Verbrauchstypen zurück
   */
  getVerbrauchstypenStats(userId: string): Promise<{
    typ: Verbrauchstyp;
    count: number;
    latestValue?: Verbrauchswert;
  }[]>;
  
  /**
   * Gibt aggregierte Verbrauchsdaten für einen bestimmten Zeitraum zurück
   */
  getVerbrauchStats(userId: string, verbrauchstypId: string, filter: DateRangeFilter): Promise<AggregationResult>;
  
  /**
   * Gibt Verbrauchsdaten nach Monat gruppiert zurück
   */
  getVerbrauchByMonth(userId: string, verbrauchstypId: string, year: number): Promise<{
    month: number;
    verbrauch: number;
    kosten: number;
  }[]>;
}

// ============================================================
// Factory-Funktion
// ============================================================

import { config, isNhostBackend, isPostgresBackend } from '../config';
import { HasuraDatabaseProvider } from './hasura-db-provider';
import { PostgresDatabaseProvider } from './postgres-db-provider';

let dbProviderInstance: DatabaseProvider | null = null;

// ============================================================
// React Context für DB-Provider
// ============================================================

import React from 'react';

export const DatabaseContext = React.createContext<DatabaseProvider>(createDatabaseProvider());

/**
 * Hook um auf den DB-Provider zuzugreifen
 */
export function useDatabase(): DatabaseProvider {
  const context = React.useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseContext.Provider');
  }
  return context;
}

/**
 * Erstellt einen Datenbank-Provider basierend auf der Konfiguration
 */
export function createDatabaseProvider(): DatabaseProvider {
  // Singleton-Pattern: Immer dieselbe Instanz zurückgeben
  if (dbProviderInstance) {
    return dbProviderInstance;
  }

  // Basierend auf der Konfiguration den passenden Provider erstellen
  if (isNhostBackend()) {
    dbProviderInstance = new HasuraDatabaseProvider();
  } else if (isPostgresBackend()) {
    dbProviderInstance = new PostgresDatabaseProvider();
  } else {
    // Standard: Nhost
    dbProviderInstance = new HasuraDatabaseProvider();
  }

  return dbProviderInstance;
}

/**
 * Setzt den Datenbank-Provider zurück (für Tests)
 */
export function resetDatabaseProvider(): void {
  dbProviderInstance = null;
}

/**
 * Gibt den aktuellen Datenbank-Provider zurück
 */
export function getDatabaseProvider(): DatabaseProvider {
  return createDatabaseProvider();
}

export default {
  createDatabaseProvider,
  resetDatabaseProvider,
  getDatabaseProvider,
};

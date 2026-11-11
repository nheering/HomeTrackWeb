/**
 * PostgreSQL Datenbank-Provider
 * 
 * Dieser Provider verwendet direkte PostgreSQL-Queries.
 * Er implementiert die DatabaseProvider-Schnittstelle.
 */

import type { DatabaseProvider } from './db-provider';
import type {
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

// Importiere alle Teil-Provider
import * as verbrauchstypProvider from './postgres/verbrauchstyp-provider';
import * as verbrauchsstelleProvider from './postgres/verbrauchsstelle-provider';
import * as verbrauchswertProvider from './postgres/verbrauchswert-provider';
import * as anbieterProvider from './postgres/anbieter-provider';
import * as handwerkerProvider from './postgres/handwerker-provider';
import * as settingsProvider from './postgres/settings-provider';

/**
 * PostgreSQL Database Provider
 * 
 * Implementiert alle Methoden der DatabaseProvider-Schnittstelle
 * durch Delegation an die jeweiligen Teil-Provider.
 */
export class PostgresDatabaseProvider implements DatabaseProvider {
  // ============================================================
  // Verbrauchstypen
  // ============================================================
  
  async getVerbrauchstypen(userId: string, options?: QueryOptions): Promise<Verbrauchstyp[]> {
    return verbrauchstypProvider.getVerbrauchstypen(userId, options);
  }
  
  async getVerbrauchstyp(id: string): Promise<Verbrauchstyp | null> {
    return verbrauchstypProvider.getVerbrauchstyp(id);
  }
  
  async createVerbrauchstyp(data: CreateVerbrauchstyp): Promise<Verbrauchstyp> {
    return verbrauchstypProvider.createVerbrauchstyp(data);
  }
  
  async updateVerbrauchstyp(id: string, data: UpdateVerbrauchstyp): Promise<Verbrauchstyp> {
    return verbrauchstypProvider.updateVerbrauchstyp(id, data);
  }
  
  async deleteVerbrauchstyp(id: string): Promise<void> {
    return verbrauchstypProvider.deleteVerbrauchstyp(id);
  }
  
  // ============================================================
  // Verbrauchsstellen
  // ============================================================
  
  async getVerbrauchsstellen(userId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]> {
    return verbrauchsstelleProvider.getVerbrauchsstellen(userId, options);
  }
  
  async getVerbrauchsstellenByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Verbrauchsstelle[]> {
    return verbrauchsstelleProvider.getVerbrauchsstellenByTyp(verbrauchstypId, options);
  }
  
  async getVerbrauchsstelle(id: string): Promise<Verbrauchsstelle | null> {
    return verbrauchsstelleProvider.getVerbrauchsstelle(id);
  }
  
  async createVerbrauchsstelle(data: CreateVerbrauchsstelle): Promise<Verbrauchsstelle> {
    return verbrauchsstelleProvider.createVerbrauchsstelle(data);
  }
  
  async updateVerbrauchsstelle(id: string, data: UpdateVerbrauchsstelle): Promise<Verbrauchsstelle> {
    return verbrauchsstelleProvider.updateVerbrauchsstelle(id, data);
  }
  
  async deleteVerbrauchsstelle(id: string): Promise<void> {
    return verbrauchsstelleProvider.deleteVerbrauchsstelle(id);
  }
  
  async setStandardVerbrauchsstelle(verbrauchstypId: string, verbrauchsstelleId: string): Promise<void> {
    return verbrauchsstelleProvider.setStandardVerbrauchsstelle(verbrauchstypId, verbrauchsstelleId);
  }
  
  // ============================================================
  // Anbieter
  // ============================================================
  
  async getAnbieter(userId: string, options?: QueryOptions): Promise<Anbieter[]> {
    return anbieterProvider.getAnbieter(userId, options);
  }
  
  async getAnbieterByTyp(verbrauchstypId: string, options?: QueryOptions): Promise<Anbieter[]> {
    return anbieterProvider.getAnbieterByTyp(verbrauchstypId, options);
  }
  
  async getAnbieter(id: string): Promise<Anbieter | null> {
    return anbieterProvider.getAnbieter(id);
  }
  
  async createAnbieter(data: CreateAnbieter): Promise<Anbieter> {
    return anbieterProvider.createAnbieter(data);
  }
  
  async updateAnbieter(id: string, data: UpdateAnbieter): Promise<Anbieter> {
    return anbieterProvider.updateAnbieter(id, data);
  }
  
  async deleteAnbieter(id: string): Promise<void> {
    return anbieterProvider.deleteAnbieter(id);
  }
  
  // ============================================================
  // Verträge
  // ============================================================
  
  async getVerträge(userId: string, options?: QueryOptions): Promise<Vertrag[]> {
    return anbieterProvider.getVerträge(userId, options);
  }
  
  async getVerträgeByAnbieter(anbieterId: string, options?: QueryOptions): Promise<Vertrag[]> {
    return anbieterProvider.getVerträgeByAnbieter(anbieterId, options);
  }
  
  async getActiveVerträgeByTyp(verbrauchstypId: string): Promise<Vertrag[]> {
    return anbieterProvider.getActiveVerträgeByTyp(verbrauchstypId);
  }
  
  async getVertrag(id: string): Promise<Vertrag | null> {
    return anbieterProvider.getVertrag(id);
  }
  
  async createVertrag(data: CreateVertrag): Promise<Vertrag> {
    return anbieterProvider.createVertrag(data);
  }
  
  async updateVertrag(id: string, data: UpdateVertrag): Promise<Vertrag> {
    return anbieterProvider.updateVertrag(id, data);
  }
  
  async deleteVertrag(id: string): Promise<void> {
    return anbieterProvider.deleteVertrag(id);
  }
  
  // ============================================================
  // Preisperioden
  // ============================================================
  
  async getPreisperiodenByVertrag(vertragId: string, options?: QueryOptions): Promise<Preisperiode[]> {
    return anbieterProvider.getPreisperiodenByVertrag(vertragId, options);
  }
  
  async getCurrentPreisperiode(vertragId: string, date?: string): Promise<Preisperiode | null> {
    return anbieterProvider.getCurrentPreisperiode(vertragId, date);
  }
  
  async getPreisperiode(id: string): Promise<Preisperiode | null> {
    return anbieterProvider.getPreisperiode(id);
  }
  
  async createPreisperiode(data: CreatePreisperiode): Promise<Preisperiode> {
    return anbieterProvider.createPreisperiode(data);
  }
  
  async updatePreisperiode(id: string, data: UpdatePreisperiode): Promise<Preisperiode> {
    return anbieterProvider.updatePreisperiode(id, data);
  }
  
  async deletePreisperiode(id: string): Promise<void> {
    return anbieterProvider.deletePreisperiode(id);
  }
  
  // ============================================================
  // Verbrauchswerte
  // ============================================================
  
  async getVerbrauchswerteByTyp(verbrauchstypId: string, options?: QueryOptions & DateRangeFilter): Promise<Verbrauchswert[]> {
    return verbrauchswertProvider.getVerbrauchswerteByTyp(verbrauchstypId, options);
  }
  
  async getVerbrauchswerteByStelle(verbrauchsstelleId: string, options?: QueryOptions & DateRangeFilter): Promise<Verbrauchswert[]> {
    return verbrauchswertProvider.getVerbrauchswerteByStelle(verbrauchsstelleId, options);
  }
  
  async getLastVerbrauchswert(verbrauchstypId: string, verbrauchsstelleId: string, date: string): Promise<Verbrauchswert | null> {
    return verbrauchswertProvider.getLastVerbrauchswert(verbrauchstypId, verbrauchsstelleId, date);
  }
  
  async getPreviousVerbrauchswert(verbrauchstypId: string, verbrauchsstelleId: string, date: string, excludeId: string): Promise<Verbrauchswert | null> {
    return verbrauchswertProvider.getPreviousVerbrauchswert(verbrauchstypId, verbrauchsstelleId, date, excludeId);
  }
  
  async getVerbrauchswert(id: string): Promise<Verbrauchswert | null> {
    return verbrauchswertProvider.getVerbrauchswert(id);
  }
  
  async createVerbrauchswert(data: CreateVerbrauchswert): Promise<Verbrauchswert> {
    return verbrauchswertProvider.createVerbrauchswert(data);
  }
  
  async updateVerbrauchswert(id: string, data: UpdateVerbrauchswert): Promise<Verbrauchswert> {
    return verbrauchswertProvider.updateVerbrauchswert(id, data);
  }
  
  async deleteVerbrauchswert(id: string): Promise<void> {
    return verbrauchswertProvider.deleteVerbrauchswert(id);
  }
  
  async recalculateVerbrauchForTyp(verbrauchstypId: string): Promise<void> {
    return verbrauchswertProvider.recalculateVerbrauchForTyp(verbrauchstypId);
  }
  
  // ============================================================
  // User Settings
  // ============================================================
  
  async getUserSetting(userId: string, key: string): Promise<UserSettings | null> {
    return settingsProvider.getUserSetting(userId, key);
  }
  
  async getUserSettings(userId: string): Promise<UserSettings[]> {
    return settingsProvider.getUserSettings(userId);
  }
  
  async setUserSetting(userId: string, key: string, value: unknown): Promise<UserSettings> {
    return settingsProvider.setUserSetting(userId, key, value);
  }
  
  async deleteUserSetting(userId: string, key: string): Promise<void> {
    return settingsProvider.deleteUserSetting(userId, key);
  }
  
  // ============================================================
  // Handwerker
  // ============================================================
  
  async getHandwerker(userId: string, options?: QueryOptions): Promise<Handwerker[]> {
    return handwerkerProvider.getHandwerker(userId, options);
  }
  
  async getHandwerker(id: string): Promise<Handwerker | null> {
    return handwerkerProvider.getHandwerker(id);
  }
  
  async createHandwerker(data: CreateHandwerker): Promise<Handwerker> {
    return handwerkerProvider.createHandwerker(data);
  }
  
  async updateHandwerker(id: string, data: UpdateHandwerker): Promise<Handwerker> {
    return handwerkerProvider.updateHandwerker(id, data);
  }
  
  async deleteHandwerker(id: string): Promise<void> {
    return handwerkerProvider.deleteHandwerker(id);
  }
  
  // ============================================================
  // Handwerkerrechnungen
  // ============================================================
  
  async getHandwerkerrechnungen(userId: string, options?: QueryOptions & DateRangeFilter): Promise<Handwerkerrechnung[]> {
    return handwerkerProvider.getHandwerkerrechnungen(userId, options);
  }
  
  async getHandwerkerrechnungenByHandwerker(handwerkerId: string, options?: QueryOptions): Promise<Handwerkerrechnung[]> {
    return handwerkerProvider.getHandwerkerrechnungenByHandwerker(handwerkerId, options);
  }
  
  async getHandwerkerrechnung(id: string): Promise<Handwerkerrechnung | null> {
    return handwerkerProvider.getHandwerkerrechnung(id);
  }
  
  async createHandwerkerrechnung(data: CreateHandwerkerrechnung): Promise<Handwerkerrechnung> {
    return handwerkerProvider.createHandwerkerrechnung(data);
  }
  
  async updateHandwerkerrechnung(id: string, data: UpdateHandwerkerrechnung): Promise<Handwerkerrechnung> {
    return handwerkerProvider.updateHandwerkerrechnung(id, data);
  }
  
  async deleteHandwerkerrechnung(id: string): Promise<void> {
    return handwerkerProvider.deleteHandwerkerrechnung(id);
  }
  
  // ============================================================
  // Aggregationen und Statistiken
  // ============================================================
  
  async getVerbrauchstypenStats(userId: string): Promise<{
    typ: Verbrauchstyp;
    count: number;
    latestValue?: Verbrauchswert;
  }[]> {
    return settingsProvider.getVerbrauchstypenStats(userId);
  }
  
  async getVerbrauchStats(userId: string, verbrauchstypId: string, filter: DateRangeFilter): Promise<AggregationResult> {
    return settingsProvider.getVerbrauchStats(userId, verbrauchstypId, filter);
  }
  
  async getVerbrauchByMonth(userId: string, verbrauchstypId: string, year: number): Promise<{
    month: number;
    verbrauch: number;
    kosten: number;
  }[]> {
    return settingsProvider.getVerbrauchByMonth(userId, verbrauchstypId, year);
  }
}

export default PostgresDatabaseProvider;

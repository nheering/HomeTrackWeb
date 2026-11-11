/**
 * Zentrale Anwendungskonfiguration
 * 
 * Diese Datei definiert die Konfiguration für verschiedene Backend-Provider.
 * Sie ermöglicht das einfache Umschalten zwischen Nhost und eigenem PostgreSQL.
 */

export type BackendProvider = 'nhost' | 'postgres';
export type AuthProviderType = 'nhost' | 'local';

// ============================================================
// Nhost Konfiguration
// ============================================================
export interface NhostConfig {
  subdomain: string;
  region: string;
}

// ============================================================
// PostgreSQL Konfiguration
// ============================================================
export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

// ============================================================
// Authentifizierung Konfiguration
// ============================================================
export interface AuthConfig {
  provider: AuthProviderType;
  jwtSecret: string;
}

// ============================================================
// Hauptkonfiguration
// ============================================================
export interface AppConfig {
  backendProvider: BackendProvider;
  nhost: NhostConfig;
  postgres: PostgresConfig;
  auth: AuthConfig;
}

// ============================================================
// Standardkonfiguration mit Umgebungsvariablen
// ============================================================

// Nhost Standardwerte
const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'local';
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION || 'eu-central-1';

// PostgreSQL Standardwerte (für lokale Entwicklung mit Docker)
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const POSTGRES_DB = process.env.POSTGRES_DB || 'hometrack_db';
const POSTGRES_USER = process.env.POSTGRES_USER || 'hometrack_user';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'hometrack_pass';
const POSTGRES_SSL = process.env.POSTGRES_SSL === 'true';

// Auth Standardwerte
const AUTH_PROVIDER: AuthProviderType = (process.env.AUTH_PROVIDER as AuthProviderType) || 'nhost';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-change-in-production';

// Backend Provider (Hauptschalter)
const BACKEND_PROVIDER: BackendProvider = (process.env.BACKEND_PROVIDER as BackendProvider) || 'nhost';

// ============================================================
// Exportierte Konfiguration
// ============================================================

export const config: AppConfig = {
  backendProvider: BACKEND_PROVIDER,
  nhost: {
    subdomain: NHOST_SUBDOMAIN,
    region: NHOST_REGION,
  },
  postgres: {
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    ssl: POSTGRES_SSL,
  },
  auth: {
    provider: AUTH_PROVIDER,
    jwtSecret: JWT_SECRET,
  },
};

// ============================================================
// Hilfsfunktionen
// ============================================================

/**
 * Prüft ob das aktuelle Backend Nhost ist
 */
export function isNhostBackend(): boolean {
  return config.backendProvider === 'nhost';
}

/**
 * Prüft ob das aktuelle Backend PostgreSQL ist
 */
export function isPostgresBackend(): boolean {
  return config.backendProvider === 'postgres';
}

/**
 * Prüft ob Nhost Auth verwendet wird
 */
export function isNhostAuth(): boolean {
  return config.auth.provider === 'nhost';
}

/**
 * Prüft ob lokale Auth verwendet wird
 */
export function isLocalAuth(): boolean {
  return config.auth.provider === 'local';
}

/**
 * Gibt den aktuellen Backend-Provider zurück
 */
export function getBackendProvider(): BackendProvider {
  return config.backendProvider;
}

/**
 * Gibt die PostgreSQL-Verbindungsstring zurück
 */
export function getPostgresConnectionString(): string {
  return `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}:${config.postgres.port}/${config.postgres.database}`;
}

/**
 * Gibt die Nhost GraphQL URL zurück
 */
export function getNhostGraphqlUrl(): string {
  const isLocal = config.nhost.subdomain === 'local';
  return isLocal 
    ? 'https://local.hasura.nhost.run/v1/graphql' 
    : `https://${config.nhost.subdomain}.graphql.${config.nhost.region}.nhost.run/v1/graphql`;
}

/**
 * Gibt die Nhost Auth URL zurück
 */
export function getNhostAuthUrl(): string {
  const isLocal = config.nhost.subdomain === 'local';
  return isLocal 
    ? 'https://local.auth.nhost.run/v1' 
    : `https://${config.nhost.subdomain}.auth.${config.nhost.region}.nhost.run/v1`;
}

/**
 * Gibt die Nhost Storage URL zurück
 */
export function getNhostStorageUrl(): string {
  const isLocal = config.nhost.subdomain === 'local';
  return isLocal 
    ? 'https://local.storage.nhost.run/v1' 
    : `https://${config.nhost.subdomain}.storage.${config.nhost.region}.nhost.run/v1`;
}

export default config;

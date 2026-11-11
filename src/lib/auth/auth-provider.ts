/**
 * Authentifizierungs-Provider Schnittstelle
 * 
 * Diese Schnittstelle definiert den Vertrag für Authentifizierungs-Provider.
 * Sie ermöglicht das einfache Umschalten zwischen verschiedenen Authentifizierungsmethoden
 * (Nhost, lokaler PostgreSQL mit JWT, etc.).
 */

import {
  User,
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  UpdateUserData,
  Session,
  AuthError,
} from './types';

// ============================================================
// AuthProvider Schnittstelle
// ============================================================

export interface AuthProvider {
  /**
   * Meldet einen Benutzer mit E-Mail und Passwort an
   */
  signIn(credentials: SignInCredentials): Promise<AuthResult>;

  /**
   * Registriert einen neuen Benutzer
   */
  signUp(credentials: SignUpCredentials): Promise<AuthResult>;

  /**
   * Meldet den aktuellen Benutzer ab
   */
  signOut(): Promise<void>;

  /**
   * Gibt den aktuellen angemeldeten Benutzer zurück
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Gibt das aktuelle Access-Token zurück
   */
  getAccessToken(): string | null;

  /**
   * Aktualisiert die Benutzerdaten
   */
  updateUser(data: UpdateUserData): Promise<User>;

  /**
   * Ändert das Passwort
   */
  changePassword(newPassword: string, currentPassword?: string): Promise<void>;

  /**
   * Requestet einen Passwort-Reset
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Setzt das Passwort mit einem Reset-Token zurück
   */
  resetPassword(token: string, newPassword: string): Promise<void>;

  /**
   * Aktualisiert den Avatars (Bild-URL)
   */
  updateAvatar(file: File): Promise<{ avatarUrl: string }>;

  /**
   * Überprüft ob ein Benutzer angemeldet ist
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Gibt die aktuelle Sitzung zurück
   */
  getSession(): Promise<Session | null>;

  /**
   * Speichert die Sitzung (wird vom Provider intern verwaltet)
   */
  setSession(session: Session | null): Promise<void>;
}

// ============================================================
// Factory-Funktion zur Erstellung des AuthProviders
// ============================================================

import { config, isNhostAuth, isLocalAuth } from '../config';
import { NhostAuthProvider } from './nhost-auth-provider';
import { LocalAuthProvider } from './local-auth-provider';

let authProviderInstance: AuthProvider | null = null;

/**
 * Erstellt einen Authentifizierungs-Provider basierend auf der Konfiguration
 * 
 * @returns AuthProvider-Instanz
 */
export function createAuthProvider(): AuthProvider {
  // Singleton-Pattern: Immer dieselbe Instanz zurückgeben
  if (authProviderInstance) {
    return authProviderInstance;
  }

  // Basierend auf der Konfiguration den passenden Provider erstellen
  if (isNhostAuth()) {
    authProviderInstance = new NhostAuthProvider();
  } else if (isLocalAuth()) {
    authProviderInstance = new LocalAuthProvider();
  } else {
    // Standard: Nhost
    authProviderInstance = new NhostAuthProvider();
  }

  return authProviderInstance;
}

/**
 * Setzt den Authentifizierungs-Provider zurück (für Tests)
 */
export function resetAuthProvider(): void {
  authProviderInstance = null;
}

/**
 * Gibt den aktuellen Authentifizierungs-Provider zurück
 * 
 * @deprecated Verwende stattdessen createAuthProvider()
 */
export function getAuthProvider(): AuthProvider {
  return createAuthProvider();
}

// ============================================================
// Typguards für AuthError
// ============================================================

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export default {
  createAuthProvider,
  resetAuthProvider,
  getAuthProvider,
  isAuthError,
};

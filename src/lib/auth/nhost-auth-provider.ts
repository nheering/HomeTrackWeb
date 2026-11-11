/**
 * Nhost Authentifizierungs-Provider
 * 
 * Dieser Provider verwendet die Nhost Auth API für die Authentifizierung.
 * Er implementiert die AuthProvider-Schnittstelle.
 */

import { NhostClient } from '@nhost/nextjs';
import { config } from '../config';
import type {
  AuthProvider,
  User,
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  UpdateUserData,
  Session,
} from './types';
import { AuthError, AuthErrorCode } from './types';

// ============================================================
// Nhost Client Initialisierung
// ============================================================

// Erstelle einen neuen Nhost Client basierend auf der Konfiguration
function createNhostClient(): NhostClient {
  const isLocal = config.nhost.subdomain === 'local';
  
  return new NhostClient({
    subdomain: config.nhost.subdomain,
    region: config.nhost.region,
    authUrl: isLocal 
      ? 'https://local.auth.nhost.run/v1' 
      : `https://${config.nhost.subdomain}.auth.${config.nhost.region}.nhost.run/v1`,
    graphqlUrl: isLocal 
      ? 'https://local.hasura.nhost.run/v1/graphql' 
      : `https://${config.nhost.subdomain}.graphql.${config.nhost.region}.nhost.run/v1/graphql`,
    functionsUrl: isLocal 
      ? 'https://local.functions.nhost.run/v1' 
      : `https://${config.nhost.subdomain}.functions.${config.nhost.region}.nhost.run/v1`,
    storageUrl: isLocal 
      ? 'https://local.storage.nhost.run/v1' 
      : `https://${config.nhost.subdomain}.storage.${config.nhost.region}.nhost.run/v1`,
  });
}

// ============================================================
// NhostAuthProvider Klasse
// ============================================================

export class NhostAuthProvider implements AuthProvider {
  private nhost: NhostClient;
  private session: Session | null = null;

  constructor() {
    this.nhost = createNhostClient();
    
    // Session aus Access Token laden
    this.initializeSession();
  }

  private initializeSession(): void {
    const accessToken = this.nhost.auth.getAccessToken();
    const user = this.nhost.auth.getUser();
    
    if (accessToken && user) {
      const expiresAt = this.nhost.auth.getAccessTokenExpiresAt();
      this.session = {
        user: this.mapNhostUser(user),
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(),
      };
    }
  }

  // ============================================================
  // User Mapping
  // ============================================================

  private mapNhostUser(nhostUser: any): User {
    return {
      id: nhostUser.id,
      email: nhostUser.email,
      displayName: nhostUser.displayName || null,
      avatarUrl: nhostUser.avatarUrl || null,
      emailVerified: nhostUser.emailVerified || false,
      disabled: nhostUser.disabled || false,
      createdAt: nhostUser.createdAt,
      updatedAt: nhostUser.updatedAt,
    };
  }

  // ============================================================
  // AuthProvider Implementation
  // ============================================================

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    try {
      const { user, accessToken, refreshToken } = await this.nhost.auth.signInEmailPassword(
        credentials.email,
        credentials.password
      );

      const mappedUser = this.mapNhostUser(user);
      const expiresAt = this.nhost.auth.getAccessTokenExpiresAt();

      this.session = {
        user: mappedUser,
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(),
      };

      return {
        user: mappedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      throw new AuthError(message, AuthErrorCode.INVALID_CREDENTIALS, 401);
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    try {
      const { user, accessToken, refreshToken } = await this.nhost.auth.signUpEmailPassword(
        credentials.email,
        credentials.password,
        {
          displayName: credentials.displayName,
        }
      );

      const mappedUser = this.mapNhostUser(user);
      const expiresAt = this.nhost.auth.getAccessTokenExpiresAt();

      this.session = {
        user: mappedUser,
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(),
      };

      return {
        user: mappedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      const message = this.getErrorMessage(error);
      if (message.includes('already exists') || message.includes('email already in use')) {
        throw new AuthError('E-Mail-Adresse bereits registriert', AuthErrorCode.USER_ALREADY_EXISTS, 400);
      }
      throw new AuthError(message, AuthErrorCode.UNKNOWN_ERROR);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.nhost.auth.signOut();
      this.session = null;
    } catch (error) {
      // Ignoriere Fehler beim Abmelden
      this.session = null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = this.nhost.auth.getUser();
      if (!user) {
        return null;
      }
      return this.mapNhostUser(user);
    } catch (error) {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.nhost.auth.getAccessToken() || null;
  }

  async updateUser(data: UpdateUserData): Promise<User> {
    try {
      const user = this.nhost.auth.getUser();
      if (!user) {
        throw new AuthError('Nicht angemeldet', AuthErrorCode.INVALID_TOKEN, 401);
      }

      const updateData: Record<string, unknown> = {};
      
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName;
      }
      if (data.email !== undefined) {
        updateData.email = data.email;
      }

      const updatedUser = await this.nhost.auth.updateUser(updateData);
      
      if (updatedUser) {
        this.session = {
          ...this.session!,
          user: this.mapNhostUser(updatedUser),
        };
        return this.mapNhostUser(updatedUser);
      }
      
      return this.mapNhostUser(user);
    } catch (error) {
      const message = this.getErrorMessage(error);
      throw new AuthError(message, AuthErrorCode.UNKNOWN_ERROR);
    }
  }

  async changePassword(newPassword: string, currentPassword?: string): Promise<void> {
    try {
      // Nhost erfordert das aktuelle Passwort nicht für die Änderung
      // (wenn der Benutzer angemeldet ist)
      await this.nhost.auth.changePassword(newPassword);
    } catch (error) {
      const message = this.getErrorMessage(error);
      if (message.includes('weak') || message.includes('password')) {
        throw new AuthError('Passwort ist zu schwach', AuthErrorCode.PASSWORD_TOO_WEAK, 400);
      }
      throw new AuthError(message, AuthErrorCode.UNKNOWN_ERROR);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.nhost.auth.resetPassword(email);
    } catch (error) {
      // Ignoriere Fehler (z.B. wenn E-Mail nicht existiert)
      // Dies ist absichtlich, um E-Mail-Enumeration zu verhindern
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.nhost.auth.resetPassword(token, newPassword);
    } catch (error) {
      const message = this.getErrorMessage(error);
      throw new AuthError(message, AuthErrorCode.INVALID_TOKEN, 400);
    }
  }

  async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const { fileMetadata, error } = await this.nhost.storage.upload({
        file,
        bucketId: 'default',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!fileMetadata) {
        throw new Error('Upload fehlgeschlagen');
      }

      // Avatar-URL aktualisieren
      const user = this.nhost.auth.getUser();
      if (user) {
        await this.nhost.auth.updateUser({
          avatarUrl: fileMetadata?.metadata?.name || fileMetadata?.path || '',
        });
      }

      return { avatarUrl: fileMetadata?.metadata?.name || fileMetadata?.path || '' };
    } catch (error) {
      const message = this.getErrorMessage(error);
      throw new AuthError(message, AuthErrorCode.UNKNOWN_ERROR);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  async getSession(): Promise<Session | null> {
    // Session aus Cache zurückgeben
    if (this.session) {
      // Prüfen ob Token abgelaufen ist
      if (this.session.expiresAt > new Date()) {
        return this.session;
      }
      // Token abgelaufen, versuchen zu erneuern
      try {
        const refreshed = await this.nhost.auth.refreshAccessToken();
        if (refreshed) {
          const accessToken = this.nhost.auth.getAccessToken();
          const user = this.nhost.auth.getUser();
          const expiresAt = this.nhost.auth.getAccessTokenExpiresAt();
          
          if (accessToken && user) {
            this.session = {
              user: this.mapNhostUser(user),
              accessToken,
              expiresAt: expiresAt ? new Date(expiresAt) : new Date(),
            };
            return this.session;
          }
        }
      } catch (error) {
        // Fehler beim Erneuern
      }
      this.session = null;
    }
    return null;
  }

  async setSession(session: Session | null): Promise<void> {
    this.session = session;
  }

  // ============================================================
  // Hilfsfunktionen
  // ============================================================

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    
    if (error && typeof error === 'object' && 'error' in error) {
      const err = error as { error: string };
      return err.error;
    }
    
    return 'Unbekannter Fehler';
  }
}

// ============================================================
// Export
// ============================================================

export default NhostAuthProvider;

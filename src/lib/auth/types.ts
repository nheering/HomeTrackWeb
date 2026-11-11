/**
 * Typdefinitionen für die Authentifizierung
 */

// ============================================================
// Benutzerdaten
// ============================================================

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Authentifizierungsergebnis
// ============================================================

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// ============================================================
// Anmeldedaten
// ============================================================

export interface SignInCredentials {
  email: string;
  password: string;
}

// ============================================================
// Registrierungsdaten
// ============================================================

export interface SignUpCredentials extends SignInCredentials {
  displayName?: string;
}

// ============================================================
// Aktualisierungsdaten für Benutzer
// ============================================================

export interface UpdateUserData {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  password?: string;
  currentPassword?: string; // Benötigt für Passwortänderung
}

// ============================================================
// Sitzungsinformationen
// ============================================================

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: Date;
}

// ============================================================
// Authentifizierungsfehler
// ============================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: AuthErrorCode,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  USER_DISABLED = 'USER_DISABLED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================
// Token-Typen
// ============================================================

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// Passwort-Reset
// ============================================================

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetToken {
  token: string;
  expiresAt: Date;
}

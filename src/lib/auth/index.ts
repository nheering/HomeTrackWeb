/**
 * Authentifizierungs-Modul
 * 
 * Dieses Modul bietet eine Abstraktionsschicht für die Authentifizierung,
 * die das einfache Umschalten zwischen verschiedenen Providern ermöglicht.
 * 
 * @example
 * ```typescript
 * import { createAuthProvider, isAuthError } from '@/lib/auth';
 * 
 * const auth = createAuthProvider();
 * 
 * // Anmelden
 * const { user, accessToken } = await auth.signIn({
 *   email: 'user@example.com',
 *   password: 'password',
 * });
 * 
 * // Aktuellen Benutzer abrufen
 * const currentUser = await auth.getCurrentUser();
 * 
 * // Abmelden
 * await auth.signOut();
 * ```
 */

// Types
export type {
  User,
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  UpdateUserData,
  Session,
  TokenPayload,
  PasswordResetRequest,
  PasswordResetToken,
} from './types';

export { AuthError, AuthErrorCode, isAuthError } from './types';

// Provider
export type { AuthProvider } from './auth-provider';
export {
  createAuthProvider,
  resetAuthProvider,
  getAuthProvider,
  AuthContext,
  useAuth,
} from './auth-provider';

// Implementierungen
export { NhostAuthProvider } from './nhost-auth-provider';
export { LocalAuthProvider } from './local-auth-provider';

// Konfiguration
export { config as authConfig, isNhostAuth, isLocalAuth } from '../config';

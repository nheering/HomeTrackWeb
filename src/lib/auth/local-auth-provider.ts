/**
 * Lokale Authentifizierungs-Provider für PostgreSQL mit JWT
 * 
 * Dieser Provider verwendet eine lokale PostgreSQL-Datenbank für die Authentifizierung
 * und generiert JWT-Tokens für die Sitzungsverwaltung.
 */

import { Pool, PoolClient } from 'pg';
import { sign, verify, decode } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import type {
  AuthProvider,
  User,
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  UpdateUserData,
  Session,
  TokenPayload,
} from './types';
import { AuthError, AuthErrorCode } from './types';

// ============================================================
// PostgreSQL Verbindung
// ============================================================

// Singleton Pool für die Datenbankverbindung
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      ssl: config.postgres.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// ============================================================
// Token-Verwaltung
// ============================================================

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateAccessToken(payload: TokenPayload): string {
  return sign(payload, config.auth.jwtSecret, { 
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

function generateRefreshToken(payload: TokenPayload): string {
  return sign(payload, config.auth.jwtSecret, { 
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

function verifyToken(token: string): TokenPayload {
  try {
    const payload = verify(token, config.auth.jwtSecret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthError('Token abgelaufen', AuthErrorCode.TOKEN_EXPIRED, 401);
    }
    throw new AuthError('Ungültiges Token', AuthErrorCode.INVALID_TOKEN, 401);
  }
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = decode(token) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

// ============================================================
// LocalAuthProvider Klasse
// ============================================================

export class LocalAuthProvider implements AuthProvider {
  private session: Session | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Session aus LocalStorage laden (wird auf dem Client gesetzt)
    if (typeof window !== 'undefined') {
      this.initializeFromStorage();
    }
  }

  private initializeFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    const sessionData = localStorage.getItem('hometrack_session');
    if (sessionData) {
      try {
        const { user, accessToken, refreshToken, expiresAt } = JSON.parse(sessionData);
        
        // Prüfen ob Token noch gültig ist
        const expiryDate = new Date(expiresAt);
        if (expiryDate > new Date()) {
          this.session = {
            user,
            accessToken,
            expiresAt: expiryDate,
          };
          this.refreshToken = refreshToken || null;
        } else {
          // Token abgelaufen, versuchen zu erneuern
          this.renewSessionIfPossible();
        }
      } catch (error) {
        localStorage.removeItem('hometrack_session');
      }
    }
  }

  private async renewSessionIfPossible(): Promise<void> {
    if (!this.refreshToken) return;
    
    try {
      const payload = verifyToken(this.refreshToken);
      const user = await this.getUserById(payload.userId);
      
      if (user) {
        const newAccessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
        });
        
        const newRefreshToken = generateRefreshToken({
          userId: user.id,
          email: user.email,
        });
        
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        this.session = {
          user,
          accessToken: newAccessToken,
          expiresAt,
        };
        this.refreshToken = newRefreshToken;
        
        this.saveSession();
      }
    } catch (error) {
      // Token erneuern fehlgeschlagen
      this.clearSession();
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined') return;
    
    if (this.session) {
      localStorage.setItem(
        'hometrack_session',
        JSON.stringify({
          user: this.session.user,
          accessToken: this.session.accessToken,
          refreshToken: this.refreshToken,
          expiresAt: this.session.expiresAt.toISOString(),
        })
      );
    } else {
      localStorage.removeItem('hometrack_session');
    }
  }

  private clearSession(): void {
    this.session = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hometrack_session');
    }
  }

  // ============================================================
  // Datenbank-Operationen
  // ============================================================

  private async getClient(): Promise<PoolClient> {
    const client = await getPool().connect();
    return client;
  }

  private async releaseClient(client: PoolClient): Promise<void> {
    client.release();
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM auth_users WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapDbUser(result.rows[0]);
  }

  private async getUserById(id: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM auth_users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapDbUser(result.rows[0]);
  }

  private async createUser(email: string, passwordHash: string, displayName?: string): Promise<User> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO auth_users (email, password_hash, display_name, email_verified)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [email.toLowerCase(), passwordHash, displayName || null]
    );
    
    return this.mapDbUser(result.rows[0]);
  }

  private async updateUserData(id: string, data: UpdateUserData): Promise<User> {
    const pool = getPool();
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    
    if (data.displayName !== undefined) {
      updates.push(`display_name = $${paramIndex}`);
      values.push(data.displayName);
      paramIndex++;
    }
    
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(data.email.toLowerCase());
      paramIndex++;
    }
    
    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramIndex}`);
      values.push(data.avatarUrl);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      // Keine Updates, aktuelle Daten zurückgeben
      return this.getUserById(id) as Promise<User>;
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE auth_users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return this.mapDbUser(result.rows[0]);
  }

  private async updatePassword(id: string, passwordHash: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE auth_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, id]
    );
  }

  private mapDbUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.display_name || null,
      avatarUrl: dbUser.avatar_url || null,
      emailVerified: dbUser.email_verified || false,
      disabled: dbUser.disabled || false,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  // ============================================================
  // AuthProvider Implementation
  // ============================================================

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    const user = await this.getUserByEmail(credentials.email);
    
    if (!user) {
      // Zeitliche Verzögerung um E-Mail-Enumeration zu verhindern
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new AuthError('Ungültige Anmeldedaten', AuthErrorCode.INVALID_CREDENTIALS, 401);
    }
    
    if (user.disabled) {
      throw new AuthError('Benutzerkonto deaktiviert', AuthErrorCode.USER_DISABLED, 403);
    }
    
    const client = await this.getClient();
    try {
      const result = await client.query(
        `SELECT password_hash FROM auth_users WHERE id = $1`,
        [user.id]
      );
      
      const passwordHash = result.rows[0]?.password_hash;
      
      if (!passwordHash) {
        throw new AuthError('Passwort nicht gefunden', AuthErrorCode.INVALID_CREDENTIALS, 401);
      }
      
      const isValid = await bcrypt.compare(credentials.password, passwordHash);
      
      if (!isValid) {
        throw new AuthError('Ungültige Anmeldedaten', AuthErrorCode.INVALID_CREDENTIALS, 401);
      }
      
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      this.session = {
        user,
        accessToken,
        expiresAt,
      };
      this.refreshToken = refreshToken;
      this.saveSession();
      
      return {
        user,
        accessToken,
        refreshToken,
      };
    } finally {
      this.releaseClient(client);
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    // Prüfen ob E-Mail bereits existiert
    const existingUser = await this.getUserByEmail(credentials.email);
    
    if (existingUser) {
      throw new AuthError('E-Mail-Adresse bereits registriert', AuthErrorCode.USER_ALREADY_EXISTS, 400);
    }
    
    // Passwort hashen
    const passwordHash = await bcrypt.hash(credentials.password, 10);
    
    // Benutzer erstellen
    const user = await this.createUser(
      credentials.email,
      passwordHash,
      credentials.displayName
    );
    
    // Tokens generieren
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    this.session = {
      user,
      accessToken,
      expiresAt,
    };
    this.refreshToken = refreshToken;
    this.saveSession();
    
    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async signOut(): Promise<void> {
    this.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    // Zuerst aus Session prüfen
    if (this.session) {
      // Token-Verfall prüfen
      if (this.session.expiresAt > new Date()) {
        return this.session.user;
      }
      // Token abgelaufen, versuchen zu erneuern
      await this.renewSessionIfPossible();
      if (this.session) {
        return this.session.user;
      }
    }
    
    // Keine Session, prüfen ob Access Token verfügbar
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('hometrack_session');
      if (sessionData) {
        const { accessToken, user } = JSON.parse(sessionData);
        
        try {
          const payload = verifyToken(accessToken);
          const dbUser = await this.getUserById(payload.userId);
          
          if (dbUser) {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15);
            
            this.session = {
              user: dbUser,
              accessToken,
              expiresAt,
            };
            return dbUser;
          }
        } catch (error) {
          // Token ungültig
          this.clearSession();
        }
      }
    }
    
    return null;
  }

  getAccessToken(): string | null {
    return this.session?.accessToken || null;
  }

  async updateUser(data: UpdateUserData): Promise<User> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      throw new AuthError('Nicht angemeldet', AuthErrorCode.INVALID_TOKEN, 401);
    }
    
    const updatedUser = await this.updateUserData(user.id, data);
    
    if (this.session) {
      this.session = {
        ...this.session,
        user: updatedUser,
      };
      this.saveSession();
    }
    
    return updatedUser;
  }

  async changePassword(newPassword: string, currentPassword?: string): Promise<void> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      throw new AuthError('Nicht angemeldet', AuthErrorCode.INVALID_TOKEN, 401);
    }
    
    // Aktuelles Passwort prüfen (falls angegeben)
    if (currentPassword) {
      const client = await this.getClient();
      try {
        const result = await client.query(
          `SELECT password_hash FROM auth_users WHERE id = $1`,
          [user.id]
        );
        
        const passwordHash = result.rows[0]?.password_hash;
        const isValid = await bcrypt.compare(currentPassword, passwordHash || '');
        
        if (!isValid) {
          throw new AuthError('Aktuelles Passwort ist falsch', AuthErrorCode.INVALID_CREDENTIALS, 401);
        }
      } finally {
        this.releaseClient(client);
      }
    }
    
    // Neues Passwort hashen und speichern
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.updatePassword(user.id, newPasswordHash);
  }

  async requestPasswordReset(email: string): Promise<void> {
    // In einer echten Implementierung würde hier eine E-Mail mit Reset-Token versendet
    // Für die lokale Entwicklung speichern wir den Token in der Datenbank
    
    const user = await this.getUserByEmail(email);
    if (!user) {
      // Nicht verraten ob die E-Mail existiert (Sicherheit)
      return;
    }
    
    // Token generieren und speichern
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    
    // In der Produktion: E-Mail mit Token versenden
    // Für Entwicklung: Token in Console ausgeben
    console.log(`[LocalAuth] Passwort-Reset-Token für ${email}: ${token}`);
    console.log(`[LocalAuth] Verwende diesen Token mit resetPassword()`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Token verifizieren
    const payload = verifyToken(token);
    
    const user = await this.getUserById(payload.userId);
    if (!user) {
      throw new AuthError('Ungültiger Token', AuthErrorCode.INVALID_TOKEN, 400);
    }
    
    // Neues Passwort hashen und speichern
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.updatePassword(user.id, newPasswordHash);
    
    // Alle Sitzungen ungültig machen
    this.clearSession();
  }

  async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
    // In einer echten Implementierung würde das Bild hochgeladen werden
    // Für die lokale Entwicklung speichern wir es im public-Verzeichnis
    
    // TODO: Implementierung für File Upload
    // Für jetzt: Platzhalter-URL
    const avatarUrl = `/avatars/${file.name}`;
    
    const user = await this.getCurrentUser();
    if (user) {
      await this.updateUserData(user.id, { avatarUrl });
      
      if (this.session) {
        this.session = {
          ...this.session,
          user: {
            ...this.session.user,
            avatarUrl,
          },
        };
        this.saveSession();
      }
    }
    
    return { avatarUrl };
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async getSession(): Promise<Session | null> {
    return this.session;
  }

  async setSession(session: Session | null): Promise<void> {
    this.session = session;
    if (session) {
      this.saveSession();
    } else {
      this.clearSession();
    }
  }

  // ============================================================
  // Statische Methoden für Server-seitige Authentifizierung
  // ============================================================

  /**
   * Überprüft ein JWT-Token und gibt den User zurück
   * (Für API-Routen)
   */
  static async verifyTokenAndGetUser(token: string): Promise<User | null> {
    try {
      const payload = verifyToken(token);
      const provider = new LocalAuthProvider();
      const user = await provider.getUserById(payload.userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gibt den User aus einem Authorization-Header zurück
   */
  static async getUserFromRequest(request: Request): Promise<User | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    return this.verifyTokenAndGetUser(token);
  }
}

// ============================================================
// Export
// ============================================================

export default LocalAuthProvider;

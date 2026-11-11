/**
 * Fehlerklassen für die Datenbank
 */

// ============================================================
// DatabaseError
// ============================================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: DatabaseErrorCode,
    public readonly statusCode: number = 500,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export enum DatabaseErrorCode {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================
// Typguards
// ============================================================

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isNotFoundError(error: unknown): boolean {
  return isDatabaseError(error) && error.code === DatabaseErrorCode.NOT_FOUND;
}

export function isValidationError(error: unknown): boolean {
  return isDatabaseError(error) && error.code === DatabaseErrorCode.VALIDATION_ERROR;
}

export function isConnectionError(error: unknown): boolean {
  return isDatabaseError(error) && error.code === DatabaseErrorCode.CONNECTION_ERROR;
}

// ============================================================
// Hilfsfunktion zum Erstellen von Datenbankfehlern
// ============================================================

export function createDatabaseError(error: unknown, context?: string): DatabaseError {
  if (isDatabaseError(error)) {
    return error;
  }

  const message = getErrorMessage(error);
  const code = mapErrorCode(error);
  const statusCode = getStatusCode(code);

  return new DatabaseError(
    context ? `${context}: ${message}` : message,
    code,
    statusCode,
    error instanceof Error ? error : undefined
  );
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }

  if (error && typeof error === 'object' && 'error' in error) {
    return (error as { error: string }).error;
  }

  return 'Unbekannter Datenbankfehler';
}

function mapErrorCode(error: unknown): DatabaseErrorCode {
  if (!error || typeof error !== 'object') {
    return DatabaseErrorCode.UNKNOWN_ERROR;
  }

  const errorObj = error as Record<string, unknown>;

  // PostgreSQL Fehlercodes
  if ('code' in errorObj) {
    const code = errorObj.code as string;
    
    switch (code) {
      case '23505':
        return DatabaseErrorCode.DUPLICATE_KEY;
      case '23503':
        return DatabaseErrorCode.FOREIGN_KEY_VIOLATION;
      case '42P01':
        return DatabaseErrorCode.NOT_FOUND;
      case '42501':
        return DatabaseErrorCode.PERMISSION_DENIED;
      default:
        return DatabaseErrorCode.QUERY_ERROR;
    }
  }

  // Connection Errors
  if ('message' in errorObj) {
    const message = errorObj.message as string;
    if (
      message.includes('connection') ||
      message.includes('ECONNREFUSED') ||
      message.includes('timeout') ||
      message.includes('connect')
    ) {
      return DatabaseErrorCode.CONNECTION_ERROR;
    }
  }

  return DatabaseErrorCode.UNKNOWN_ERROR;
}

function getStatusCode(code: DatabaseErrorCode): number {
  switch (code) {
    case DatabaseErrorCode.NOT_FOUND:
      return 404;
    case DatabaseErrorCode.DUPLICATE_KEY:
      return 409;
    case DatabaseErrorCode.PERMISSION_DENIED:
      return 403;
    case DatabaseErrorCode.VALIDATION_ERROR:
      return 400;
    case DatabaseErrorCode.CONNECTION_ERROR:
      return 503;
    default:
      return 500;
  }
}

export default {
  DatabaseError,
  DatabaseErrorCode,
  isDatabaseError,
  isNotFoundError,
  isValidationError,
  isConnectionError,
  createDatabaseError,
};

/**
 * Storage-Provider Schnittstelle
 * 
 * Diese Schnittstelle definiert den Vertrag für Storage-Provider.
 * Sie ermöglicht das einfache Umschalten zwischen verschiedenen Storage-Backends
 * (Nhost Storage, lokale Dateisystem, S3, etc.).
 */

import type {
  StorageFile,
  UploadOptions,
  UploadResult,
  DeleteOptions,
} from './types';

// ============================================================
// StorageProvider Schnittstelle
// ============================================================

export interface StorageProvider {
  /**
   * Lädt eine Datei hoch
   * @param file - Die Datei als Blob oder File-Objekt
   * @param options - Upload-Optionen
   * @returns Upload-Ergebnis
   */
  upload(file: Blob | File, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Lädt eine Datei als Base64-String hoch
   * @param base64 - Base64-kodierter String
   * @param options - Upload-Optionen
   * @returns Upload-Ergebnis
   */
  uploadBase64(base64: string, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Lädt mehrere Dateien hoch
   * @param files - Array von Dateien
   * @param options - Upload-Optionen
   * @returns Array von Upload-Ergebnissen
   */
  uploadMultiple(files: (Blob | File)[], options?: UploadOptions): Promise<UploadResult[]>;

  /**
   * Lädt eine Datei herunter
   * @param path - Der Pfad oder die URL der Datei
   * @returns Die Datei als Blob
   */
  download(path: string): Promise<Blob>;

  /**
   * Gibt die URL einer Datei zurück
   * @param path - Der Pfad der Datei
   * @returns Die URL
   */
  getUrl(path: string): string;

  /**
   * Gibt Metadaten einer Datei zurück
   * @param path - Der Pfad der Datei
   * @returns StorageFile oder null
   */
  getFile(path: string): Promise<StorageFile | null>;

  /**
   * Listet Dateien in einem Verzeichnis auf
   * @param directory - Das Verzeichnis
   * @returns Array von StorageFiles
   */
  listFiles(directory?: string): Promise<StorageFile[]>;

  /**
   * Löscht eine Datei
   * @param path - Der Pfad der Datei
   * @param options - Lösch-Optionen
   */
  delete(path: string, options?: DeleteOptions): Promise<void>;

  /**
   * Löscht mehrere Dateien
   * @param paths - Array von Pfaden
   * @param options - Lösch-Optionen
   */
  deleteMultiple(paths: string[], options?: DeleteOptions): Promise<void>;

  /**
   * Erstellt ein neues Verzeichnis
   * @param path - Der Pfad des Verzeichnisses
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Prüft ob eine Datei existiert
   * @param path - Der Pfad der Datei
   * @returns true wenn die Datei existiert
   */
  exists(path: string): Promise<boolean>;
}

// ============================================================
// Factory-Funktion
// ============================================================

import { config, isNhostBackend, isPostgresBackend } from '../config';
import { NhostStorageProvider } from './nhost-storage-provider';
import { LocalStorageProvider } from './local-storage-provider';

let storageProviderInstance: StorageProvider | null = null;

/**
 * Erstellt einen Storage-Provider basierend auf der Konfiguration
 */
export function createStorageProvider(): StorageProvider {
  // Singleton-Pattern: Immer dieselbe Instanz zurückgeben
  if (storageProviderInstance) {
    return storageProviderInstance;
  }

  // Basierend auf der Konfiguration den passenden Provider erstellen
  if (isNhostBackend()) {
    storageProviderInstance = new NhostStorageProvider();
  } else if (isPostgresBackend()) {
    storageProviderInstance = new LocalStorageProvider();
  } else {
    // Standard: Nhost
    storageProviderInstance = new NhostStorageProvider();
  }

  return storageProviderInstance;
}

/**
 * Setzt den Storage-Provider zurück (für Tests)
 */
export function resetStorageProvider(): void {
  storageProviderInstance = null;
}

/**
 * Gibt den aktuellen Storage-Provider zurück
 */
export function getStorageProvider(): StorageProvider {
  return createStorageProvider();
}

export default {
  createStorageProvider,
  resetStorageProvider,
  getStorageProvider,
};

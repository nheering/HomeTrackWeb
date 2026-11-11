/**
 * Typdefinitionen für Storage-Provider
 */

// ============================================================
// Storage File
// ============================================================

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ============================================================
// Upload-Optionen
// ============================================================

export interface UploadOptions {
  /**
   * Der Dateiname
   */
  filename?: string;
  
  /**
   * Der MIME-Typ
   */
  mimeType?: string;
  
  /**
   * Das Verzeichnis in dem die Datei gespeichert werden soll
   */
  directory?: string;
  
  /**
   * Ob die Datei öffentlich zugänglich sein soll
   */
  isPublic?: boolean;
}

// ============================================================
// Upload-Ergebnis
// ============================================================

export interface UploadResult {
  /**
   * Die ID der hochgeladenen Datei
   */
  id: string;
  
  /**
   * Der Dateiname
   */
  name: string;
  
  /**
   * Der Pfad zur Datei
   */
  path: string;
  
  /**
   * Die URL zum Herunterladen der Datei
   */
  url: string;
  
  /**
   * Der MIME-Typ
   */
  mimeType: string;
  
  /**
   * Die Dateigröße in Bytes
   */
  size: number;
}

// ============================================================
// Delete-Optionen
// ============================================================

export interface DeleteOptions {
  /**
   * Ob der ganze Ordner gelöscht werden soll
   */
  deleteFolder?: boolean;
}

export default {
  StorageFile,
  UploadOptions,
  UploadResult,
  DeleteOptions,
};

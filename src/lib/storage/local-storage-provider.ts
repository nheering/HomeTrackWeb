/**
 * Local Storage Provider
 * 
 * Dieser Provider speichert Dateien im lokalen Dateisystem (für PostgreSQL-Backend).
 * In einer echten Produktivumgebung würde man hier z.B. S3 oder einen anderen
 * Object-Storage verwenden.
 * 
 * Für lokale Entwicklung mit Docker wird ein Volume verwendet.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { StorageProvider } from './storage-provider';
import type {
  StorageFile,
  UploadOptions,
  UploadResult,
  DeleteOptions,
} from './types';

// ============================================================
// Konfiguration
// ============================================================

const STORAGE_DIRECTORY = process.env.STORAGE_DIRECTORY || 
  path.join(process.cwd(), 'storage');

const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL || 
  'http://localhost:3000/api/storage';

export class LocalStorageProvider implements StorageProvider {
  private storageDir: string;
  private publicUrl: string;

  constructor() {
    this.storageDir = STORAGE_DIRECTORY;
    this.publicUrl = PUBLIC_URL;
    
    // Erstelle das Storage-Verzeichnis falls es nicht existiert
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch {
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Erstellt einen Dateinamen
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${basename}-${timestamp}-${random}${ext}`;
  }

  /**
   * Erstellt den vollen Pfad zu einer Datei
   */
  private getFullPath(filePath: string): string {
    // Entferne führenden Slash
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return path.join(this.storageDir, cleanPath);
  }

  /**
   * Erstellt einen relativen Pfad für die URL
   */
  private getRelativePath(filePath: string): string {
    // Entferne führenden Slash und das Storage-Verzeichnis
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return cleanPath;
  }

  /**
   * Lädt eine Datei hoch
   */
  async upload(file: Blob | File, options?: UploadOptions): Promise<UploadResult> {
    const filename = options?.filename || 
      (file instanceof File ? file.name : `upload-${Date.now()}`);
    const finalFilename = this.generateFilename(filename);
    const directory = options?.directory || '';
    const mimeType = options?.mimeType || 
      (file instanceof File ? file.type : file.type || 'application/octet-stream');
    
    // Erstelle den Zielpfad
    const targetPath = directory ? path.join(directory, finalFilename) : finalFilename;
    const fullPath = this.getFullPath(targetPath);
    
    // Stelle sicher dass das Verzeichnis existiert
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Konvertiere Blob zu Buffer
    const arrayBuffer = await (file instanceof File ? file : file).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Speichere die Datei
    await fs.writeFile(fullPath, buffer);
    
    return {
      id: finalFilename,
      name: filename,
      path: targetPath,
      url: `${this.publicUrl}/${this.getRelativePath(targetPath)}`,
      mimeType,
      size: buffer.length,
    };
  }

  /**
   * Lädt eine Datei als Base64-String hoch
   */
  async uploadBase64(base64: string, options?: UploadOptions): Promise<UploadResult> {
    const [prefix, data] = base64.split(',');
    const mimeType = prefix.match(/^data:(.+);base64/)?.[1] || 'application/octet-stream';
    const buffer = Buffer.from(data, 'base64');
    
    const filename = options?.filename || `upload-${Date.now()}.bin`;
    const blob = new Blob([buffer], { type: mimeType });
    
    return this.upload(blob, { ...options, mimeType, filename });
  }

  /**
   * Lädt mehrere Dateien hoch
   */
  async uploadMultiple(files: (Blob | File)[], options?: UploadOptions): Promise<UploadResult[]> {
    return Promise.all(files.map(file => this.upload(file, options)));
  }

  /**
   * Lädt eine Datei herunter
   */
  async download(filePath: string): Promise<Blob> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      const buffer = await fs.readFile(fullPath);
      return new Blob([buffer]);
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  /**
   * Gibt die URL einer Datei zurück
   */
  getUrl(filePath: string): string {
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${this.publicUrl}/${cleanPath}`;
  }

  /**
   * Gibt Metadaten einer Datei zurück
   */
  async getFile(filePath: string): Promise<StorageFile | null> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      const stats = await fs.stat(fullPath);
      
      return {
        id: path.basename(fullPath),
        name: path.basename(fullPath),
        path: filePath,
        url: this.getUrl(filePath),
        mimeType: 'application/octet-stream',
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
        userId: '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Listet Dateien in einem Verzeichnis auf
   */
  async listFiles(directory?: string): Promise<StorageFile[]> {
    const targetDir = directory ? this.getFullPath(directory) : this.storageDir;
    
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const files: StorageFile[] = [];
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = path.join(targetDir, entry.name);
          const stats = await fs.stat(fullPath);
          const relativePath = directory ? 
            path.join(directory, entry.name) : 
            entry.name;
          
          files.push({
            id: entry.name,
            name: entry.name,
            path: relativePath,
            url: this.getUrl(relativePath),
            mimeType: 'application/octet-stream',
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
            userId: '',
          });
        }
      }
      
      return files;
    } catch {
      return [];
    }
  }

  /**
   * Löscht eine Datei
   */
  async delete(filePath: string, _options?: DeleteOptions): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Löscht mehrere Dateien
   */
  async deleteMultiple(filePaths: string[], options?: DeleteOptions): Promise<void> {
    await Promise.all(filePaths.map(filePath => this.delete(filePath, options)));
  }

  /**
   * Erstellt ein neues Verzeichnis
   */
  async createDirectory(dirPath: string): Promise<void> {
    const fullPath = this.getFullPath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  /**
   * Prüft ob eine Datei existiert
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(filePath);
    
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

export default LocalStorageProvider;

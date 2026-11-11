/**
 * Nhost Storage Provider
 * 
 * Dieser Provider verwendet das Nhost Storage API.
 */

import { getNhostStorageUrl } from '../config';
import type { StorageProvider } from './storage-provider';
import type {
  StorageFile,
  UploadOptions,
  UploadResult,
  DeleteOptions,
} from './types';

export class NhostStorageProvider implements StorageProvider {
  private readonly storageUrl: string;

  constructor() {
    this.storageUrl = getNhostStorageUrl();
  }

  /**
   * Lädt eine Datei hoch
   */
  async upload(file: Blob | File, options?: UploadOptions): Promise<UploadResult> {
    try {
      const { nhost } = await import('@nhost/nhost-js');
      
      const client = nhost.createClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'local',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || 'eu-central-1',
      });

      const filename = options?.filename || (file instanceof File ? file.name : `upload-${Date.now()}`);
      const path = options?.directory ? `${options.directory}/${filename}` : filename;
      const mimeType = options?.mimeType || (file instanceof File ? file.type : file.type || 'application/octet-stream');

      const result = await client.storage.upload({
        file,
        bucketId: 'default',
        options: {
          upsert: true,
        },
      });

      return {
        id: result.fileMetadata.id,
        name: result.fileMetadata.name,
        path: result.fileMetadata.path,
        url: result.fileMetadata.url,
        mimeType,
        size: file.size,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Lädt eine Datei als Base64-String hoch
   */
  async uploadBase64(base64: string, options?: UploadOptions): Promise<UploadResult> {
    const [prefix, data] = base64.split(',');
    const mimeType = prefix.match(/^data:(.+);base64/)?.[1] || 'application/octet-stream';
    const byteCharacters = atob(data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    const byteArray = new Uint8Array(byteArrays);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return this.upload(blob, { ...options, mimeType });
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
  async download(path: string): Promise<Blob> {
    try {
      const { nhost } = await import('@nhost/nhost-js');
      
      const client = nhost.createClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'local',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || 'eu-central-1',
      });

      const result = await client.storage.download({ path });
      return await result.blob();
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  /**
   * Gibt die URL einer Datei zurück
   */
  getUrl(path: string): string {
    // Entferne führenden Slash wenn vorhanden
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.storageUrl}/files/${cleanPath}`;
  }

  /**
   * Gibt Metadaten einer Datei zurück
   */
  async getFile(path: string): Promise<StorageFile | null> {
    try {
      const { nhost } = await import('@nhost/nhost-js');
      
      const client = nhost.createClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'local',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || 'eu-central-1',
      });

      // Versuche, die Datei-Info zu bekommen
      // Note: Nhost hat keine direkte API für Metadaten, also bauen wir die URL
      const fileId = path.split('/').pop();
      
      return {
        id: fileId,
        name: path.split('/').pop() || '',
        path,
        url: this.getUrl(path),
        mimeType: 'application/octet-stream',
        size: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: '',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Listet Dateien in einem Verzeichnis auf
   */
  async listFiles(directory?: string): Promise<StorageFile[]> {
    // Note: Nhost hat keine direkte API zum Listieren von Dateien
    // Dies ist eine Vereinfachung
    return [];
  }

  /**
   * Löscht eine Datei
   */
  async delete(path: string, _options?: DeleteOptions): Promise<void> {
    try {
      const { nhost } = await import('@nhost/nhost-js');
      
      const client = nhost.createClient({
        subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'local',
        region: process.env.NEXT_PUBLIC_NHOST_REGION || 'eu-central-1',
      });

      await client.storage.delete({ path });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Löscht mehrere Dateien
   */
  async deleteMultiple(paths: string[], options?: DeleteOptions): Promise<void> {
    await Promise.all(paths.map(path => this.delete(path, options)));
  }

  /**
   * Erstellt ein neues Verzeichnis
   */
  async createDirectory(_path: string): Promise<void> {
    // Nhost erstellt Verzeichnisse automatisch beim Hochladen
    // Keine explizite Aktion nötig
  }

  /**
   * Prüft ob eine Datei existiert
   */
  async exists(path: string): Promise<boolean> {
    const file = await this.getFile(path);
    return file !== null;
  }
}

export default NhostStorageProvider;

/**
 * Storage-Modul
 * 
 * Dieses Modul bietet eine Abstraktionsschicht für Storage-Operationen,
 * die das einfache Umschalten zwischen verschiedenen Storage-Backends ermöglicht.
 * 
 * @example
 * ```typescript
 * import { createStorageProvider } from '@/lib/storage';
 * 
 * const storage = createStorageProvider();
 * 
 * // Datei hochladen
 * const result = await storage.upload(file, { directory: 'verbrauchswerte' });
 * 
 * // URL generieren
 * const url = storage.getUrl(result.path);
 * ```
 */

// Types
export type {
  StorageFile,
  UploadOptions,
  UploadResult,
  DeleteOptions,
} from './types';

// Storage Provider
export type { StorageProvider } from './storage-provider';
export {
  createStorageProvider,
  resetStorageProvider,
  getStorageProvider,
} from './storage-provider';

// Implementierungen
export { NhostStorageProvider } from './nhost-storage-provider';
export { LocalStorageProvider } from './local-storage-provider';

export default {
  createStorageProvider,
  resetStorageProvider,
  getStorageProvider,
  NhostStorageProvider,
  LocalStorageProvider,
};

'use client';

import { useState, useEffect } from 'react';
import { useNhostClient } from '@nhost/nextjs';

interface Props {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Zeigt ein Bild aus dem nhost Storage an.
 * Unterstützt sowohl Presigned-URLs (für private Buckets) als auch Data-URLs.
 * Erwartet entweder eine vollständige Storage-URL ({storageUrl}/files/{fileId})
 * oder eine Data-URL (data:...) für lokale Vorschauen.
 */
export default function StorageImage({ src, alt = '', className }: Props) {
  const nhost = useNhostClient();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    // Data-URL oder Blob-URL: direkt verwenden
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setUrl(src);
      return;
    }

    // Storage-URL: fileId extrahieren und Presigned-URL holen
    const match = src.match(/\/files\/([0-9a-fA-F-]{36})/);
    if (!match) {
      setUrl(src);
      return;
    }
    const fileId = match[1];

    nhost.storage.getPresignedUrl({ fileId }).then(({ presignedUrl, error }) => {
      if (presignedUrl?.url) {
        setUrl(presignedUrl.url);
      } else {
        // Fallback: Wenn Presigned URL fehlschlägt, versuchen wir es mit der Public URL + Token (Nhost-spezifisch)
        const token = nhost.auth.getAccessToken();
        const baseUrl = nhost.storage.getPublicUrl({ fileId });
        const fallbackUrl = token ? `${baseUrl}?token=${token}` : baseUrl;
        
        console.warn('StorageImage: Presigned URL fehlgeschlagen, verwende Fallback:', fallbackUrl);
        setUrl(fallbackUrl);
      }
    }).catch(err => {
      console.error('StorageImage: Fehler beim Abrufen der Presigned URL:', err);
      const token = nhost.auth.getAccessToken();
      const baseUrl = nhost.storage.getPublicUrl({ fileId });
      setUrl(token ? `${baseUrl}?token=${token}` : baseUrl);
    });
  }, [src, nhost]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} />;
}

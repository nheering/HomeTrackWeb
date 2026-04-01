'use client';

import { useState, useEffect } from 'react';
import { useNhostClient } from '@nhost/nextjs';
import { storageUrl } from '@/lib/nhost';

interface Props {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Zeigt ein Bild aus dem nhost Storage an.
 * Unterstützt sowohl Presigned-URLs (für private Buckets) als auch Data-URLs.
 * Erwartet entweder eine Storage-URL mit /files/{fileId} oder eine Data-URL (data:...).
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
    const token = nhost.auth.getAccessToken();

    // Presigned-URL direkt über die korrekte storageUrl holen (SDK-URL ist bei Local-Dev falsch)
    const presignedEndpoint = `${storageUrl}/files/${fileId}/presignedurl`;
    fetch(presignedEndpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (data?.url) {
          setUrl(data.url);
        } else {
          // Fallback: direkte URL mit Auth-Token
          const directUrl = `${storageUrl}/files/${fileId}`;
          setUrl(token ? `${directUrl}?token=${token}` : directUrl);
        }
      })
      .catch(() => {
        // Fallback: direkte URL mit Auth-Token
        const directUrl = `${storageUrl}/files/${fileId}`;
        setUrl(token ? `${directUrl}?token=${token}` : directUrl);
      });
  }, [src, nhost]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} />;
}

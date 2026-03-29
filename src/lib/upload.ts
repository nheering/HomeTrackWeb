/**
 * Wandelt einen nhost-Storage-Fehler in eine verständliche deutsche Fehlermeldung um.
 */
export function uploadFehlerText(error: unknown): string {
  if (!error) return 'Unbekannter Fehler.';

  const e = error as { message?: string; status?: number; error?: string };

  // HTTP-Statuscodes auswerten
  if (e.status === 401 || e.status === 403) return 'Keine Berechtigung. Bitte neu anmelden.';
  if (e.status === 413) return 'Datei ist zu groß.';
  if (e.status === 415) return 'Dateityp wird nicht unterstützt.';
  if (e.status === 500 || e.status === 503) return 'Serverfehler. Bitte später erneut versuchen.';

  // Fehlercodes und Meldungen auswerten
  const msg = (e.message ?? e.error ?? '').toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch'))
    return 'Keine Verbindung zum Server. Läuft nhost local?';
  if (msg.includes('no mutations exist') || msg.includes('permission'))
    return 'Fehlende Berechtigung im Storage. Hasura-Permissions prüfen.';
  if (msg.includes('too large') || msg.includes('size'))
    return 'Datei ist zu groß.';
  if (msg.includes('type') || msg.includes('mime'))
    return 'Dateityp wird nicht unterstützt.';
  if (msg.includes('bucket'))
    return 'Storage-Bucket nicht gefunden.';

  // Rohe Meldung als Fallback
  if (e.message) return e.message;
  return 'Upload fehlgeschlagen.';
}

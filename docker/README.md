# HomeTrack Docker Backend

Dieses Verzeichnis enthaelt die Docker-Konfiguration fuer ein **lokal eigenes PostgreSQL-Backend** als Alternative oder Ergänzung zu Nhost.

## 📁 Struktur

```
docker/
├── docker-compose.yml    # Docker Compose Konfiguration
├── .env                   # Standard-Umgebungsvariablen
├── init.sql               # Datenbankschema (wird automatisch ausgefuehrt)
├── seed.sql               # Beispieldaten (optional)
└── README.md              # Diese Datei
```

---

## ⚡ Schnellstart

### 1. Docker Compose starten

```bash
# Von Project-Root aus
cd /pfad/zu/HomeTrackWeb

# Container starten (PostgreSQL + optional PostGraphile + pgAdmin)
docker-compose -f docker/docker-compose.yml up -d
```

### 2. Pruefen ob alles laeuft

```bash
# Container-Status anzeigen
docker-compose -f docker/docker-compose.yml ps

# Logs anzeigen
docker-compose -f docker/docker-compose.yml logs -f postgres
```

### 3. Verbindung testen

```bash
# Direkte Verbindung zur Datenbank (wenn psql installiert ist)
psql -h localhost -p 5432 -U hometrack_user -d hometrack_db

# Oder mit Docker
docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db
```

---

## 📝 Konfiguration

### Umgebungsvariablen

Die Standardkonfiguration findet sich in `docker/.env`. Kopiere diese Datei um lokale Aenderungen vorzunehmen:

```bash
cp docker/.env docker/.env.local
```

**Wichtige Variablen:**

| Variable | Standardwert | Beschreibung |
|----------|--------------|--------------|
| `POSTGRES_DB` | `hometrack_db` | Datenbankname |
| `POSTGRES_USER` | `hometrack_user` | Datenbanknutzer |
| `POSTGRES_PASSWORD` | `hometrack_pass` | Passwort |
| `POSTGRES_PORT` | `5432` | Port |
| `JWT_SECRET` | `dev-super-secret-...` | JWT Secret fuer Auth |
| `POSTGRAPHILE_PORT` | `5000` | GraphQL API Port |
| `PGADMIN_PORT` | `5050` | pgAdmin Web-UI Port |

### Datenbank-Verbindungsstring

```
postgres://hometrack_user:hometrack_pass@localhost:5432/hometrack_db
```

---

## 🏗️ Dienste

### 1. PostgreSQL (`postgres`)

- **Port**: 5432 (Standard)
- **Datenbank**: hometrack_db
- **Nutzer**: hometrack_user
- **Passwort**: hometrack_pass
- **Volume**: hometrack-postgres-data (persistent)

**Tabellen:**
- Alle Anwendungstabellen aus Nhost
- Auth-Tabellen (vereinfacht)
- RLS (Row Level Security) Policies aktiviert

### 2. PostGraphile (`postgraphile`) - Optional

PostGraphile ist eine Alternative zu Hasura und stellt eine GraphQL-API fuer PostgreSQL bereit.

- **Port**: 5000
- **GraphQL Endpoint**: `http://localhost:5000/graphql`
- **GraphiQL UI**: `http://localhost:5000/graphiql`

**Vorteile:**
- Behalte bestehende GraphQL-Queries bei
- Automatische Generierung des GraphQL-Schemas
- Einfache Integration mit existierendem Frontend

**Nachteile:**
- Weniger Features als Hasura
- Kein Web-Dashboard

### 3. pgAdmin (`pgadmin`) - Optional

Web-basierte Verwaltungsoberflaeche fuer PostgreSQL.

- **Port**: 5050
- **URL**: `http://localhost:5050`
- **Login**: admin@hometrack.local / admin123

---

## 🔄 Daten Migration

### Von Nhost zu lokalem PostgreSQL

1. **Export von Nhost:**
   ```bash
   # Daten exportieren (Beispiel mit psql)
   pg_dump -h <nhost-host> -p 5432 -U <user> -d <db> > nhost_dump.sql
   ```

2. **Import in lokales PostgreSQL:**
   ```bash
   # Daten importieren
   docker exec -i hometrack-postgres psql -U hometrack_user -d hometrack_db < nhost_dump.sql
   ```

### Daten zuruecksetzen

```bash
# Container stoppen und Volume loeschen
docker-compose -f docker/docker-compose.yml down -v

# Container neu starten (Daten werden neu erstellt)
docker-compose -f docker/docker-compose.yml up -d
```

---

## 🔧 Umgebung für lokale Entwicklung

### Verbindung in Next.js

Erstelle eine neue Datei `src/lib/postgres.ts`:

```typescript
// src/lib/postgres.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'hometrack_db',
  user: process.env.POSTGRES_USER || 'hometrack_user',
  password: process.env.POSTGRES_PASSWORD || 'hometrack_pass',
});

// Beispiel: Verbrauchstypen abfragen
export async function getVerbrauchstypen(userId: string) {
  const result = await pool.query(
    'SELECT * FROM verbrauchstyp WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  return result.rows;
}
```

### mit Docker Compose und Hot-Reload

```bash
# Im Projekt-Root
npm run dev

# In einem anderen Terminal
docker-compose -f docker/docker-compose.yml up -d
```

---

## 📊 PostGraphile GraphQL API

### GraphQL Queries testen

1. Oeffne GraphiQL: `http://localhost:5000/graphiql`

2. Beispiel-Query:

```graphql
query GetVerbrauchstypen {
  verbrauchstypen: allVerbrauchstyps {
    nodes {
      id
      name
      einheit
      symbol
      farbe
    }
  }
}
```

### Authentifizierung mit JWT

1. Token generieren (manuell fuer Tests):

```bash
# Token fuer Testnutzer generieren (in Node.js)
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '<user-uuid>', role: 'user' },
  'dev-super-secret-change-in-production',
  { algorithm: 'HS256' }
);
console.log(token);
```

2. GraphQL-Request mit Authorization-Header:

```graphql
# Query mit Auth-Header
# Authorization: Bearer <jwt-token>
query GetMyData {
  myVerbrauchstypen: allVerbrauchstyps(
    filter: { userId: { equalTo: "<user-uuid>" } }
  ) {
    nodes {
      id
      name
    }
  }
}
```

---

## 🧪 Testing

### Datenbank-Inhalte pruefen

```bash
# Anzahl Tabellen anzeigen
docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db -c "\dt"

# Daten einer Tabelle anzeigen
docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db -c "SELECT * FROM verbrauchstyp LIMIT 5;"
```

### Verbindungstest

```bash
# Test mit psql
docker exec -it hometrack-postgres psql -U hometrack_user -d hometrack_db -c "SELECT 'Connection OK' as status;"

# Test mit curl (PostGraphile)
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ allVerbrauchstyps { nodes { id name } } }"}'
```

---

## 🛡️ Sicherheit

### Wichtige Hinweise fuer Produktion

1. **Niemals Standard-Passwoerter verwenden!**
   - Aendere alle Passwoerter in `.env.local`
   - Verwende starke, zufaellige Passwoerter

2. **JWT Secret**
   - Generiere ein neues Secret: `openssl rand -hex 32`
   - Speichere es sicher

3. **Datenbank auf Raeubern**
   - Aktiviere SSL/TLS
   - Schraenke den Zugriff ein (Firewall)

4. **Backups**
   ```bash
   # Backup erstellen
docker exec hometrack-postgres pg_dump -U hometrack_user -d hometrack_db > backup_$(date +%Y-%m-%d).sql
   ```

---

## 📚 Referenzen

- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [PostGraphile](https://www.graphile.org/postgraphile/)
- [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 🎯 Naechste Schritte

1. [ ] Docker Compose starten
2. [ ] Verbindung zur Datenbank testen
3. [ ] PostGraphile GraphQL API testen (optional)
4. [ ] Frontend mit lokalem Backend verbinden
5. [ ] Daten von Nhost migrieren (falls gewuenscht)

---

**Hinweis:** Dies ist eine Entwicklungsumgebung. Für Produktion müssen zusätzliche Sicherheitsmaßnahmen getroffen werden!

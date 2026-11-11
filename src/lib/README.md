# Abstraktionsschichten für HomeTrackWeb

Dieses Verzeichnis enthält die Abstraktionsschichten für die Backend-Integration, die ein einfaches Umschalten zwischen verschiedenen Backend-Provider ermöglichen.

## Übersicht

### Ziel

Die Anwendung soll sowohl mit **Nhost** (Hasura GraphQL) als auch mit **lokalem PostgreSQL** (Docker) betrieben werden können. Die Auswahl erfolgt über die Umgebungsvariable `BACKEND_PROVIDER`:

- `BACKEND_PROVIDER=nhost` - Nhost/Hasura GraphQL (Standard)
- `BACKEND_PROVIDER=postgres` - Lokales PostgreSQL mit Docker

### Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────┐ │
│  │  Providers   │────▶│    Auth      │     │    Config      │ │
│  │  (providers  │     │   Context    │     │  (config.ts)   │ │
│  │    .tsx)     │◄────┤              │     │                 │ │
│  └──────────────┘     │   Provider   │     └────────┬─────────┘ │
│                       └──────────────┘              │          │
│                              │                       │          │
│                              ▼                       ▼          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Abstraktionsschichten                      │ │
│  │                                                                  │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │ │
│  │  │   AuthProvider   │  │ DatabaseProvider │  │StorageProvider│ │ │
│  │  │                 │  │                 │  │              │ │ │
│  │  │  - NhostAuth     │  │  - HasuraDB     │  │  - Nhost     │ │ │
│  │  │  - LocalAuth     │  │  - PostgresDB   │  │  - LocalFS   │ │ │
│  │  └──────────────────┘  └──────────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                     ▲              ▲              ▲
                     │              │              │
                     ▼              ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Nhost        │ │   PostgreSQL    │ │    Nhost        │
│   (Hasura)      │ │   (Docker)      │ │   Storage       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Konfiguration

### Umgebungsvariablen

| Variable | Werte | Standard | Beschreibung |
|----------|--------|----------|--------------|
| `BACKEND_PROVIDER` | `nhost`, `postgres` | `nhost` | Backend-Provider |
| `AUTH_PROVIDER` | `nhost`, `local` | `nhost` | Authentifizierungs-Provider |
| `NHOST_SUBDOMAIN` | string | `local` | Nhost Subdomain |
| `NHOST_REGION` | string | `eu-central-1` | Nhost Region |
| `POSTGRES_HOST` | string | `localhost` | PostgreSQL Host |
| `POSTGRES_PORT` | number | `5432` | PostgreSQL Port |
| `POSTGRES_DB` | string | `hometrack_db` | PostgreSQL Database |
| `POSTGRES_USER` | string | `hometrack_user` | PostgreSQL Benutzer |
| `POSTGRES_PASSWORD` | string | `hometrack_pass` | PostgreSQL Passwort |
| `JWT_SECRET` | string | `dev-...` | JWT Secret für lokale Auth |

### Docker-Setup

Für lokale Entwicklung mit PostgreSQL:

```bash
cd docker
docker-compose up -d
```

Dies startet:
- PostgreSQL auf Port 5432
- PostGraphile auf Port 5000 (GraphQL-Interface für PostgreSQL)
- pgAdmin auf Port 5050 (Web-UI)

Standard-Anmeldedaten:
- PostgreSQL: `hometrack_user/hometrack_pass`
- pgAdmin: `admin@admin.com/admin`

## Module

### 1. Auth (`./auth/`)

Authentifizierungs-Abstraktion mit:

- **Schnittstelle:** `AuthProvider` - Definiert alle Auth-Operationen
- **Implementierungen:**
  - `NhostAuthProvider` - Nhost Authentifizierung
  - `LocalAuthProvider` - Lokale JWT-basierte Authentifizierung
- **React-Integration:** `AuthContext` und `useAuth()` Hook

#### Verwendung

```typescript
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const auth = useAuth();
  
  const handleLogin = async () => {
    const result = await auth.signIn({
      email: 'user@example.com',
      password: 'password',
    });
    
    const currentUser = await auth.getCurrentUser();
  };
}
```

### 2. Datenbank (`./db/`)

Datenbank-Abstraktion mit:

- **Schnittstelle:** `DatabaseProvider` - Definiert alle CRUD-Operationen
- **Implementierungen:**
  - `HasuraDatabaseProvider` - GraphQL für Nhost/Hasura
  - `PostgresDatabaseProvider` - Direktes PostgreSQL
- **React-Integration:** `DatabaseContext` und `useDatabase()` Hook

#### Entitäten

- Verbrauchstypen
- Verbrauchsstellen (Zähler)
- Anbieter
- Verträge
- Preisperioden
- Verbrauchswerte
- User Settings
- Handwerker
- Handwerkerrechnungen

#### Verwendung

```typescript
import { useDatabase } from '@/lib/db';

async function VerbrauchstypenListe() {
  const db = useDatabase();
  const userId = 'user-id';
  
  const typen = await db.getVerbrauchstypen(userId);
  
  return typen.map(typ => (
    <div key={typ.id}>{typ.name}</div>
  ));
}
```

### 3. Storage (`./storage/`)

Datei-Speicher Abstraktion mit:

- **Schnittstelle:** `StorageProvider` - Definiert alle Datei-Operationen
- **Implementierungen:**
  - `NhostStorageProvider` - Nhost Storage API
  - `LocalStorageProvider` - Lokales Dateisystem
- **React-Integration:** (wird über `useDatabase()` integriert)

#### Verwendung

```typescript
import { createStorageProvider } from '@/lib/storage';

async function UploadForm() {
  const storage = createStorageProvider();
  
  const result = await storage.upload(file, {
    directory: 'verbrauchswerte',
    filename: 'zaehlerstand.jpg',
  });
  
  return <img src={result.url} />;
}
```

### 4. GraphQL (`./graphql/`)

GraphQL-Queries und Mutations für Hasura:

- `queries.ts` - Bestehende Queries
- `queries-additional.ts` - Zusätzliche Queries für HasuraDatabaseProvider
- `mutations.ts` - Bestehende Mutations
- `mutations-additional.ts` - Zusätzliche Mutations für HasuraDatabaseProvider

## Provider-Auswahl

Die Auswahl des Providers erfolgt automatisch basierend auf der `BACKEND_PROVIDER` Umgebungsvariable:

### Nhost (Standard)

```bash
BACKEND_PROVIDER=nhost
AUTH_PROVIDER=nhost
```

### PostgreSQL (Docker)

```bash
BACKEND_PROVIDER=postgres
AUTH_PROVIDER=local
```

## Migration von Nhost zu PostgreSQL

### 1. Schema anlegen

Das PostgreSQL-Schema ist in `docker/init.sql` definiert und wird automatisch beim ersten Start des Containers erstellt.

### 2. Daten migrieren

Das Skript `docker/seed.sql` enthält Beispieldaten. Für eine echte Migration:

1. Daten aus Nhost/Hasura exportieren
2. In PostgreSQL importieren
3. Format anpassen (camelCase ↔ snake_case)

### 3. Anpassungen im Frontend

Die bestehenden Komponenten müssen aktualisiert werden, um die neue Abstraktionsschicht zu verwenden:

**Alt (Nhost-spezifisch):**
```typescript
import nhost from '@/lib/nhost';
import { useQuery } from '@apollo/client';
import { GET_VERBRAUCHSTYPEN } from '@/lib/graphql/queries';
```

**Neu (Backend-unabhängig):**
```typescript
import { useDatabase } from '@/lib/db';

const db = useDatabase();
const typen = await db.getVerbrauchstypen(userId);
```

## Testing

### Nhost-Testing

```bash
BACKEND_PROVIDER=nhost npm run dev
```

### PostgreSQL-Testing

```bash
BACKEND_PROVIDER=postgres npm run dev
```

Vorher Docker-Container starten:
```bash
cd docker
docker-compose up -d
```

## Fehlerbehebung

### Verbindung zu PostgreSQL fehlgeschlagen

- Prüfen ob Docker-Container läuft: `docker ps`
- Prüfen ob Port 5432 verfügbar ist
- Verbindungstest: `psql -h localhost -p 5432 -U hometrack_user -d hometrack_db`

### GraphQL-Fehler bei Hasura

- Prüfen ob Nhost-Service erreichbar ist
- Prüfen ob Access-Token gültig ist
- Prüfen ob die GraphQL-Queries mit dem Schema übereinstimmen

## Dateistruktur

```
src/lib/
├── auth/
│   ├── types.ts              # Typdefinitionen
│   ├── auth-provider.ts      # Schnittstelle + Factory
│   ├── nhost-auth-provider.ts # Nhost-Implementierung
│   ├── local-auth-provider.ts # Lokale JWT-Implementierung
│   └── index.ts              # Exporte
├── db/
│   ├── types.ts              # Typdefinitionen
│   ├── errors.ts             # Fehlerbehandlung
│   ├── db-provider.ts        # Schnittstelle + Factory
│   ├── hasura-db-provider.ts # Hasura-Implementierung
│   ├── postgres-db-provider.ts # PostgreSQL-Implementierung
│   └── index.ts              # Exporte
│   └── postgres/             # PostgreSQL Teil-Provider
│       ├── base-provider.ts
│       ├── verbrauchstyp-provider.ts
│       ├── verbrauchsstelle-provider.ts
│       ├── verbrauchswert-provider.ts
│       ├── anbieter-provider.ts
│       ├── handwerker-provider.ts
│       └── settings-provider.ts
├── storage/
│   ├── types.ts              # Typdefinitionen
│   ├── storage-provider.ts   # Schnittstelle + Factory
│   ├── nhost-storage-provider.ts # Nhost-Implementierung
│   ├── local-storage-provider.ts # Lokale Dateisystem-Implementierung
│   └── index.ts              # Exporte
├── graphql/
│   ├── queries.ts            # GraphQL-Queries (bestehend)
│   ├── queries-additional.ts # Zusätzliche Queries
│   ├── mutations.ts          # GraphQL-Mutations (bestehend)
│   ├── mutations-additional.ts # Zusätzliche Mutations
│   └── index.ts              # Exporte
└── config.ts                 # Zentrale Konfiguration
```

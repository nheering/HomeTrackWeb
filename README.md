# HomeTrack 🏠⚡

Eine Web-App zur Erfassung, Analyse und Optimierung von Verbrauchsdaten im Haushalt. Gebaut mit **Next.js 14** und **nHost** (EU-hosted Backend).

---

## Features

- 🔐 **Authentifizierung** (Email/Passwort via nHost Auth)
- 📊 **Dashboard** mit Verbrauchskacheln (letzter Zählerstand, 3-Monats-Durchschnitt, Jahresgesamt)
- 📈 **Auswertungen** mit interaktiven Charts (Area-Chart) und Tabellenansicht
- ⚙️ **Einstellungen** – vollständige CRUD-Verwaltung für:
  - Verbrauchstypen (Gas, Strom, Wasser, etc. mit Symbol & Farbe)
  - Verbrauchsstellen (Zähler) inkl. Standardstelle je Typ
  - Anbieter mit Kontaktdaten
  - Verträge mit Preisperioden-History
- 📷 **Foto-Upload** bei Zählerstandserfassung (nHost Storage)
- 🔒 **Row Level Security** – jeder Nutzer sieht nur seine eigenen Daten

---

## Tech Stack

| Schicht     | Technologie |
|-------------|-------------|
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend     | nHost (EU – Frankfurt) |
| Datenbank   | PostgreSQL via Hasura GraphQL |
| Auth        | nHost Auth (Email/Passwort) |
| File Storage| nHost Storage |
| Charts      | Recharts |
| Icons       | Lucide React |

---

## Setup

### 1. nHost Projekt erstellen

1. Gehe zu [app.nhost.io](https://app.nhost.io) und erstelle ein neues Projekt
2. Wähle **EU Frankfurt** als Region (DSGVO-konform)
3. Notiere dir **Subdomain** und **Region** deines Projekts

### 2. Datenbank migrieren

Führe die SQL-Migration in deinem nHost-Projekt aus:

1. Öffne in nHost das **Hasura-Dashboard**
2. Gehe zu **Data > SQL**
3. Kopiere den Inhalt von `hasura/migrations/default/1_init/up.sql`
4. Führe ihn aus

Alternativ via Hasura CLI:
```bash
hasura migrate apply --database-name default
```

### 3. Hasura Permissions einrichten

Im Hasura-Dashboard unter **Permissions** für jede Tabelle:

- **Role**: `user`
- **Select / Insert / Update / Delete**: aktivieren
- **Row filter**: `{"user_id": {"_eq": "X-Hasura-User-Id"}}`
- **Column presets** (Insert): `user_id: X-Hasura-User-Id`

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

Trage deine nHost-Daten ein:
```env
NEXT_PUBLIC_NHOST_SUBDOMAIN=dein-projekt-subdomain
NEXT_PUBLIC_NHOST_REGION=eu-central-1
```

### 5. Dependencies installieren & starten

```bash
npm install
npm run dev
```

App läuft unter [http://localhost:3000](http://localhost:3000)

---

## Projektstruktur

```
hometrack/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard (Home)
│   │   ├── auswertungen/         # Charts & Tabellen
│   │   ├── einstellungen/        # Stammdaten-Verwaltung
│   │   └── auth/login/           # Login & Registrierung
│   ├── components/
│   │   ├── layout/               # Navigation
│   │   ├── home/                 # Dashboard-Komponenten
│   │   └── modals/               # CRUD-Modals
│   ├── lib/
│   │   ├── nhost.ts              # nHost Client
│   │   └── graphql/              # Queries & Mutations
│   └── types/                    # TypeScript Typen
├── hasura/
│   └── migrations/               # SQL Schema
└── .env.local.example
```

---

## Deployment

### Vercel (empfohlen)

```bash
# Vercel CLI
npx vercel

# Environment Variables in Vercel Dashboard setzen:
# NEXT_PUBLIC_NHOST_SUBDOMAIN
# NEXT_PUBLIC_NHOST_REGION
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Roadmap (nächste Schritte)

- [ ] Verbrauchsstellen-Modal (UI für Anlegen/Bearbeiten von Zählern)
- [ ] Detail-Ansicht pro Verbrauchstyp mit Verlaufsdiagramm
- [ ] Kostenberechnung in Auswertungen (Verbrauch × Preisperiode)
- [ ] PWA / Offline-Support (Service Worker)
- [ ] iOS-App (SwiftUI) mit gleicher nHost-Datenbank

---

## Lizenz

MIT

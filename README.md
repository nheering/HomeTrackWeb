# HomeTrack 🏠⚡

Eine mobile-first PWA zur Erfassung, Analyse und Optimierung von Verbrauchsdaten im Haushalt. Gebaut mit **Next.js 14** und **nHost** (EU-hosted Backend).

---

## Features

- 🔐 **Authentifizierung** (Email/Passwort via nHost Auth)
- 📊 **Dashboard** mit Verbrauchskacheln – letzter Zählerstand, 3-Monats-Durchschnitt, Min/Max und Jahresgesamt pro Verbrauchstyp
- 🗂️ **Detailansicht** – Bottom-Drawer pro Verbrauchstyp mit vollständiger Eintrags-Liste, Bearbeiten und Löschen
- 📈 **Auswertungen** – interaktive Area-Charts und Tabellenansicht mit flexiblen Zeitraumfiltern (3M / 6M / 1J / Aktuelles Jahr / Benutzerdefiniert)
- 💶 **Kostenansicht** in Auswertungen – automatische Berechnung auf Basis von Preisperioden (Verbrauch × Einheitspreis × (1 + MwSt.))
- ⚙️ **Einstellungen** – vollständige CRUD-Verwaltung für:
  - Verbrauchstypen (Gas, Strom, Wasser, etc. mit Symbol & Farbe)
  - Verbrauchsstellen (Zähler) inkl. Standardstelle je Typ und Neuberechnung aller Verbrauchswerte
  - Anbieter mit Kontaktdaten
  - Verträge mit Preisperioden-History
- 📷 **Foto-Upload** bei Zählerstandserfassung (nHost Storage)
- 👤 **Nutzerprofil** – Avatar-Upload, Anzeigename bearbeiten, Passwort ändern
- 🧭 **Navigationsposition** – unten (Mobile) oder links (Desktop), als Nutzereinstellung gespeichert
- ➕ **Kontextsensitiver + Button** – je nach aktiver Seite direkt die passende Erfassungsmaske öffnen
- 📅 **Smarte Datumseingabe** – Auto-Vervollständigung mit Punkten und Kalender-Overlay
- 🔒 **Row Level Security** – jeder Nutzer sieht nur seine eigenen Daten

---

## Tech Stack

| Schicht      | Technologie                                    |
|--------------|------------------------------------------------|
| Frontend     | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend      | nHost (EU – Frankfurt)                         |
| Datenbank    | PostgreSQL via Hasura GraphQL                  |
| Auth         | nHost Auth (Email/Passwort)                    |
| File Storage | nHost Storage                                  |
| Charts       | Recharts                                       |
| Datepicker   | react-day-picker v8 + date-fns v3              |
| Icons        | Lucide React                                   |

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
3. Kopiere den Inhalt von `nhost/migrations/default/1_init/up.sql`
4. Führe ihn aus

Alternativ via nHost CLI:
```bash
nhost dev hasura metadata apply \
  --endpoint https://local.hasura.nhost.run \
  --admin-secret nhost-admin-secret
```

### 3. Hasura Permissions einrichten (⚠️ WICHTIG)

Dieser Schritt ist **zwingend erforderlich**, sonst funktionieren Mutations (Insert/Update/Delete) nicht!

Gehe im Hasura-Dashboard zu **Data → [Tabelle] → Permissions** und konfiguriere für jede Tabelle:

#### Für ALLE Tabellen (verbrauchstyp, verbrauchsstelle, anbieter, vertrag, preisperiode, verbrauchswert):

**Role: `user`**

| Operation  | Row Filter / Check                              | Column Presets              |
|------------|------------------------------------------------|-----------------------------|
| **Select** | `{"user_id": {"_eq": "X-Hasura-User-Id"}}`     | –                           |
| **Insert** | `{}` *(leer – nicht user_id filtern!)*         | `user_id: X-Hasura-User-Id` |
| **Update** | `{"user_id": {"_eq": "X-Hasura-User-Id"}}`     | –                           |
| **Delete** | `{"user_id": {"_eq": "X-Hasura-User-Id"}}`     | –                           |

> **Achtung:** Der Insert-Check muss `{}` (leer) sein! Ein Check auf `user_id` schlägt fehl, weil der Column-Preset erst **nach** dem Check greift.

**Wichtig:** Ohne diese Permissions erhältst du den Fehler:
```
ApolloError: no mutations exist
```

#### Schnell-Check in Hasura:
1. Gehe zu **Data → verbrauchstyp → Permissions**
2. Prüfe ob die Role `user` existiert
3. Klicke auf `user` → Es sollten alle 4 Operationen (Select, Insert, Update, Delete) mit grünem Häkchen angezeigt werden

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
│   │   ├── auswertungen/         # Charts & Tabellen + Kostenansicht
│   │   ├── einstellungen/        # Stammdaten-Verwaltung & Profil
│   │   └── auth/login/           # Login & Registrierung
│   ├── components/
│   │   ├── layout/               # Navigation (Bottom / Left)
│   │   ├── home/                 # Dashboard-Kacheln & Detail-Drawer
│   │   ├── modals/               # CRUD-Modals (Typen, Stellen, Anbieter, …)
│   │   └── ui/                   # DateInput, StorageImage
│   ├── lib/
│   │   ├── nhost.ts              # nHost Client
│   │   └── graphql/              # Queries & Mutations
│   └── types/                    # TypeScript Typen
├── nhost/
│   └── migrations/               # SQL Schema & Metadaten
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

- [x] Verbrauchsstellen-Modal (UI für Anlegen/Bearbeiten von Zählern)
- [x] Detail-Ansicht pro Verbrauchstyp mit Verlaufsdiagramm
- [x] Kostenberechnung in Auswertungen (Verbrauch × Preisperiode)
- [ ] PWA / Offline-Support (Service Worker)
- [ ] iOS-App (SwiftUI) mit gleicher nHost-Datenbank

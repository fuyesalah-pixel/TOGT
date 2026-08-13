# TOGT Tour & Travel Management System

A full-stack platform to digitize the operations of **TOGT Tour & Travel**, an IATA-accredited travel agency based in Addis Ababa, Ethiopia, covering all six of its core business lines:

- ✈️ **Ticket Office** (IATA BSP ticketing, refunds, reissues)
- 🕋 **Umrah Packages** (Economy / VIP / Honeymoon / Custom + Gift feature)
- 🏔️ **Domestic Tours** (School / Honeymoon / Friends / Corporate)
- 🌍 **Foreigner Tours** (Airport-to-Airport inbound tourism)
- 🛂 **Visa Processing** (Visit / Medical / Family visas)
- 💼 **Consulting** (across all service lines)

## Brand Identity

| Color | Hex | Usage |
|---|---|---|
| TOGT Blue | `#1F67B1` | Primary, logo, headers |
| TOGT Orange | `#FF9300` | Accent, buttons, highlights |
| White | `#FFFFFF` | Background |
| Dark Navy | `#12394F` | Footer, contrast text |

Style: Aviation-inspired, modern, professional, trustworthy.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Queue | Valkey (Redis-compatible) + BullMQ |
| Real-time | Socket.io |
| Mobile | React Native (Expo) |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend |
| SMS | SMSEthiopia |
| AI | OpenAI (GPT-3.5 Turbo) |
| Monitoring | GlitchTip |
| Hosting | Hostinger VPS (Docker) |
| CI/CD | GitHub Actions |

## Monorepo Structure

```
TOGT web app/
├── togt-web/          # Next.js 14 frontend (public site + dashboards)
├── togt-api/           # NestJS backend (REST API, Prisma, BullMQ)
├── togt-mobile/        # React Native (Expo) mobile app
├── docs/                # Requirements, DB schema, API spec, project plan
├── docker-compose.yml   # PostgreSQL + Valkey (local dev infra)
├── .env.example         # Root-level env vars for docker-compose
└── README.md
```

## Getting Started

### 1. Clone & configure environment

```bash
git clone https://github.com/fuyesalah-pixel/TOGT.git
cd "TOGT web app"
cp .env.example .env
cp togt-web/.env.example togt-web/.env.local
cp togt-api/.env.example togt-api/.env
```

### 2. Start infrastructure (PostgreSQL + Valkey)

```bash
docker compose up -d
```

### 3. Install dependencies & run apps

```bash
# Backend
cd togt-api
npm install
npm run start:dev

# Frontend (in a new terminal)
cd togt-web
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`, backend API at `http://localhost:3001` (see `togt-api/.env`).

## Documentation

See the [`docs/`](./docs) folder for:
- [`requirements.md`](./docs/requirements.md) — full business analysis & functional requirements
- [`database-schema.md`](./docs/database-schema.md) — entity/table design
- [`api-endpoints.md`](./docs/api-endpoints.md) — REST API reference
- [`project-plan.md`](./docs/project-plan.md) — phased build roadmap

## User Roles

`customer` · `worker` · `guide` (Imam/Tour Guide) · `admin` · `tech` — each user has exactly one role. Authentication is via Google OAuth 2.0 (JWT-based sessions), except for the seeded `admin`/`tech` accounts.

## Multi-Language Support

Public homepage supports **English, Arabic, Amharic, Oromiffa** (`en` / `ar` fully translated; `am` / `om` placeholder dictionaries). All dashboards operate in English only.

## License

Proprietary — TOGT Tour & Travel. All rights reserved.

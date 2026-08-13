# TOGT Project Plan — Phased Roadmap

## Phase 1 — Foundation (current)
- Monorepo folder structure, docker-compose (Postgres + Valkey), docs, git + GitHub remote
- Next.js 14 bootstrap (`togt-web`) with Tailwind, shadcn/ui, next-intl i18n scaffolding
- Homepage shell with all public sections (static/mock content, brand theme applied)
- Smart Form UI (6 tabs) with client-side validation and mock submit handler
- NestJS bootstrap (`togt-api`) with Prisma schema stub matching `database-schema.md`

## Phase 2 — Auth & Core API
- Google OAuth 2.0 integration, JWT + refresh tokens, RBAC guards
- Seed admin/tech accounts (bcrypt)
- Real `service-requests`, `packages`, `tickets`, `visa-applications`, `consulting`, `umrah/gifts` modules wired to Prisma/Postgres
- Connect Smart Form to real API endpoints end-to-end

## Phase 3 — Customer & Worker Dashboards
- Customer Dashboard: Track Processes, History, Reviews, Notifications, Settings
- Worker Dashboard: Users, Create (user/group/package), Progress, Notifications, Settings
- Email (Resend) + SMS (SMSEthiopia) notification automation via BullMQ

## Phase 4 — Guide Dashboard & GPS
- Group cards, My Members, Tracking Plan, Track Map
- Real-time GPS via Socket.io, 1km geofence alerts
- Parent tracking secure link
- TimescaleDB hypertable for `location_tracking`

## Phase 5 — Admin & Tech Dashboards
- Admin: Users management, Reports (with PDF export via Puppeteer), bulk Notifications
- Tech: System health, GlitchTip integration, maintenance mode, AI error analyzer (read-only)

## Phase 6 — Chat, AI Assistant, Reviews
- Real-time chat (Socket.io) with file upload (Cloudflare R2, 10MB limit)
- AI Assistant (OpenAI GPT-3.5 Turbo, RAG pipeline on TOGT services/policies), multi-language
- Review system with 24h auto-publish, homepage testimonials pagination

## Phase 7 — Mobile App
- React Native (Expo) bootstrap in `togt-mobile`
- Customer features parity + Azan alarm, Qibla locator, push notifications

## Phase 8 — Offline Mode & Automation
- Worker Dashboard offline mode (IndexedDB + Service Worker background sync)
- Daily automated backup (pg_dump → gzip → Telegram Bot, 30-day retention)

## Phase 9 — Deployment & CI/CD
- Full docker-compose (add `api`, `web`, `glitchtip`, `nginx` services)
- GitHub Actions CI/CD pipeline
- Hostinger VPS deployment, SSL, domain setup

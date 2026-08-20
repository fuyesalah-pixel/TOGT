# TOGT API

NestJS backend for TOGT Tour & Travel.

## Local Setup

1. Start PostgreSQL and Valkey from the repository root:

   ```bash
   docker compose up -d postgres valkey
   ```

2. Copy `.env.example` to `.env` and configure Google OAuth, JWT secrets, and optional R2/Resend/SMS credentials.

3. Install and initialize Prisma:

   ```bash
   npm install
   npm run prisma:validate
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   npm run seed
   ```

4. Start the API:

   ```bash
   npm run start:dev
   ```

The API listens on `http://localhost:4000/api` by default.

## Security

- Access JWT: 15 minutes, stored in an httpOnly cookie.
- Refresh JWT: 7 days, rotated and stored in Valkey.
- Revoked access and refresh tokens are blacklisted or deleted in Valkey.
- Global JWT and role guards reject terminated users and unauthorized roles.
- Global throttling defaults to 100 requests per minute; OAuth endpoints are limited to 10 per minute.
- Uploads are restricted to JPG, PNG, GIF, WebP, and PDF with a 10 MB limit.

## Production

Run `npm run prisma:migrate:deploy` during deployment, then start with `npm run start:prod`. Use strong JWT secrets, HTTPS, `COOKIE_SECURE=true`, a restricted `FRONTEND_URL`, and configured R2 public storage.

# TOGT Production Deploy Runbook

One compose file, one command, one source of truth: [docker-compose.yaml](docker-compose.yaml).

- VPS: Hostinger `srv1897995`, stack at `/docker/togt-travel`, Traefik serves `https://travel.togttrading.com`.
- **API and web are built from the local checkout** (`./togt-api`, `./togt-web` build contexts). A `git pull` changes the build context, so `up -d --build` always ships the pulled code — no cache-bust vars, no stale layers.
- Migrations run automatically on API boot (`npx prisma migrate deploy && node dist/main.js`).

## Standard deploy

```bash
cd /docker/togt-travel
git pull
docker compose up -d --build
```

That's it. First build after a pull takes a few minutes (web/Next.js is the long pole).

## Verify

If a `git pull` touched `docker-compose.yaml` itself, run `docker compose config --quiet` first — it catches YAML/typo errors before an `up` can half-apply them.

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'        # api/web/postgres/valkey Up
docker logs --tail 30 togt-api-prod                       # migrations applied + "Nest application successfully started"
curl -s https://travel.togttrading.com/downloads/version.json
curl -s -o /dev/null -w '%{http_code}\n' https://travel.togttrading.com/api/system/maintenance/public   # 200
curl -sL -o /dev/null -w '%{http_code}\n' https://travel.togttrading.com/en                              # 200
```

Homepage redirects `/` → `/en`: use `-L` (follow redirects) when grepping page content, or grep returns 0 on a healthy site.

## Common pitfalls (all real incidents)

- **Bare `docker compose` used to pick the wrong file.** There used to be `docker-compose.yml` / `docker-compose.prod.yml` decoys; they are deleted. If `docker compose config` ever shows something other than `docker-compose.yaml`, stop and re-checkout the repo.
- **P1001 "Can't reach database server at postgres:5432"** with postgres Up/healthy = the API container is not on the postgres network (healthchecks only test *inside* a container). Fix: `docker compose up -d --force-recreate` (the whole stack), wait ~30 s, check logs again.
- **Crash-loop (exit 1) after a deploy** → `docker inspect togt-api-prod --format 'ExitCode={{.State.ExitCode}} OOMKilled={{.State.OOMKilled}}'`. `OOMKilled=true` means the box ran out of RAM during a build; let the build finish, then `up -d togt-api`. Exit 1 with a Prisma/Nest error in logs → read the log, it names the missing env or failed step.
- **The build itself can starve the API** on a small VPS (this caused an outage once). Prefer deploying when idle; adding swap on the VPS is recommended.

## First-time setup / .env

Copy `.env.example` → `.env` and fill in secrets (JWT secrets, Google OAuth, Chapa, R2, Resend, SMS, Mapbox). TTLs default to 30 days (`2592000`); `ADMIN_EMAILS` auto-promotes listed emails on boot. Postgres/Valkey data live in named volumes `togt_postgres_data` / `togt_valkey_data` and survive recreation.

## Rollback

```bash
git log --oneline -5                # pick the last known-good commit
git checkout <sha> && docker compose up -d --build
git checkout main
```

## Mobile releases (no VPS access needed)

`togt-mobile-flutter` APK + `public/downloads/version.json` are built and pushed by the GitHub workflow `build-flutter-apk.yml` on every push to `main`; phones auto-update in-app. CI also builds/pushes the `ghcr.io/fuyesalah-pixel/togt-{api,web}:main` images on every push — the compose tags default to `:latest` so a `docker compose pull togt-api togt-web` fallback works if a build is impossible on the VPS.

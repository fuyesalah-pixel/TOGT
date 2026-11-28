#!/usr/bin/env node
/**
 * Push the store listing (title, descriptions, icon, feature graphic,
 * screenshots) for one language to Google Play.
 *
 * Reads from store-listing/<language>/:
 *   short-description.txt  (max 80 chars)
 *   full-description.txt   (max 4000 chars)
 *   icon.png               (512x512, 32-bit PNG)
 *   feature-graphic.png    (1024x500)
 *   screenshots/*.png      (phone screenshots, 2:1 or taller-free ratio)
 *
 * The title is kept as-is unless --title is given.
 *
 *   node scripts/play-listing.mjs
 *   node scripts/play-listing.mjs --language en-US --title "TOGT Tour & Travel"
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE = 'com.togt.travel';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const UPLOAD_API = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3';
const KEY = path.join(ROOT, '.secrets/google-play-service-account.json');

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    language: 'en-US',
    title: '',
    dryRun: false,
    dir: path.join(ROOT, 'store-listing/en-US'),
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const v = argv[++i];
      if (!v || v.startsWith('--')) fail(`${arg} needs a value`);
      return v;
    };
    if (arg === '--language') args.language = value();
    else if (arg === '--title') args.title = value();
    else if (arg === '--dir') args.dir = path.resolve(value());
    else if (arg === '--dry-run') args.dryRun = true;
    else fail(`unknown argument: ${arg}`);
  }
  return args;
}

async function accessToken() {
  const keyPath = process.env.PLAY_SERVICE_ACCOUNT || KEY;
  if (!fs.existsSync(keyPath)) fail(`service account key not found at ${keyPath}`);
  const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url');
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(sa.private_key, 'base64url');
  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) fail(`token exchange failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function player(token) {
  const base = `${API}/applications/${encodeURIComponent(PACKAGE)}`;
  const request = async (method, url, init = {}) => {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
      body: init.body,
      signal: AbortSignal.timeout(120_000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}\n${text.slice(0, 600)}`);
    return text ? JSON.parse(text) : {};
  };
  return {
    json: (method, suffix, body) =>
      request(method, `${base}${suffix}`, {
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    upload: (suffix, bytes, contentType = 'image/png') =>
      request('POST', `${UPLOAD_API}/applications/${encodeURIComponent(PACKAGE)}${suffix}?uploadType=media`, {
        headers: { 'Content-Type': contentType, 'Content-Length': String(bytes.length) },
        body: bytes,
      }),
    delete: (suffix) => request('DELETE', `${base}${suffix}`),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = args.dir.endsWith(args.language) ? args.dir : path.join(args.dir, args.language);
  const shortDesc = fs.readFileSync(path.join(dir, 'short-description.txt'), 'utf8').trim();
  const fullDesc = fs.readFileSync(path.join(dir, 'full-description.txt'), 'utf8').trim();
  const iconPath = path.join(dir, 'icon.png');
  const featurePath = path.join(dir, 'feature-graphic.png');
  const shotsDir = path.join(dir, 'screenshots');
  const shots = fs.existsSync(shotsDir)
    ? fs.readdirSync(shotsDir).filter((f) => f.endsWith('.png')).sort()
    : [];

  if (shortDesc.length > 80) fail(`short description is ${shortDesc.length} chars (max 80)`);
  if (fullDesc.length > 4000) fail(`full description is ${fullDesc.length} chars (max 4000)`);
  for (const file of [iconPath, featurePath, ...shots.map((s) => path.join(shotsDir, s))]) {
    if (!fs.existsSync(file)) fail(`missing ${file}`);
  }

  console.log('Listing');
  console.log(`  language:   ${args.language}`);
  console.log(`  short:      ${shortDesc.length}/80 chars`);
  console.log(`  full:       ${fullDesc.length}/4000 chars`);
  console.log(`  assets:     icon, feature graphic, ${shots.length} screenshot(s)`);

  if (args.dryRun) {
    console.log('[dry-run] nothing uploaded');
    return;
  }

  const token = await accessToken();
  const play = await player(token);

  const edit = await play.json('POST', '/edits', {});
  try {
    const current = await play.json('GET', `/edits/${edit.id}/listings/${args.language}`).catch(() => ({}));
    const listing = {
      language: args.language,
      title: args.title || current.title,
      shortDescription: shortDesc,
      fullDescription: fullDesc,
    };
    if (!listing.title) fail('no title set on the listing and --title was not given');

    await play.json('PUT', `/edits/${edit.id}/listings/${args.language}`, listing);
    console.log(`Text saved (title: "${listing.title}")`);

    await play.upload(`/edits/${edit.id}/listings/${args.language}/icon`, fs.readFileSync(iconPath));
    console.log('Icon uploaded');

    await play.upload(
      `/edits/${edit.id}/listings/${args.language}/featureGraphic`,
      fs.readFileSync(featurePath),
    );
    console.log('Feature graphic uploaded');

    await play.delete(`/edits/${edit.id}/listings/${args.language}/phoneScreenshots`).catch(() => {});
    for (const shot of shots) {
      await play.upload(
        `/edits/${edit.id}/listings/${args.language}/phoneScreenshots`,
        fs.readFileSync(path.join(shotsDir, shot)),
      );
      console.log(`Screenshot uploaded: ${shot}`);
    }

    const committed = await play.json('POST', `/edits/${edit.id}:commit`);
    console.log(`Committed edit ${committed.id}`);
  } catch (err) {
    console.error(err.message);
    await play.delete(`/edits/${edit.id}`).catch(() => {});
    process.exit(1);
  }
}

main().catch((err) => fail(err.message));

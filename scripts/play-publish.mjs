#!/usr/bin/env node
/**
 * Upload the Flutter App Bundle to Google Play and assign it to a track.
 *
 * Uses the Play Developer API v3 with a service-account JSON key, so it needs
 * no npm dependencies (node:crypto signs the JWT, global fetch talks to Google).
 *
 * Auth: PLAY_SERVICE_ACCOUNT points at the key file; otherwise the key is read
 * from .secrets/google-play-service-account.json (gitignored).
 *
 * Examples:
 *   node scripts/play-publish.mjs --list
 *   node scripts/play-publish.mjs --track internal --status completed
 *   node scripts/play-publish.mjs --aab path/to/app-release.aab --dry-run
 *   node scripts/play-publish.mjs --uploader curl --track internal   # flaky links
 *   node scripts/play-publish.mjs --track internal --status completed --version-code 11
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PACKAGE = 'com.togt.travel';
const DEFAULT_AAB = path.join(
  ROOT,
  'togt-mobile-flutter/build/app/outputs/bundle/release/app-release.aab',
);
const DEFAULT_KEY = path.join(ROOT, '.secrets/google-play-service-account.json');
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
// Media/resumable sessions are opened on the /upload host, not the JSON host.
const UPLOAD_API = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3';
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const STATUSES = ['draft', 'completed', 'halted', 'inProgress'];

function parseArgs(argv) {
  const args = {
    aab: DEFAULT_AAB,
    package: DEFAULT_PACKAGE,
    track: 'internal',
    status: 'draft',
    notes: '',
    language: 'en-US',
    dryRun: false,
    list: false,
    uploader: 'fetch',
    versionCode: '',
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const v = argv[++i];
      if (!v || v.startsWith('--')) fail(`${arg} needs a value`);
      return v;
    };
    switch (arg) {
      case '--aab': args.aab = value(); break;
      case '--package': args.package = value(); break;
      case '--track': args.track = value(); break;
      case '--status': args.status = value(); break;
      case '--notes': args.notes = value(); break;
      case '--notes-file': args.notes = fs.readFileSync(value(), 'utf8').trim(); break;
      case '--language': args.language = value(); break;
      case '--uploader': args.uploader = value(); break;
      case '--version-code': args.versionCode = value(); break;
      case '--dry-run': args.dryRun = true; break;
      case '--list': args.list = true; break;
      case '-h':
      case '--help':
        console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
        process.exit(0);
        break;
      default: fail(`unknown argument: ${arg}`);
    }
  }
  if (!STATUSES.includes(args.status)) {
    fail(`--status must be one of ${STATUSES.join(', ')}`);
  }
  if (!['fetch', 'curl'].includes(args.uploader)) {
    fail('--uploader must be fetch or curl');
  }
  return args;
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function loadServiceAccount() {
  const keyPath = process.env.PLAY_SERVICE_ACCOUNT || DEFAULT_KEY;
  if (!fs.existsSync(keyPath)) {
    fail(
      `service account key not found at ${keyPath}\n` +
        'Set PLAY_SERVICE_ACCOUNT to the key file, or put it at ' +
        '.secrets/google-play-service-account.json',
    );
  }
  const json = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  if (json.type !== 'service_account' || !json.private_key || !json.client_email) {
    fail(`${keyPath} is not a Google service-account JSON key`);
  }
  return json;
}

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(sa.private_key, 'base64url');

  const res = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    fail(`token exchange failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeClient(token, packageName) {
  const base = `${API}/applications/${encodeURIComponent(packageName)}`;
  return async function call(method, suffix, { json, body, contentType } = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    let payload;
    if (json !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(json);
    } else if (body !== undefined) {
      headers['Content-Type'] = contentType;
      payload = body;
    }

    // Play occasionally answers 429/5xx while an edit is settling; retrying the
    // same request is safe because edits are idempotent within their lifetime.
    const attempts = 4;
    for (let attempt = 1; ; attempt++) {
      let res;
      let text;
      try {
        res = await fetch(`${base}${suffix}`, {
          method,
          headers,
          body: payload,
          signal: AbortSignal.timeout(120_000),
        });
        text = await res.text();
      } catch (networkErr) {
        if (attempt >= attempts) throw networkErr;
        await sleep(attempt * 1500);
        continue;
      }
      let parsed = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
      const retryable = res.status === 429 || res.status >= 500;
      if (!res.ok && retryable && attempt < attempts) {
        console.error(`  ${method} ${suffix} -> ${res.status}, retry ${attempt}/${attempts - 1}`);
        await sleep(attempt * 1500);
        continue;
      }
      if (!res.ok) {
        const detail = typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed;
        const err = new Error(`${method} ${suffix} -> ${res.status}\n${detail}`);
        err.status = res.status;
        throw err;
      }
      return parsed;
    }
  };
}

async function uploadBundle({ token, packageName, editId, filePath }) {
  const data = fs.readFileSync(filePath);
  const total = data.length;
  const CHUNK = 8 * 1024 * 1024; // multiple of 256 KB, as the resumable protocol requires

  // 1. Open a resumable session; the returned URI is where the bytes go.
  const sessionRes = await fetch(
    `${UPLOAD_API}/applications/${encodeURIComponent(packageName)}/edits/${editId}/bundles?uploadType=resumable`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'application/octet-stream',
        'X-Upload-Content-Length': String(total),
      },
      body: '{}',
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!sessionRes.ok) {
    throw new Error(
      `cannot start upload session (${sessionRes.status}): ${await sessionRes.text()}`,
    );
  }
  const sessionUri = sessionRes.headers.get('location');
  if (!sessionUri) fail('upload session did not return a Location header');

  // 2. Send the bundle in chunks. Each chunk is retried on its own, and after a
  // failed attempt the server reports how many bytes it already has, so a
  // dropped connection resumes instead of restarting 65 MB.
  let offset = 0;
  let result = null;
  while (offset < total) {
    const end = Math.min(offset + CHUNK, total);
    const chunk = data.subarray(offset, end);
    let done = false;

    for (let attempt = 1; attempt <= 6 && !done; attempt++) {
      try {
        const res = await fetch(sessionUri, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${offset}-${end - 1}/${total}`,
            'Content-Length': String(chunk.length),
          },
          body: chunk,
          // Without this a stalled connection waits forever; Google can spend
          // minutes processing the final chunk of a large bundle.
          signal: AbortSignal.timeout(300_000),
        });

        if (res.status === 308) {
          const range = res.headers.get('range');
          const last = range ? Number(range.split('-')[1]) : end - 1;
          offset = last + 1;
          done = true;
          const pct = ((offset / total) * 100).toFixed(1);
          console.log(`  ${pct}% (${offset}/${total} bytes)`);
          continue;
        }
        if (res.ok) {
          result = await res.json();
          done = true;
          continue;
        }
        const detail = (await res.text()).slice(0, 300);
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable) throw new Error(`upload rejected (${res.status}): ${detail}`);
        console.error(`  chunk at ${offset} -> ${res.status}, retry ${attempt}/5`);
      } catch (err) {
        const cause = err.cause?.code || err.cause?.message || '';
        console.error(`  chunk at ${offset} failed (${err.message}${cause ? `: ${cause}` : ''}), retry ${attempt}/5`);
        if (attempt === 6) throw err;
      }
      await sleep(attempt * 2000);
      // Ask the server how much it has before resending, in case a failed
      // attempt actually landed.
      const status = await queryOffset(sessionUri, token, total).catch(() => offset);
      offset = status;
    }
    if (!done) {
      throw new Error(`upload stalled at ${offset}/${total} bytes after 6 attempts`);
    }
  }

  if (!result) fail('upload finished without a bundle response');
  return result;
}

// Same media upload, but handed to curl. Useful on flaky links where a single
// long-lived fetch connection stalls: curl retries the transfer itself.
async function uploadBundleCurl({ token, packageName, editId, filePath }) {
  const url =
    `${UPLOAD_API}/applications/${encodeURIComponent(packageName)}` +
    `/edits/${editId}/bundles?uploadType=media`;
  const out = execFileSync(
    'curl',
    [
      '-sS',
      '--fail-with-body',
      '--retry', '3',
      '--retry-delay', '5',
      '--retry-all-errors',
      '--max-time', '3600',
      '-X', 'POST',
      '-H', `Authorization: Bearer ${token}`,
      '-H', 'Content-Type: application/octet-stream',
      '--data-binary', `@${filePath}`,
      url,
    ],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  return JSON.parse(out);
}

// Resumable-protocol status probe: PUT with an empty body and a total-range
// header returns 308 + Range (bytes received so far) or 200 with the resource.
async function queryOffset(sessionUri, token, total) {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Range': `bytes */${total}` },
    signal: AbortSignal.timeout(60_000),
  });
  if (res.status === 308) {
    const range = res.headers.get('range');
    return range ? Number(range.split('-')[1]) + 1 : 0;
  }
  if (res.ok) return total;
  return 0;
}

async function listState(call, packageName) {
  const edit = await call('POST', '/edits', { json: {} });
  try {
    const [details, tracks, bundles, listings] = await Promise.all([
      call('GET', `/edits/${edit.id}/details`),
      call('GET', `/edits/${edit.id}/tracks`),
      call('GET', `/edits/${edit.id}/bundles`),
      call('GET', `/edits/${edit.id}/listings`),
    ]);
    console.log('App');
    console.log(`  package:        ${packageName}`);
    console.log(`  default lang:   ${details.defaultLanguage}`);
    for (const listing of listings.listings || []) {
      console.log(`  listing ${listing.language}: ${listing.title}`);
    }
    console.log('Tracks');
    for (const track of tracks.tracks || []) {
      const releases = (track.releases || [])
        .map((r) => `${r.status}${r.versionCodes ? ` [${r.versionCodes.join(', ')}]` : ' (empty)'}`)
        .join(', ');
      console.log(`  ${track.track}: ${releases || 'no releases'}`);
    }
    const codes = (bundles.bundles || []).map((b) => b.versionCode);
    console.log(`Uploaded bundles: ${codes.length ? codes.join(', ') : 'none'}`);
  } finally {
    await call('DELETE', `/edits/${edit.id}`).catch(() => {});
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sa = loadServiceAccount();
  const token = await accessToken(sa);
  const call = makeClient(token, args.package);

  if (args.list) {
    await listState(call, args.package);
    return;
  }

  // --version-code promotes a bundle that is already uploaded (for example to
  // turn the internal draft into a real rollout) without resending the file.
  const reuseBundle = Boolean(args.versionCode);
  if (!reuseBundle && !fs.existsSync(args.aab)) {
    fail(`AAB not found: ${args.aab}`);
  }
  const sizeMb = reuseBundle
    ? '0'
    : (fs.statSync(args.aab).size / (1024 * 1024)).toFixed(1);

  if (args.dryRun) {
    console.log(
      reuseBundle
        ? `[dry-run] would set versionCode ${args.versionCode} on track "${args.track}"`
        : `[dry-run] would upload ${args.aab} (${sizeMb} MB) to ${args.package}`,
    );
    console.log(`[dry-run] track=${args.track} status=${args.status} language=${args.language}`);
    await listState(call, args.package);
    return;
  }

  const edit = await call('POST', '/edits', { json: {} });
  try {
    let versionCode = String(args.versionCode || '');
    if (reuseBundle) {
      // Fail early with Google's own message if that code is not uploaded.
      const bundles = await call('GET', `/edits/${edit.id}/bundles`);
      const known = (bundles.bundles || []).map((b) => String(b.versionCode));
      if (!known.includes(versionCode)) {
        fail(`versionCode ${versionCode} is not uploaded (have: ${known.join(', ') || 'none'})`);
      }
      console.log(`Reusing uploaded versionCode ${versionCode}`);
    } else {
      console.log(`Uploading ${path.basename(args.aab)} (${sizeMb} MB) to ${args.package}...`);
      const upload = args.uploader === 'curl' ? uploadBundleCurl : uploadBundle;
      const bundle = await upload({
        token,
        packageName: args.package,
        editId: edit.id,
        filePath: args.aab,
      });
      versionCode = String(bundle.versionCode);
      console.log(`Uploaded as versionCode ${versionCode}`);
    }

    const release = {
      versionCodes: [versionCode],
      status: args.status,
    };
    if (args.notes) {
      release.releaseNotes = [{ language: args.language, text: args.notes }];
    }

    const updated = await call('PUT', `/edits/${edit.id}/tracks/${encodeURIComponent(args.track)}`, {
      json: { track: args.track, releases: [release] },
    });
    const state = updated.releases?.[0]?.status;
    console.log(`Assigned to track "${args.track}" (${state})`);

    const committed = await call('POST', `/edits/${edit.id}:commit`);
    console.log(`Committed edit ${committed.id}`);
  } catch (err) {
    console.error(err.message);
    await call('DELETE', `/edits/${edit.id}`).catch(() => {});
    process.exit(1);
  }
}

main().catch((err) => fail(err.message));

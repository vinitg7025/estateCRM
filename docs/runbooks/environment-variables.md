# Environment variables (pilot)

Every variable the deployed system uses: what it is for, where its value comes from, and the command that makes it.
Pilot: Vercel project `estatecrm` (production domain `https://estatecrm-navy.vercel.app`) and Supabase project
`estatesCRM` (ref `tkbaakabwolgjnpdvwjs`, Mumbai). Status as of 2026-10-02.

## Rules first
- **Type secrets in your own terminal or the provider's UI.** Never in chat, tickets, commits or files.
- **Vercel → `estatecrm` → Settings → Environment Variables.** Secrets go in as **Sensitive**. Vercel never shows a Sensitive
  value again, so to change one you re-enter the whole value. Keep a copy in your password manager.
- **One project, seven services, one set of variables** (CR-013). Each service reads `<NAME>` first, then
  `<SERVICE>_<NAME>` (for example `RECORDS_DATABASE_URL`). So per-service values **must** use the prefix, and the plain
  names `DATABASE_URL`, `CRON_SECRET`, `SERVICE_CREDENTIAL`, `POOL_MAX`, `HF_MODEL` must **never** be set: the plain name
  would win in every service. Prefixes: `WEB_`, `INTAKE_`, `RECORDS_`, `JOURNEYS_`, `CRM_ENGINE_`, `LISTINGS_`, `INSIGHT_`.
- **Changing a variable needs a redeploy** (Deployments → latest → Redeploy) before the services see it.
- **Some values must never change once data exists** (marked 🔒). Changing them breaks stored hashes or encrypted keys.

## 1. Vercel: set now (Production)

### Shared by all services
| Variable | Used by | Status | Where the value comes from |
|---|---|---|---|
| `ENVIRONMENT_NAME` | all | set | Type `pilot` |
| `WEB_URL` | the six backends (JWKS, service tokens) | set | Type `https://estatecrm-navy.vercel.app` |
| `SUPABASE_URL` | web, intake, journeys, insight | set | Type `https://tkbaakabwolgjnpdvwjs.supabase.co` (Supabase → Project Settings → API) |
| `SUPABASE_ANON_KEY` | web (Google sign-in) | set | Supabase → Project Settings → API Keys → `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | web (invites), intake, journeys, insight (Storage) | set | Supabase → Project Settings → API Keys → `service_role` / secret key |
| `HF_TOKEN` | intake, insight (AI on redacted text; optional) | set | huggingface.co → Settings → Access Tokens → fine-grained, "Inference Providers" only |

### Database connections (one per service)
| Variable | Status | Where the value comes from |
|---|---|---|
| `WEB_DATABASE_URL` | set | See "Database URL" below, user `web_svc` |
| `INTAKE_DATABASE_URL` | **set, but re-enter with the SSL suffix** | user `intake_svc` |
| `RECORDS_DATABASE_URL` | **re-enter with the SSL suffix** | user `records_svc` |
| `JOURNEYS_DATABASE_URL` | **re-enter with the SSL suffix** | user `journeys_svc` |
| `CRM_ENGINE_DATABASE_URL` | **re-enter with the SSL suffix** | user `crm_engine_svc` |
| `LISTINGS_DATABASE_URL` | **re-enter with the SSL suffix** | user `listings_svc` |
| `INSIGHT_DATABASE_URL` | **re-enter with the SSL suffix** | user `insight_svc` |

**Database URL.** Shape (one line):

```
postgresql://<role>.tkbaakabwolgjnpdvwjs:<PASSWORD>@<POOLER_HOST>:6543/postgres?uselibpqcompat=true&sslmode=require
```

- `<role>`: the user in the table (`intake_svc`, …).
- `<POOLER_HOST>`: Supabase → **Connect** → **Transaction pooler** (looks like `aws-?-ap-south-1.pooler.supabase.com`). Port
  **6543** (transaction mode).
- `<PASSWORD>`: the role's password from bootstrap. If you no longer have it, make a new one (command C5).
- The suffix is required: the pooler refuses connections without SSL, and plain `sslmode=require` fails certificate
  verification in node-postgres 8 (`SELF_SIGNED_CERT_IN_CHAIN`). `uselibpqcompat=true&sslmode=require` encrypts without
  verifying the chain (libpq semantics; data-hosting §1 "clients use `sslmode=require`"). Full verification with Supabase's CA is a paid-gate hardening item.

### Scheduler secrets (one per service)
| Variable | Status | Where the value comes from |
|---|---|---|
| `WEB_CRON_SECRET`, `INTAKE_CRON_SECRET`, `RECORDS_CRON_SECRET`, `JOURNEYS_CRON_SECRET`, `CRM_ENGINE_CRON_SECRET`, `LISTINGS_CRON_SECRET`, `INSIGHT_CRON_SECRET` | set | Command C1, one value each. The **same** value goes into the scheduler setup (section 3) |

### Service-to-service credentials (six backends)
| Variable | Status | Where the value comes from |
|---|---|---|
| `INTAKE_SERVICE_CREDENTIAL`, `RECORDS_SERVICE_CREDENTIAL`, `JOURNEYS_SERVICE_CREDENTIAL`, `CRM_ENGINE_SERVICE_CREDENTIAL`, `LISTINGS_SERVICE_CREDENTIAL`, `INSIGHT_SERVICE_CREDENTIAL` | set (2026-10-02) | Command C4. It registers each credential's hash in web's database and prints the value once. Making a new one replaces the old one |

### web only
| Variable | Status | Where the value comes from |
|---|---|---|
| `WEB_KEK` 🔒 | set | Command C2. Encrypts web's signing keys and keys the e-mail / credential hashes. Changing it invalidates every service credential and signing key |
| `WEB_TENANT_ID` 🔒 | set | Command C3 (a UUID). Every record belongs to this tenant |
| `APP_ORIGIN` (also set as `WEB_APP_ORIGIN`; one is enough) | set | Type `https://estatecrm-navy.vercel.app` |

### Per-service secrets
| Variable | Status | Where the value comes from |
|---|---|---|
| `INTAKE_ANONYMISATION_KEY` 🔒 | set | Command C1. Keys the hashes intake uses to anonymise uploads |
| `RECORDS_CONTACT_HASH_SECRET` 🔒 | set | Command C1. Phone and e-mail hashes used for dedup |
| `RECORDS_SCAN_SALT` and `LISTINGS_SCAN_SALT` 🔒 | set | Command C1 **once**, the **same** value in both: listings checks records' scan-term hashes (R-20) |
| `JOURNEYS_IP_HASH_SALT` | set | Command C1. Salt for hashing proposal-link visitor IPs |
| `RECORDS_STORAGE_URL`, `LISTINGS_STORAGE_URL` | set (plain) | Type `https://tkbaakabwolgjnpdvwjs.supabase.co` |
| `RECORDS_STORAGE_SERVICE_KEY`, `LISTINGS_STORAGE_SERVICE_KEY` | set | The Supabase `service_role` key (same as `SUPABASE_SERVICE_ROLE_KEY`) |

## 2. Vercel: do not set
| Variable | Why |
|---|---|
| `SVC_INTAKE_URL` … `SVC_INSIGHT_URL` (web), `RECORDS_URL`, `INTAKE_URL`, `JOURNEYS_URL`, `LISTINGS_URL` (backends) | Injected by the service bindings in `vercel.json` |
| `INTAKE_RECORDS_URL` | intake → records can't be bound (a cycle with records → intake). Pointing it at the public domain doesn't work either: records' API isn't public. Open point in CR-013 |
| `DATABASE_URL`, `CRON_SECRET`, `SERVICE_CREDENTIAL`, `POOL_MAX`, `HF_MODEL` (plain) | Would override every service (see the rules) |
| `PORT`, `LOCAL_STORAGE_DIR`, `LOCAL_EXPORT_DIR`, `LOCAL_EMAIL_SIGNIN` | Local development only |

## 3. Optional tuning (defaults are fine for the pilot)
Set only with the service prefix.

| Variable | Service | Default |
|---|---|---|
| `<SERVICE>_POOL_MAX` | all | 3 connections per instance. Must stay within the role's connection cap (`records_svc` 6, `intake_svc` 5, others 3–4, `web_svc` 3) |
| `INTAKE_PILOT_MODE`, `INTAKE_CHUNK_SIZE`, `INTAKE_CHUNK_CONCURRENCY` | intake | pilot mode on, 500-row chunks |
| `INTAKE_HF_MODEL`, `INTAKE_HF_ENDPOINT_URL` | intake | `meta-llama/Llama-3.1-8B-Instruct`, `https://router.huggingface.co` |
| `INSIGHT_HF_MODEL`, `INSIGHT_HF_BASE_URL`, `INSIGHT_HF_CONCURRENCY`, `INSIGHT_EXPORT_MAX_ROWS`, `INSIGHT_EXPORT_BUCKET` | insight | `Qwen/Qwen2.5-7B-Instruct`, router, 5, 20,000, `insight-exports` |
| `RECORDS_PHOTO_BUCKET`, `RECORDS_SCAN_SALT_VERSION`, `RECORDS_TENANT_IDS` | records | `records-photos`, 1, (from data) |
| `LISTINGS_PRIVATE_BUCKET`, `LISTINGS_PUBLIC_BUCKET`, `LISTINGS_API_KEY_CACHE_TTL_MS`, `LISTINGS_FEED_SETTLE_MS` | listings | `listings-photos`, `listings-public` |
| `JOURNEYS_STORAGE_BUCKET`, `JOURNEYS_PUBLIC_BASE_URL` | journeys | `journeys-proposals`, `WEB_URL` |
| `<SERVICE>_JWKS_URL` | backends | `WEB_URL` + `/.well-known/jwks.json` |
| `WEB_PILOT` | web | `true` in the pilot |

## 4. Outside Vercel
### Scheduler setup (Supabase pg_cron; typed in your shell for `infra/scripts/configure-environment.mjs`)
| Variable | Where the value comes from |
|---|---|
| `ADMIN_DATABASE_URL` | Supabase → Connect → **Direct connection** (user `postgres`, your database password). Not the pooler |
| `ENVIRONMENT_NAME` | `pilot` |
| `<SERVICE>_BASE_URL` | `https://estatecrm-navy.vercel.app/svc/<service>` (for example `RECORDS_BASE_URL=…/svc/records`) |
| `<SERVICE>_CRON_SECRET` | The same values as in Vercel |
| `ALARM_WEBHOOK_URL` (optional) | An incoming-webhook URL from your chat tool |
| `SCHEDULES` | `on` only once every service is healthy |

### GitHub → repository → Settings → Secrets and variables → Actions
| Name | Kind | Where the value comes from |
|---|---|---|
| `BACKUP_DATABASE_URL` | secret | Supabase → Connect → **Direct connection** (admin `postgres` user), as for `ADMIN_DATABASE_URL` |
| `BACKUP_PASSPHRASE` | secret | Command C1. Keep old passphrases for 14 days (restores need them) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | secret | As in Vercel (backups upload to the private `backups` bucket) |
| `BACKUPS_ENABLED` | variable | `true` to switch the nightly backup on |

## 5. Commands
Run these in your own terminal, from the repo folder. They print the value once: copy it straight into Vercel and your
password manager.

**C1. Random secret** (cron secrets, salts, hash secrets, backup passphrase):
```bash
openssl rand -hex 32
```

**C2. `WEB_KEK`** (exactly 32 bytes, base64):
```bash
openssl rand -base64 32
```

**C3. `WEB_TENANT_ID`** (a lowercase UUID):
```bash
uuidgen | tr 'A-Z' 'a-z'
```

**C4. The six `*_SERVICE_CREDENTIAL`s.** It asks for web's four settings (paste each and press Enter; nothing shows),
then prints `intake: SERVICE_CREDENTIAL=…` and so on. Run it as one command in one terminal tab:
```bash
printf "WEB_DATABASE_URL: "; read -rs WEB_DATABASE_URL; echo; printf "WEB_KEK: "; read -rs WEB_KEK; echo; printf "WEB_TENANT_ID: "; read -rs WEB_TENANT_ID; echo; printf "WEB_CRON_SECRET: "; read -rs WEB_CRON_SECRET; echo; export WEB_DATABASE_URL WEB_KEK WEB_TENANT_ID WEB_CRON_SECRET; for s in intake records journeys crm-engine listings insight; do pnpm --silent --filter @11e/web service-client "$s"; done
```

**C5. New database passwords for the service roles.** It asks for the admin (direct) connection URL, then prints one new
password per role. Build each `*_DATABASE_URL` from it (section 1):
```bash
printf "ADMIN_DATABASE_URL: "; read -rs ADMIN_DATABASE_URL; echo; export ADMIN_DATABASE_URL; for s in intake records journeys crm-engine listings insight; do node infra/scripts/rotate-db-password.mjs "$s"; done
```
For one service only, end the command with `node infra/scripts/rotate-db-password.mjs records` instead of the loop. Add
`migrator` after the service name to rotate the migration role.

**Check what is set** (names only; values stay hidden), with the Vercel CLI:
```bash
npx vercel env ls production
```

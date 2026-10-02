# Environment variables (pilot)

Every variable the deployed pilot uses, one row each: the exact name, what it is for, and **exactly** where its value
comes from (a fixed value to copy, a dashboard page, or a terminal command from section 3).

Pilot: Vercel project `estatecrm`, production domain `https://estatecrm-navy.vercel.app`. Supabase project `estatesCRM`,
ref `tkbaakabwolgjnpdvwjs`, Mumbai. Status as of 2026-10-02.

## How to enter a variable in Vercel
Vercel → project `estatecrm` → **Settings** → **Environment Variables** → **Add New**:
- **Key**: the exact name from the tables below.
- **Value**: what the "Value" column says.
- **Environments**: Production.
- **Sensitive**: on for every row marked "secret". Vercel never shows a Sensitive value again (the box looks empty). To
  change one, you enter the whole value again, so keep a copy in your password manager.

Then **Deployments → latest → ⋯ → Redeploy**. Services only see changes after a redeploy.

Words used in the "Value" column:
- **Fixed value**: no command. Copy the text shown, exactly, into the Value box.
- **Dashboard**: open the page named and copy the value shown there.
- **Command Cn**: run that command (section 3) in your terminal, in the repo folder. Copy what it prints.

🔒 = never change once real data exists (it protects stored hashes or encrypted keys; changing it breaks dedup, logins or
service credentials).

## 1. Vercel variables (all Production)

### 1.1 Shared
| # | Variable | Secret | For | Value |
|---|---|---|---|---|
| 1 | `ENVIRONMENT_NAME` | no | all services: which environment this is | Fixed value: `pilot` |
| 2 | `WEB_URL` | no | the six backends: where web's JWKS and service-token endpoints are | Fixed value: `https://estatecrm-navy.vercel.app` |
| 3 | `SUPABASE_URL` | no | web, intake, journeys, insight | Fixed value: `https://tkbaakabwolgjnpdvwjs.supabase.co` |
| 4 | `SUPABASE_ANON_KEY` | yes | web: Google sign-in | Dashboard: Supabase → project → **Project Settings** → **API Keys** → `anon` (publishable) key |
| 5 | `SUPABASE_SERVICE_ROLE_KEY` | yes | web (invites), intake, journeys, insight (file storage) | Dashboard: same page → `service_role` (secret) key → Reveal |
| 6 | `HF_TOKEN` | yes | intake, insight: AI on redacted text (optional) | Dashboard: huggingface.co → **Settings** → **Access Tokens** → Create → Fine-grained → tick "Make calls to Inference Providers" |

### 1.2 Database connections
| # | Variable | Secret | Database user in the URL | Value |
|---|---|---|---|---|
| 7 | `WEB_DATABASE_URL` | yes | `web_svc` | Command C6 (with `web` in the list) or the URL you saved |
| 8 | `INTAKE_DATABASE_URL` | yes | `intake_svc` | Command C6 |
| 9 | `RECORDS_DATABASE_URL` | yes | `records_svc` | Command C6 |
| 10 | `JOURNEYS_DATABASE_URL` | yes | `journeys_svc` | Command C6 |
| 11 | `CRM_ENGINE_DATABASE_URL` | yes | `crm_engine_svc` | Command C6 |
| 12 | `LISTINGS_DATABASE_URL` | yes | `listings_svc` | Command C6 |
| 13 | `INSIGHT_DATABASE_URL` | yes | `insight_svc` | Command C6 |

**What a database URL is made of.** Each value is one line with this pattern (the "template"):

```
postgresql://<USER>.tkbaakabwolgjnpdvwjs:<PASSWORD>@<POOLER_HOST>:6543/postgres?uselibpqcompat=true&sslmode=require
```

The three `<…>` parts are replaced:
| Part | Replace with | Where it comes from |
|---|---|---|
| `<USER>` | the user in the table above, e.g. `intake_svc` | Fixed per variable |
| `<PASSWORD>` | that user's database password | Made by command C6 (a new random password is set on the user and printed once) |
| `<POOLER_HOST>` | the Supabase pooler's host name | Dashboard: Supabase → project → **Connect** (top bar) → **Transaction pooler** → the host in the shown string, between `@` and `:6543`. Looks like `aws-0-ap-south-1.pooler.supabase.com` |

Example with made-up values:
`postgresql://intake_svc.tkbaakabwolgjnpdvwjs:Xy7…Qe@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?uselibpqcompat=true&sslmode=require`.
Command C6 does the replacing for you and prints the finished lines. The ending `?uselibpqcompat=true&sslmode=require` is
required: Supabase refuses connections without encryption, and plain `?sslmode=require` fails in our database driver
(`SELF_SIGNED_CERT_IN_CHAIN`).

### 1.3 Scheduler secrets (Supabase pg_cron sends these with every scheduled call)
| # | Variable | Secret | Value |
|---|---|---|---|
| 14 | `WEB_CRON_SECRET` | yes | Command C1 |
| 15 | `INTAKE_CRON_SECRET` | yes | Command C1 |
| 16 | `RECORDS_CRON_SECRET` | yes | Command C1 |
| 17 | `JOURNEYS_CRON_SECRET` | yes | Command C1 |
| 18 | `CRM_ENGINE_CRON_SECRET` | yes | Command C1 |
| 19 | `LISTINGS_CRON_SECRET` | yes | Command C1 |
| 20 | `INSIGHT_CRON_SECRET` | yes | Command C1 |

The same seven values are given once more to the scheduler setup (section 2.1).

### 1.4 Service-to-service credentials (a backend shows one to web to get a token for calling another backend)
| # | Variable | Secret | Value |
|---|---|---|---|
| 21 | `INTAKE_SERVICE_CREDENTIAL` | yes | Command C5, line starting `intake:` |
| 22 | `RECORDS_SERVICE_CREDENTIAL` | yes | Command C5, line starting `records:` |
| 23 | `JOURNEYS_SERVICE_CREDENTIAL` | yes | Command C5, line starting `journeys:` |
| 24 | `CRM_ENGINE_SERVICE_CREDENTIAL` | yes | Command C5, line starting `crm-engine:` |
| 25 | `LISTINGS_SERVICE_CREDENTIAL` | yes | Command C5, line starting `listings:` |
| 26 | `INSIGHT_SERVICE_CREDENTIAL` | yes | Command C5, line starting `insight:` |

Copy only the part after `SERVICE_CREDENTIAL=`.

### 1.5 web only
| # | Variable | Secret | Value |
|---|---|---|---|
| 27 | `WEB_KEK` 🔒 | yes | Command C2 |
| 28 | `WEB_TENANT_ID` 🔒 | yes | Command C3 |
| 29 | `APP_ORIGIN` | no | Fixed value: `https://estatecrm-navy.vercel.app` |
| 30 | `WEB_APP_ORIGIN` | no | Same as `APP_ORIGIN`. Web needs only one of the two; both are set today, which is harmless |

### 1.6 Per-service secrets and settings
| # | Variable | Secret | Value |
|---|---|---|---|
| 31 | `INTAKE_ANONYMISATION_KEY` 🔒 | yes | Command C1 |
| 32 | `RECORDS_CONTACT_HASH_SECRET` 🔒 | yes | Command C1 |
| 33 | `RECORDS_SCAN_SALT` 🔒 | yes | Command C4 (one value for both rows 33 and 34) |
| 34 | `LISTINGS_SCAN_SALT` 🔒 | yes | Command C4: **the same value as row 33** |
| 35 | `JOURNEYS_IP_HASH_SALT` | yes | Command C1 |
| 36 | `RECORDS_STORAGE_URL` | no | Fixed value: `https://tkbaakabwolgjnpdvwjs.supabase.co` |
| 37 | `LISTINGS_STORAGE_URL` | no | Fixed value: `https://tkbaakabwolgjnpdvwjs.supabase.co` |
| 38 | `RECORDS_STORAGE_SERVICE_KEY` | yes | Dashboard: the `service_role` key (same value as row 5) |
| 39 | `LISTINGS_STORAGE_SERVICE_KEY` | yes | Dashboard: the `service_role` key (same value as row 5) |

### 1.7 Do not add these
| Variable | Why |
|---|---|
| `SVC_INTAKE_URL`, `SVC_RECORDS_URL`, `SVC_JOURNEYS_URL`, `SVC_CRM_ENGINE_URL`, `SVC_LISTINGS_URL`, `SVC_INSIGHT_URL`, `RECORDS_URL`, `INTAKE_URL`, `JOURNEYS_URL`, `LISTINGS_URL` | Vercel fills them in from the bindings in `vercel.json` |
| `INTAKE_RECORDS_URL` | Can't work today: records' API is not public, and the binding would be a cycle (open point in CR-013) |
| `DATABASE_URL`, `CRON_SECRET`, `SERVICE_CREDENTIAL`, `POOL_MAX`, `HF_MODEL` (without a prefix) | A name without a prefix is read by **every** service and overrides the prefixed ones |
| `PORT`, `LOCAL_STORAGE_DIR`, `LOCAL_EXPORT_DIR`, `LOCAL_EMAIL_SIGNIN` | Local development only |

Optional tuning, only with a prefix and only if needed (defaults are fine for the pilot): `<SERVICE>_POOL_MAX` (default 3;
must stay within the user's connection cap: records 6, intake 5, journeys/crm-engine/listings 4, insight/web 3),
`INTAKE_HF_MODEL` (default `meta-llama/Llama-3.1-8B-Instruct`), `INSIGHT_HF_MODEL` (default `Qwen/Qwen2.5-7B-Instruct`),
`INTAKE_CHUNK_SIZE` (500 in the pilot), `INSIGHT_EXPORT_MAX_ROWS` (20,000 in the pilot).

## 2. Outside Vercel

### 2.1 Scheduler setup (typed in your terminal for `infra/scripts/configure-environment.mjs`; command C7)
| # | Variable | Value |
|---|---|---|
| 40 | `ADMIN_DATABASE_URL` | Dashboard: Supabase → **Connect** → **Direct connection** (or **Session pooler** if your network has no IPv6) → copy the string and replace `[YOUR-PASSWORD]` with the database password chosen when the project was created (reset it under Project Settings → Database if lost) |
| 41 | `ENVIRONMENT_NAME` | Fixed value: `pilot` |
| 42 | `WEB_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app` |
| 43 | `INTAKE_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app/svc/intake` |
| 44 | `RECORDS_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app/svc/records` |
| 45 | `JOURNEYS_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app/svc/journeys` |
| 46 | `CRM_ENGINE_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app/svc/crm-engine` |
| 47 | `LISTINGS_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app/svc/listings` |
| 48 | `INSIGHT_BASE_URL` | Fixed value: `https://estatecrm-navy.vercel.app/svc/insight` |
| 49–55 | `WEB_CRON_SECRET`, `INTAKE_CRON_SECRET`, `RECORDS_CRON_SECRET`, `JOURNEYS_CRON_SECRET`, `CRM_ENGINE_CRON_SECRET`, `LISTINGS_CRON_SECRET`, `INSIGHT_CRON_SECRET` | The same seven values as rows 14–20 |
| 56 | `ALARM_WEBHOOK_URL` (optional) | Your chat tool's incoming-webhook URL |
| 57 | `SCHEDULES` | Fixed value: `on`, only once all services are healthy |

### 2.2 GitHub → repository → Settings → Secrets and variables → Actions (nightly backups)
| # | Name | Kind | Value |
|---|---|---|---|
| 58 | `BACKUP_DATABASE_URL` | secret | Same as row 40 |
| 59 | `BACKUP_PASSPHRASE` | secret | Command C1. Keep old passphrases for 14 days (restores need them) |
| 60 | `SUPABASE_URL` | secret | Same as row 3 |
| 61 | `SUPABASE_SERVICE_ROLE_KEY` | secret | Same as row 5 |
| 62 | `BACKUPS_ENABLED` | variable | Fixed value: `true` (switches the nightly backup on) |

## 3. Commands
Run in your own terminal, in the repo folder (`estateCRM`). When a command asks for a value (`…:`), paste it and press
Enter; nothing appears while you paste, that is on purpose. Copy the output straight into Vercel and your password manager.
Run each command as **one** line in **one** terminal tab.

**C1. A random secret.** Run once per variable; each run prints a different 64-character value.
```bash
openssl rand -hex 32
```
To print all the C1 values of a fresh environment at once (only for a new environment: rows 14–20 and 31, 32, 35 are
already set in the pilot, and changing a 🔒 value breaks data):
```bash
for n in WEB_CRON_SECRET INTAKE_CRON_SECRET RECORDS_CRON_SECRET JOURNEYS_CRON_SECRET CRM_ENGINE_CRON_SECRET LISTINGS_CRON_SECRET INSIGHT_CRON_SECRET INTAKE_ANONYMISATION_KEY RECORDS_CONTACT_HASH_SECRET JOURNEYS_IP_HASH_SALT; do echo "$n=$(openssl rand -hex 32)"; done
```

**C2. `WEB_KEK`** (exactly 32 random bytes, base64):
```bash
openssl rand -base64 32
```

**C3. `WEB_TENANT_ID`** (a lowercase UUID):
```bash
uuidgen | tr 'A-Z' 'a-z'
```

**C4. `RECORDS_SCAN_SALT` and `LISTINGS_SCAN_SALT`** (one value, printed for both names):
```bash
v=$(openssl rand -hex 32); echo "RECORDS_SCAN_SALT=$v"; echo "LISTINGS_SCAN_SALT=$v"
```

**C5. The six `*_SERVICE_CREDENTIAL` values.** Asks for rows 7, 27, 28 and 14 (web's database URL, `WEB_KEK`,
`WEB_TENANT_ID`, `WEB_CRON_SECRET`), registers a new credential for each backend in web's database, and prints six
lines like `intake: SERVICE_CREDENTIAL=…`. Running it again replaces all six (update Vercel afterwards).
```bash
printf "WEB_DATABASE_URL: "; read -rs WEB_DATABASE_URL; echo; printf "WEB_KEK: "; read -rs WEB_KEK; echo; printf "WEB_TENANT_ID: "; read -rs WEB_TENANT_ID; echo; printf "WEB_CRON_SECRET: "; read -rs WEB_CRON_SECRET; echo; export WEB_DATABASE_URL WEB_KEK WEB_TENANT_ID WEB_CRON_SECRET; for s in intake records journeys crm-engine listings insight; do pnpm --silent --filter @11e/web service-client "$s"; done
```

**C6. The `*_DATABASE_URL` values.** Asks for `ADMIN_DATABASE_URL` (row 40) and the pooler host (see 1.2), sets a new
random password on each service's database user, and prints the six finished lines, e.g.
`INTAKE_DATABASE_URL=postgresql://intake_svc.tkbaakabwolgjnpdvwjs:…@…:6543/postgres?uselibpqcompat=true&sslmode=require`.
Copy the part after the first `=` into the variable of that name. The old passwords stop working for new connections.
```bash
printf "ADMIN_DATABASE_URL: "; read -rs ADMIN_DATABASE_URL; echo; export ADMIN_DATABASE_URL; printf "POOLER_HOST: "; read -r POOLER_HOST; for s in intake records journeys crm-engine listings insight; do r=$(printf %s "$s" | tr - _); pw=$(node infra/scripts/rotate-db-password.mjs "$s" | sed -n 2p); printf '%s_DATABASE_URL=postgresql://%s_svc.tkbaakabwolgjnpdvwjs:%s@%s:6543/postgres?uselibpqcompat=true&sslmode=require\n' "$(printf %s "$r" | tr a-z A-Z)" "$r" "$pw" "$POOLER_HOST"; done
```
To include web (row 7), add `web` at the start of the list (`for s in web intake …`). Only do that if you also update
`WEB_DATABASE_URL` in Vercel straight away: web stops connecting until you do.

**C7. Scheduler setup** (after all services are healthy). Asks for the admin URL and the seven cron secrets, sets the
base URLs, and shows what it would configure (`--dry-run`). When the plan looks right, run it again without `--dry-run`.
```bash
printf "ADMIN_DATABASE_URL: "; read -rs ADMIN_DATABASE_URL; echo; for n in WEB INTAKE RECORDS JOURNEYS CRM_ENGINE LISTINGS INSIGHT; do printf "%s_CRON_SECRET: " "$n"; read -rs v; echo; export "${n}_CRON_SECRET=$v"; done; export ADMIN_DATABASE_URL ENVIRONMENT_NAME=pilot WEB_BASE_URL=https://estatecrm-navy.vercel.app INTAKE_BASE_URL=https://estatecrm-navy.vercel.app/svc/intake RECORDS_BASE_URL=https://estatecrm-navy.vercel.app/svc/records JOURNEYS_BASE_URL=https://estatecrm-navy.vercel.app/svc/journeys CRM_ENGINE_BASE_URL=https://estatecrm-navy.vercel.app/svc/crm-engine LISTINGS_BASE_URL=https://estatecrm-navy.vercel.app/svc/listings INSIGHT_BASE_URL=https://estatecrm-navy.vercel.app/svc/insight; node infra/scripts/configure-environment.mjs --dry-run
```

**Check which variables are set** (names only, values stay hidden; needs `npx vercel login` and `npx vercel link` once):
```bash
npx vercel env ls production
```

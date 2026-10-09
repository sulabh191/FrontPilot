# @frontpilot/db

The database layer of FrontPilot: **Postgres 17** schema, versioned SQL migrations, a seed script and the database client, built with [Drizzle ORM](https://orm.drizzle.team). Only the API (`apps/api`) uses this package; the web app talks to the API, never to the database.

| File | What it is |
| --- | --- |
| `src/schema.ts` | Tables, enums, indexes and constraints: the single source of truth for the database structure |
| `drizzle/` | Generated SQL migrations (`0000_….sql`, …) + Drizzle's snapshots; committed to Git |
| `src/client.ts` | `createDatabase(url)`: a connection pool + Drizzle instance (the API creates one at startup) |
| `src/migrate.ts` | `migrateDatabase(url, folder)`: applies migrations from code (used by the e2e tests and CI) |
| `src/seed.ts` | Resets the demo business (Rapid Plumbing) with sample data |
| `src/index.ts` | Public exports: client, tables, row types, query helpers (`eq`, `and`, `sql`, …) |
| `drizzle.config.ts` | Drizzle Kit settings; reads `DATABASE_URL` from `apps/api/.env.local` |

Built with tsup to ESM + CommonJS + type declarations (`dist/`).

## Commands (from the repository root)

| Command | What |
| --- | --- |
| `pnpm db:up` / `pnpm db:down` | Start / stop local Postgres in Docker (port 5433) |
| `pnpm db:generate` | Create a migration from changes in `src/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Reset the demo business with sample data |
| `pnpm db:psql` | SQL prompt inside the container (`\dt` tables · `\d appointments` columns and indexes · `\q` quit) |
| `pnpm db:studio` | Browse the data in a browser |
| `pnpm --filter @frontpilot/db build` | Rebuild `dist/` (Turbo does this automatically before dev, typecheck and tests) |

## Changing the schema

```
edit src/schema.ts
  → pnpm db:generate     writes drizzle/000X_name.sql (review it!)
  → pnpm db:migrate      applies it to your database
  → commit schema.ts + the new migration files
```

Never edit the database by hand and never edit an applied migration; add a new one. The API's end-to-end tests and CI rebuild their database from these same files, so the schema can't drift between environments.

## Tables

| Table | Holds | Key columns |
| --- | --- | --- |
| tenants | One row per business | slug (unique), time_zone, opening_hours (JSON), appointment_minutes |
| agent_settings | Agent setup page | agent_name, greeting, tone, instructions, tools (JSON), approval_mode, suggested_questions |
| conversations | Chat threads | status, customer_name, summary |
| messages | Every message | role, content, input_tokens, output_tokens |
| leads | CRM | stage, score, phone, sms_consent, conversation_id |
| appointments | Bookings | starts_at (UTC), status, booked_by, lead_id |

Every table has **tenant_id** (multi-tenancy). Foreign keys enforce relationships; cascade deletes clean up a tenant's data.

## Status values

| Conversation: "does the owner need to act?" | Appointment: "is the visit happening?" |
| --- | --- |
| open, needs_owner, resolved_by_ai, resolved_by_owner | awaiting_approval, confirmed, cancelled |

A conversation can need the owner with no appointment (custom quote), and one conversation can have several appointments. So: different entities, different statuses, updated together in transactions.

DB stores **codes** (`needs_owner`); UI shows **labels** ("Needs you"). Clients map codes to labels (the web app does it in each feature's `server/queries.ts`).

## Indexes and constraints

| Table | Index / constraint | Why |
| --- | --- | --- |
| tenants | PRIMARY KEY `id` (text, e.g. `tenant_rapid_plumbing`), UNIQUE `slug` | Look up a business by its URL name (widget, auth) |
| agent_settings | PRIMARY KEY `tenant_id` | Exactly one settings row per business; makes the upsert possible |
| conversations | `conversations_tenant_updated_idx (tenant_id, updated_at)` | Dashboard list: this business's chats, newest first |
| messages | `messages_conversation_idx (conversation_id, created_at)` | Load one chat's history in order |
| leads | `leads_tenant_stage_idx (tenant_id, stage)` | Leads board / filter by stage |
| appointments | `appointments_tenant_starts_idx (tenant_id, starts_at)` | Appointment list + availability lookups by time range |
| appointments | **`appointments_tenant_slot_unique (tenant_id, starts_at) WHERE status <> 'cancelled'`** | **Partial unique index**: one live booking per business per start time (see below) |

Foreign keys: `tenant_id → tenants ON DELETE CASCADE` (deleting a business deletes all its data) · `messages.conversation_id → conversations CASCADE` · `leads.conversation_id → conversations SET NULL` · `appointments.lead_id → leads SET NULL` (history survives).

## The double-booking guard (partial unique index)

```ts
// packages/db/src/schema.ts
uniqueIndex("appointments_tenant_slot_unique")
  .on(t.tenantId, t.startsAt)
  .where(sql`${t.status} <> 'cancelled'`)
```
```sql
-- what the migration runs
CREATE UNIQUE INDEX "appointments_tenant_slot_unique" ON "appointments"
  USING btree ("tenant_id","starts_at") WHERE "appointments"."status" <> 'cancelled';
```

- **Why code alone isn't enough (race condition):** chat 1 checks 9:00 → free; chat 2 checks 9:00 → free; chat 1 inserts; chat 2 inserts → double booking. Both checks happened before either insert.
- **Unique** → the database rejects the second insert with error **23505** (unique violation). **Partial** (`WHERE status <> 'cancelled'`) → declined bookings don't block the slot.
- The API's `BookingService` catches 23505 on that index name → "That time was just taken"; the transaction rolls back (no orphan lead). Drizzle wraps driver errors, so check `error.cause` too.
- **Defense in depth:** code check = friendly answer; DB constraint = correctness. The constraint is the final authority.
- Limit: blocks identical start times only (fine: slots are on a fixed grid). Overlapping ranges (10:00 vs 10:30) would need an **exclusion constraint** (`btree_gist` + `tstzrange(...) WITH &&`).
- Tested in `apps/api/test/booking-race.e2e-spec.ts`: the code check is fooled with a spy and the database still refuses.

## Queries the API runs

Code lives in the API's repositories and services (`apps/api/src/modules/<feature>/<feature>.repository.ts`, `booking.service.ts`, `appointment-approvals.service.ts`). Values are always sent as parameters (`$1, $2…`), never concatenated into SQL. **Every query filters by `tenant_id`**, except the public lookup of a business by its slug.

### Reads (dashboard)

| Operation | Endpoint | SQL (simplified) | Index used / note |
| --- | --- | --- | --- |
| Who is calling | every protected call (AuthGuard) | `SELECT id, name, slug, time_zone FROM tenants WHERE slug = $1 LIMIT 1` | UNIQUE slug |
| Leads | `GET /v1/leads?stage=` | `SELECT * FROM leads WHERE tenant_id = $1 [AND stage = $2] ORDER BY created_at DESC` | `leads_tenant_stage_idx`; optional filters become `undefined` → dropped from `and()` |
| Conversations | `GET /v1/conversations` | ① `SELECT * FROM conversations WHERE tenant_id = $1 [AND status = $2] ORDER BY updated_at DESC LIMIT $3` ② `SELECT * FROM messages WHERE conversation_id IN ($1…$n) ORDER BY created_at` | ② is ONE query for all chats (**avoids N+1**) |
| One conversation | `GET /v1/conversations/:id` | `SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2 LIMIT 1` | No row → **404** (another business's id looks like "not found": IDOR protection) |
| Appointments | `GET /v1/appointments` | `SELECT * FROM appointments WHERE tenant_id = $1 [AND status = $2] [AND starts_at >= $3] ORDER BY starts_at ASC` | `appointments_tenant_starts_idx` |
| Availability | `GET /v1/availability?date=` | ① `SELECT time_zone, opening_hours, appointment_minutes FROM tenants WHERE id = $1` ② `SELECT starts_at FROM appointments WHERE tenant_id = $1 AND status <> 'cancelled' AND starts_at >= $2 AND starts_at < $3` | Slots are computed in code: opening hours − too soon − booked |
| Overview | `GET /v1/overview` | `SELECT status, count(*) FROM conversations WHERE tenant_id = $1 AND created_at >= $2 GROUP BY status` · `SELECT count(*) FROM leads WHERE tenant_id = $1 AND created_at >= $2` · `SELECT count(*) FROM appointments WHERE tenant_id = $1 AND created_at >= $2 AND status <> 'cancelled'` · `SELECT * FROM conversations WHERE tenant_id = $1 AND status = 'needs_owner' ORDER BY updated_at DESC LIMIT n` · `SELECT conversation_id, content FROM messages WHERE conversation_id IN (…) AND role = 'user'` · `SELECT * FROM appointments WHERE tenant_id = $1 AND starts_at >= now AND status <> 'cancelled' ORDER BY starts_at LIMIT n` | Independent queries run in parallel (`Promise.all`); `GROUP BY` counts in the DB, not in JS |
| Agent settings | `GET /v1/agent-settings` | `SELECT * FROM agent_settings WHERE tenant_id = $1 LIMIT 1` | No row → defaults |
| Health | `GET /health` | `SELECT 1` | Proves the DB answers |

### Writes

**Save agent settings (upsert)**, `PUT /v1/agent-settings`
```sql
INSERT INTO agent_settings (tenant_id, agent_name, greeting, …, updated_at) VALUES ($1, $2, …)
ON CONFLICT (tenant_id) DO UPDATE SET agent_name = $2, greeting = $3, …, updated_at = $n;
```
Insert the first time, update after: one statement, no "does it exist?" race.

**Customer chat**, `POST /v1/chat`
```sql
SELECT id, name, slug, time_zone FROM tenants WHERE slug = $1 LIMIT 1;                  -- business
INSERT INTO conversations (tenant_id, channel, status) VALUES ($1, 'website_chat', 'open') RETURNING id;  -- new chat
SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2 LIMIT 1;                     -- existing chat (tenant-checked)
SELECT count(*) FROM messages WHERE conversation_id = $1;                                 -- 60-message cap
BEGIN;                                                                                    -- save a message
  INSERT INTO messages (conversation_id, tenant_id, role, content, input_tokens, output_tokens) VALUES (…);
  UPDATE conversations SET updated_at = now() WHERE id = $1 AND tenant_id = $2;           -- moves it to the top
COMMIT;
SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 30;  -- history (reversed in code)
```

**Booking** (agent's `book_appointment` → `BookingService.book`)
```sql
-- 1. Idempotency: same chat + same slot already booked? return it (retries never double-book)
SELECT a.id, a.status FROM appointments a JOIN leads l ON a.lead_id = l.id
 WHERE a.tenant_id = $1 AND l.conversation_id = $2 AND a.starts_at = $3 LIMIT 1;
-- 2. Availability re-check (the two availability queries above)
-- 3. All or nothing:
BEGIN;
  INSERT INTO leads (tenant_id, conversation_id, name, phone, sms_consent, service, score, stage, source)
       VALUES ($1, $2, …, 'hot', 'booked', 'website_chat') RETURNING id;
  INSERT INTO appointments (tenant_id, lead_id, customer_name, service, address, starts_at, status, booked_by)
       VALUES (…, 'awaiting_approval' | 'confirmed', 'ai_agent') RETURNING id;   -- 23505 here → ROLLBACK, "just taken"
  UPDATE conversations SET customer_name = $, status = 'needs_owner' | 'resolved_by_ai', summary = $, updated_at = now()
   WHERE id = $ AND tenant_id = $;
COMMIT;
```

**Approve / decline**, `POST /v1/appointments/:id/approve|decline`
```sql
BEGIN;
  SELECT status FROM appointments WHERE id = $1 AND tenant_id = $2 LIMIT 1;     -- none → 404; not pending → 409
  UPDATE appointments SET status = 'confirmed'                                  -- or 'cancelled'
   WHERE id = $1 AND tenant_id = $2 AND status = 'awaiting_approval'            -- CONDITIONAL: 0 rows → someone else won → 409
   RETURNING lead_id, service;
  UPDATE leads SET stage = 'booked' | 'qualified', updated_at = now() WHERE id = $ AND tenant_id = $ RETURNING conversation_id;
  UPDATE conversations SET status = 'resolved_by_owner' | 'needs_owner', summary = $, updated_at = now()
   WHERE id = $ AND tenant_id = $;
COMMIT;
-- after commit, for the SMS (never fails the request):
SELECT a.customer_name, a.service, a.starts_at, l.phone, l.sms_consent, t.name, t.time_zone
  FROM appointments a JOIN leads l ON a.lead_id = l.id JOIN tenants t ON a.tenant_id = t.id
 WHERE a.id = $1 LIMIT 1;
```

### Patterns to remember

| Pattern | Where | Why |
| --- | --- | --- |
| `WHERE … AND tenant_id = $` on every query | Everywhere | Tenant isolation; other business → no rows → 404 |
| `IN (…)` batch load | Conversations, overview | Avoid N+1 (one query instead of one per chat) |
| `GROUP BY` + `count(*)` | Overview | Let the DB count, don't load rows into JS |
| `INSERT … ON CONFLICT DO UPDATE` | Agent settings | Atomic upsert |
| `BEGIN … COMMIT` transaction | Booking, approval, saving messages | Several tables change together or not at all |
| Conditional `UPDATE … WHERE status = 'awaiting_approval'` | Approve/decline | Optimistic concurrency: the loser updates 0 rows → 409 |
| Partial `UNIQUE INDEX … WHERE` | Appointments | The DB enforces "one live booking per slot" even under races |
| `RETURNING` | Inserts/updates | Get new IDs / changed values without a second query |
| Times in `timestamptz` (UTC) | `starts_at`, `created_at` | Convert to the business zone only for display |

### Handy queries for inspecting the database

Open a SQL prompt with `pnpm db:psql` (`\dt` tables · `\d appointments` columns, indexes, constraints · `\di` all indexes · `\q` quit). One-off from the terminal:
`docker exec frontpilot-postgres psql -U frontpilot -d frontpilot -c "<query>"`

```sql
-- Bookings waiting for approval, in the business's local time
SELECT customer_name, service, starts_at AT TIME ZONE 'America/New_York' AS local_time
  FROM appointments WHERE status = 'awaiting_approval' ORDER BY starts_at;

-- Double bookings (must return nothing; run before adding the unique index)
SELECT tenant_id, starts_at, count(*) FROM appointments
 WHERE status <> 'cancelled' GROUP BY 1, 2 HAVING count(*) > 1;

-- One chat, in order
SELECT role, left(content, 80) AS text, created_at FROM messages
 WHERE conversation_id = '<uuid>' ORDER BY created_at;

-- AI cost per business: tokens used by replies
SELECT tenant_id, count(*) AS replies, sum(input_tokens) AS input, sum(output_tokens) AS output
  FROM messages WHERE role = 'assistant' GROUP BY tenant_id;

-- Pipeline: leads per stage
SELECT stage, count(*) FROM leads GROUP BY stage ORDER BY stage;

-- Which migrations have been applied
SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;

-- Does a query use an index? (look for "Index Scan" instead of "Seq Scan")
EXPLAIN ANALYZE SELECT * FROM appointments WHERE tenant_id = 'tenant_rapid_plumbing' ORDER BY starts_at;

-- See the unique index refuse a duplicate, safely (ROLLBACK undoes everything)
BEGIN;
INSERT INTO appointments (tenant_id, customer_name, service, starts_at, status)
SELECT tenant_id, 'Dup test', service, starts_at, 'confirmed' FROM appointments
 WHERE status <> 'cancelled' LIMIT 1;           -- → ERROR: duplicate key value violates unique constraint "appointments_tenant_slot_unique"
ROLLBACK;
```

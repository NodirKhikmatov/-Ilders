# Mini Settlement Ledger

## Overview

This project implements a simplified settlement ledger for music revenue distribution.

Revenue generated from music play events is distributed among:

* Creator Pool (40%)
* CMO (15%)
* Platform (45%)

The system is designed around three primary goals:

* Correctness
* Concurrency Safety
* Auditability

---

## Architecture Overview

The system follows a transactional ledger model.

```
                +----------------+
                |   Play Events  |
                +--------+-------+
                         |
                         v
               +------------------+
               | SettlementService|
               +--------+---------+
                        |
                        v
             +----------------------+
             | SettlementCalculator |
             +----------+-----------+
                        |
        +---------------+---------------+
        |                               |
        v                               v
+-------------------+         +----------------+
| Allocations       |         | Audit Logs     |
+-------------------+         +----------------+
```

**Flow**

1. Play events are recorded in the ledger.
2. Settlement execution claims unsettled events.
3. Revenue is aggregated by song.
4. Revenue is allocated using the Largest Remainder Method.
5. Immutable settlement allocations are persisted.
6. Audit logs capture the exact inputs and outputs used.
7. Settled events are marked to prevent double settlement.

This guarantees:

* Correctness
* Concurrency Safety
* Auditability

---

## Technology Stack

* NestJS
* TypeScript
* PostgreSQL
* TypeORM
* Jest
* Swagger / OpenAPI (interactive API docs at `/api`)

PostgreSQL was selected because financial settlement systems require ACID transactions, unique constraints and strong consistency guarantees.

---

## Getting Started

### Prerequisites

* Node.js 18+
* Docker + Docker Compose (recommended — starts PostgreSQL with one command)
* Or a local PostgreSQL 14+ instance if you prefer not to use Docker

### Quick Start (recommended)

From a clean checkout, the whole stack comes up in three commands:

```bash
npm install                 # install dependencies
cp .env.example .env        # create local env (defaults work out of the box)
docker compose up -d        # start PostgreSQL (db is auto-created)
npm run start:dev           # start the API on http://localhost:3000
```

`docker compose up -d` launches a PostgreSQL 16 container and **automatically
creates the `settlement_ledger` database** (via `POSTGRES_DB`), so no manual
database setup is required. The schema itself is created automatically on
startup (`synchronize` is enabled in development).

Once the server is up, interactive **Swagger / OpenAPI docs** are available at
**http://localhost:3000/api** (raw spec at `/api-json`). You can try every
endpoint directly from the browser, which is the quickest way to verify the
API works.

The host port is taken from `DB_PORT` in your `.env` (default `5432`). If that
port is already in use on your machine, change `DB_PORT` (e.g. `5435`) — it is
applied to both the container and the app.

To stop and remove the database (including its data):

```bash
docker compose down -v
```

### Without Docker

If you already run PostgreSQL locally, create the database once and point
`.env` at it:

```bash
createdb settlement_ledger
# edit .env so DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD match your instance
npm run start:dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (used by both the app and `docker-compose`) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `PORT` | HTTP server port (default `3000`) |

---

## Running the Tests

```bash
npm test
```

The test suite runs **without a database** (repositories and the data source are
mocked), so it needs no Docker or PostgreSQL — just `npm install && npm test`.

It contains **35 tests across 6 suites** and focuses on the graded core:

* **Correctness / rounding** (`settlement-calculator.service.spec.ts`) —
  asserts the invariant `sum(allocations) === revenue` for **every** integer
  revenue from 0 to 500, plus targeted edge cases (0, 1, the 101 KRW case, etc.)
  and verifies the deterministic Largest-Remainder tie-break order.
* **Concurrency / idempotency** (`settlements.service.spec.ts`) — verifies the
  duplicate-key fast path, the unique-violation (`23505`) recovery on a fresh
  connection, and that events are claimed exactly once.
* **Auditability** (`audit.service.spec.ts`) — verifies the immutable input
  snapshot (event ids + split config) is recorded.
* Controller specs wire the HTTP layer to the services.

---

## End-to-End Smoke Test — How to Verify Each API

With the server running (`docker compose up -d && npm run start:dev`), you can
exercise all four APIs and confirm everything works.

The fastest way is the **Swagger UI at http://localhost:3000/api** — every
endpoint has an example body filled in, so you can click "Try it out" and run
the full flow from the browser. The equivalent `curl` commands are below. The
example uses **101 KRW**, the intentional rounding case from the task
(40.40 / 15.15 / 45.45), so you can see the leftover 1 KRW handled correctly.

**1. Record a play event** — `POST /play-events`

```bash
curl -X POST http://localhost:3000/play-events \
  -H "Content-Type: application/json" \
  -d '{"songId":"song-1","storeId":"store-1","playedAt":"2026-04-10T12:00:00.000Z","unitPrice":101}'
```

Expect `HTTP 201` and a JSON body with a generated `id` and `settledBatchId: null`.

**2. Execute settlement** — `POST /settlements`

```bash
curl -X POST http://localhost:3000/settlements \
  -H "Content-Type: application/json" \
  -d '{"periodStart":"2026-04-01T00:00:00.000Z","periodEnd":"2026-04-30T23:59:59.999Z","idempotencyKey":"apr-2026"}'
```

Returns the settlement `id` and the per-party allocations
(Creator `40`, CMO `15`, Platform `46`). **Note the settlement `id`** for the
next steps.

**2b. Prove idempotency / no double settlement** — call the exact same request
again with the **same `idempotencyKey`**:

```bash
curl -X POST http://localhost:3000/settlements \
  -H "Content-Type: application/json" \
  -d '{"periodStart":"2026-04-01T00:00:00.000Z","periodEnd":"2026-04-30T23:59:59.999Z","idempotencyKey":"apr-2026"}'
```

It returns the **same settlement `id`** and the same `totalRevenue` — no second
settlement is created and the events are not counted twice.

**3. Get the settlement result** — `GET /settlements/:id`

```bash
curl http://localhost:3000/settlements/<settlementId>
```

This is the proof of correctness. Look for:

* `allocationTotal` === `totalRevenue` (here `101`)
* `"matchesOriginalRevenue": true`  ← the reconciliation check
* `partyTotals`: Creator `40`, CMO `15`, Platform `46` (sum = `101`)

**4. Get the audit log** — `GET /audit/settlements/:settlementId`

```bash
curl http://localhost:3000/audit/settlements/<settlementId>
```

Returns the immutable input snapshot used for the calculation: the exact
`playEventIds`, `playEventCount`, `totalRevenue`, the period, and the
`revenueSplitBasisPoints` config — enough to independently recompute and verify
the settlement later.

> Tip: pipe any response through `| python3 -m json.tool` (or `| jq`) for
> readable output.

---

## Data Model

### PlayEvent

Stores music play activity.

| Field | Type | Description |
|---|---|---|
| `songId` | varchar | Song identifier |
| `storeId` | varchar | Store identifier |
| `playedAt` | timestamptz | When the play occurred |
| `duration` | integer (nullable) | Optional play duration (seconds) |
| `unitPrice` | integer | Revenue in KRW (defaults to `DEFAULT_UNIT_PRICE_KRW` when omitted) |
| `settledBatchId` | uuid (nullable) | Claim marker — the settlement batch that consumed this event. `NULL` means unsettled. Guarantees each event is settled exactly once. |

### SettlementBatch

Represents a settlement execution for a specific time range.

| Field | Type | Description |
|---|---|---|
| `idempotencyKey` | varchar (unique) | Prevents duplicate settlement |
| `periodStart` | timestamptz | Inclusive period start |
| `periodEnd` | timestamptz | Inclusive period end |
| `totalRevenue` | integer | Total KRW settled |
| `status` | enum | `PENDING` or `COMPLETED` |

### SettlementAllocation

Stores immutable allocation records generated during settlement.

| Field | Type | Description |
|---|---|---|
| `songId` | varchar | Song identifier |
| `partyType` | enum | `CREATOR_POOL`, `CMO`, `PLATFORM` |
| `allocatedAmount` | integer | Allocated KRW |

### AuditLog

Stores audit events and settlement metadata.

| Field | Type | Description |
|---|---|---|
| `eventType` | varchar | Event name |
| `payload` | jsonb | Structured metadata |

---

## API Endpoints

### POST /play-events

Record a music play event.

**Request body**

```json
{
  "songId": "song-123",
  "storeId": "store-1",
  "playedAt": "2026-01-10T12:00:00.000Z",
  "duration": 180,
  "unitPrice": 10
}
```

`duration` and `unitPrice` are optional. When `unitPrice` is omitted it defaults
to `DEFAULT_UNIT_PRICE_KRW` (10 KRW).

### GET /play-events/:id

Retrieve a single play event by id.

### POST /settlements

Execute settlement for a period.

**Request body**

```json
{
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-01-31T23:59:59.999Z",
  "idempotencyKey": "unique-key"
}
```

### GET /settlements/:id

Retrieve settlement result.

**Response includes**

* `allocations` — per-song, per-party allocation rows
* `trackTotals` — total settled amount per track
* `partyTotals` — total settled amount per participant (Creator / CMO / Platform)
* `totalRevenue` — original revenue settled for the period
* `allocationTotal` — sum of all `allocatedAmount` values
* `matchesOriginalRevenue` — `allocationTotal === totalRevenue` (reconciliation check)

### GET /audit/settlements/:settlementId

Retrieve settlement audit history.

---

## Correctness

All monetary values are represented as integer KRW values.

Floating point arithmetic is never used for allocation calculations.

Revenue distribution uses the **Largest Remainder Method**:

1. Each party's share is computed in integer basis points
   (Creator 4000 / CMO 1500 / Platform 4500 of 10000) — no floating point.
2. Each party receives the floor of its exact share.
3. The leftover KRW (`revenue − sum(floors)`) is distributed one unit at a time
   to the parties with the largest fractional remainder.
4. Ties on the remainder are broken by a fixed priority order
   (`Creator → CMO → Platform`) so the result is fully deterministic.

Example — 101 KRW:

| Party | Exact | Floor | Remainder | Final |
|---|---|---|---|---|
| Creator Pool | 40.40 | 40 | 0.40 | 40 |
| CMO | 15.15 | 15 | 0.15 | 15 |
| Platform | 45.45 | 45 | 0.45 | **46** |

Total: 101 KRW (the leftover 1 KRW goes to Platform, the largest remainder).

This guarantees:

* no loss of money (sum always equals the original revenue)
* no duplicated money
* deterministic allocation
* reproducible calculations

The calculator tests assert the invariant `sum(allocations) === revenue` for
**every** integer revenue from 0 to 500, plus targeted edge cases.

---

## Concurrency

Two independent forms of double-settlement are prevented:

**1. Duplicate / retried requests (same idempotency key)**

* `executeSettlement` first checks for an existing batch with the key (fast path).
* Inside the transaction, the batch row is inserted **first**. A `UNIQUE`
  constraint on `idempotency_key` is the single source of truth: a racing
  transaction inserting the same key blocks until the winner commits, then
  fails with a unique violation (`23505`).
* On that violation the transaction rolls back and the winning settlement is
  re-read on a **fresh connection**. This matters: in PostgreSQL, once a
  statement errors the transaction is aborted and no further query can run on
  that connection, so the recovery read must happen outside the failed
  transaction.

**2. Overlapping settlement periods (different idempotency keys)**

Idempotency keys alone do not stop two *different* settlements over overlapping
periods from counting the same play events. To close this gap, play events are
**claimed**:

* Events are selected with `FOR UPDATE SKIP LOCKED` and filtered on
  `settled_batch_id IS NULL`.
* After allocation they are stamped with the batch id, so a concurrent or later
  settlement can never pick them up again.

This guarantees every play event contributes to revenue **exactly once**.

Trade-off:

I combined transactional idempotency (unique constraint) with row-level claim
locking instead of a single global lock. The unique constraint gives a cheap,
strong guarantee for the common retry case, while `SKIP LOCKED` row claiming
allows non-overlapping settlements to run concurrently without blocking each
other. The cost is slightly more moving parts than a single coarse lock, but
much better throughput and a tighter correctness guarantee.

---

## Auditability

Settlement records are immutable.

Completed settlement allocations are never modified or deleted.

Audit logs record an immutable **input snapshot** for each settlement:

* `idempotencyKey`
* input period (`periodStart` / `periodEnd`)
* `playEventIds` — the exact list of events that were settled
* `playEventCount` / `songCount`
* `totalRevenue`
* `revenueSplitBasisPoints` — the split configuration used
* timestamp

Because the audit log captures *which* events and *which* split config produced
the result (not just the period), a settlement can be independently recomputed
and verified later, even if new events are added to the same period afterward.

---

## Assumptions

1. Revenue is represented as integer KRW values.
2. Each PlayEvent carries its own `unitPrice`. When omitted, a configurable
   default (`DEFAULT_UNIT_PRICE_KRW`, currently 10 KRW) is applied at record time.
3. Settlement periods are inclusive on both ends.
4. Completed settlements (batches and allocations) are immutable — never updated
   or deleted.
5. Duplicate/retried requests are identified by `idempotencyKey`.
6. A play event is settled **exactly once**: once claimed by a batch
   (`settledBatchId`), it is excluded from all future settlements, even those
   over an overlapping period. Re-running a period after new events arrive will
   only settle the new (unclaimed) events.
7. Revenue allocation uses the Largest Remainder Method with a fixed tie-break
   order (Creator → CMO → Platform).

---

## AI Tool Usage

Tools used:

* Cursor
* Claude Sonnet

AI was used for:

* project scaffolding
* boilerplate generation
* test generation
* Swagger/OpenAPI annotations and the `docker-compose` setup

Manually reviewed and validated:

* the Largest Remainder rounding logic and its tie-break order
* the concurrency model — specifically the PostgreSQL aborted-transaction
  recovery path and the `FOR UPDATE SKIP LOCKED` claim strategy (these are easy
  for an AI to get subtly wrong, so they were checked by hand and covered with
  dedicated tests)
* the auditability/immutability guarantees

---

## Not Done / Future Improvements

Implemented in this round:

* play-event recording API
* per-track and per-party result aggregates
* play-event claim locking (`FOR UPDATE SKIP LOCKED`) to prevent double-settlement
* aborted-transaction-safe idempotency recovery
* reproducible audit input snapshot (event ids + split config)
* OpenAPI / Swagger docs at `/api` and a one-command PostgreSQL setup via
  `docker-compose`

Given additional time, I would add:

* a generated SQL migration (currently `synchronize` builds the schema in dev)
* integration tests against a real PostgreSQL instance (Testcontainers) to
  exercise the actual `SKIP LOCKED` / unique-violation behavior, which unit
  tests can only approximate with mocks
* settlement reversal/versioning (append-only correction batches)
* reconciliation reporting and an outbox pattern for downstream payouts
* full app containerization (Dockerfile) for production deployment

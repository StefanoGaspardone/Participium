# Server - Local DB & Test helpers

This file documents convenient npm scripts to manage the local Postgres containers and run the server or tests without editing `.env` every time.

## Helpful scripts (from `server/package.json`)

- `npm run db:test:start` — start the test Postgres (compose at `test/docker/postgres/docker-compose.yaml`).
- `npm run db:test:stop` — stop the test Postgres.
- `npm run db:dev:start` — start the dev Postgres (compose at `docker/postgres/docker-compose.yaml`).
- `npm run db:dev:stop` — stop the dev Postgres.
- `npm run dev:test` — run the dev server with environment variables overridden to point to the test DB (no `.env` edits).
- `npm run test:ci` — starts the test DB, runs Jest in-band, then stops the test DB (good for CI/local single-command runs).

## Typical workflows

Start test DB and run tests (recommended for local CI-like runs):

```bash
cd server
npm run db:test:start
npm test -- --runInBand
# or use the helper which wraps start/test/stop
npm run test:ci
```

Run the dev server using the dev Postgres (recommended for normal development):

```bash
cd server
npm run db:dev:start
npm run dev
```

Run the dev server against the test Postgres for quick checks (without editing `.env`):

```bash
cd server
npm run db:test:start   # ensure test DB is up
npm run dev:test
```

## Notes

- The `dev:test` script sets DB env vars only for that process (it does not modify `.env`).
- Using the same DB for dev and tests can cause conflicts (duplicate keys, data reset). Prefer using the dev compose for regular development and reserve the test compose for running the test suite.

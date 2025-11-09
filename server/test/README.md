# Server tests — how to run (quick)

This file documents the basic commands to run the server test suite and the E2E tests locally.

Important: the e2e tests require a Postgres test container defined in `test/docker/postgres/docker-compose.yaml`. The project's test datasource expects the container to expose port 5445 (see `test/setup/test-datasource.ts`).

Start the test DB (Docker Compose)

```bash
# run from the `server` folder
npm run db:test:start
```

Run the full test suite (unit, integration, e2e)

```bash
# run from the `server` folder
npm test
```

Run a single test file (example: the reports e2e file)

```bash
# run from the `server` folder
npm test -- test/e2e/reports/reports.e2e.test.ts
```

Notes / troubleshooting

- If you get a DB connection error (ECONNREFUSED), make sure the test DB container is running (re-run `npm run db:test:start`).
- To stop the test DB containers:

```bash
# run from the `server` folder
docker compose -f ./test/docker/postgres/docker-compose.yaml down
```

- The lifecycle used by E2E tests (`test/e2e/lifecycle.ts`) calls the helpers in `test/setup/test-datasource.ts` which set environment variables for the test DB and seed a couple of users and roles. Suite-specific fixtures (for example, categories used by report tests) are created by the test suites themselves (recommended for isolation).

- If you frequently create the same categories in multiple suites, consider using the helper `test/helpers/createCategory.ts` to avoid duplication.

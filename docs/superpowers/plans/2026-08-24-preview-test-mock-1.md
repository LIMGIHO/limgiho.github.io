# Preview Test Mock 1 Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single-file TypeScript practice starter manifest and hand off a generic reservation-relay assignment without providing source, configuration, tests, README, or solution code.

**Architecture:** The starter contains only `package.json` under the repository's temporary practice directory. It pins a Node 20-compatible NestJS, Axios, node-json-db, and Vitest toolchain; the candidate creates every other project file. The assignment text is delivered in conversation rather than stored beside the starter.

**Tech Stack:** Node.js 20, npm 10, TypeScript 5.9, NestJS 11, Axios, node-json-db, Vitest 4, Supertest, Nock

## Global Constraints

- Create only `tmp/preview-test-practice/mock-1/package.json` in the practice starter.
- Do not create source, TypeScript configuration, Vitest configuration, tests, README, lockfile, or solution files.
- Do not modify the portfolio application, data, or existing user changes.
- Do not commit the practice starter.
- Use exact dependency versions verified against the npm registry on 2026-08-24.
- Keep the assignment unrelated to Toss, finance, mobile devices, and test automation.

---

## File Structure

- `tmp/preview-test-practice/mock-1/package.json`: the complete dependency and script manifest supplied to the candidate.
- No other file is created under `tmp/preview-test-practice/mock-1/`.

### Task 1: Create and validate the starter manifest

**Files:**
- Create: `tmp/preview-test-practice/mock-1/package.json`
- Test: command-line JSON, dependency-resolution, and file-count checks only

**Interfaces:**
- Consumes: Node.js `20.19.x`, npm `10.x`, and the approved practice design.
- Produces: npm scripts `build`, `start`, `start:dev`, `start:prod`, `test`, and `test:watch`; dependencies for NestJS HTTP communication, file persistence, validation, and Vitest/Supertest tests.

- [ ] **Step 1: Create the only starter file**

Create `tmp/preview-test-practice/mock-1/package.json` with exactly:

```json
{
  "name": "reservation-relay-practice",
  "version": "1.0.0",
  "private": true,
  "license": "UNLICENSED",
  "engines": {
    "node": ">=20.19.0 <21"
  },
  "packageManager": "npm@10.8.2",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@nestjs/axios": "4.0.1",
    "@nestjs/common": "11.2.1",
    "@nestjs/core": "11.2.1",
    "@nestjs/platform-express": "11.2.1",
    "axios": "1.19.0",
    "class-transformer": "0.5.1",
    "class-validator": "0.15.1",
    "node-json-db": "2.6.0",
    "reflect-metadata": "0.2.2",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@nestjs/cli": "11.0.24",
    "@nestjs/testing": "11.2.1",
    "@types/node": "20.19.43",
    "@types/supertest": "7.2.1",
    "nock": "14.0.17",
    "supertest": "7.2.2",
    "typescript": "5.9.3",
    "vitest": "4.1.11"
  }
}
```

- [ ] **Step 2: Verify JSON structure and required categories**

Run:

```bash
node -e "const p=require('./tmp/preview-test-practice/mock-1/package.json'); const required=['@nestjs/common','@nestjs/axios','axios','node-json-db']; const dev=['vitest','@nestjs/testing','supertest']; if(!required.every(x=>p.dependencies[x])||!dev.every(x=>p.devDependencies[x])) process.exit(1); console.log('manifest-ok')"
```

Expected: exit code `0` and `manifest-ok`.

- [ ] **Step 3: Verify the dependency graph resolves**

Run:

```bash
npm install --dry-run --ignore-scripts --package-lock=false --prefix tmp/preview-test-practice/mock-1
```

Expected: exit code `0` with no peer-dependency resolution error and no lockfile creation.

- [ ] **Step 4: Verify the starter contains one file only**

Run:

```bash
find tmp/preview-test-practice/mock-1 -mindepth 1 -print | sort
```

Expected:

```text
tmp/preview-test-practice/mock-1/package.json
```

- [ ] **Step 5: Leave the starter uncommitted**

Run:

```bash
git status --short -- tmp/preview-test-practice/mock-1/package.json
```

Expected: `?? tmp/preview-test-practice/mock-1/package.json` if `tmp/` is not ignored, or no output if the directory is ignored. Do not stage or commit it.

### Task 2: Deliver the mock assignment in conversation

**Files:**
- Create: none
- Modify: none
- Test: manual completeness check against the acceptance criteria below

**Interfaces:**
- Consumes: the manifest from Task 1.
- Produces: a self-contained Korean assignment prompt that the candidate can implement without additional clarification.

- [ ] **Step 1: Present the following problem and constraints**

Provide a generic reservation relay service assignment with these exact requirements:

1. `POST /reservations` accepts `requestId`, `resourceId`, `userId`, `startsAt`, and `endsAt`. All string fields are required, the two date-time fields must be valid ISO 8601 values, and `startsAt` must precede `endsAt`.
2. Persist a `PENDING` reservation before calling `POST {PROVIDER_BASE_URL}/reservations` with Axios. Send `resourceId`, `userId`, `startsAt`, `endsAt`, and `clientRequestId: requestId`, using a 1,000 ms timeout.
3. A provider 2xx response with `{ reservationId: string }` produces `CONFIRMED` and stores that value as `providerReservationId`. A provider `409` produces `REJECTED`. Other non-2xx responses, network failure, malformed success responses, or timeout produce `FAILED` with a useful `lastError`.
4. Provider rejection or failure is a recorded business result returned by the API rather than an unhandled server error.
5. Repeating the same `requestId`, including concurrent requests in one Node.js process, must not call the provider twice and must return the existing reservation.
6. `POST /reservations/:requestId/retry` retries only `FAILED` reservations; missing reservations return `404` and `PENDING`, `CONFIRMED`, or `REJECTED` reservations return `409`.
7. `GET /reservations/:requestId` returns the stored reservation or `404`.
8. Every stored reservation contains `requestId`, input fields, `status`, `providerReservationId` or `null`, `attemptCount`, `lastError` or `null`, `createdAt`, and `updatedAt`.
9. Store reservations with node-json-db at the `DATA_FILE` environment path, defaulting to `./data/db.json`; state must survive repository or application re-instantiation. Read the provider URL from `PROVIDER_BASE_URL`, defaulting to `http://localhost:4000`.
10. Use TypeScript, NestJS, `@nestjs/axios` or Axios, node-json-db, and Vitest. Do not add or upgrade dependencies.
11. Include unit and HTTP integration tests for confirmation, rejection, provider failure, duplicate `requestId`, concurrent duplicate requests, retry, input validation, and persistence after repository re-instantiation. Tests must not access the public internet.
12. Create a README with setup, commands, API examples, architecture, assumptions, concurrency guarantee and limitation, and incomplete work.

- [ ] **Step 2: State the exercise schedule and review boundary**

State that the candidate uses one hour on Monday, thinks about structure without implementation during Tuesday daytime, finishes code Tuesday evening, and submits the practice directory for review on Wednesday. Explain that practice code may be shared for review, while the real Toss assignment must never be shared.

- [ ] **Step 3: Check handoff completeness**

Confirm the response includes all endpoints, provider contract, status transitions, idempotency behavior, persistence path, timeout, technology constraints, required tests, README contents, schedule, and the clickable absolute path to `package.json`.

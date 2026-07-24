# JUnit (black-box) tests for Kata Task Manager

This module contains black-box **JUnit 5** tests (using **RestAssured**) that validate the KT-22 feature:

- `PATCH /api/tasks/{id}/status` supports workflow transitions:
  - `todo` -> `in-progress`
  - `in-progress` -> `done`
  - `done` -> `todo`
- Server-side validation rejects invalid transitions and invalid payloads.

## Prerequisites

- Java 17+
- Maven 3.9+
- The Next.js application running locally or accessible remotely

## Start the app

From repo root:

```bash
npm ci
npm run dev
```

By default Next.js runs on `http://localhost:3000`.

## Run tests

From repo root:

```bash
cd junit-tests
mvn test \
  -DbaseUrl=http://localhost:3000 \
  -Dusername=admin \
  -Dpassword=password123
```

### Target a deployed environment

```bash
cd junit-tests
mvn test -DbaseUrl=https://gh-copilot-usecase1.vercel.app -Dusername=admin -Dpassword=password123
```

## Notes

- Tests create a temporary task (unique title) and clean it up at the end.
- The app uses Bearer token authentication; the tests call `/api/auth/login` to obtain a token.

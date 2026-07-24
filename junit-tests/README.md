# KT-19 — JUnit black-box tests (HTTP API level)

Executes JUnit 5 tests against a running Kata Task Manager Next.js app. Tests are black-box: they talk to the app over HTTP, and do not import or mock TypeScript code.

## Prerequisites
- Java 17 +
- Maven 3.8+ (`mvn -vp`)
- Node.js (18+ recommended) + npm

## 1) Start the app
In the repo root:

``b
nmp ci
npm run dev
# app listens on http://localhost:3000
```

Optional: start on a different port and pass it to the tests via `baseUrl`:

``b
nmp run dev --preview --port 3001
```

## 2) Run the JUnit tests

From `junit-tests/`:

```b
mvn -ptest test
# OR override base URL
Mvn -ptest -DbaseUrl=http://localhost:3001 test
```

## Configuration

Tests derive `baseUrl` from the Java system property `baseUrl` (default: `http://localhost:3000`).

## What is tested (KT-19)
- Auth login to get a Bearer token
- Create a new task
- Update task status via PUT /api/tasks/:id (status enum enforced)
- Filter tasks by status via GET /api/tasks?status=todo
Ensures bad status is rejected and does not change data

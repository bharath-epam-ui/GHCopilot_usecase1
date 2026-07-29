# junit-tests (KT-23)

Black-box JUnit 5 tests for the KT-23 safe-delete + undo (restore) feature.

## Prerequisites
- Node.js (to run the Next.js app)
- Java 17+
- Maven 3.9+

## Start the app
From repo root:

```bash
npm ci
npm run dev
# app should be on http://localhost:3000
```

> If your app runs on a different port, pass `-DbaseUrl=http://localhost:<port>` when running tests.

## Run tests
In a separate terminal:

```bash
cd junit-tests
mvn test
```

### Override defaults

```bash
cd junit-tests
mvn test -DbaseUrl=http://localhost:3000 -Dusername=user1 -Dpassword=test1234
```

## What is covered
- Login to obtain Bearer token
- Create a task
- Soft-delete the task via `DELETE /api/tasks/{id}`
- Ensure task is excluded from `GET /api/tasks`
- Restore the task via `POST /api/tasks/{id}/restore`
- Ensure task is visible again via `GET /api/tasks`

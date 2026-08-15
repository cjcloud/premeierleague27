# Premier League 2026/27 Tests

This directory contains test scripts for validating the Premier League API integration and update logic.

## Test Descriptions

### 1. Simple API Test (`simple-api-test.ts`)

A basic test that verifies the Premier League API is accessible and returns properly formatted data.

**Purpose:**
- Verify that the API endpoint is reachable
- Confirm that authentication headers work correctly
- Validate that the response contains the expected data structure
- Display the top 5 teams in the standings

**Usage:**
```bash
npx ts-node tests/simple-api-test.ts
```

### 2. Update Logic Test (`update-logic-test.ts`)

A comprehensive test that validates the 3-minute update logic for Premier League standings.

**Purpose:**
- Test data freshness detection (whether data is stale or fresh)
- Verify that stale data (>3 minutes old) triggers an update
- Confirm that fresh data (<3 minutes old) skips the update
- Test database timestamp updates during the process
- Validate the entire update cycle functions correctly

**Usage:**
```bash
npx ts-node -r dotenv/config tests/update-logic-test.ts
```

## Running Tests

Make sure you have the necessary environment variables set in `.env.local` before running tests:

```
DATABASE_URL="your-neon-postgres-connection-string"
```

The season endpoint is centralised in `src/lib/api.ts` (`SEASON_ID = "2026"`); the standalone
`simple-api-test.ts` hits `.../seasons/2026/standings?live=false` directly.

## Why Tests Are Excluded From Build

These test files are intentionally placed outside the `src` directory and excluded from the TypeScript compilation during the build process to prevent deployment errors. Test files are not needed in the production environment and may contain code that's useful for development but not suitable for production.

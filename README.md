# Premier League 2026/27 Prediction App

## Overview

This is a prediction application for the Premier League 2026/27 season. The application allows users to predict the final positions of Premier League teams and compare their predictions with the actual standings in real-time.

## Features

- User predictions for Premier League team positions
- Real-time standings from the official Premier League API
- Smart API update mechanism (only fetches new data when older than 3 minutes)
- Leaderboard showing user scores based on prediction accuracy
- Point calculation system with bonuses for correct predictions
- Admin interface for managing data
- Responsive design for mobile and desktop

## Technical Details

### Frontend
- Next.js 14.2.5 with App Router
- TypeScript for type safety
- TailwindCSS for styling with Radix UI components (Emerald & Teal theme)
- React Hook Form for form handling

### Backend
- Next.js API routes and server actions
- PostgreSQL database (via Neon serverless)
- Drizzle ORM for database interactions
- Iron Session for authentication

### Data Source
- Premier League standings from the official Premier League internal API
- The season is centralised in a single constant (`SEASON_ID` in `src/lib/api.ts`)
- Robust error handling and request caching
- Browser request mimicking to avoid API restrictions

### Deployment
- Vercel (serverless Node runtime for server actions, iron-session and API routes)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Update database schema
npm run db:push

# Seed database with initial data
npm run db:seed

# Run tests
npm run test:api:simple
npm run test:update-logic

# Build for production
npm run build

# Run production server
npm start
```

## Environment Variables

The application requires the following environment variables to be set in `.env.local`
(and in the Vercel project settings for production). Never commit these.

```
DATABASE_URL="your-neon-postgres-connection-string"
SECRET_COOKIE_PASSWORD="a-random-string-at-least-32-characters-long"
CRON_SECRET="a-random-string-to-protect-the-cron-endpoint"
```

See `.env.example` for the template.

## Deployment

Deploy to Vercel by importing the repository at https://vercel.com/new, setting the
three environment variables above in the project settings, and pushing to the
production branch. Preview deployments are created automatically for pull requests.

## Season Information

This is the Premier League **2026/27** edition. The season kicks off on **Saturday 22
August 2026** (opening fixture Friday 21 August 2026), and predictions lock at the first
match kickoff (see `PREDICTIONS_DEADLINE` in `src/lib/time-utils.ts`).

To carry the app forward to a future season, change `SEASON_ID` in `src/lib/api.ts` and
the `PREDICTIONS_DEADLINE` in `src/lib/time-utils.ts`, then stand up a fresh database.

## API Implementation

The application uses a direct connection to the Premier League's internal API endpoint
(season id `2026` == "Season 2026/2027"):
```
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false
```

### Rate Limiting and Caching
- The application checks the age of Premier League standings data when the leaderboard is viewed
- If the data is older than 3 minutes, it automatically calls the Premier League API to update the database
- This prevents excessive API calls while ensuring users see reasonably fresh data

### Implementation Details
- Browser-like request headers are used to mimic legitimate web browser traffic
- Robust error handling with appropriate HTTP status checks
- Next.js cache invalidation tags are used for efficient cache management

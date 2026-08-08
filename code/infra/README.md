# Vercel deployment

CalmPath Melbourne is deployed as a public web application on Vercel. The current deployment uses Vercel for the frontend and serverless API functions, with Neon PostgreSQL providing the relational database.

## Current deployment

- Vercel project: `calmpath-melbourne`
- Production URL: <https://calmpath-melbourne.vercel.app>
- Frontend: React, TypeScript and Vite
- API runtime: Vercel Functions using Node.js 24
- Function region: Sydney (`syd1`)
- Database: Neon PostgreSQL in Sydney
- Authentication: none; the application is public and does not collect user accounts or journey histories
- Deployment method: manual Vercel CLI deployment

The frontend and API are deployed together from the `code/` directory. Requests under `/api/*` are handled by Vercel Functions, so a separate API Gateway is not required.

## Vercel configuration

The deployment settings are stored in `vercel.json`:

- install command: `pnpm install --frozen-lockfile`
- frontend build command: `pnpm --filter @sensory-melbourne/web build`
- output directory: `frontend/dist`
- function region: `syd1`

The current Vercel Function entry points are:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirms that the API runtime is available |
| `GET` | `/api/db-health` | Confirms that the Neon database is reachable |
| `POST` | `/api/routes` | Passes route requests to the backend application |

`POST /api/routes` currently uses the backend mock composition. It must not be described as using live pedestrian or routing data until the backend integration is completed.

## Environment variables

`DATABASE_URL` is configured as a Sensitive environment variable for both Preview and Production deployments.

It contains the pooled Neon PostgreSQL connection string for the read-only `calmpath_app` role. Database owner credentials must not be provided to the web application.

Environment values must be configured through the Vercel dashboard or CLI. They must never be committed to Git.

See `.env.example` for variable names only.

## Validate before deployment

From `code/`:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dlx vercel@latest build --prod

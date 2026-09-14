# Supabase Setup

This document describes the Supabase project prerequisites for the CUET Lost
and Found Box MVP. It configures only the integration foundation; no database
schema, RLS policy, authentication UI, posts, claims, or uploads are included
in this phase.

## 1. Create and configure a Supabase project

1. Create a Supabase project and retain its project URL.
2. In **Authentication → Providers**, enable Google OAuth and provide Google
   with Supabase's callback URL shown in that provider configuration.
3. In **Authentication → URL Configuration**, add local redirect URLs used by
   the future Next.js callback, such as `http://localhost:3000/auth/callback`.
   Add production URLs when deployed.
4. Obtain the project URL and the publishable (or legacy `anon`) key from
   **Project Settings → API**. The publishable/anon key may be used in the
   frontend; it does not bypass Row Level Security.
5. Retain the database connection string for backend-only configuration. Do
   not place it in a `NEXT_PUBLIC_*` variable.

## 2. Authentication and token validation

The next phase will implement Google login and FastAPI request protection.
Before then, configure the backend with:

- `SUPABASE_URL`: establishes the expected issuer
  (`<project-url>/auth/v1`) and default JWKS URL.
- `SUPABASE_JWT_AUDIENCE=authenticated`: validates the intended token audience.
- Modern Supabase projects: use the derived JWKS endpoint
  (`<project-url>/auth/v1/.well-known/jwks.json`) or set `SUPABASE_JWKS_URL`.
- Legacy HS256 projects only: set server-only `SUPABASE_JWT_SECRET`.

The backend must validate signature, issuer, expiration, and audience before
trusting a user identity. Frontend environment variables must never contain a
JWT signing secret, database URL, or Supabase service-role key.

CUET email-domain enforcement is intentionally deferred to the authentication
phase, where it will be checked against the verified Supabase user identity.

## 3. PostgreSQL

Supabase provides the project PostgreSQL database. Set `DATABASE_URL` only in
`backend/.env`; it will be used when migrations and SQLAlchemy are added. Do
not manually create the MVP tables from this phase—schema migrations are the
next database-focused phase.

## 4. Storage

Create a bucket named `lost-found-images` when the project is provisioned.
The application has a shared frontend constant for this name, but it does not
upload files yet. The schema/storage phase must add owner-scoped policies for
paths like `posts/{user_id}/{post_id}/{filename}`, file validation, and the
chosen public-read policy.

## Environment variables

| Location | Variable | Purpose |
| --- | --- | --- |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` | FastAPI base URL |
| `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public publishable/anon key |
| `backend/.env` | `SUPABASE_URL` | Token issuer and default JWKS base |
| `backend/.env` | `SUPABASE_JWKS_URL` | Optional JWKS endpoint override |
| `backend/.env` | `SUPABASE_JWT_AUDIENCE` | Expected access-token audience |
| `backend/.env` | `SUPABASE_JWT_SECRET` | Legacy server-only HS256 secret, if applicable |
| `backend/.env` | `DATABASE_URL` | Server-only Supabase PostgreSQL URL |

Use each service's `.env.example` as a template. Do not commit either real
environment file.

## Local testing

1. Copy `frontend/.env.example` to `frontend/.env.local` and enter the project
   URL, public key, and API URL.
2. Copy `backend/.env.example` to `backend/.env`; add the Supabase URL,
   audience, and database URL as applicable. Do not use the JWT secret unless
   the project uses legacy HS256 signing.
3. Start the frontend with `npm run dev` from `frontend`.
4. Start FastAPI with `uvicorn app.main:app --reload --port 8000` from
   `backend` after installing `requirements.txt`.
5. Confirm `GET http://localhost:8000/health` returns `{"status":"ok"}`.
6. The browser client can be imported through
   `@/lib/supabase/client`. Login, database access, and file upload tests are
   deferred until their dedicated MVP phases.

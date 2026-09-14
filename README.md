# CUET Lost and Found Box

Monorepo for the CUET Lost and Found Box MVP.

## Phase 1 setup

- `frontend/`: Next.js, TypeScript, and Tailwind CSS
- `backend/`: FastAPI application
- `docs/`: project documentation

### Run the frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

The frontend is available at `http://localhost:3000`.

### Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

The health endpoint is available at `http://localhost:8000/health`.

## Supabase integration foundation

The application supports Supabase Google OAuth for CUET institutional accounts.
It persists sessions in Supabase-managed cookies, provides login/logout and an
OAuth callback, protects `/dashboard` and future post-creation routes, and
validates FastAPI bearer tokens at `GET /api/v1/auth/me`.

Only emails ending in `@student.cuet.ac.bd` or `@cuet.ac.bd` are permitted.
This is enforced both after OAuth and in FastAPI's reusable
`get_current_user()` dependency. Follow
[docs/supabase-setup.md](docs/supabase-setup.md) to configure a Supabase
project and local environment files.

### Test authentication locally

1. In Supabase, enable Google and register
   `http://localhost:3000/auth/callback` as an allowed redirect URL.
2. Configure the frontend and backend environment files as described in
   [docs/supabase-setup.md](docs/supabase-setup.md).
3. Start the frontend and backend, then visit `http://localhost:3000/login`.
4. Complete Google OAuth using an allowed CUET email. The callback should take
   you to `/dashboard`; use **Log out** to end the session.
5. Copy the Supabase session access token from the browser's authenticated
   session and call `GET /api/v1/auth/me` with
   `Authorization: Bearer <access_token>`. It must return `200` only for an
   unexpired, valid CUET token.

Run backend authentication tests with `pytest` from `backend/` after Python
and the dependencies in `requirements.txt` are installed.

The tracked database foundation (schema, constraints, indexes, profile trigger,
and RLS) is documented in [docs/database.md](docs/database.md). Posts, claims,
and file-upload APIs/UI remain intentionally deferred to their dedicated phases.

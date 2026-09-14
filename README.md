# CUET Lost and Found Box

A Next.js, FastAPI, and Supabase MVP for reporting CUET lost and found items.

## Implemented MVP phases

- Supabase Google OAuth restricted to CUET email domains.
- FastAPI bearer-token validation and post authorization.
- PostgreSQL schema, constraints, indexes, and Row Level Security migrations.
- Posts API: create, feed, filters, search, detail, edit, and delete.
- Responsive posts UI with optional Supabase Storage image uploads.
- Top-five LOST ↔ FOUND similarity API using weighted TF-IDF/cosine matching.

Claims are not implemented yet. Similarity UI is a later phase; the backend API
is available at `GET /api/v1/posts/{post_id}/similar`.

## Prerequisites

- Node.js 20+
- Python 3.12+
- A Supabase project
- Supabase CLI, run as a repository dependency via `npx supabase`

## 1. Install dependencies

```powershell
cd E:\cuet-lost-found-box\frontend
npm.cmd install
cd ..\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## 2. Configure Supabase

1. Create a Supabase project.
2. In **Authentication → Providers**, enable Google OAuth and add Google client credentials.
3. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback`.
4. In **Connect**, copy the **Session Pooler** URI. It is suitable for IPv4 local Windows FastAPI development. Copy it exactly: its username is `postgres.<project-ref>` and host ends in `.pooler.supabase.com`.
5. Reset the database password if it was exposed. URL-encode special characters inside a connection URI.

## 3. Configure environment files

```powershell
cd E:\cuet-lost-found-box\frontend
Copy-Item .env.example .env.local
cd ..\backend
Copy-Item .env.example .env
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

`backend/.env`:

```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres
```

Do not put database secrets or a service-role key in frontend variables.

## 4. Apply database and Storage migrations

From the repository root:

```powershell
npm.cmd install --save-dev supabase
npx supabase init
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

This applies the database schema and the `lost-found-images` Storage bucket. The bucket is public-read for displaying active-post images, while authenticated users can only write/delete objects in `posts/{user_id}/{post_id}/{filename}`.

## 5. Run the project

Terminal 1 — backend:

```powershell
cd E:\cuet-lost-found-box\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:

```powershell
cd E:\cuet-lost-found-box\frontend
npm.cmd run dev
```

Open `http://localhost:3000`.

## Verify locally

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8000/health
Invoke-WebRequest -UseBasicParsing http://localhost:8000/api/v1/posts
```

Before data is created, the second response is:

```json
{"items":[],"page":1,"limit":12,"total":0}
```

Run backend tests:

```powershell
cd E:\cuet-lost-found-box\backend
.\.venv\Scripts\python.exe -m pytest -p no:cacheprovider
```

## Image uploads

The post form accepts JPEG, PNG, and WebP files up to 5 MB. It validates and previews the image before upload, creates the post to obtain its UUID, uploads to Supabase Storage, then saves the resulting public URL in `posts.image_url`. Image bytes are never stored in PostgreSQL.

## Documentation

- [Supabase setup](docs/supabase-setup.md)
- [Database schema and RLS](docs/database.md)
- [Posts API](docs/api.md)

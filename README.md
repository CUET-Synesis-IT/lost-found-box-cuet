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

Authentication, Supabase integration, posts, and claims are intentionally not part of Phase 1.

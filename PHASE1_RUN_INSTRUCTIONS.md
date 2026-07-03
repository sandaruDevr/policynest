# Phase 1 — Foundation: Run Instructions

## Prerequisites

1. **Supabase Project**: Ensure you have a Supabase project with the following:
   - `NEXT_PUBLIC_SUPABASE_URL` set
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
   - `SUPABASE_SERVICE_ROLE_KEY` set (for Express server)

2. **Database Schema**: Apply the Phase 1 schema extensions:
   ```bash
   # From the project root
   psql -h <your-supabase-host> -U postgres -d postgres -f supabase/phase1_extensions.sql
   ```

3. **Environment Variables**: Copy the example and configure:
   ```bash
   cp production/.env.example production/.env.local
   ```
   
   Required in `production/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
   ```

   Required in `server/.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

## Running the Application

### 1. Start the Express Server (RAG Backend)

The Express server runs on port **3001** and provides:
- `/health` — Health check endpoint
- `/api/auth/create-test-user` — Creates test users for dev login
- `/api/rag/query` — RAG query endpoint (for later phases)

```bash
cd server
npm install
node index.js
```

Verify the server is running:
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Start the Next.js Production App

The Next.js app runs on port **3000** and provides:
- `/login` — Staff-only fixture login
- `/app/*` — Protected routes (require auth)

```bash
cd production
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Dev Login

1. Navigate to `http://localhost:3000/login`
2. Select one of the 4 staff fixture organizations:
   - Sunrise Aged Care
   - City General Hospital
   - Community Care Services
   - Mindful Health Clinic
3. All fixtures use password: `test123`
4. First login will auto-create the user via the Express backend

## Phase 1 Exit Gate Verification

After running the application, verify:

1. **All 4 fixture staff can log in** — Each organization should allow login
2. **Profile is displayed in topbar** — Shows real name, role, and site
3. **No mock data in layout** — Profile and notifications come from Supabase
4. **Sign-out works** — Redirects to `/login` and clears session
5. **Protected routes redirect** — Accessing `/app/*` without auth redirects to `/login`

### Build Verification

Phase 1 code has been verified:
- **Typecheck**: Passes (`npm run typecheck`)
- **Build**: Passes (`npm run build`)
- **ESLint**: Minor plugin conflict warning (non-blocking)

## Troubleshooting

- **Port conflicts**: Ensure Express is on 3001 and Next.js is on 3000
- **Supabase connection**: Verify env vars are set correctly
- **User creation fails**: Check Express server logs and SUPABASE_SERVICE_ROLE_KEY
- **RLS errors**: Ensure Phase 1 schema extensions are applied

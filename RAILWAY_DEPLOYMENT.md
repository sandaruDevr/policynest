# Railway Deployment Guide (Testing / Temporary)

Deploys the **Next.js web platform** (`production/`) and the **Express RAG server** (`server/`) as **two services inside one Railway project**, sharing the same GitHub repo.

> This setup is for testing only — not the final production deployment topology.

---

## 1. Push this repo to GitHub

```bash
git init
git add .
git commit -m "chore: prepare monorepo for Railway test deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

**Before pushing**, confirm no secrets are staged:
```bash
git status
```
`.env`, `.env.local`, and `server/.env` must NOT appear (they're excluded via `.gitignore`).

---

## 2. Create the Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select this repository. Railway will create the first service — set its **Root Directory** to `server`.
3. In the same project, click **+ New → GitHub Repo** again, select the same repo, and set its **Root Directory** to `production`.

You should now have two services in one project:
- `server` → Express RAG backend
- `production` → Next.js web platform

Each subfolder already has a `railway.json` (Nixpacks build/start config), so Railway will pick up correct build/start commands automatically once the Root Directory is set.

---

## 3. Set environment variables

### Service: `server`
| Variable | Value |
|---|---|
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |
| `OPENAI_API_KEY` | your OpenAI API key |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-large` |
| `OPENAI_CHAT_MODEL` | `gpt-5.4-mini` |
| `INTERNAL_SHARED_SECRET` | any strong random string (must match `production` service) |
| `CORS_ALLOWED_ORIGINS` | the `production` service's public URL (set after step 4) |
| `NODE_ENV` | `production` |

### Service: `production`
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) |
| `NEXT_PUBLIC_API_URL` | the `server` service's public URL (set after step 4) |
| `INTERNAL_SHARED_SECRET` | same value as `server` service |
| `NODE_ENV` | `production` |

---

## 4. Generate public domains, then wire cross-service URLs

1. Deploy both services once (Railway auto-deploys on push).
2. In each service → **Settings → Networking → Generate Domain**.
3. Copy the `server` domain → set as `NEXT_PUBLIC_API_URL` on `production` (e.g. `https://server-xxxx.up.railway.app`).
4. Copy the `production` domain → set as `CORS_ALLOWED_ORIGINS` on `server` (e.g. `https://production-xxxx.up.railway.app`).
5. Redeploy both services (Railway redeploys automatically when env vars change).

---

## 5. Verify

- Open the `production` domain → app should load.
- Log in / trigger an AI Assistant query → confirms `production` → `server` communication works (shared secret + CORS correctly configured).

---

## Notes

- Both `railway.json` files use **Nixpacks** (Railway's default builder) — no Dockerfile needed.
- `production/railway.json` overrides the start command to `next start -p $PORT` so Railway's dynamically assigned port is respected.
- `server/index.js` already reads `process.env.PORT`, so no changes were needed there.
- This is a **testing setup**. For permanent production deployment, revisit: custom domains, secrets rotation, autoscaling, and a proper CI/CD pipeline.

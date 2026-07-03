# CareSuite — Staff Role Phase Execution Plan

> Implementation-ready execution plan for integrating real frontend logic, backend, database, auth, and RAG into the **completed Staff UI** under `production/`.
>
> **Scope:** STAFF role only. Admin / Super-Admin / Auditor are out of scope for this phase, but the architecture must remain future-safe.

---

## 1. Executive Summary

### 1.1 Current State Assessment
- **`production/` (staff UI)** is feature-complete visually: 11 pages, ~25 typed domain models, ~50 components, design system, command palette, mobile nav, SOS, notifications. Build is green. **All data is mock.** No auth, no Supabase calls, no real RAG, no server actions, no persistence.
- **`prototype/`** is a working but minimal Next.js app with: Supabase Auth (`@supabase/auth-helpers-nextjs`), a **predefined-profile login screen** (4 organisations × 2 roles each), staff dashboard reading `rag_audit_logs` directly from Supabase, an assistant page that calls the local Express server's `/api/rag/query`, and a basic policy library, incidents form, emergency view and history list. **All real data flows live here.**
- **`server/` (Express, port 3001)** owns the RAG pipeline: `documentProcessor.js` (chunking + batch embeddings), `ragService.js` (golden-answers shortcut → vector retrieval via `match_tenant_documents` RPC → LLM with strict JSON system prompt → audit log + HITL queue), `rulesEngine.js` (high-risk keyword detection), plus onboarding/test-user creation endpoints that bypass RLS.
- **`supabase/`** has a production-shaped schema (`tenants`, `profiles`, `documents`, `document_chunks` w/ pgvector(3072), `rag_audit_logs`, `hitl_queue`, `golden_answers`, `incidents`) with RLS policies and a tenant-scoped `match_tenant_documents` RPC. Seed data covers 4 tenants and a couple of golden answers.
- The **production UI's domain model is richer** than the prototype's DB schema (training, compliance, emergency protocols, drills, contacts, quick-reference, surveys, safe-voice, activity, notifications, induction, credentials, signed documents are all UI-only with no DB backing).

### 1.2 Overall Recommendation
1. **Adopt `production/` as the single Next.js app.** Retire `prototype/` after harvesting auth and RAG-call wiring.
2. **Keep `server/` as the RAG/LLM orchestration service**, but re-shape the public API to the `production` domain (block-based responses, citation objects, structured next-actions).
3. **Move all non-RAG reads/writes to Next.js Server Components / Route Handlers** that talk to Supabase directly with a per-request server client (auth-helpers); the Express server is reserved for embedding, retrieval, and LLM orchestration.
4. **Replace every `MOCK_*` import** with calls to typed server-side data layers (`/lib/data/*`) backed by Supabase. The `api-contracts` module stays as the UI's only seam — its implementations flip from mock to real, so UI components do not change.
5. **Port the prototype's predefined-profile login** into `production/login` exactly (same UUIDs, same `test123` password, same `/api/auth/create-test-user` server-side bootstrap), but **filtered to staff-role profiles only**. Email/password sign-in remains the underlying auth mechanism.
6. **Extend the Supabase schema** with the staff-domain tables that today only exist in mock data (training, induction, credentials, acknowledgements, compliance, quick-reference, activity, notifications, surveys, safe-voice, emergency protocols/drills/contacts, document sections/citations).
7. **Harden RLS, audit logs, and tenant isolation** for every new table. Every read/write goes through `current_user_tenant_id()`.
8. **Future phases** (admin / auditor) reuse the same schema and Express service. Role gates are already RLS-driven; no UI changes required to support them later.

### 1.3 Critical Architectural Decisions for This Phase
| Decision | Choice | Rationale |
|---|---|---|
| App boundary | Single Next.js 14 app under `production/` (App Router) | UI is already there; collapsing reduces drift |
| Auth | Supabase Auth via `@supabase/auth-helpers-nextjs` (SSR cookies) | Matches prototype; supports RSC; future-safe |
| Data path: read | RSC + Supabase server client (RLS-enforced) | Zero round-trips, secure-by-default |
| Data path: write | Next.js Route Handlers / Server Actions → Supabase | Avoids exposing service-role client; consistent with auth cookies |
| RAG path | Browser → Next.js route `/api/rag/query` → Express `:3001/api/rag/query` | Centralises auth + tenant assertion before LLM |
| RAG response shape | Block-based `GuidanceResponse` (production type) | UI is already wired to it; server returns it natively |
| Tenant isolation | RLS everywhere + server-side enforcement of `tenant_id` | Defence-in-depth |
| Staff role gating | RLS predicates on `profiles.role = 'staff'` + UI route group | Supports future roles without rewrite |
| Mock data | Removed entirely from runtime; kept only as fixtures for tests | Prevents demo-data regression |
| Login UX | Predefined-profile picker (staff-only) reusing prototype IDs and password `test123` | User-mandated, dev/test friendly |
| Document storage | Policy content inline in `documents` + `document_sections` (structured, searchable) | Supports FTS, readable rendering, no external storage complexity for phase-1 |
| Voice input (STT) | `gpt-4o-mini-transcribe` for audio → text conversion | Lightweight, cost-effective, integrates with existing OpenAI setup |
| Observability | Supabase logs + structured server logs + `rag_audit_logs` + `activity` table | Sufficient for this phase, ready to grow |

---

## 2. Investigated Codebase Summary

### 2.1 Frontend (`production/`)
- **Stack**: Next.js 14.2.15 (App Router), React 18, TypeScript strict, Tailwind, Radix, Framer Motion, lucide-react.
- **Routing**: `src/app/(app)/app/{home,assistant,library,library/[documentId],training,incidents,incidents/new,emergency,quick-reference,compliance,feedback,history,profile}` plus root `redirect('/app/home')`. No login, no signup, no auth guard.
- **App shell**: `(app)/layout.tsx` does an unguarded `Promise.all([ProfileApi.getMe(), NotificationsApi.list()])` and renders `AppShell` (sidebar, topbar, mobile nav, SOS, command palette).
- **State management**: Pages are RSC; client components hold local UI state (`useState`/`useRouter`). No global store. No data-fetching library. The `AssistantWorkspace` simulates streaming with `setTimeout` and replays the first mock turn.
- **Design system**: Strong; tokens in `tailwind.config.ts`, primitives in `components/ui/*`, shared blocks in `components/shared/*`. **No changes required.**
- **Domain types** (`src/types/*`): comprehensive and richer than the DB. Includes `StaffProfile`, `GuidanceResponse` (block-based), `Citation`, `DocumentDetail`, `TrainingModule`, `ComplianceItem/Summary`, `IncidentReport`, `EmergencyProtocol/Drill/Contact`, `QuickReferenceItem`, `ActivityItem`, `NotificationItem`, `SurveySummary`, `SafeVoiceSubmission`, `CredentialItem`, `InductionStep`, `SignedDocument`.
- **API seam**: `src/lib/api-contracts/index.ts` exports `ProfileApi`, `LibraryApi`, `AssistantApi`, `TrainingApi`, `ComplianceApi`, `IncidentsApi`, `EmergencyApi`, `QuickRefApi`, `FeedbackApi`, `ActivityApi`, `NotificationsApi`. Every method returns `ApiResult<T>` and currently wraps a mock import. **This is the integration seam — implementations flip, callers do not change.**
- **Mock data**: `src/lib/mock-data/*` (assistant, compliance, emergency, incidents, library, profile, training, misc). Imported by `api-contracts/index.ts` AND by `command-palette.tsx` (direct `MOCK_DOCUMENTS` import — must be replaced).

### 2.2 Prototype Folder (`prototype/`)
- **Auth**: `app/login/page.tsx` defines 4 orgs and 8 users (admin + staff per org). UUIDs, emails, password `test123` are hard-coded. On click it calls `supabase.auth.signInWithPassword`; on first failure, it calls `${NEXT_PUBLIC_API_URL}/api/auth/create-test-user` to provision the auth user + profile via service-role, then retries sign-in. **Reuse exactly, but show staff-only buttons.**
- **Supabase wiring**: `lib/supabase.ts` (`createClientComponentClient`) and `lib/supabase-server.ts` (`createServerComponentClient({ cookies })`). Use the same in `production/`.
- **Staff routes**: `staff/{layout,page,assistant,policies,incidents,emergency,history}` all read directly from Supabase tables (`profiles`, `rag_audit_logs`, `documents`, `incidents`). The assistant page shows the **canonical RAG call shape** to reuse.
- **Onboarding/signup**: Prototype has signup + create-organisation flows. **Out of scope for this phase**, but keep the routes archived for the future admin-onboarding phase. Staff in this phase are pre-provisioned via the predefined login.

### 2.3 Backend / Server (`server/`)
- **Express on `:3001`**, ESM, 5 dependencies (`express`, `cors`, `dotenv`, `@supabase/supabase-js`, `openai`).
- **Endpoints**:
  - `POST /api/documents/process` — chunk + batch-embed + insert (admin-only in future, but used via service-role).
  - `POST /api/rag/query` — main RAG flow: golden-answer match → embedding → `match_tenant_documents` RPC → LLM → audit + HITL.
  - `POST /api/incidents` — inserts incident, then opportunistically asks RAG for next-step suggestions.
  - `POST /api/golden-answers` — admin-only (future phase).
  - `POST /api/onboarding/setup` — bypasses RLS to create tenant + profile (admin-only, future).
  - `POST /api/auth/create-test-user` — service-role admin user creation **(needed for predefined login)**.
  - `POST /api/hitl/:id/approve` — admin/HITL flow (future).
- **Issues to fix**:
  - Express returns prototype-shaped JSON (`{ answer, steps[], citations[], confidence:number, requires_escalation }`). Production UI expects block-based `GuidanceResponse`. **Adapter required** (server-side preferred).
  - `model_name` audit field is `'gpt-5.4-mini'` — placeholder string; align to actual config.
  - No request authentication: relies on the caller passing `tenant_id`/`user_id` in the body. **Must verify the caller's Supabase JWT and resolve tenant from `profiles`.**
  - CORS is `*`. Lock to known origins.
  - No rate limiting, no idempotency keys, no structured logging.

### 2.4 Supabase / Database / Auth
- **Schema** (`supabase/schema.sql`):
  - Core tables: `tenants`, `profiles`, `documents`, `document_chunks` (vector(3072)), `rag_audit_logs`, `hitl_queue`, `golden_answers`, `incidents`.
  - RPC: `match_tenant_documents(query_embedding, tenant, count, role, site_id, filter, min_similarity)` — already role/site/expiry filtered.
  - RLS enabled on all tables; SELECT keyed by `current_user_tenant_id()` helper. INSERT/UPDATE policies for admin-only document mutation; staff INSERT for incidents and audit logs.
  - Trigger `set_updated_at` on `documents` and `golden_answers`.
- **Migrations**: `migrate_embedding_3072.sql` (live), `cleanup_duplicate_documents.sql` (housekeeping).
- **Seed data** (`seed.sql`): 4 tenants with the same UUIDs the prototype login uses, 4 sample documents, 2 golden answers; profiles must be created via Supabase Auth and then linked.
- **Gaps for staff phase**: schema has no tables for **training, induction, credentials, signed documents, acknowledgements, compliance items, quick-reference pins, activity log, notifications, surveys, safe-voice submissions, emergency protocols/drills/contacts, document sections/anchors/citations**. All of these exist only as UI mocks. They **must be added** with proper RLS.

### 2.5 What is Reusable (verbatim or with minor changes)
- All of `production/src/components/**` (UI is correct).
- All of `production/src/types/**` (canonical domain).
- All of `production/src/lib/{constants,utils,route-config,permissions}/**`.
- `production/src/lib/api-contracts/index.ts` (only the implementations change).
- `prototype/lib/supabase.ts` and `prototype/lib/supabase-server.ts` (verbatim, copied to production).
- `prototype/app/login/page.tsx` (logic verbatim, restyled to production design tokens, staff-only filter).
- `server/{documentProcessor,ragService,rulesEngine,openai,supabase,config}.js` core logic.
- `supabase/schema.sql` (core), `migrate_embedding_3072.sql`, `seed.sql` (extend, do not replace).

### 2.6 What Must Be Refactored
- `server/index.js`: add JWT verification, narrow CORS, return block-based response, structured logging, error envelope, request validation (zod or similar).
- `server/ragService.js`: emit production `GuidanceResponse` shape directly; map `confidence:number` → `ConfidenceLevel ('high'|'medium'|'low')` thresholds; populate `nextActions` (open-document, start-incident, ask-followup) from server signals.
- `production/src/lib/api-contracts/index.ts`: each method becomes a typed call into `lib/data/*` (Supabase RSC) or `/api/*` route handler, no mock imports.
- `production/src/components/layout/command-palette.tsx`: stop importing `MOCK_DOCUMENTS`; fetch via a client-side endpoint or pass docs through props.
- `production/src/components/assistant/workspace.tsx`: replace `setTimeout` mock with real `AssistantApi.ask` call returning the streamed/non-streamed `GuidanceResponse`.
- `production/src/app/(app)/app/incidents/new/page.tsx` and `feedback/page.tsx`: wire `handleSubmit` to real route handlers.

### 2.7 What Must Be Replaced
- All `production/src/lib/mock-data/**` runtime imports — moved to `tests/__fixtures__/` and used only in unit/component tests.
- The unguarded root `redirect('/app/home')` — must check session and redirect to `/login` when unauthenticated.
- Hard-coded `MOCK_PROFILE` consumption in `(app)/layout.tsx` — replaced by RSC fetch from Supabase using `auth.uid()` and `profiles` join.

---

## 3. Staff Scope Inventory

Status legend: **MOCKED** = UI rendered from `MOCK_*`. **PARTIAL** = some real code, mostly mocked. **NOT_CONNECTED** = button/handler exists but does nothing real. **MISSING_BACKEND** = no DB or API. **MISSING_AUTH** = no session wiring.

### Global app shell
| Element | File | Status | Notes |
|---|---|---|---|
| Auth-protected layout | `src/app/(app)/layout.tsx` | MISSING_AUTH | Needs Supabase server client + session check + redirect |
| Profile fetch | same | MOCKED | Replace `ProfileApi.getMe()` with RSC Supabase query |
| Notifications fetch | same | MOCKED, MISSING_BACKEND | New `notifications` table |
| Sidebar nav | `components/layout/sidebar.tsx` | DONE | No data wiring needed |
| Topbar — locale switcher | `components/layout/topbar.tsx` | NOT_CONNECTED | Persist to `profiles.locale` |
| Topbar — voice button | same | NOT_CONNECTED | Phase-2; for now opens assistant with `voice=true` |
| Topbar — sync badge | same | PARTIAL | Reads `navigator.onLine`; needs real `lastSyncAt` from DB |
| Topbar — notifications dropdown | same | MOCKED | Real query + mark-as-read mutation |
| Topbar — profile menu sign-out | same | NOT_CONNECTED | Wire to `supabase.auth.signOut()` |
| Command palette search | `components/layout/command-palette.tsx` | MOCKED | Replace `MOCK_DOCUMENTS` with `/api/library/search?q=` route handler |
| Command palette "Ask the assistant" | same | DONE | Already routes to `/app/assistant?q=...` |
| SOS floating button | `components/layout/sos-button.tsx` | DONE | Routes to `/app/emergency` |
| Mobile bottom bar | `components/layout/mobile-nav.tsx` | DONE | |

### Home (`/app/home`)
| Element | File | Status | Notes |
|---|---|---|---|
| Welcome strip (greeting, shift, sectors) | `components/home/welcome-strip.tsx` | MOCKED | From `profiles` + `staff_shifts` |
| Quick Ask input | `components/home/quick-ask.tsx` | DONE (routing) | Submits to `/app/assistant?q=` |
| Quick Ask voice button | same | NOT_CONNECTED | Phase-2 |
| Suggested prompts chips | same | MOCKED | New `assistant_suggested_prompts` table or static config keyed by role/sector |
| Priority actions cards | `components/home/priority-actions.tsx` | MOCKED | From `compliance_items` view |
| Compliance snapshot | `components/home/compliance-snapshot.tsx` | MOCKED | From aggregated query |
| Continue section (recent activity) | `components/home/continue-section.tsx` | MOCKED | From `activity_log` |
| Quick Reference grid | `components/home/quick-ref-grid.tsx` | MOCKED | From `quick_reference_pins` |
| Broadcasts panel | `components/home/broadcasts-surveys.tsx` | MOCKED | From `notifications` (`category='broadcast'`) |
| Surveys panel | same | MOCKED | From `surveys` |

### Assistant (`/app/assistant`)
| Element | File | Status | Notes |
|---|---|---|---|
| Suggested prompts | `components/assistant/workspace.tsx` | MOCKED | Same source as home |
| Composer text + send | `components/assistant/composer.tsx` | PARTIAL | Wire submit to real `AssistantApi.ask` |
| Composer voice toggle | same | NOT_CONNECTED | Phase-2 (audio capture → `gpt-4o-mini-transcribe` via Express) |
| Composer attachments | same | NOT_CONNECTED | Out of scope this phase |
| Explain-like-I'm-new toggle | `workspace.tsx` | PARTIAL | Pass to server as `mode` |
| Locale toggle in header | same | NOT_CONNECTED | Phase-2 |
| Voice header button | same | NOT_CONNECTED | Phase-2 (same STT path as composer) |
| Escalate button | same | DONE | Links to `/app/emergency` |
| Conversation rendering | `workspace.tsx` | MOCKED | Replace `setTimeout` with real call |
| Response card actions: open-document | `response-card.tsx` | NOT_CONNECTED | Wire to `router.push(/app/library/...)` |
| Response card actions: start-incident | same | NOT_CONNECTED | Pre-fill `/app/incidents/new` query string |
| Response card actions: pin-quick-ref | same | NOT_CONNECTED, MISSING_BACKEND | POST `/api/quick-reference/pin` |
| Response card actions: share-internal | same | NOT_CONNECTED | Phase-2 |
| Response card actions: rephrase | same | NOT_CONNECTED | Re-submit with `rephrase=true` |
| Citations renderer | `response-blocks.tsx` | DONE | Already deep-links to `/app/library/{docId}#anchor` |

### Library (`/app/library`, `/app/library/[documentId]`)
| Element | File | Status | Notes |
|---|---|---|---|
| Document list | `library-browser.tsx` | MOCKED | RSC query `documents` filtered by tenant + status published/updated |
| Search box | same | PARTIAL | Client-side filter; should call `/api/library/search` once doc count grows |
| Type filters | same | DONE (logic) | Same data |
| Grid/list toggle | same | DONE | |
| Featured row (bookmarked + recently used by AI) | same | MOCKED | Computed from `document_bookmarks` + `recently_cited` view |
| Document card | `document-card.tsx` | DONE (presentational) | |
| Document viewer hero | `document-viewer.tsx` | MOCKED | From `documents` row |
| Document sections | same | MOCKED, MISSING_BACKEND | Add `document_sections` table |
| TopBar bookmark | same | NOT_CONNECTED | Toggles `document_bookmarks` row |
| TopBar download PDF | same | NOT_CONNECTED | Phase-2 (Supabase Storage signed URL) |
| TopBar share | same | NOT_CONNECTED | Phase-2 |
| TopBar "Ask about this" | same | NOT_CONNECTED | Routes to assistant with `documentId` context hint |
| Acknowledge block | same | NOT_CONNECTED, MISSING_BACKEND | Inserts `acknowledgements` row |
| On-this-page TOC | same | DONE | |
| Metadata sidebar | same | DONE | |
| Tags | same | MOCKED | From `documents.framework`/tags column |
| Related forms/FAQs | `library/[documentId]/page.tsx` | MOCKED, MISSING_BACKEND | Add `document_related` join table |

### Training (`/app/training`)
| Element | File | Status | Notes |
|---|---|---|---|
| Modules list | `app/training/page.tsx` | MOCKED, MISSING_BACKEND | New `training_modules` + `training_assignments` |
| Module progress bar | `module-card.tsx` | MOCKED | From assignment row |
| Induction stepper | `app/training/page.tsx` | MOCKED, MISSING_BACKEND | New `induction_steps` |
| Credentials list | same | MOCKED, MISSING_BACKEND | New `credentials` |
| Credential statuses | same | DONE (presentational) | Computed in DB or query |
| Open module CTA | `module-card.tsx` | NOT_CONNECTED | Phase-2: actual learning content |

### Incidents (`/app/incidents`, `/app/incidents/new`)
| Element | File | Status | Notes |
|---|---|---|---|
| Incidents list | `app/incidents/page.tsx` | MOCKED | RSC from `incidents` table (already exists in DB) |
| Empty state | same | DONE | |
| Incident row | `incident-row.tsx` | DONE | |
| New incident form fields (title, location, description, immediate actions, witnesses) | `incidents/new/page.tsx` | NOT_CONNECTED | Wire submit |
| Severity selector | same | DONE | |
| Category selector | same | DONE | |
| Submit | same | NOT_CONNECTED | POST `/api/incidents` (Express still owns this for AI suggestions) |
| Cancel/back | same | DONE | |
| Drafts | — | MISSING_BACKEND | Phase-2 (`incident_drafts` table) |

### Emergency (`/app/emergency`)
| Element | File | Status | Notes |
|---|---|---|---|
| Protocol cards | `protocol-card.tsx` | MOCKED, MISSING_BACKEND | New `emergency_protocols` |
| Protocol details | — | MISSING | No detail page yet; phase-2 |
| Drill schedule | `drill-schedule.tsx` | MOCKED, MISSING_BACKEND | New `emergency_drills` |
| Contacts list | `contacts.tsx` | MOCKED, MISSING_BACKEND | New `emergency_contacts` (per-tenant) |
| Phone tap-to-call | `contacts.tsx` | NOT_CONNECTED | Add `tel:` href |

### Quick Reference (`/app/quick-reference`)
| Element | File | Status | Notes |
|---|---|---|---|
| Pinned items list | `app/quick-reference/page.tsx` | MOCKED, MISSING_BACKEND | New `quick_reference_pins` |
| Pin from assistant | — | NOT_CONNECTED | Server action |
| Unpin | same | NOT_CONNECTED | Server action |

### Compliance (`/app/compliance`)
| Element | File | Status | Notes |
|---|---|---|---|
| Overall score, totals | `app/compliance/page.tsx` | MOCKED | Aggregated SQL view |
| Training/credentials progress bars | same | MOCKED | Same |
| Items list | same | MOCKED, MISSING_BACKEND | New `compliance_items` view (union of training + acknowledgements + credentials) |

### Feedback (`/app/feedback`)
| Element | File | Status | Notes |
|---|---|---|---|
| Category buttons | `app/feedback/page.tsx` | DONE (UI) | |
| Message textarea | same | DONE (UI) | |
| Submit | same | NOT_CONNECTED | POST `/api/feedback` → `feedback_submissions` |
| Surveys list integration | `home/broadcasts-surveys.tsx` | MOCKED | Real surveys table, link to survey runner (phase-2) |
| Safe-voice anonymous submission | — | MISSING | Add toggle on form; route to `safe_voice_submissions` |

### History (`/app/history`)
| Element | File | Status | Notes |
|---|---|---|---|
| Activity list | `app/history/page.tsx` | MOCKED, MISSING_BACKEND | New `activity_log` table appended by server actions |

### Profile (`/app/profile`)
| Element | File | Status | Notes |
|---|---|---|---|
| Avatar/initials | `app/profile/page.tsx` | DONE (presentational) | |
| Name / role / sector | same | MOCKED | From `profiles` |
| Site, shift, presence, last sync | same | MOCKED | From `profiles` + `staff_shifts` |
| Preference toggles (voice, accessibility, notifications, offline) | — | MISSING UI in production | Phase-2 — types exist, no form yet |

### Notifications
- Backed by new `notifications` table (per-user fan-out). Read-state per row.

### Auth flows
- `/login` (predefined-profile picker, staff only) — MISSING in production.
- Sign-out — NOT_CONNECTED in topbar profile menu.
- Session refresh middleware — MISSING.

---

## 4. Target Architecture for This Phase

### 4.1 Frontend
- **Single Next.js app** at `production/`. App Router. RSC by default.
- **Auth boundary**: `middleware.ts` at repo root refreshes the Supabase session cookie and redirects unauthenticated requests on `/app/**` to `/login`. Authenticated requests on `/login` redirect to `/app/home`.
- **Route groups**:
  - `(public)/login/` — predefined-profile picker.
  - `(app)/app/**` — staff app, protected, profile + notifications loaded in `(app)/layout.tsx` from Supabase.
- **State**: Server Components for all reads. Client Components for interactive widgets and mutations. **TanStack Query** for client-side caches (notifications poll, assistant turns, quick-reference toggles, library search).
- **Mutations**: Either Server Actions (for simple inline forms like incident submit, feedback, acknowledge, pin/unpin) or Route Handlers under `/api/**` (for assistant calls and complex flows). **No `fetch` to Supabase REST from the browser.**
- **api-contracts seam**: keep public surface; implementations:
  - Server-only contracts (used in RSC) call Supabase server client directly.
  - Client-only contracts (e.g. `AssistantApi.ask`) call internal Next.js Route Handlers.
- **Type safety**: generate Supabase types via `supabase gen types typescript --project-id … > src/lib/supabase/database.types.ts` and use them in the data layer.

### 4.2 Backend / App Server
- **Next.js Route Handlers** under `production/src/app/api/`:
  - `POST /api/rag/query` — verifies cookie, resolves `tenant_id`/`role`, forwards to Express RAG service, returns block-based `GuidanceResponse`.
  - `POST /api/incidents` — same pattern (forwards to Express to enrich with AI suggestions when allowed) OR direct Supabase insert + queued AI suggestion job (preferred — keeps Next.js as the only browser-facing surface).
  - `POST /api/feedback`, `POST /api/safe-voice`, `POST /api/acknowledgements`, `POST /api/quick-reference/pin`, `POST /api/quick-reference/unpin`, `POST /api/notifications/read`, `POST /api/document-bookmarks/toggle`, `GET /api/library/search`.
- **Express service** (`server/`) becomes private, accepts only authenticated requests from Next.js (shared secret header + JWT pass-through). Owns: chunking, embedding, retrieval, LLM, audit logging, HITL queue, golden-answer matching.

### 4.3 Supabase / Data / Auth
- Reuse all existing tables. Add the staff-domain tables listed in §9.
- Every new table: `tenant_id uuid not null references tenants(id) on delete cascade`, RLS enabled, SELECT/INSERT/UPDATE policies keyed by `current_user_tenant_id()` and (where appropriate) `id = auth.uid()` for user-owned rows.
- `profiles.role` constraint extended (or kept lax) to recognise the existing values plus the production `StaffRole` taxonomy via a separate `profiles.staff_role` column (`care-worker | registered-nurse | …`) so the prototype's coarse `role='staff'` continues to gate access while the staff app can use the finer-grained role for content filtering.
- `profiles.preferred_name`, `profiles.locale`, `profiles.sectors`, `profiles.primary_sector`, `profiles.presence`, `profiles.last_sync_at`, `profiles.avatar_url` added.
- `sites` table promoted (currently only `profiles.site_id uuid` with no FK target). `staff_shifts` added.
- pgvector retained at 3072 dims; `match_tenant_documents` already RLS-safe through `security definer` and explicit tenant filter.

### 4.4 RAG / Assistant
- **Pipeline (server)**:
  1. Verify caller (Next.js shared secret + Supabase JWT).
  2. Resolve `tenant_id`, `staff_role`, `sectors`, `site_id` from `profiles`.
  3. Try golden answers (`question_pattern` fuzzy match within tenant).
  4. Embed query (`text-embedding-3-large`, 3072 dims).
  5. Call `match_tenant_documents` with role/site filter and `min_similarity=0.2`.
  6. If empty → escalate, log, queue HITL, return policy-not-found block-based response.
  7. Else build context, call LLM with strict JSON system prompt, validate response.
  8. Map LLM JSON → block-based `GuidanceResponse`:
     - `summary` block from `answer`.
     - `steps` block from `steps[]` (with citation snippets resolved against retrieved chunks).
     - `citations` block from `citations[]` joined with chunk metadata (anchor, snippet, version, effectiveAt).
     - `warning` block when `requires_escalation=true` and not policy-not-found.
     - `escalation` block when `policy_not_found=true`.
     - `related-docs` block from top-K distinct `document_id`s that did not power citations.
     - `nextActions`: always include `ask-followup` (top suggested prompt for the intent), `open-document` (top citation), `pin-quick-ref`, `start-incident` (only if intent classifier flags incident), `rephrase`.
  9. Save audit log + activity log + (if escalation) HITL queue.
  10. Return `GuidanceResponse` with `confidence: 'high' | 'medium' | 'low'` (mapped from numeric 0–1 → ≥0.85 high, ≥0.7 medium, else low).
- **Frontend**: `AssistantWorkspace` posts to `/api/rag/query` with `{ text, mode, voice, contextHints }` and renders the returned `GuidanceResponse` directly. Streaming optional in phase-2.

### 4.5 Integration Boundaries
| Concern | Owner |
|---|---|
| Auth (sign-in, session, sign-out) | Next.js + Supabase Auth |
| Authorization (tenant + role gate) | Supabase RLS + Next.js `middleware.ts` |
| Profile / shift / preferences | Next.js RSC ↔ Supabase |
| Library list / detail / search | Next.js RSC ↔ Supabase (FTS index) |
| Acknowledgements | Server Action → Supabase |
| Incidents (read) | Next.js RSC ↔ Supabase |
| Incidents (write + AI suggestions) | Next.js Route Handler → Express (`/api/incidents`) → Supabase + RAG |
| Training / induction / credentials | Next.js RSC ↔ Supabase |
| Compliance | Next.js RSC ↔ Supabase view |
| Quick Reference pins | Server Action → Supabase |
| Notifications | Next.js RSC ↔ Supabase + Server Action for read-state |
| Activity / History | Next.js RSC ↔ Supabase |
| Surveys / Feedback / Safe-Voice | Server Action → Supabase |
| Emergency (read) | Next.js RSC ↔ Supabase (offline-cached client-side) |
| RAG | Next.js Route Handler → Express → OpenAI + Supabase |
| Document ingestion | Express (admin phase, but kept ready) |

### 4.6 Future-Safe Considerations (without overbuilding)
- All new tables already include `tenant_id` and (where useful) `site_id`, `created_by`, `updated_at`, `metadata jsonb`.
- A `feature_flags` row per tenant is added, even if unused now, for future staged rollout.
- `auth.users.app_metadata` will carry `role` and `tenant_id` mirrors so future edge functions can authorize without DB hops.
- Document storage: policy content stored inline in `documents` + `document_sections` for staff phase. A `document_versions` table is added for future admin phase versioning, but not used now.
- HITL queue and golden answers are already in DB; staff phase only consumes them — admin phase will manage them.

---

## 5. Feature-by-Feature Execution Plan

> For every feature: **Current** · **Gaps** · **Real source** · **Backend** · **Contract** · **State** · **Edge cases** · **Dependencies** · **Acceptance**.

### 5.1 Auth + Predefined-Profile Login
- **Current**: No `/login` route in production; prototype has the working flow.
- **Gaps**: Login page, middleware, session refresh, sign-out, RSC-aware Supabase clients.
- **Real source**: `auth.users` + `profiles`. Predefined IDs come from `prototype/app/login/page.tsx` and `supabase/seed.sql` (4 tenants).
- **Backend**:
  - Reuse `server/index.js` `POST /api/auth/create-test-user` for first-time provisioning. Lock CORS to `production` origin.
  - Add a Next.js Route Handler `POST /api/dev/ensure-staff-profile` that wraps the Express call, so the browser only talks to Next.js.
- **Contract**:
  ```ts
  // src/lib/auth/profiles-fixture.ts (staff-only)
  export interface StaffFixtureUser {
    id: string; tenant_id: string; tenant_name: string;
    email: string; password: 'test123';
    full_name: string;
  }
  export const STAFF_FIXTURE_USERS: StaffFixtureUser[] = [
    { id: '550e8400-...440011', tenant_id: '...440000', tenant_name: 'Sunrise Aged Care', email: 'staff@sunrise.test', password: 'test123', full_name: 'Staff - Sunrise Aged Care' },
    { id: '...440021', ... 'City General Hospital', email: 'staff@hospital.test', ... },
    { id: '...440031', ... 'Community Care Services', email: 'staff@community.test', ... },
    { id: '...440041', ... 'Mindful Health Clinic', email: 'staff@mindful.test', ... },
  ]
  ```
- **State**: Local form state; no global store needed.
- **Edge cases**: First sign-in requires user creation (Express call). Concurrent first-sign-ins on same email — Express handles "already registered" gracefully. Cookie domain mismatch in dev — set `NEXT_PUBLIC_SITE_URL`. Disable email confirmation in Supabase Auth settings for dev.
- **Dependencies**: Supabase Auth, prototype login logic, `server/index.js` create-test-user, RLS profile self-select policy.
- **Acceptance**: From `/login`, clicking any of the 4 staff cards results in an authenticated session, profile loaded, redirect to `/app/home`. Refreshing the page keeps session. Sign-out clears session and returns to `/login`.

### 5.2 App Shell (layout, topbar, sidebar, mobile, SOS, command palette)
- **Current**: All visual; data via `MOCK_PROFILE` and `MOCK_NOTIFICATIONS`.
- **Gaps**: Real profile + notifications fetch with auth.
- **Real source**: `profiles` (joined to `tenants`, `sites`), `notifications`.
- **Backend**: Supabase RSC queries in `(app)/layout.tsx`. No Express touch.
- **Contract**:
  ```ts
  ProfileApi.getMe(): Promise<ApiResult<StaffProfile>>
  // server impl:
  // const supabase = createServerComponentClient({ cookies })
  // const { data: { user } } = await supabase.auth.getUser()
  // const { data } = await supabase.from('profiles')...select('*, sites(*), staff_shifts(*)')
  ```
- **State**: RSC props; `mobileNavOpen` local; locale state currently local — persist via `POST /api/profile/preferences`.
- **Edge cases**: User with no profile row → server-side redirect to `/login` with toast; will not happen for fixture users because their profile is provisioned via Express.
- **Dependencies**: §5.1.
- **Acceptance**: Topbar shows the real preferred name, role label, site; notifications dropdown shows real unread count; locale changes persist across reload; sign-out works.

### 5.3 Home Dashboard (`/app/home`)
- **Current**: Renders 8 mock blocks.
- **Gaps**: Each block needs a real data source.
- **Real source**:
  - Welcome strip → `profiles` + `staff_shifts`.
  - Quick Ask suggested prompts → `assistant_suggested_prompts` (or static config selected by `staff_role`/`sector`).
  - Priority actions → `compliance_items` view (state ≠ complete, ordered by `dueAt`).
  - Compliance snapshot → aggregate query on `compliance_items` + `credentials` + `acknowledgements`.
  - Continue section → top-N rows of `activity_log` for current user.
  - Quick Reference grid → `quick_reference_pins` for current user.
  - Broadcasts → `notifications` where category = broadcast.
  - Surveys → `surveys` joined to `survey_assignments`.
- **Backend**: All RSC queries inside the page.
- **Contract**: Existing `*Api.list()`/`*Api.summary()` methods become real.
- **State**: RSC props.
- **Edge cases**: Empty states already designed. Slow site connectivity — RSC stream renders sections progressively.
- **Dependencies**: §9 schema additions; §5.2.
- **Acceptance**: Each panel reflects real DB state per signed-in tenant; cross-tenant content never appears.

### 5.4 Assistant (`/app/assistant`)
- **Current**: Posts to mock with `setTimeout`.
- **Gaps**: Real RAG call; voice/locale/share/rephrase wiring (some phase-2).
- **Real source**: Express `/api/rag/query` returning the production `GuidanceResponse`.
- **Backend**:
  - **Next.js Route Handler** `src/app/api/rag/query/route.ts`:
    1. `createRouteHandlerClient({ cookies })`, fail with 401 if no session.
    2. Read `profiles` for `tenant_id`, `role` (coarse), `staff_role`, `site_id`.
    3. POST `${INTERNAL_RAG_URL}/api/rag/query` with `{ user_id, tenant_id, role, site_id, query, mode, voice, contextHints }` and a shared-secret `X-Internal-Token`.
    4. Returns the JSON straight through (already block-shaped after the Express refactor below).
  - **Express refactor** in `server/ragService.js`:
    - Add `mapToGuidanceResponse(llm, retrieval, intent)` that produces the production-shaped JSON.
    - Add intent classification (lightweight rule + keyword: fall, medication, behaviour, infection, consent, handover) for `nextActions.start-incident` decision.
    - Add `confidenceLevel` mapping.
    - Add `auditLog.id` returned to the client to enable feedback.
- **Contract**:
  ```ts
  AssistantApi.ask(query: GuidanceQuery): Promise<ApiResult<GuidanceResponse>>
  // implementation: fetch('/api/rag/query', { method: 'POST', body: JSON.stringify(query) })
  ```
- **State**: TanStack Query mutation per turn; turns stored in component state.
- **Edge cases**:
  - LLM JSON parse failure — server returns `escalation` block.
  - Network error from Express → 502 from Next.js handler → UI shows retry.
  - Policy-not-found → response renders `escalation` block (already supported).
  - Voice / explain-mode flags propagate to server.
  - Citations whose `documentId` is not visible to current user — server filters out before returning.
- **Dependencies**: Express running, Supabase profile, `documents` + `document_chunks` populated.
- **Acceptance**: Asking the seeded "What should I do if a resident falls?" returns a block-based response with at least one citation that links to a real document in `/app/library/{id}#anchor`. Audit log row created. History page shows the turn.

### 5.5 Policy Library list (`/app/library`)
- **Current**: Mock list, client-side filter.
- **Gaps**: Real data; server-side search; bookmark + offline flags.
- **Real source**: `documents` filtered by tenant, `status in ('approved','published','updated')` and `effective_date <= now()` and (`expiry_date is null or expiry_date >= now()`). Plus per-user joins for `document_bookmarks`, `document_acknowledgements`, `recent_ai_citations`.
- **Backend**: RSC query. Search route handler `GET /api/library/search?q=` with FTS (`tsvector` on `title`, `tags`, `category`, `summary`). The command palette consumes the same handler.
- **Contract**: `LibraryApi.list({ q?, type?, sector? })`.
- **State**: RSC for first paint, TanStack Query for client-driven search.
- **Edge cases**: 0 documents (new tenant) → existing empty state; very large list → cursor pagination.
- **Dependencies**: `documents` already in DB; add `document_sections`, `document_bookmarks`, `recent_ai_citations` view.
- **Acceptance**: Library shows only this tenant's published documents; bookmark icon reflects per-user state; search returns hits across all visible documents.

### 5.6 Policy Detail (`/app/library/[documentId]`)
- **Current**: Renders `MOCK_DOCUMENT_DETAIL`.
- **Gaps**: Real document, sections, related, acknowledgement, bookmark toggle, "Ask about this" deep-link, download.
- **Real source**: `documents`, `document_sections`, `document_related`, `document_acknowledgements`, `document_bookmarks`.
- **Backend**: RSC query (page) + Server Actions (`acknowledgeDocument`, `toggleBookmark`).
- **Contract**: `LibraryApi.get(id)` returns `DocumentDetail` with `acknowledgementRequired` derived from policy ruleset (e.g. published policies in last 30d that require sign-off).
- **State**: RSC props + small client component for action buttons.
- **Edge cases**: Document not visible to user → 404 (RLS will return null). Acknowledgement already done → button disabled with timestamp.
- **Dependencies**: §5.5 + new `document_sections`, `document_bookmarks`, `document_acknowledgements`.
- **Acceptance**: Real sections render; "I acknowledge" inserts a row, hides button, logs activity, surfaces in compliance.

### 5.7 Training (`/app/training`)
- **Current**: Mock modules + induction + credentials.
- **Gaps**: Real schema and assignment per user.
- **Real source**: `training_modules`, `training_assignments` (per user), `induction_steps`, `induction_progress`, `credentials`.
- **Backend**: RSC queries per section.
- **Contract**: `TrainingApi.modules()`, `TrainingApi.induction()`, `TrainingApi.credentials()`.
- **State**: RSC.
- **Edge cases**: User with no assignments → empty state; expiring credentials surface in compliance + notifications.
- **Dependencies**: §9 new tables.
- **Acceptance**: Modules show real status, due dates, progress; induction reflects user's row; credentials show real expiry.

### 5.8 Incidents list + new (`/app/incidents`, `/app/incidents/new`)
- **Current**: List from mock; form does nothing on submit.
- **Gaps**: Wire submission and AI-suggested next steps; show timeline; retain attachments out of scope.
- **Real source**: `incidents` (already exists, extended with `reference`, `severity`, `category`, `location`, `description`, `immediate_actions`, `witnesses`, `notified_parties`, `attachments` jsonb, `timeline` jsonb, `ai_suggested_next_steps`, `follow_up_required`).
- **Backend**:
  - Submission: `POST /api/incidents` (Next.js Route Handler) → forwards to Express `/api/incidents`, which inserts and triggers RAG suggestions, then returns the full row.
  - List: RSC query on `incidents`.
- **Contract**: `IncidentsApi.list()`, `IncidentsApi.create(IncidentDraft)`.
- **State**: Form local state (controlled inputs); after submit, `router.push('/app/incidents/{ref}')` (detail page is phase-2; redirect to list with toast for now).
- **Edge cases**:
  - Submit without category/severity → client validation.
  - RAG call fails → row still saved, `ai_suggested_next_steps` left null.
  - High-severity incident → notification fan-out to team leader (phase-2).
- **Dependencies**: §5.4, schema extension to `incidents`.
- **Acceptance**: Incident appears in list within seconds of submit; reference number generated server-side (`INC-{yyyy}-{seq}` via DB sequence); AI suggestions populate when available; activity log entry created.

### 5.9 Emergency (`/app/emergency`)
- **Current**: Cards/contacts/drills from mock.
- **Gaps**: Real protocols, drills, contacts; offline cache.
- **Real source**: `emergency_protocols`, `emergency_protocol_steps`, `emergency_contacts`, `emergency_drills`.
- **Backend**: RSC; client stores protocols + contacts in IndexedDB on first load (Workbox). Phase-2 hardens offline.
- **Contract**: `EmergencyApi.protocols()/contacts()/drills()`.
- **State**: RSC; client cache for offline.
- **Edge cases**: Offline-first read from IDB if network unavailable. SOS button always reachable (already global).
- **Dependencies**: §9 schema additions.
- **Acceptance**: Protocols match tenant configuration; tap-to-call works on phone.

### 5.10 Quick Reference (`/app/quick-reference`)
- **Current**: Mock pins.
- **Gaps**: Real pins, pin/unpin from assistant + library + manual.
- **Real source**: `quick_reference_pins`.
- **Backend**: Server Actions `pinQuickRef`, `unpinQuickRef`.
- **Contract**: `QuickRefApi.list()/pin(input)/unpin(id)`.
- **State**: RSC for list; revalidate after action.
- **Edge cases**: Duplicate pin → unique index `(user_id, target_type, target_id)`.
- **Dependencies**: §9.
- **Acceptance**: Pinning from assistant response card immediately reflects on `/app/quick-reference` and on home grid.

### 5.11 Compliance (`/app/compliance`)
- **Current**: Mock summary + items.
- **Gaps**: Real aggregation.
- **Real source**: SQL view `staff_compliance_items` (union of acknowledgements + training_assignments + credentials with computed `state`) and view `staff_compliance_summary` (precomputed counts).
- **Backend**: RSC queries.
- **Contract**: `ComplianceApi.summary()/items()`.
- **State**: RSC.
- **Edge cases**: All complete → 100% with celebratory banner (phase-2 polish).
- **Dependencies**: §5.6, §5.7.
- **Acceptance**: Numbers match the underlying tables; clicking an item routes to the right resource.

### 5.12 Feedback (`/app/feedback`) + Surveys
- **Current**: UI only, no submission.
- **Gaps**: Wire submit; safe-voice anonymous flow; survey runner (phase-2).
- **Real source**: `feedback_submissions`, `safe_voice_submissions`, `surveys`, `survey_responses`.
- **Backend**: Server Actions; safe-voice writes with `user_id = null` if anonymous (record only `tenant_id`).
- **Contract**: `FeedbackApi.submitFeedback(input)`, `FeedbackApi.submitSafeVoice(input)`, `FeedbackApi.surveys()`.
- **State**: Form local; clear after submit.
- **Edge cases**: Anonymous toggle clears the user reference; Supabase RLS allows insert for any authenticated user but only with `tenant_id = current_user_tenant_id()`.
- **Dependencies**: §9.
- **Acceptance**: Both flows persist; only same-tenant admins can read in future phase.

### 5.13 History (`/app/history`)
- **Current**: Mock.
- **Gaps**: Real `activity_log` populated by every server action.
- **Real source**: `activity_log` table appended whenever the app does: ai-question, incident-submitted, training-completed, policy-acknowledged, quick-ref-pinned, credential-updated, survey-submitted, feedback-submitted.
- **Backend**: All write paths call `appendActivity(kind, title, targetId)` helper.
- **Contract**: `ActivityApi.list({ limit })`.
- **State**: RSC.
- **Acceptance**: Submitting an incident immediately appears at the top of the history list with the right kind icon.

### 5.14 Profile (`/app/profile`)
- **Current**: Mock.
- **Gaps**: Real profile; preference editing UI exists in types but not in UI — defer.
- **Real source**: `profiles` (extended) + `staff_shifts`.
- **Backend**: RSC read; Server Action `updateProfilePreferences` for what's in the topbar (locale).
- **Contract**: `ProfileApi.getMe()/updatePreferences(patch)`.
- **State**: RSC.
- **Acceptance**: Real fields render; persistence works for locale; sign-out works.

---

## 6. Demo Data Replacement Plan

| Mock import | Used in | Replacement |
|---|---|---|
| `MOCK_PROFILE` | `(app)/layout.tsx`, `home/welcome-strip`, `topbar`, `profile/page` | RSC query `profiles` joined to `sites` + `staff_shifts`; cached per request |
| `MOCK_NOTIFICATIONS` | `(app)/layout.tsx`, `topbar`, `home/broadcasts-surveys` | RSC query `notifications` for `auth.uid()` + tenant; client polls every 60s via TanStack Query |
| `MOCK_DOCUMENTS` | `command-palette.tsx`, `library/page.tsx`, `assistant/page.tsx` | `documents` RSC query; `GET /api/library/search` |
| `MOCK_DOCUMENT_DETAIL` | `library/[documentId]/page.tsx` | `documents` + `document_sections` + `document_related` |
| `SUGGESTED_PROMPTS` | `home/quick-ask.tsx`, `assistant` | `assistant_suggested_prompts` (per role/sector) — bootstrapped from current static list |
| `MOCK_CONVERSATION` | `assistant/page.tsx` | Removed (initialHistory = []); turns come from real RAG calls |
| `MOCK_TRAINING`, `MOCK_INDUCTION`, `MOCK_SIGNED_DOCS`, `MOCK_CREDENTIALS` | `training/page.tsx` | New tables (§9) |
| `MOCK_COMPLIANCE_*` | `compliance/page.tsx`, `home/priority-actions`, `home/compliance-snapshot` | `staff_compliance_items` + `staff_compliance_summary` views |
| `MOCK_INCIDENTS` | `incidents/page.tsx` | `incidents` table |
| `MOCK_PROTOCOLS`, `MOCK_DRILLS`, `MOCK_CONTACTS` | `emergency/page.tsx` | New tables (§9) |
| `MOCK_QUICK_REFS` | `home/quick-ref-grid.tsx`, `quick-reference/page.tsx` | `quick_reference_pins` |
| `MOCK_ACTIVITY` | `home/continue-section.tsx`, `history/page.tsx` | `activity_log` |
| `MOCK_SURVEYS`, `MOCK_SAFE_VOICE` | `home/broadcasts-surveys`, `feedback/page.tsx` | `surveys`, `safe_voice_submissions` |

**Migration approach**:
1. Add new schema (§9) idempotent SQL.
2. Seed each tenant with reference data (emergency protocols/contacts, training catalog, suggested prompts).
3. Implement `/lib/data/*.ts` modules — one per domain — that mirror the mock shape exactly so existing UI code does not change.
4. Switch `api-contracts/index.ts` to import from `lib/data` instead of `lib/mock-data`.
5. Move `lib/mock-data/*` to `tests/__fixtures__/`. Add an ESLint rule banning imports from `tests/` in `src/`.
6. Delete the `MOCK_DOCUMENTS` import in `command-palette.tsx`; replace with a passed-in prop or a client-side debounced fetch to `/api/library/search`.

---

## 7. Auth + Staff Profile Login Plan

### 7.1 Reused Fixtures (verbatim from prototype)
Filtered to staff role only (4 users), unchanged IDs and password:
- Sunrise Aged Care · `staff@sunrise.test` · `test123` · profile `550e8400-e29b-41d4-a716-446655440011` · tenant `…440000`
- City General Hospital · `staff@hospital.test` · `test123` · profile `…440021` · tenant `…440001`
- Community Care Services · `staff@community.test` · `test123` · profile `…440031` · tenant `…440002`
- Mindful Health Clinic · `staff@mindful.test` · `test123` · profile `…440041` · tenant `…440003`

### 7.2 Implementation Steps
1. Create `production/src/app/(public)/login/page.tsx` that mirrors the prototype's grid UI but uses production design tokens. **Do not invent new credentials.**
2. Add `production/src/lib/supabase/{client,server,route}.ts` (browser, RSC, route handler clients) using `@supabase/auth-helpers-nextjs`.
3. Add `production/middleware.ts`:
   - `createMiddlewareClient`, `await supabase.auth.getSession()`.
   - If `pathname.startsWith('/app')` and no session → redirect `/login`.
   - If `pathname === '/login'` and session → redirect `/app/home`.
4. Click handler: try `supabase.auth.signInWithPassword({ email, password })`. On `Invalid login credentials`, call `POST /api/dev/ensure-staff-profile` (Next.js wrapper around Express `POST /api/auth/create-test-user`) then retry sign-in.
5. After successful sign-in, `router.push('/app/home')`. Server-side, `(app)/layout.tsx` loads the profile.
6. Topbar profile menu "Sign out" calls `supabase.auth.signOut()` and `router.push('/login')`.
7. Disable email confirmations in Supabase Auth dashboard for the dev environment.
8. `staff_role` (production type) is derived from a deterministic mapping `email → staff_role`; for the four fixture staff we set `registered-nurse` (matches the design-time profile). Stored in `profiles.staff_role`.

### 7.3 Dev/Test Safety
- Predefined login is gated by `process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'`. In production builds it's hidden behind a real email/password login (admin phase).
- `POST /api/dev/ensure-staff-profile` returns 403 unless the same env flag is set, so it cannot create users in production environments.
- All four fixture staff are seeded in `seed.sql`; in non-dev environments they simply do not exist.

### 7.4 Future Evolution
- Phase-2: real org SSO, MFA, and email/password sign-in screen alongside the dev picker.
- Phase-3: device binding for staff PIN sign-in on shared devices.

---

## 8. Backend / API / Service Plan

### 8.1 Next.js Route Handlers (kept in `production/src/app/api/`)
| Route | Method | Owner of side-effects | Notes |
|---|---|---|---|
| `/api/rag/query` | POST | Express (proxied) | Verifies session, resolves tenant/role, forwards to Express |
| `/api/incidents` | POST | Express (proxied) | Inserts incident + AI suggestions |
| `/api/library/search` | GET | Supabase | FTS over `documents` |
| `/api/document-bookmarks/toggle` | POST | Supabase | Toggle row |
| `/api/acknowledgements` | POST | Supabase | Insert row, append activity |
| `/api/quick-reference/pin` | POST | Supabase | Insert row, append activity |
| `/api/quick-reference/unpin` | POST | Supabase | Delete row |
| `/api/notifications/read` | POST | Supabase | Mark as read |
| `/api/feedback` | POST | Supabase | Insert row |
| `/api/safe-voice` | POST | Supabase | Insert row (anonymous handled) |
| `/api/profile/preferences` | PATCH | Supabase | Update `profiles` |
| `/api/dev/ensure-staff-profile` | POST | Express (proxied) | Dev only |

All handlers:
- Use `createRouteHandlerClient({ cookies })`.
- 401 if unauthenticated; 403 if tenant mismatch.
- Return `ApiResult<T>`.
- Append to `activity_log` where applicable.
- Use `zod` schemas (new dep) for request validation.
- Errors logged with structured fields (`request_id`, `route`, `user_id`, `tenant_id`).

### 8.2 Express Service (`server/`) refactor
- Add `requireInternalAuth` middleware: validates `X-Internal-Token` (shared secret) and forwards `Authorization: Bearer <jwt>` for downstream Supabase use.
- Replace direct `tenant_id` from body with re-resolution from JWT to prevent forgery (defence in depth).
- Lock CORS to the `production` origin.
- Add `pino` (or `console` JSON) structured logging.
- `mapToGuidanceResponse(...)`: pure function with unit tests; returns the production block-based shape.
- Keep `/api/documents/process`, `/api/golden-answers`, `/api/onboarding/setup`, `/api/hitl/:id/approve` as-is for the future admin phase, but place behind `requireInternalAuth`.

### 8.3 Removed / Deprecated
- `/api/auth/create-test-user` — keep for dev only; gate by env flag.
- Frontend never calls Express directly anymore.

### 8.4 Logging / Audit / Errors
- Every RAG call → `rag_audit_logs` (already there).
- Every staff-impacting write → `activity_log` (new).
- App-level errors → console JSON + Supabase `error_log` (optional, can defer).
- Rate limiting: simple in-memory token bucket per `user_id` on `/api/rag/query` (configurable). Phase-2 → Upstash.

---

## 9. Data Model / Supabase Plan

### 9.1 Existing tables to keep (with extensions)
- `tenants` — keep as-is.
- `profiles` — add columns: `preferred_name text`, `staff_role text`, `sectors text[] default '{}'`, `primary_sector text`, `locale text default 'en-AU'`, `presence text check (presence in ('available','in-care','break','offline')) default 'available'`, `last_sync_at timestamptz`, `avatar_url text`. Keep existing `role` for coarse gating (`staff` / `organisation_admin`).
- `documents` — add columns: `category text`, `pillar text`, `tags text[]`, `summary text`, `short_title text`, `acknowledgement_required boolean default false`, `offline_available boolean default false`, `emergency_related boolean default false`, `estimated_read_minutes int`, `roles_relevant text[]`. Add FTS column `search_tsv tsvector` + trigger. **Policy content stored inline in `documents.summary` and `document_sections.body` for staff phase.**
- `document_chunks`, `rag_audit_logs`, `hitl_queue`, `golden_answers`, `incidents` — keep as-is, with `incidents` extended (see §5.8).

### 9.2 New tables (DDL outline)
```sql
-- Sites & shifts
sites (id uuid pk, tenant_id fk, name text, address text, code text, created_at timestamptz default now())
staff_shifts (id uuid pk, tenant_id fk, profile_id fk profiles(id), starts_at timestamptz, ends_at timestamptz, label text)

-- Library extensions
document_sections (id uuid pk, tenant_id fk, document_id fk documents, anchor text, title text, body text, ord int)
document_related (document_id fk, related_id text, related_type text, title text, primary key(document_id, related_id))
document_bookmarks (profile_id fk, tenant_id fk, document_id fk, created_at, primary key(profile_id, document_id))
document_acknowledgements (id uuid pk, tenant_id fk, profile_id fk, document_id fk, version text, signed_at timestamptz default now())

-- Training & compliance
training_modules (id uuid pk, tenant_id fk, title text, type text, category text, duration_minutes int,
                  required boolean default false, roles_relevant text[], linked_policy_id uuid references documents(id))
training_assignments (id uuid pk, tenant_id fk, profile_id fk, module_id fk training_modules,
                      status text check (status in ('not-started','in-progress','completed','overdue','due-soon')) default 'not-started',
                      progress_percent int default 0, due_at timestamptz, completed_at timestamptz)
induction_steps (id uuid pk, tenant_id fk, ord int, title text, type text, duration_minutes int)
induction_progress (profile_id fk, step_id fk, status text default 'upcoming', primary key(profile_id, step_id))
credentials (id uuid pk, tenant_id fk, profile_id fk, name text, issuer text, number text,
             issued_at date, expires_at date, status text, required boolean default false, file_path text)

-- Acknowledgements/compliance views
create view staff_compliance_items as ...
create view staff_compliance_summary as ...

-- Quick reference
quick_reference_pins (id uuid pk, tenant_id fk, profile_id fk, kind text, title text, subtitle text,
                      target_type text, target_id text, target_url text, pinned_at timestamptz default now(),
                      unique(profile_id, target_type, target_id))

-- Notifications
notifications (id uuid pk, tenant_id fk, profile_id fk, category text, level text, title text, body text,
               at timestamptz default now(), read boolean default false, href text, action_label text)

-- Activity
activity_log (id uuid pk, tenant_id fk, profile_id fk, kind text, at timestamptz default now(),
              title text, meta text, target_id text)

-- Surveys & feedback
surveys (id uuid pk, tenant_id fk, title text, description text, status text, question_count int,
         estimated_minutes int, anonymous boolean, closes_at timestamptz, completed_at timestamptz)
survey_assignments (survey_id fk, profile_id fk, completed_at timestamptz, primary key(survey_id, profile_id))
survey_responses (id uuid pk, tenant_id fk, survey_id fk, profile_id fk null, answers jsonb, submitted_at timestamptz default now())
feedback_submissions (id uuid pk, tenant_id fk, profile_id fk, category text, message text, submitted_at timestamptz default now())
safe_voice_submissions (id uuid pk, tenant_id fk, profile_id fk null, category text, message text, anonymous boolean,
                        status text default 'received', submitted_at timestamptz default now())

-- Emergency
emergency_protocols (id uuid pk, tenant_id fk, category text, title text, short_label text,
                     description text, offline_available boolean default true, last_synced_at timestamptz default now())
emergency_protocol_steps (id uuid pk, protocol_id fk, ord int, title text, detail text, caution text)
emergency_protocol_documents (protocol_id fk, document_id fk, primary key(protocol_id, document_id))
emergency_contacts (id uuid pk, tenant_id fk, label text, role text, phone text, is_primary boolean default false)
emergency_drills (id uuid pk, tenant_id fk, title text, conducted_at timestamptz, outcome text)

-- Assistant suggested prompts (replaces SUGGESTED_PROMPTS)
assistant_suggested_prompts (id uuid pk, tenant_id fk null, scope_role text null, scope_sector text null,
                             label text, intent text, icon_key text)

-- Optional future-safe
feature_flags (tenant_id fk pk, flags jsonb default '{}')
```

### 9.3 RLS Policies (new tables)
- SELECT: `tenant_id = current_user_tenant_id()` AND (where personal) `profile_id = auth.uid()`.
- INSERT: same; for `safe_voice_submissions` the `profile_id` may be `null` if `anonymous=true` and the row's `tenant_id` matches.
- UPDATE: only on personal rows (`profile_id = auth.uid()`) for `notifications`, `quick_reference_pins`, `induction_progress`, `training_assignments` (limited fields), `document_bookmarks`, `staff_shifts` (read-only for staff).
- DELETE: only `quick_reference_pins` and `document_bookmarks` for self.
- Admin-only tables (e.g. inserting a `training_module`) deny staff INSERT/UPDATE.

### 9.4 Profile / Session Loading Strategy
- `(app)/layout.tsx` runs once per request; it fetches `profiles` joined to `sites` and the most recent `staff_shifts` row (today's), plus `notifications` (unread top 10).
- Client components receive props; client only re-fetches notifications via TanStack Query polling.

### 9.5 Migration Path from Current Mock to DB
1. Apply `schema.sql` + new DDL to the existing Supabase project.
2. Run new `seed.sql` extension that inserts:
   - 4 sites (one per tenant) keyed to the same UUIDs.
   - Today's shift for each fixture staff user.
   - The current static suggested prompts.
   - Emergency contacts (`000`, on-call, facility manager) per tenant.
   - 5 emergency protocols per tenant (fire, medical, aggression, incident-sirs, facility) using current mock content.
   - 5 documents per tenant including required `document_sections` (use existing `MOCK_DOCUMENT_DETAIL` content).
   - 5 training modules per tenant + 1 induction (5 steps).
   - 1 sample acknowledgement, 1 sample bookmark, a couple of activity rows so the home empty-state isn't always shown.
3. Update Supabase TypeScript types and import them in `lib/data`.
4. Remove all runtime imports of `MOCK_*`.

---

## 10. Implementation Phasing

### Phase 1 — Foundation (must come first)
1. Add `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `zod`, `@tanstack/react-query` to `production/package.json`.
2. Add Supabase clients (`browser`, `server`, `route`, `middleware`).
3. Add `middleware.ts` and `(public)/login` route.
4. Add `(app)/layout.tsx` profile + notifications fetch.
5. Apply schema extensions and new tables to Supabase.
6. Generate and commit `database.types.ts`.
7. Implement `lib/data/profile.ts`, `lib/data/notifications.ts`. Wire `ProfileApi`/`NotificationsApi` to them. Replace mock imports in `(app)/layout.tsx` and topbar.
8. Implement sign-out and profile menu wiring.
9. Bring up Express in dev and confirm `/health` is reachable from Next.js dev process (`NEXT_PUBLIC_API_URL`).

**Exit gate**: All four fixture staff can log in, see their real profile in the topbar, and see no mock data in the layout.

### Phase 2 — Library + Assistant + Incidents (parallelizable)
- 2A: Library list + detail + bookmarks + acknowledgements + search.
- 2B: Assistant route handler + Express response refactor + assistant workspace integration.
- 2C: Incidents list + new + Express forwarding + AI suggestions.

**Exit gate**: An incident can be reported; the assistant returns a real cited answer; the library shows real documents.

### Phase 3 — Compliance, Training, Emergency, Quick Ref, Activity
Sequenced because some depend on Phase 2 (e.g. compliance reads acknowledgements).
- 3A: Training schema + page integration.
- 3B: Compliance views + page integration + home priority actions + compliance snapshot.
- 3C: Emergency protocols/contacts/drills + page.
- 3D: Quick reference pins (assistant + library + manual).
- 3E: Activity log appended by all writes; history page real.

**Exit gate**: Home page shows zero mock data.

### Phase 4 — Surveys, Feedback, Safe-Voice, Notifications polling
- Wire feedback form, safe-voice anonymous flow, surveys list. Notifications polling every 60s.

**Exit gate**: Every visible UI element is functional.

### Phase 5 — Hardening
- Rate limit `/api/rag/query`; structured logs; remove dead code; e2e tests with Playwright covering login → ask → cite → start incident → acknowledge policy → pin to quick reference → see in history.
- Add Express endpoint `POST /api/voice/transcribe` for `gpt-4o-mini-transcribe` integration (client-side audio capture → Express → OpenAI Whisper API).

---

## 11. Risk & Gap Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| Cross-tenant data leak through a missed RLS policy | Critical | Add RLS to every new table; CI test that runs queries as fixture users from different tenants and asserts isolation |
| Express service exposed without auth | Critical | Shared-secret + JWT verification + locked CORS; firewall in deploy |
| RAG returns invalid JSON | High | Already handled by `response_format: json_object`; add server-side schema validation; on parse failure return escalation block |
| Citations point to documents not visible to the user | High | Server filters citations by `match_tenant_documents` results before returning |
| Mock import sneaks back into runtime | Medium | ESLint rule banning `@/lib/mock-data` outside tests |
| Unbounded vector search cost | Medium | `min_similarity=0.2`, `match_count=8`, ivfflat index where possible |
| Predefined login enabled in production deploy | Critical | Env-flag gate; CI check that `NEXT_PUBLIC_ENABLE_DEV_LOGIN` is unset on production builds |
| Profile mismatch on first login | Medium | Express `ensure-staff-profile` is idempotent and only acts on the 4 fixture emails |
| Schema drift between UI types and DB | High | Generate Supabase types and use them in `lib/data`; `lib/data` adapters return `@/types` shapes; one place to keep in sync |
| Embedding model change | Medium | Already migrated to 3072 dims; document model version in audit log |
| Audit log size growth | Low | TTL job for `rag_audit_logs` older than N months (admin phase) |
| RAG service downtime breaks assistant | Medium | Next.js handler returns a graceful escalation block, UI shows retry button |
| Activity log writes failing silently | Medium | Wrap appender in try/catch with structured warn; do not block primary action |

---

## 12. Acceptance Criteria for the Staff Phase

1. **Auth**: All four fixture staff can sign in from `/login`, no mock profiles served. Sign-out works and persists across reload.
2. **Tenant isolation**: A staff user from tenant A cannot see any row from tenant B for any feature, verified by automated RLS tests.
3. **Home**: Every panel renders real data; empty states only when DB is genuinely empty.
4. **Assistant**: A query returns a block-based response with at least one valid citation linking to a real document; audit log row created; activity log row created; rephrase/follow-up/open-document/start-incident actions all functional; pin-to-quick-ref persists.
5. **Library**: List shows only published/updated docs for the tenant; detail page shows real sections from DB; bookmark toggling persists; acknowledgement persists and surfaces in compliance.
6. **Incidents**: New incident form persists to DB, reference number generated, AI-suggested next steps populate when available, list and history reflect immediately.
7. **Training/Compliance/Credentials**: Reflect real DB rows; computed `state` is correct (`overdue`, `due-soon`, `complete`).
8. **Emergency**: Protocols, drills, contacts come from DB; tap-to-call works; offline cache loads protocols when offline.
9. **Quick Reference**: Pins from assistant and library appear here; unpinning persists.
10. **Feedback / Safe-Voice / Surveys**: Submissions persist; anonymous safe-voice rows have null `profile_id`.
11. **History**: Records every staff-impacting write within the same session.
12. **Profile**: Real fields render; locale switch persists.
13. **No remaining demo data**: ESLint passes the no-mock-import rule; grep confirms no `MOCK_` import in `src/`.
14. **Performance**: First contentful paint of `/app/home` < 1500ms on local dev with 8 fixture rows per table.
15. **Build**: `next build` and `tsc --noEmit` clean. `npm run lint` clean.
16. **Documentation**: README updated with: how to run Supabase migrations, how to seed staff fixtures, how to enable dev login, how to run Express + Next together.

---

## 13. Open Questions / Decisions Needed

1. **Streaming RAG responses?** Recommended phase-2; this phase returns whole responses for simplicity.
2. **`ENABLE_DEV_LOGIN` strategy in non-local environments?** Confirm we keep it on for staging only and off in production.
3. ~~**Voice input** — Web Speech API or a server-side STT? Default plan: Web Speech API in phase-2, no work in this phase except the toggle wiring.~~ **DECIDED:** Use `gpt-4o-mini-transcribe` for audio → text conversion in phase-2. Audio captured client-side, sent to Express endpoint which calls OpenAI Whisper API.
4. ~~**Document storage** — keep policy bodies inline in `documents`/`document_sections` or move to Supabase Storage with extracted text? For staff phase, inline is sufficient. Admin ingestion phase will switch to Storage + extraction.~~ **DECIDED:** Keep policy content inline in `documents` + `document_sections` tables for staff phase. Content remains readable and searchable without external storage complexity.
5. **Time zone handling** — DB stores `timestamptz`, UI formats per `profiles.locale`; AU only for now. Confirm or proceed.
6. **Notifications fan-out** — written by server actions explicitly for this phase (no triggers). DB triggers can be added in phase-2 once patterns stabilise.

---

*End of plan.*

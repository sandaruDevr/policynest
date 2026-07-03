# CareSuite AI - Tenant-Isolated RAG Compliance Platform

A production-ready prototype of a tenant-isolated RAG-based compliance and policy guidance platform for regulated organisations (Aged Care, NDIS, Healthcare).

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Node.js/Express server for RAG orchestration
- **Database**: Supabase (PostgreSQL with pgvector)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI-compatible API (embeddings + chat completion)

## Features

### Strict Tenant Isolation
- Each tenant has isolated documents, chunks, embeddings, users, and audit logs
- Row Level Security (RLS) policies enforce tenant boundaries
- Server-side tenant validation on all operations

### RAG System
- Document ingestion with chunking and embedding generation
- Vector similarity search using pgvector
- Golden Answers for high-confidence reusable responses
- HITL (Human-in-the-Loop) review queue for low-confidence answers
- Citation validation and step-by-step answers

### User Roles
- **organisation_admin**: Full access to document management, RAG testing, audit logs, HITL review
- **staff**: AI assistant access, policy library, incident reporting

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (or compatible)

### 2. Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and execute the schema from `supabase/schema.sql`
3. Enable the required extensions (vector, pgcrypto) - included in schema
4. Get your credentials:
   - Project URL
   - Anon Key
   - Service Role Key (for server only)

### 3. Environment Configuration

Create `.env` file in root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4-turbo-preview
DEV_MODE=true
```

Create `server/.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4-turbo-preview
PORT=3001
```

### 4. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 5. Run the Application

Terminal 1 - Start the backend server:
```bash
cd server
npm start
```

Terminal 2 - Start the Next.js frontend:
```bash
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Testing the Prototype

### 1. Create Organisation
1. Sign up at http://localhost:3000/signup
2. Create organisation on onboarding page
3. Select "organisation_admin" role

### 2. Upload Sample Document
1. Go to Admin Dashboard → Documents
2. Click "Upload Document"
3. Use this sample content:

```
Falls Management Policy v1.0

Section 1: Immediate Response
If a resident falls, staff must stay with the resident and check for immediate danger. Staff must not move the resident unless there is an immediate safety risk. Staff must call the Registered Nurse or supervisor immediately.

Section 2: Observation
Staff should observe and record visible injuries, pain, consciousness, and mobility concerns. Clinical assessment must be completed by an authorised nurse or clinical staff member.

Section 3: Reporting
All falls must be documented using the Incident Report Form before the end of the shift. Serious injury or suspected serious injury must be escalated to the Clinical Manager immediately.

Section 4: Family and Management Notification
The Registered Nurse or Clinical Manager is responsible for determining whether family notification, management escalation, or external reporting is required.
```

4. Fill in metadata:
   - Title: Falls Management Policy
   - Document Type: Policy
   - Sector: Aged Care
   - Framework: Aged Care Quality Standards
   - Risk Level: High
5. Click "Upload & Process"

### 3. Test RAG Query
1. Go to Admin Dashboard → RAG Playground (or use Staff AI Assistant)
2. Ask: "What should I do if a resident falls?"
3. Expected response: Step-by-step guidance with citations

### 4. Create Staff User (Optional)
1. Sign up with a different email
2. During onboarding, select "staff" role
3. Login as staff to test restricted access

## Key Files

### Frontend
- `src/app/` - Next.js app router pages
- `src/components/` - Reusable UI components
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/types.ts` - TypeScript type definitions

### Backend
- `server/index.js` - Express server with API endpoints
- `server/ragService.js` - RAG orchestration logic
- `server/documentProcessor.js` - Document chunking and embedding
- `server/openai.js` - OpenAI API integration
- `server/rulesEngine.js` - Rules and escalation logic
- `server/supabase.js` - Supabase admin client

### Database
- `supabase/schema.sql` - Complete database schema with RLS policies

## API Endpoints

### Backend Server (Port 3001)

- `POST /api/documents/process` - Process document into chunks and embeddings
- `POST /api/rag/query` - Execute RAG query with tenant isolation
- `POST /api/incidents` - Create incident with optional AI suggestions
- `POST /api/golden-answers` - Create golden answer
- `POST /api/hitl/:id/approve` - Approve/correct HITL queue item

## Security Features

1. **Tenant Isolation**: All queries filtered by tenant_id
2. **Row Level Security**: Database-level access control
3. **Service Role Key**: Only used on server, never exposed to frontend
4. **Role-Based Access**: Different dashboards for admin vs staff
5. **Escalation Logic**: Low-confidence answers require human review

## Acceptance Criteria

✅ Admin can create organisation
✅ Admin can upload/create policy document
✅ Admin can process document into chunks and embeddings
✅ Admin can publish document
✅ Staff can ask question
✅ RAG retrieves only staff tenant's published document chunks
✅ AI returns cited answer
✅ If no source found, AI returns escalation fallback
✅ Every AI interaction saved in audit logs
✅ Admin can view audit logs
✅ Low-confidence answers appear in HITL queue
✅ Admin can create Golden Answer
✅ Staff and admin see different dashboards
✅ Tenant isolation is preserved

## Future Enhancements

- PDF/DOCX file parsing
- Advanced NDIS/SIRS rule engine
- Restrictive Practice authorisation workflows
- State-based compliance rules
- Real-time notifications
- Advanced analytics dashboard
- Multi-language support
- Version control for documents

## License

MIT License - Prototype for demonstration purposes.

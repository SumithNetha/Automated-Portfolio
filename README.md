# AI-Powered, Self-Updating Personal GitHub Portfolio

An evidence-driven, single-owner portfolio platform that automatically monitors authorized GitHub repositories, analyzes commits upon each push, classifies technical content, and continuously maintains a public developer portfolio without requiring manual website updates.

---

## 1. What the Application Does

Whenever you push code to an authorized GitHub repository, this system automatically:
1. **Detects the Push:** Securely receives the GitHub webhook and verifies its HMAC SHA-256 signature.
2. **Contextual Analysis:** Inspects changed files, commit messages, repository directory structure, manifests, and documentation (e.g., Cisco IOS configurations, Packet Tracer topologies, Terraform modules, or full-stack React/Node source code).
3. **Holistic Understanding:** Treats each repository as a cohesive body of work. For example, a CCNA repository is categorized as a comprehensive networking laboratory covering VLANs, 802.1Q trunks, OSPFv2, NAT, and ACLs, rather than creating disjointed portfolio posts for every daily commit.
4. **Secret Protection:** Automatically scans files and outputs for leaked credentials (e.g., AWS keys, GitHub PATs, private keys, database URLs). Sensitive content immediately blocks automatic publication and records redacted alerts.
5. **Idempotent Updates:** Updates the existing portfolio project rather than generating duplicate entries.
6. **Owner Overrides:** Manual edits made in the private Admin Dashboard are locked so future automated push analyses never overwrite custom curated descriptions.
7. **Instant Publication:** Eligible, high-confidence updates become immediately available on the responsive public website.

---

## 2. Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │                   GitHub Repository                     │
   │           (Push Event / New Commit / Webhook)           │
   └────────────────────────────┬────────────────────────────┘
                                │ HMAC SHA-256 Webhook
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                     Backend API                         │
   │  • Webhook Signature Verification (HMAC SHA-256)       │
   │  • Delivery Idempotency Check                           │
   │  • Monitored Repository Authorization                   │
   │  • MongoDB-Backed Asynchronous Job Queue                │
   └────────────────────────────┬────────────────────────────┘
                                │
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │               Analysis & AI Pipeline                    │
   │  • Change Significance Filter (ignores trivial typos)   │
   │  • Credential & Secret Scanner (Redacted alerts)        │
   │  • Deterministic Category Classification                │
   │  • AI Evidence Synthesis (Mock / OpenAI / Gemini)       │
   │  • Structured Zod Output Validation                     │
   └────────────────────────────┬────────────────────────────┘
                                │
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                    MongoDB Storage                      │
   │  • Preserves Manual Override Locks                      │
   │  • Stale-Job Protection (prevents out-of-order writes)  │
   │  • Maintains Last-Known-Good Published State            │
   └────────────────────────────┬────────────────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │      Public Website       │ │  Private Admin Dashboard  │
   │ • React + Vite + Tailwind │ │ • Single-Owner Auth (JWT) │
   │ • Responsive Project Grid │ │ • Repo Monitor Controls   │
   │ • CCNA & Labs Spotlight   │ │ • Manual Override Editor  │
   │ • Evidence-Verified Modal │ │ • Review Queue & Jobs Log │
   └───────────────────────────┘ └───────────────────────────┘
```

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6.
- **Backend:** Node.js, Express, TypeScript, Zod, Mongoose, Helmet, Cookie-Parser, JWT, Bcrypt.
- **Database:** MongoDB (external URI supported, with built-in zero-config in-memory MongoDB for local dev and testing).
- **AI Abstraction:** Configurable multi-provider architecture supporting Mock (offline/zero-cost), OpenAI (gpt-4o-mini), and Gemini (gemini-1.5-flash).

---

## 3. Quick Start (Zero-Setup Local Mode)

The repository is configured for out-of-the-box local execution. If `MONGODB_URI` is set to `memory` (or left blank), an embedded in-memory MongoDB server starts automatically, and the Mock AI Provider generates deterministic, evidence-grounded portfolio entries without needing external API keys.

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```

- **Public Portfolio:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Direct Admin Route:** [http://localhost:5173/admin](http://localhost:5173/admin) (or `/login`)

---

## 4. Admin Console & Management Portal

> [!NOTE]
> **Why is there no "Admin" button on the public portfolio?**
> The direct Admin link is intentionally **hidden from the public navigation** so recruiters and visitors experience a clean, distraction-free portfolio. The owner accesses the administrative dashboard by navigating directly to `/admin` or `/login`.

### Accessing the Admin Console
- **Direct URL:** `http://localhost:5173/admin` (redirects to `/login` if not authenticated)
- **Login Credentials:**
  - **Email:** Set via `ADMIN_EMAIL` in `.env` (Default: `admin@example.com`)
  - **Password:** Set via `ADMIN_PASSWORD` in `.env` (Default: `admin-secure-initial-password-123!`)
- **Authentication:** Protected by single-owner signed JWT tokens stored securely in HTTP-only cookies and local session state.

### Key Admin Capabilities
1. **Dynamic Resume Upload & Management:**
   - Upload updated PDF resume files at any time via file picker or drag-and-drop.
   - Uploaded resumes automatically become the active download file across the portfolio without code redeployments.
   - Real-time preview of the current resume with file size and update timestamp.
2. **Profile & Telemetry Customization:**
   - Modify display name, role headlines, engineering summary, LinkedIn URL, and contact email.
   - Toggle publication policies (e.g., *Auto-Publish Confident Repositories*, *Block Private Repositories by Default*).
3. **Repository Monitor Controls:**
   - Authorize new GitHub repositories to monitor for webhook push events.
   - View your unique webhook payload URL (`http://<your-host>/api/webhooks/github`) and HMAC secret.
4. **Manual Override Locks:**
   - Edit AI-generated project titles, descriptions, architectural highlights, and live demo URLs.
   - Marking a project field as "Manual Override" locks it permanently against automated GitHub push overwrites.
5. **Review Queue & Audit Trail:**
   - Inspect pending project updates from private or low-confidence repositories before publishing.
   - Review immutable system audit logs showing webhook deliveries, secret scan results, and AI classifications.

---

## 5. Environment Variables (`.env`)

Copy `.env.example` to `.env` in the root or `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development
APP_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Database (Use 'memory' for zero-setup local dev/test or your MongoDB Atlas URI)
MONGODB_URI=memory

# Admin Authentication
SESSION_SECRET=a-very-secure-random-secret-key-min-32-chars
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin-secure-initial-password-123!

# GitHub Integration
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_yourTokenHere
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# AI Provider ("mock", "openai", or "gemini")
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=gpt-4o-mini

# Publication Defaults
AUTO_PUBLISH_CONFIDENT=true
REQUIRE_REVIEW_ON_SENSITIVE=true
BLOCK_PRIVATE_REPOS_BY_DEFAULT=true
```

---

## 6. GitHub Integration & Webhook Configuration

### Method A: Personal Access Token (Simplest for Personal Use)
1. Go to **GitHub Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens** (or Tokens Classic).
2. Grant read permissions for **Repository metadata** and **Repository contents**.
3. Set `GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...` in your `.env`.

### Method B: Webhook Setup on GitHub
1. Open your GitHub Repository → **Settings → Webhooks → Add webhook**.
2. **Payload URL:** `https://your-domain.com/api/webhook/github` (or your ngrok URL for local testing).
3. **Content type:** Select `application/json`.
4. **Secret:** Paste the exact string configured in `GITHUB_WEBHOOK_SECRET`.
5. **Which events would you like to trigger this webhook?** Select **Just the push event**.
6. Ensure **Active** is checked and click **Add webhook**.

---

## 7. Testing the Push Pipeline Locally

You do not need to wait for a real GitHub push to test the pipeline. A built-in simulation script sends an authenticated HMAC SHA-256 push payload directly to your running backend:

```bash
# In another terminal while the server is running:
npm run simulate:push
```

You can customize the target repository and commit message:
```bash
npx tsx backend/src/scripts/simulatePush.ts "portfolio-owner/ccna-networking-labs" "feat: add BGP multi-homing topology"
```

The server receives the webhook, verifies the signature, deduplicates the delivery, extracts context, scans for secrets, generates/updates the portfolio entry, and broadcasts the result.

---

## 8. Running Automated Tests

The test suite covers unit classification, credential protection, HMAC webhook verification, and all 9 End-to-End Scenarios (A through I):

```bash
npm run test
```

### Verified Test Scenarios:
- **Scenario A (New Project):** A push introduces a new project; creates and publishes the entry.
- **Scenario B (Existing Update):** Subsequent pushes modify the existing entry without creating duplicates.
- **Scenario C (Manual Override Locks):** Deliberate owner edits in the Admin Dashboard are locked and never overwritten by subsequent AI runs.
- **Scenario D (Insignificant Changes):** Linter, formatting, or trivial commits are acknowledged without updating the public portfolio unnecessarily.
- **Scenario E (Sensitive Content Protection):** Pushes containing AWS keys or tokens are blocked with redacted warnings recorded.
- **Scenario F (Idempotency):** Duplicate webhook delivery IDs are recognized and ignored.
- **Scenario G (AI Recovery):** AI errors preserve the last known good portfolio version.
- **Scenario H (Stale Job Protection):** An older push job finishing late never overwrites a newer repository state.
- **Scenario I (Private Repositories):** Monitored private repositories remain in review/draft by default and are never published automatically.

---

## 9. Production Deployment

### Option 1: Docker
Build and run both services using standard Node.js containers:
```bash
# Build backend
npm --prefix backend run build

# Build frontend
npm --prefix frontend run build
```

### Option 2: Render / Railway / Fly.io / VPS
1. **Backend:** Deploy the `backend` folder as a Node.js web service. Set `npm start` as the start command (`node dist/server.js`).
2. **Frontend:** Deploy the `frontend/dist` folder to Cloudflare Pages, Netlify, Vercel, or serve it directly through an NGINX reverse proxy pointing `/api` to the backend.
3. **MongoDB:** Provide a MongoDB Atlas connection string in `MONGODB_URI`.
4. **Environment Variables:** Set `GITHUB_WEBHOOK_SECRET`, `SESSION_SECRET`, `ADMIN_PASSWORD`, and AI keys in the hosting dashboard.

---

## 10. Security Threat Model & Safeguards

- **No Public Registration:** The system is single-owner; registration endpoints do not exist.
- **Webhook Integrity:** All incoming GitHub webhooks are verified via `crypto.timingSafeEqual` against the HMAC SHA-256 signature using `GITHUB_WEBHOOK_SECRET`.
- **Credential Redaction:** Detected secrets are never written to logs, prompts, or public responses.
- **Prompt Injection Defense:** Repository files and commit messages are delimited as untrusted data (`<UNTRUSTED_REPOSITORY_DATA>`) to prevent manipulation of AI system directives.
- **CORS & Rate Limiting:** Configured with secure HTTP headers (`helmet`) and restricted origins.

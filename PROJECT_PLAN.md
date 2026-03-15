# vscx — Project Plan

> Maintained by the lead architect. Tasks below are for the executor agent.
> After each task, the architect will review before moving to the next.

---

## How This Works

- **Architect** (me): Reviews code, approves/rejects, decides priorities.
- **Executor** (you): Implements tasks below, one at a time.
- **Owner**: Asks the architect to review after each task.

**Rules for the executor:**
1. Read the relevant files before changing anything.
2. Do NOT refactor or "improve" code outside the scope of your task.
3. Follow the existing patterns in the codebase unless the task says otherwise.
4. Use the green accent color `#22c55e` everywhere. No other greens.
5. Use CSS variables from `frontend/src/index.css` and Tailwind classes — never hardcode hex colors inline.
6. Keep components under 250 lines. Extract sub-components if needed.
7. Do not add new dependencies unless the task explicitly allows it.
8. After completing a task, mark it `[x]` in this file.
9. Reference the Stitch design screenshots in `/stitch-screens/` for all UI work.

---

## Phase 1: Fix Critical Frontend Bugs

> The frontend has several broken things that need fixing before any new work.

### Task 1.1 — Fix Math.random() placeholder data
- [x] **Files:** `frontend/src/pages/Assets.tsx`, `frontend/src/pages/Scans.tsx`
- **Problem:** Assets page (around line 305-307) shows `Math.random()` for findings counts. Scans page (around line 301, 306) shows `Math.random()` for findings count and scan duration. These render random numbers on every re-render.
- **Fix for Assets.tsx:** Replace random findings counts with real data from the asset object. If the API doesn't return findings counts per asset, show `—` or `0` instead of random numbers.
- **Fix for Scans.tsx:** For findings count, show actual findings count from the scan result if available, otherwise `—`. For duration, calculate real duration from `started_at` and `completed_at` fields on the scan object. If scan is still running or fields are null, show `—`.
- **Verify:** The page should look the same on every render (no flickering random numbers).

### Task 1.2 — Fix broken Material Design icon references
- [x] **Files:** `frontend/src/pages/Assets.tsx`, `frontend/src/pages/Findings.tsx`
- **Problem:** These files reference `material-symbols-outlined` font class (Assets ~line 325/330, Findings ~line 226) but this font is not loaded anywhere. Icons render as broken text.
- **Fix:** Replace all `material-symbols-outlined` references with equivalent icons from `lucide-react`, which is already installed and used throughout the rest of the app. Import the needed icons at the top of each file.

### Task 1.3 — Fix Login page success/error message handling
- [x] **File:** `frontend/src/pages/Login.tsx`
- **Problem:** Line ~28 sets `setError("Registration successful! Please sign in.")` — using the error state to show a success message. This shows in red error styling.
- **Fix:** Add a separate `success` state variable. After successful registration, set `setSuccess("Registration successful. Please sign in.")` and `setIsRegister(false)` to flip back to login mode. Display success messages in green (`text-green-500`). Clear success state when switching modes.

### Task 1.4 — Fix Settings page Save button
- [x] **File:** `frontend/src/pages/Settings.tsx`
- **Problem:** The Save button (~line 140) has no `onClick` handler. Settings are never persisted.
- **Fix:** For now, wire up the Save button to store settings in `localStorage` and show a success toast/message. Use key `vscx-settings`. Load saved settings on mount with `useEffect`. Add a brief "Settings saved" confirmation that disappears after 2 seconds.
- **Note:** Backend settings API doesn't exist yet. localStorage is the interim solution.

### Task 1.5 — Add frontend route protection
- [x] **Files:** `frontend/src/App.tsx`, create `frontend/src/components/ProtectedRoute.tsx`
- **Problem:** All routes are accessible without authentication. A user can navigate to `/dashboard` without logging in.
- **Fix:** Create a `ProtectedRoute` component that checks for a valid token in localStorage. If no token, redirect to `/login`. Wrap all routes inside the `<Layout>` with this component in `App.tsx`.
- **Implementation:**
  ```tsx
  // ProtectedRoute.tsx
  const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return <Outlet />;
  };
  ```
  Then in App.tsx, nest the Layout routes inside ProtectedRoute.

---

## Phase 2: Frontend Color & Style Consistency

> Standardize all colors to use CSS variables. No more hardcoded hex values.

### Task 2.1 — Standardize green accent color across all pages
- [x] **Files:** All files in `frontend/src/pages/` and `frontend/src/components/`
- **Problem:** Four different greens are used: `#22c55e`, `#21c488`, `#21c45d`, `#1acb5b`. Should be one.
- **Fix:**
  1. Search all `.tsx` files for hardcoded hex color values (green variants, background colors, border colors).
  2. Replace ALL green hex codes with the CSS variable `var(--accent)` (which is `#22c55e`) or the appropriate Tailwind class (`text-green-500`, `bg-green-500`, `border-green-500`, etc.).
  3. Replace hardcoded dark background colors with CSS variables from `index.css` (`var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-card)`, etc.).
  4. For hover states use `var(--accent-hover)` or `hover:bg-green-600`.
  5. Do a final search for any remaining hardcoded hex values — there should be zero in .tsx files.

### Task 2.2 — Match Stitch design screenshots
- [x] **Files:** All pages in `frontend/src/pages/`
- **Reference:** Compare each page against its design in `/stitch-screens/`:
  - `1-login.png` → `Login.tsx`
  - `2-dashboard.png` → `Dashboard.tsx`
  - `3-assets.png` → `Assets.tsx`
  - `4-findings.png` → `Findings.tsx`
  - `5-scans.png` → `Scans.tsx`
  - `6-settings.png` → `Settings.tsx`
- **Instructions:** Open each screenshot, compare layout/spacing/typography against the current component. Fix any visible differences in layout structure, spacing, font sizes, and element positioning. Don't rewrite the whole component — just fix the mismatches.

---

## Phase 3: Dashboard & Data Display Fixes

### Task 3.1 — Implement real dashboard chart
- [x] **File:** `frontend/src/pages/Dashboard.tsx`
- **Problem:** The trend chart section (~line 132-142) is a hardcoded placeholder. `recharts` is already in package.json but unused.
- **Fix:** Replace the placeholder with a real `recharts` AreaChart or BarChart. Use the findings summary data from the API (`findings.summary(projectId)`). Show findings over time if the data supports it, or show severity distribution as a bar chart. Style the chart to match the dark theme (dark background, green accent for the data line/bars, gray grid lines).
- **Also fix:** Remove the hardcoded trend percentages (+5%, +2%, etc.) from the stat cards. Either calculate real trends from data or remove the trend indicators entirely.

### Task 3.2 — Remove fake data from stat cards
- [x] **File:** `frontend/src/pages/Dashboard.tsx`
- **Problem:** Trend indicators like "+5%", "+2%", "-15%", "-3%" (~lines 88-117) are hardcoded, not calculated from real data.
- **Fix:** Remove the trend indicators entirely. Just show the current values. If we add real trend tracking later, we can add them back.

---

## Phase 4: Backend Security Hardening

### Task 4.1 — Enforce SECRET_KEY validation at startup
- [x] **File:** `backend/app/core/config.py`
- **Fix:** Add a validator that raises `ValueError` at import time if `SECRET_KEY` is still the default `"changeme-in-production"`. This prevents accidentally running in production with a forgeable JWT secret.
- **Implementation:** Add a `model_validator` (Pydantic v2) or check in `__init__` that rejects the default value.

### Task 4.2 — Add password validation to registration
- [x] **File:** `backend/app/api/v1/endpoints/auth.py`
- **Fix:**
  1. Change registration to accept a JSON body (Pydantic model) instead of query parameters. Create a `UserRegister` schema in `backend/app/schemas/` with fields: `username`, `email`, `password`.
  2. Add validation: password min 8 chars, must contain at least one uppercase, one lowercase, one digit.
  3. Add validation: username 3-32 chars, alphanumeric + underscores only.
  4. Add validation: email must be valid format.
  5. Update the frontend `api.ts` `auth.register()` call to send JSON body instead of query params.

### Task 4.3 — Add foreign key constraints to database models
- [x] **File:** `backend/app/models/base.py`
- **Fix:** Add proper `ForeignKey` constraints:
  - `Project.owner_id` → `User.id`
  - `Asset.project_id` → `Project.id` (CASCADE delete)
  - `Scan.project_id` → `Project.id` (CASCADE delete)
  - `Scan.created_by` → `User.id`
  - `Finding.scan_id` → `Scan.id` (CASCADE delete)
  - `Finding.project_id` → `Project.id` (CASCADE delete)
  - `Finding.asset_id` → `Asset.id` (SET NULL, nullable)
- Also add SQLAlchemy `relationship()` declarations so you can do `project.assets`, `scan.findings`, etc.
- Create an Alembic migration for the schema change.

### Task 4.4 — Fix hardcoded asset_id=0 in scan tasks
- [x] **File:** `backend/app/services/tasks.py`
- **Problem:** When findings are created from scan results, `asset_id` is always set to `0`. This means findings are never linked to real assets.
- **Fix:** The scan should attempt to match findings to existing assets by IP address, hostname, or URL. If a match is found, use that asset's ID. If no match, set `asset_id=None` (after Task 4.3 makes it nullable).

### Task 4.5 — Add rate limiting to auth endpoints
- [x] **Files:** `backend/app/main.py`, `backend/app/api/v1/endpoints/auth.py`
- **Fix:** Install `slowapi` (add to requirements.txt). Apply rate limits:
  - `/auth/login`: 5 requests per minute per IP
  - `/auth/register`: 3 requests per minute per IP
  - `/scans/{id}/execute`: 10 requests per minute per user
- **New dependency allowed:** `slowapi`

### Task 4.6 — Validate scan targets
- [x] **File:** `backend/app/api/v1/endpoints/scans.py`, `backend/app/services/scanners.py`
- **Fix:** Before executing a scan, validate that targets are not:
  - `127.0.0.1`, `localhost`, `0.0.0.0`, `::1`
  - Private ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (unless explicitly allowed via env var `ALLOW_PRIVATE_TARGETS=true`)
  - Any IP that resolves to a loopback address
- Return HTTP 400 with a clear message if targets are blocked.

---

## Phase 5: Backend Quality

### Task 5.1 — Centralize environment variable loading
- [x] **File:** `backend/app/core/config.py`
- **Problem:** Some env vars use Pydantic Settings, others use raw `os.getenv()` scattered across `ai_service.py`, `vulnerability_db.py`, and endpoint files.
- **Fix:** Move ALL env var access into the `Settings` class:
  - `NVD_API_KEY: str | None = None`
  - `OPENAI_API_KEY: str | None = None`
  - `ANTHROPIC_API_KEY: str | None = None`
  - `OLLAMA_BASE_URL: str = "http://localhost:11434"`
  - `ALLOW_PRIVATE_TARGETS: bool = False`
- Then update all files that use `os.getenv()` to import and use `settings.VARIABLE` instead.

### Task 5.2 — Fix hardcoded credentials in alembic.ini
- [x] **File:** `backend/alembic.ini`
- **Problem:** Database URL is hardcoded: `postgresql+asyncpg://vscx:vscx@localhost:5432/vscx`
- **Fix:** In `alembic/env.py`, override the sqlalchemy URL from `settings.DATABASE_URL` so alembic.ini doesn't contain credentials. Set `sqlalchemy.url =` to empty string in alembic.ini.

### Task 5.3 — Add basic test suite
- [x] **Create:** `backend/tests/` directory with:
  - `conftest.py` — pytest fixtures, test database setup (SQLite in-memory or test PostgreSQL)
  - `test_auth.py` — Test login, register, JWT validation, password hashing
  - `test_projects.py` — Test CRUD, ownership enforcement
  - `test_scanners.py` — Test nmap/nuclei/trivy output parsing with sample data (mock subprocess)
- **New dependencies allowed:** `pytest`, `pytest-asyncio`, `httpx` (for TestClient)
- **Minimum coverage:** Auth flow must be fully tested. Scanner parsing must have at least one test per scanner with real sample output.

---

## Phase 6: Infrastructure

### Task 6.1 — Fix Docker security
- [x] **Files:** `docker/Dockerfile.backend`, `docker/Dockerfile.frontend`
- **Fix for backend:** Add a non-root user `vscx` and switch to it after installing dependencies. Run the app as this user.
- **Fix for frontend:** Add a non-root user for nginx. Set proper file permissions.
- **Also:** Add `HEALTHCHECK` directive to backend Dockerfile.

### Task 6.2 — Create .env.example files
- [x] **Create:** `docker/.env.example`, `backend/.env.example`, `frontend/.env.example`
- **Contents:** Copy from existing .env files but replace all secrets/passwords with placeholder values and add comments explaining each variable.
- **Remove** real credentials from any `.env` files that are tracked in git. Add `.env` to `.gitignore` if not already there.

### Task 6.3 — Add GitHub Actions CI
- [x] **Create:** `.github/workflows/ci.yml`
- **Pipeline steps:**
  1. Lint backend: `ruff check backend/`
  2. Type-check frontend: `cd frontend && npx tsc --noEmit`
  3. Lint frontend: `cd frontend && npm run lint`
  4. Run backend tests: `cd backend && pytest`
  5. Build frontend: `cd frontend && npm run build`
- **New dependency allowed:** `ruff` (add to backend requirements.txt)

---

## Phase 7: Nice-to-Have Features (Low Priority)

### Task 7.1 — Add error boundaries and toast notifications to frontend
- [x] Wrap the app in a React error boundary
- [x] Add a simple toast notification system for API errors and success messages
- [x] Show user-visible errors when API calls fail (currently silent)

### Task 7.2 — Add audit logging to backend
- [x] Log scan executions, finding status changes, and login attempts
- [x] Use Python's `logging` module with structured JSON output

### Task 7.3 — Implement header search functionality
- [x] Wire up the search input in `Header.tsx` to search across assets, findings, and scans
- [x] Show results in a dropdown below the search input

---

## Reference

### Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Celery, Redis, PostgreSQL |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Scanners | Nmap, Nuclei, Trivy |
| AI | OpenAI, Anthropic, Ollama |
| Infra | Docker Compose |

### Key Paths
```
backend/app/core/config.py        — Settings, env vars
backend/app/models/base.py        — Database models
backend/app/api/v1/endpoints/     — API routes
backend/app/services/             — Business logic, scanners, AI
frontend/src/pages/               — Page components
frontend/src/components/          — Shared components
frontend/src/lib/api.ts           — API client
frontend/src/index.css            — CSS variables, theme
stitch-screens/                   — Design reference PNGs
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

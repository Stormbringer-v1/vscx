# vscx — Project Plan (v2)

> Maintained by the lead architect. Tasks below are for the executor agent.
> After completing each phase, the architect will review before moving on.
>
> **Stable checkpoint:** commit `c20c2c8` (2026-03-15) — roll back here if anything goes wrong.

---

## How This Works

- **Architect** (me): Reviews code, approves/rejects, decides priorities.
- **Executor** (you): Implements tasks below, one phase at a time.
- **Owner**: Asks the architect to review after each phase.

**Rules for the executor:**
1. Read the relevant files before changing anything.
2. Do NOT refactor or "improve" code outside the scope of your task.
3. Follow the existing patterns in the codebase unless the task says otherwise.
4. Use the green accent color `#22c55e` everywhere. No other greens.
5. Keep components under 250 lines. Extract sub-components if needed.
6. Do not add new dependencies unless the task explicitly allows it.
7. After completing a task, mark it `[x]` in this file.
8. Run tests after every backend change: `cd backend && python -m pytest tests/ -v`
9. **NEVER use 192.168.50.x IPs** in seed data, test data, or examples. Use `10.0.1.x` or `example.com`.

---

## Phase 8: Fix Scans — Make Them Actually Work

> **Priority:** P0 — Nothing else matters if scans don't work.
> **Context:** Scans currently get stuck in "pending" state. The frontend creates a scan but never calls the execute endpoint. Also, private target scanning is blocked by default, but this is a self-hosted tool — users should be able to scan their own networks.

### Task 8.1 — Fix the scan execution flow (frontend → backend)

- [x] **Files:** `frontend/src/pages/Scans.tsx`, `frontend/src/lib/api.ts`
- **Problem:** The frontend creates a scan via `POST /scans/` (sets status to PENDING) but never calls `POST /scans/{id}/execute`. The user creates a scan and it sits in "pending" forever.
- **Fix — Option A (Recommended):** Auto-execute on creation. After the `createMutation` succeeds and returns the new scan object (with `id`), immediately call `scans.execute(projectId, scan.id)`. This is a two-step API call but one user action.
- **Implementation:**
  ```tsx
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { project_id: number }) => {
      const response = await scans.create(data)
      // Auto-execute after creation
      await scans.execute(data.project_id, response.data.id)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans', selectedProject?.id] })
      setShowForm(false)
      setFormData({ name: '', scan_type: 'nmap', targets: '' })
    },
  })
  ```
- **Also fix:** The "Re-run" button (`<Reply>` icon, ~line 328) and "Run Scan" buttons on the scan tool cards (~line 184-193) currently do nothing useful. Wire up the Re-run button to call `scans.execute()` on the existing scan.
- **Verify:** Creating a scan should immediately start it. Status should move from pending → running → completed/failed.

### Task 8.2 — Enable private target scanning by default

- [x] **Files:** `backend/app/core/config.py`, `docker/docker-compose.yml`
- **Problem:** `ALLOW_PRIVATE_TARGETS` defaults to `False`. This is a self-hosted vulnerability scanner — the entire point is scanning your own private networks (10.x, 172.16.x, 192.168.x). Blocking private targets by default makes the tool unusable for its primary use case.
- **Fix:**
  1. In `backend/app/core/config.py`, change `ALLOW_PRIVATE_TARGETS: bool = False` to `ALLOW_PRIVATE_TARGETS: bool = True`
  2. In `docker/docker-compose.yml`, set `ALLOW_PRIVATE_TARGETS=true` in both the `backend` and `celery` environment sections.
  3. Keep the loopback/localhost validation (127.0.0.1, ::1, 0.0.0.0 should still be blocked).
- **DO NOT** remove the private target validation code entirely — just flip the default. Users who deploy this externally can set it back to `false`.

### Task 8.3 — Fix Celery task execution issues

- [x] **Files:** `backend/app/services/tasks.py`, `backend/app/services/celery_app.py`
- **Problem:** The `execute_scan` Celery task wraps async code in `asyncio.run()` inside a sync Celery worker. This can cause event loop conflicts, especially if the worker's prefork pool already has an event loop running. Also, there's no error handling around the task — if it throws an exception, the scan stays in "running" forever.
- **Fix:**
  1. Add a try/except wrapper around the entire task body. If ANY exception occurs, catch it, set scan status to `FAILED` with the error message, and re-raise.
  2. Add proper error logging using Python's `logging` module when a task fails.
  3. Ensure the `asyncio.run()` approach works by testing. If it doesn't (event loop errors in logs), switch to a synchronous approach: replace async SQLAlchemy calls with sync equivalents using `run_in_executor`, or create a fresh event loop explicitly.
  4. Add the `acks_late=True` and `reject_on_worker_lost=True` options to the task decorator so tasks are retried if the worker crashes mid-scan.
- **Test:** After fixing, create a scan through the UI. It should go from pending → running → completed (or failed with a clear error message), never stuck in pending/running.
- **Check:** Run `docker-compose -f docker/docker-compose.yml logs --tail=50 celery` — look for error messages and fix whatever is failing.

### Task 8.4 — Fix scan creation to pass `created_by` field

- [x] **Files:** `backend/app/api/v1/endpoints/scans.py`
- **Problem:** Check if the scan create endpoint properly sets `created_by` to the current user's ID. The Scan model requires `created_by` (ForeignKey to users.id, nullable=False). If this field isn't being set, scan creation will fail with a database error.
- **Fix:** In the scan create endpoint, ensure `created_by=current_user.id` is set when creating the Scan object. Read the existing code first — it may already be doing this. If it is, mark this task as done.
- **Verify:** Create a scan through the API docs at `/docs` and check that it saves correctly.

---

## Phase 9: Redesign Scan Types — Simplify the UX

> **Priority:** P0 — The current scan type model (nmap/nuclei/trivy) is confusing for users.
> **Context:** Users shouldn't need to know what Nmap or Nuclei is. They should pick a scan intensity level, and the system decides which tools to run internally. Think of it like antivirus: Quick Scan, Full Scan, Custom Scan.

### Task 9.1 — Define scan profiles (backend)

- [x] **Files:** `backend/app/services/scan_profiles.py` (new file), `backend/app/models/base.py`
- **Create** a new file `backend/app/services/scan_profiles.py` that defines scan profiles:
  ```python
  SCAN_PROFILES = {
      "quick": {
          "label": "Quick Scan",
          "description": "Fast port scan and service detection. Runs in under 2 minutes.",
          "steps": [
              {"scanner": "nmap", "options": "-sn -T4"},  # Ping sweep only
          ],
          "timeout": 120,
      },
      "standard": {
          "label": "Standard Scan",
          "description": "Port scan with service detection and common vulnerability checks.",
          "steps": [
              {"scanner": "nmap", "options": "-sV -sC -T3 --top-ports 1000"},
              {"scanner": "nuclei", "options": "-severity critical,high"},
          ],
          "timeout": 600,
      },
      "aggressive": {
          "label": "Aggressive Scan",
          "description": "Full port scan, OS detection, all vulnerability checks. Can take 10+ minutes.",
          "steps": [
              {"scanner": "nmap", "options": "-sV -sC -O -T4 -p-"},
              {"scanner": "nuclei", "options": "-severity critical,high,medium,low"},
          ],
          "timeout": 1800,
      },
      "container": {
          "label": "Container Scan",
          "description": "Scan container images for vulnerabilities and misconfigurations.",
          "steps": [
              {"scanner": "trivy", "options": "--severity HIGH,CRITICAL"},
          ],
          "timeout": 600,
      },
  }
  ```
- **Update** the Scan model: The `scan_type` field (String 50) currently stores "nmap"/"nuclei"/"trivy". Change its semantics to store the profile name: "quick"/"standard"/"aggressive"/"container". No schema migration needed — it's the same String field, just different values.
- **DO NOT** break backward compatibility. The scanner registry (`SCANNERS` dict in `scanners.py`) stays the same. Profiles just define which scanners to call in sequence.

### Task 9.2 — Update scan execution to use profiles

- [x] **Files:** `backend/app/services/tasks.py`, `backend/app/services/scan_profiles.py`
- **Problem:** The current `execute_scan` task calls `run_scan(scan.scan_type, scan.targets)` which maps directly to one scanner. With profiles, a single scan may run multiple scanners in sequence.
- **Fix:** Update the `execute_scan` task:
  1. Import `SCAN_PROFILES` from `scan_profiles.py`
  2. Look up the profile: `profile = SCAN_PROFILES.get(scan.scan_type)`
  3. If no profile found, fall back to treating `scan_type` as a direct scanner name (backward compatible with old "nmap"/"nuclei"/"trivy" scans)
  4. Loop through `profile["steps"]`, running each scanner in sequence
  5. Aggregate all findings from all steps
  6. Update progress proportionally (e.g., 2 steps = 50% per step)
- **Implementation sketch:**
  ```python
  profile = SCAN_PROFILES.get(scan.scan_type)
  if profile:
      all_findings = []
      steps = profile["steps"]
      for i, step in enumerate(steps):
          progress = 10 + int(80 * i / len(steps))
          self.update_state(state="PROGRESS", meta={"status": f"Running {step['scanner']}...", "progress": progress})
          result = await run_scan(step["scanner"], scan.targets, step.get("options", ""))
          if result.get("success"):
              all_findings.extend(result.get("findings", []))
          # Don't fail the whole scan if one step fails — log it and continue
      scan_result = {"findings": all_findings, "success": True}
  else:
      # Backward compatibility: treat scan_type as direct scanner name
      scan_result = await run_scan(scan.scan_type, scan.targets)
  ```

### Task 9.3 — Update scan validation for profiles

- [x] **Files:** `backend/app/api/v1/endpoints/scans.py`, `backend/app/schemas/scan.py` (or wherever ScanCreate schema is)
- **Fix:**
  1. Update the `ScanCreate` schema to validate that `scan_type` is one of the valid profile names: `"quick"`, `"standard"`, `"aggressive"`, `"container"`. Also accept legacy names for backward compatibility: `"nmap"`, `"nuclei"`, `"trivy"`.
  2. Update the scan create endpoint to validate accordingly.
  3. Add a new endpoint `GET /scans/profiles` that returns the available scan profiles with their labels and descriptions. The frontend will use this instead of hardcoded scan tool cards.
  ```python
  @router.get("/profiles")
  async def get_scan_profiles():
      return {name: {"label": p["label"], "description": p["description"]} for name, p in SCAN_PROFILES.items()}
  ```

### Task 9.4 — Redesign the Scans page UI

- [x] **Files:** `frontend/src/pages/Scans.tsx`
- **Problem:** The current UI shows three scanner tool cards (Nmap, Nuclei, Trivy) and asks the user to pick one. Users shouldn't need to know which tools exist.
- **Fix:** Replace the scan tool cards and form with a new scan creation flow:
  1. **Replace the three tool cards** with four profile cards: Quick Scan, Standard Scan, Aggressive Scan, Container Scan
  2. **Each card should show:** Profile name, description, estimated duration, an icon
  3. **Clicking a card** should open the scan form pre-filled with that profile type
  4. **The form should have:**
     - Scan Name (auto-generated default like "Quick Scan - Mar 15")
     - Profile Type (pre-selected from card click, but changeable via radio buttons)
     - Targets (text input with placeholder "10.0.1.0/24 or example.com")
  5. **Icons to use** (from lucide-react):
     - Quick: `Zap`
     - Standard: `Shield`
     - Aggressive: `Flame`
     - Container: `Box`
  6. **Colors:**
     - Quick: green (#22c55e)
     - Standard: blue (#3b82f6)
     - Aggressive: orange (#f97316)
     - Container: purple (#a855f7)
  7. In the scan history table, replace the "Tool" column with "Profile" column. Show the profile label instead of the scanner name.
- **Optionally:** Fetch profiles from the `GET /scans/profiles` endpoint instead of hardcoding them. If the endpoint doesn't exist yet, hardcode is fine.

---

## Phase 10: First-Login Experience (Wazuh-Style)

> **Priority:** P1 — Security improvement for initial deployment.
> **Context:** Currently there's a hardcoded admin/admin123 user created via SQL init script. Instead, we want: (1) generate random credentials on first boot, (2) display them in the backend logs, (3) force password change on first login.

### Task 10.1 — Generate initial admin credentials on first boot

- [x] **Files:** `backend/app/services/init_admin.py` (new file), `backend/app/main.py`, `docker/postgres/init.sql`
- **Remove** the hardcoded admin user from `docker/postgres/init.sql` (delete the INSERT statement, keep the file for any other init logic or leave a comment).
- **Create** `backend/app/services/init_admin.py`:
  ```python
  import secrets
  import string
  from sqlalchemy import select
  from app.models.base import User
  from app.core.security import get_password_hash

  def generate_password(length=16):
      alphabet = string.ascii_letters + string.digits + "!@#$%"
      return ''.join(secrets.choice(alphabet) for _ in range(length))

  async def init_admin_user(db):
      """Create admin user on first boot if no users exist."""
      result = await db.execute(select(User).limit(1))
      if result.scalar_one_or_none() is not None:
          return  # Users already exist, skip

      password = generate_password()
      admin = User(
          username="admin",
          email="admin@vscx.local",
          hashed_password=get_password_hash(password),
          is_active=True,
          is_superuser=True,
          must_change_password=True,  # New field — see Task 10.2
      )
      db.add(admin)
      await db.commit()

      # Print to stdout so it shows in docker logs
      print("=" * 60)
      print("  VSCX Initial Admin Credentials")
      print("=" * 60)
      print(f"  Username: admin")
      print(f"  Password: {password}")
      print("=" * 60)
      print("  Change this password after first login!")
      print("=" * 60)
  ```
- **Call** `init_admin_user()` from the FastAPI `startup` event in `backend/app/main.py`:
  ```python
  @app.on_event("startup")
  async def startup():
      async with async_session() as db:
          await init_admin_user(db)
  ```
- **Verify:** When starting with an empty database, the admin password should appear in `docker-compose logs backend`. It should be different every time.

### Task 10.2 — Add `must_change_password` field and enforcement

- [x] **Files:** `backend/app/models/base.py`, `backend/app/api/v1/endpoints/auth.py`
- **Add** a new field to the User model:
  ```python
  must_change_password = Column(Boolean, default=False)
  ```
- **Create Alembic migration** for this schema change: `cd backend && alembic revision --autogenerate -m "add must_change_password to users"`
- **Update the login endpoint:** When a user logs in with `must_change_password=True`, return a special response:
  ```python
  if user.must_change_password:
      temp_token = create_access_token(data={"sub": str(user.id), "pwd_change": True}, expires_delta=timedelta(minutes=10))
      return {"access_token": temp_token, "token_type": "bearer", "must_change_password": True}
  ```
- **Add a new endpoint** `POST /auth/change-password`:
  ```python
  @router.post("/change-password")
  async def change_password(
      request: Request,
      current_password: str,
      new_password: str,
      token: str = Depends(oauth2_scheme),
      db: AsyncSession = Depends(get_db)
  ):
      # Validate token, get user
      # Verify current_password matches
      # Validate new_password (same rules as registration: 8+ chars, upper, lower, digit)
      # Hash and save new password
      # Set must_change_password = False
      # Return new access token (without pwd_change claim)
  ```
  Use a Pydantic model for the request body (not individual params).

### Task 10.3 — Add admin user management endpoint

- [x] **Files:** `backend/app/api/v1/endpoints/auth.py` or `backend/app/api/v1/endpoints/users.py` (new file)
- **Add** endpoints for admin to manage users:
  ```
  GET    /users/           — List all users (admin only)
  POST   /users/           — Create a user (admin only), returns generated password
  DELETE /users/{user_id}  — Delete a user (admin only, can't delete self)
  PUT    /users/{user_id}  — Update user (admin only: change email, toggle active, reset password)
  ```
- **Admin-only guard:** Check `current_user.is_superuser == True`. Return 403 if not.
- **When admin creates a user:** Generate a random password (like init_admin), set `must_change_password=True`, return the generated password in the response so the admin can share it.
- **When admin resets a password:** Generate new random password, set `must_change_password=True`, return new password.
- **Remove** the public `POST /auth/register` endpoint. Users should not self-register — the admin creates accounts. If you don't want to remove it entirely, guard it with `is_superuser` check.

### Task 10.4 — Frontend: First-login password change flow

- [x] **Files:** `frontend/src/pages/Login.tsx`, `frontend/src/pages/ChangePassword.tsx` (new file), `frontend/src/App.tsx`
- **Handle** the `must_change_password` response from login:
  1. After login, check if `response.data.must_change_password === true`
  2. If yes, store the temp token and redirect to `/change-password` instead of `/dashboard`
  3. The `/change-password` page shows a form: Current Password, New Password, Confirm New Password
  4. On submit, call `POST /auth/change-password`
  5. On success, store the new token and redirect to `/dashboard`
- **Add** the `/change-password` route in `App.tsx`
- **Style** the page to match the login page design (same card layout, same dark theme).
- **Remove** the "Request Access" / register link from `Login.tsx` since registration is now admin-only.

---

## Phase 11: Give Assets a Purpose

> **Priority:** P1 — Assets exist in the DB but serve no real function.
> **Context:** The user asked: "what is the idea behind having assets if I cannot do anything there?" Currently assets are just a list of IPs/hostnames. They should be the primary way users define WHAT to scan and track the security posture of each asset over time.

### Task 11.1 — Link assets to scan targets

- [x] **Files:** `frontend/src/pages/Scans.tsx`, `frontend/src/pages/Assets.tsx`, `frontend/src/lib/api.ts`
- **Problem:** When creating a scan, the user has to manually type target IPs. But they already added assets with IPs/hostnames. Those should be selectable as scan targets.
- **Fix — Scan creation form:**
  1. Below the Targets text input, add a "Select from assets" section that shows the project's assets as selectable chips/checkboxes.
  2. When an asset is selected, add its IP address (or hostname, or URL — whichever is populated) to the targets field.
  3. Multiple assets can be selected. Targets are comma-separated.
  4. The user can still manually type targets — the asset selector is additive.
- **Implementation:**
  1. In the scan creation form, fetch assets via `assets.list(selectedProject.id)`
  2. Show each asset as a clickable chip: `[Server Icon] Web Server (10.0.1.10)`
  3. On click, append/remove the IP from the targets textarea
- **Also fix in Assets.tsx:** Add a "Scan this asset" button/action on each asset row. Clicking it should navigate to the Scans page with that asset's IP pre-filled as the target. Use React Router's `navigate('/scans', { state: { target: asset.ip_address } })` and read it in `Scans.tsx` via `useLocation()`.

### Task 11.2 — Show asset security posture

- [x] **Files:** `frontend/src/pages/Assets.tsx`, `backend/app/api/v1/endpoints/assets.py`
- **Problem:** The assets page just shows a list of assets with no security context. An asset should show how many open findings it has, when it was last scanned, and its risk level.
- **Backend fix:** Add a new endpoint or expand the existing list endpoint to include finding counts per asset:
  ```python
  @router.get("/with-stats")
  async def list_assets_with_stats(project_id: int, ...):
      # For each asset, count findings by severity where status='open'
      # Include: total_findings, critical_count, high_count, last_scan_at
      # Return as part of the asset response
  ```
  Alternatively, compute this in a subquery/join so it's one DB call.
- **Frontend fix:** Update the Assets page table to show:
  - Asset name and type
  - IP / Hostname / URL
  - Finding counts (critical in red, high in orange, medium in yellow badge)
  - Last scanned date (from `last_scan_at` field)
  - Risk score (color-coded: 0-3 green, 4-6 yellow, 7-10 red)
  - "Scan" action button (links to scan creation with this target pre-filled)

### Task 11.3 — Auto-create assets from scan results

- [x] **Files:** `backend/app/services/tasks.py`
- **Problem:** If a user scans `10.0.1.0/24` and Nmap discovers 15 hosts, those hosts are NOT automatically added as assets. The user has to manually create each one. That's tedious and defeats the purpose of discovery scanning.
- **Fix:** In the `execute_scan` task, after getting scan results:
  1. For each unique IP/hostname found in scan findings' `affected_component`:
     - Check if an asset with that IP/hostname already exists in the project
     - If not, auto-create a new Asset with: `name` = hostname or IP, `asset_type` = "discovered", `ip_address` = the IP, `project_id` = scan's project
  2. Link the findings to the auto-created assets
  3. Update the asset's `last_scan_at` timestamp
- **Important:** Only auto-create for Nmap/network scan results (profile types "quick", "standard", "aggressive"). Don't auto-create assets for container scans.
- **Mark auto-created assets** by setting `asset_type = "discovered"` so the UI can distinguish them from manually added assets (show a badge or different icon).

### Task 11.4 — Update Asset model for better types

- [x] **Files:** `backend/app/models/base.py`, `frontend/src/pages/Assets.tsx`
- **Problem:** The `asset_type` field is a free-text String. It should have defined values so the UI can show proper icons and the system can make decisions based on type.
- **Fix — Backend:**
  Add an enum or constant list for valid asset types:
  ```python
  ASSET_TYPES = ["server", "workstation", "network_device", "container", "web_application", "database", "cloud_resource", "discovered"]
  ```
  Validate `asset_type` on creation (return 400 if invalid type).
- **Fix — Frontend:**
  Show different icons for each asset type in the assets table:
  - server: `Server` (lucide)
  - workstation: `Monitor`
  - network_device: `Router`
  - container: `Box`
  - web_application: `Globe`
  - database: `Database`
  - cloud_resource: `Cloud`
  - discovered: `Search` (with a "Discovered" badge)

---

## Phase 12: Install Script & README

> **Priority:** P1 — First thing a new user sees. Must be dead simple.
> **Context:** Users should be able to install VSCX with one command on a fresh Ubuntu/Debian server. No Docker required for the app — only PostgreSQL and Redis need to be installed (either natively or via Docker). The app itself runs as systemd services.

### Task 12.1 — Create the install script

- [x] **Create:** `install.sh` (root of repo)
- **The script should:**
  1. **Check prerequisites:** Must run as root or with sudo. Must be Linux (Ubuntu 22.04+ / Debian 12+ primarily).
  2. **Install system dependencies:**
     ```bash
     apt-get update && apt-get install -y \
       python3.12 python3.12-venv python3-pip \
       postgresql postgresql-contrib \
       redis-server \
       nginx \
       nmap \
       git curl wget unzip
     ```
  3. **Install Nuclei:**
     ```bash
     curl -sL https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_*.zip ...
     ```
  4. **Install Trivy:**
     ```bash
     curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
     ```
  5. **Set up PostgreSQL:**
     - Create database `vscx` and user `vscx` with a randomly generated password
     - Store the connection string for later
  6. **Set up the application:**
     - Create a system user `vscx` (no login shell)
     - Clone/copy the repo to `/opt/vscx/`
     - Create Python venv at `/opt/vscx/venv/`
     - Install backend dependencies: `pip install -r backend/requirements.txt`
     - Install frontend dependencies and build: `cd frontend && npm ci && npm run build`
     - Generate a random `SECRET_KEY`
     - Create `.env` file at `/opt/vscx/backend/.env` with all config
     - Run Alembic migrations: `alembic upgrade head`
  7. **Create systemd services:**
     - `/etc/systemd/system/vscx-backend.service` — runs uvicorn
     - `/etc/systemd/system/vscx-worker.service` — runs celery worker
     - Both run as the `vscx` system user
     - Both restart on failure
  8. **Configure nginx:**
     - Create `/etc/nginx/sites-available/vscx` with reverse proxy config:
       - `/` → serves the built frontend static files from `/opt/vscx/frontend/dist/`
       - `/api/` → proxy to `127.0.0.1:8000`
     - Enable the site, disable default, reload nginx
  9. **Start services:**
     ```bash
     systemctl enable --now vscx-backend vscx-worker redis postgresql nginx
     ```
  10. **Print the summary:**
      ```
      ================================================
        VSCX Installation Complete!
      ================================================
        URL:      http://<server-ip>

        Check backend logs for initial admin credentials:
          journalctl -u vscx-backend --no-pager | grep -A5 "Initial Admin"

        Services:
          systemctl status vscx-backend
          systemctl status vscx-worker
      ================================================
      ```
- **Script must be idempotent** — running it twice should not break anything. Check if services/databases already exist before creating.
- **Script must be interactive** — ask the user to confirm before proceeding. Show what will be installed.
- **Error handling** — if any step fails, print a clear error and stop. Don't continue blindly.

### Task 12.2 — Keep Docker as an alternative

- [x] **Files:** `docker/docker-compose.yml`, `docker/README.md` (new)
- **DO NOT remove** the existing Docker setup. Some users prefer it.
- **Create** `docker/README.md` explaining how to use Docker:
  ```
  # Docker Installation (Alternative)

  If you prefer Docker over native installation:

  1. Copy .env.example to .env and configure
  2. Run: docker-compose up -d
  3. Check logs for admin credentials: docker-compose logs backend
  ```
- **Update** `docker/docker-compose.yml`:
  - Add `ALLOW_PRIVATE_TARGETS=true` to backend and celery env vars (if not done in Phase 8)
  - Ensure the compose file still works standalone

### Task 12.3 — Write the README

- [x] **Files:** `README.md` (root of repo — overwrite existing)
- **Structure:**
  ```markdown
  # VSCX — Vulnerability Scanner

  Open-source vulnerability management platform. Scan your infrastructure,
  discover vulnerabilities, get AI-powered remediation suggestions.

  ## Features
  - Network scanning (Nmap), web vulnerability scanning (Nuclei), container scanning (Trivy)
  - AI-powered remediation suggestions (OpenAI, Anthropic, Ollama)
  - CVE enrichment from NVD, OSV, EPSS databases
  - Dark-themed modern web UI
  - Scan profiles: Quick, Standard, Aggressive, Container
  - Asset discovery and tracking
  - Audit logging

  ## Quick Start

  ### Option 1: Install Script (Recommended)
  ```bash
  git clone https://github.com/<repo>/vscx.git
  cd vscx
  sudo bash install.sh
  ```

  ### Option 2: Docker
  See [docker/README.md](docker/README.md)

  ## Screenshots
  [Include 2-3 screenshots from stitch-screens/]

  ## Configuration
  [Table of key environment variables]

  ## Architecture
  [Brief description: FastAPI + React + PostgreSQL + Redis + Celery]

  ## Contributing
  [Basic contribution guidelines]

  ## License
  [Your license choice]
  ```
- Keep it concise. Don't over-document — link to docs/ for details.

---

## Phase 13: Reports, Scan Scheduling & Finding Deduplication

> **Priority:** P0 — Core features that make the platform production-usable.
> **Context:** Users need to export their findings, schedule recurring scans, and not see duplicate findings from repeat scans. These are table-stakes for any vulnerability management tool.

### Task 13.1 — PDF Report Generation (backend)

- [ ] **Files:** `backend/app/services/report_generator.py` (new), `backend/app/api/v1/endpoints/reports.py` (new), `backend/requirements.txt`
- **Add dependency:** `weasyprint` (or `reportlab` if weasyprint has too many system deps). Add to `requirements.txt`.
- **Create** `backend/app/services/report_generator.py`:
  1. `generate_project_report(project_id, db) -> bytes` — generates a PDF with:
     - Cover page: project name, date, generated by VSCX
     - Executive summary: total findings by severity (critical/high/medium/low/info), risk score
     - Findings table: sorted by severity (critical first), showing title, severity, status, affected asset, CVE if known
     - Per-finding detail pages: description, remediation, AI suggestion (if available), references
  2. Use HTML→PDF approach: render an HTML template string, convert to PDF with weasyprint
  3. Style the PDF with dark theme colors matching the UI (or a clean print-friendly light theme — your call, but keep the green accent)
- **Create** `backend/app/api/v1/endpoints/reports.py`:
  ```python
  @router.get("/projects/{project_id}/report/pdf")
  async def generate_pdf_report(project_id: int, current_user = Depends(get_current_user), db = Depends(get_db)):
      # Verify user owns project
      # Generate PDF bytes
      # Return as StreamingResponse with content-type application/pdf
  ```
- **Register** the router in `backend/app/api/v1/api.py`
- **Test:** `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/projects/1/report/pdf -o report.pdf` should produce a valid PDF.

### Task 13.2 — CSV/JSON Export (backend)

- [ ] **Files:** `backend/app/api/v1/endpoints/reports.py`
- **Add** two more export endpoints:
  ```python
  @router.get("/projects/{project_id}/report/csv")
  async def export_findings_csv(project_id: int, ...):
      # Return findings as CSV with columns: title, severity, status, asset, cve_id, description, remediation
      # Use Python's csv module, return as StreamingResponse with text/csv content type

  @router.get("/projects/{project_id}/report/json")
  async def export_findings_json(project_id: int, ...):
      # Return findings as a JSON array
      # Include all finding fields plus related asset info
  ```
- These should respect the same project ownership check as the PDF endpoint.

### Task 13.3 — Export UI (frontend)

- [ ] **Files:** `frontend/src/pages/Findings.tsx` (or `Dashboard.tsx`), `frontend/src/lib/api.ts`
- **Add** to `api.ts`:
  ```typescript
  export const reports = {
    downloadPdf: (projectId: number) => api.get(`/projects/${projectId}/report/pdf`, { responseType: 'blob' }),
    downloadCsv: (projectId: number) => api.get(`/projects/${projectId}/report/csv`, { responseType: 'blob' }),
    downloadJson: (projectId: number) => api.get(`/projects/${projectId}/report/json`, { responseType: 'blob' }),
  };
  ```
- **Add** an "Export" dropdown button on the Findings page header (next to any existing action buttons):
  - Options: "Download PDF Report", "Export CSV", "Export JSON"
  - On click, call the API, create a Blob URL, trigger download via an `<a>` element
  - Show a loading spinner while generating
- **Icons:** `FileText` for PDF, `FileSpreadsheet` for CSV, `FileJson` for JSON (lucide-react)
- **Style:** Use the existing dropdown/menu pattern from the codebase. Green accent on hover.

### Task 13.4 — Scan Scheduling (backend)

- [ ] **Files:** `backend/app/models/base.py`, `backend/app/services/scheduler.py` (new), `backend/app/api/v1/endpoints/scans.py`, `backend/app/main.py`
- **Add** fields to the Scan model:
  ```python
  schedule_cron = Column(String(100), nullable=True)  # Cron expression: "0 2 * * *" = daily at 2am
  schedule_enabled = Column(Boolean, default=False)
  next_run_at = Column(DateTime, nullable=True)
  last_run_at = Column(DateTime, nullable=True)
  ```
- **Create Alembic migration** for these new fields.
- **Create** `backend/app/services/scheduler.py`:
  1. A function `check_scheduled_scans(db)` that queries all scans where `schedule_enabled=True` and `next_run_at <= now()`
  2. For each due scan: clone it as a new scan execution (same targets, same profile), dispatch to Celery, update `last_run_at` and compute `next_run_at` from the cron expression
  3. Use the `croniter` library to parse cron expressions and compute next run time. Add `croniter` to `requirements.txt`.
- **Add a background task** in `main.py` startup that runs `check_scheduled_scans` every 60 seconds using `asyncio.create_task` with a loop. Keep it simple — no need for APScheduler or Celery Beat.
- **Update** the scan create/update endpoints to accept `schedule_cron` and `schedule_enabled` fields.
- **Validation:** Only accept valid cron expressions. Return 400 with a clear message if the cron is invalid. Minimum interval: 1 hour (reject `* * * * *` or anything that runs more than once per hour).

### Task 13.5 — Scan Scheduling UI (frontend)

- [ ] **Files:** `frontend/src/pages/Scans.tsx`, `frontend/src/lib/api.ts`
- **Update** the scan creation form:
  1. Add a "Schedule" toggle switch below the targets field
  2. When enabled, show a schedule selector with presets:
     - Daily at 2:00 AM (`0 2 * * *`)
     - Weekly on Monday at 2:00 AM (`0 2 * * 1`)
     - Monthly on the 1st at 2:00 AM (`0 2 1 * *`)
     - Custom (shows a cron expression input with help text)
  3. The preset buttons are selectable chips; selecting one fills in the cron field
- **Update** the scan history table:
  1. Add a "Schedule" column showing the schedule status (icon: `Clock` for scheduled, `—` for one-time)
  2. Show `next_run_at` in a tooltip on hover
- **Update** `api.ts` scan types to include the new schedule fields.

### Task 13.6 — Finding Deduplication (backend)

- [ ] **Files:** `backend/app/services/tasks.py`, `backend/app/models/base.py`
- **Problem:** When the same scan runs twice against the same target, identical findings are created as new rows. This inflates finding counts and makes the data useless over time.
- **Add** a `fingerprint` field to the Finding model:
  ```python
  fingerprint = Column(String(64), nullable=True, index=True)  # SHA-256 hash for dedup
  ```
- **Create Alembic migration** for this field.
- **Compute fingerprint** when creating findings in `tasks.py`:
  ```python
  import hashlib
  def compute_finding_fingerprint(title: str, severity: str, affected_component: str, cve_id: str = None) -> str:
      raw = f"{title}|{severity}|{affected_component}|{cve_id or ''}"
      return hashlib.sha256(raw.encode()).hexdigest()
  ```
- **Dedup logic** in scan result processing:
  1. Before creating a new finding, check if a finding with the same fingerprint already exists for this project
  2. If it exists and status is "open": update `last_seen_at` timestamp, skip creating duplicate
  3. If it exists and status is "resolved"/"false_positive": leave it alone (don't reopen automatically — that's a future feature)
  4. If it doesn't exist: create new finding as normal
- **Add** `first_seen_at` and `last_seen_at` fields to the Finding model (DateTime, default=now). These help users understand finding age.
- **Test:** Run the same scan twice. Second run should NOT create duplicate findings — it should update `last_seen_at` on existing ones.

---

## Phase 14: Notifications, Finding Details & Dashboard Improvements

> **Priority:** P1 — UX improvements that make daily use much better.
> **Context:** Users need to be notified when scans complete, need a proper finding detail page (not just a table row), and the dashboard needs more actionable data.

### Task 14.1 — In-App Notification System (backend)

- [ ] **Files:** `backend/app/models/base.py`, `backend/app/api/v1/endpoints/notifications.py` (new), `backend/app/services/tasks.py`
- **Create** a Notification model:
  ```python
  class Notification(Base):
      __tablename__ = "notifications"
      id = Column(Integer, primary_key=True)
      user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
      title = Column(String(200), nullable=False)
      message = Column(Text, nullable=True)
      type = Column(String(50), nullable=False)  # "scan_complete", "critical_finding", "system"
      is_read = Column(Boolean, default=False)
      created_at = Column(DateTime, default=func.now())
      link = Column(String(500), nullable=True)  # Optional link to related resource
  ```
- **Create Alembic migration.**
- **Create** notification endpoints:
  ```
  GET    /notifications/          — List notifications for current user (paginated, newest first)
  PUT    /notifications/{id}/read — Mark as read
  POST   /notifications/read-all  — Mark all as read
  DELETE /notifications/{id}      — Delete a notification
  GET    /notifications/unread-count — Return count of unread notifications
  ```
- **Trigger notifications** in `tasks.py`:
  1. When a scan completes: create notification for the user who created the scan
     - Title: "Scan Complete: {scan_name}"
     - Message: "Found {count} findings ({critical} critical, {high} high)"
     - Type: "scan_complete"
     - Link: "/scans" (or scan detail URL)
  2. When a critical finding is discovered: create notification
     - Title: "Critical Finding: {finding_title}"
     - Type: "critical_finding"
     - Link: "/findings/{finding_id}"

### Task 14.2 — Notification Bell UI (frontend)

- [ ] **Files:** `frontend/src/components/Sidebar.tsx` (or header component), `frontend/src/lib/api.ts`
- **Add** notification API calls to `api.ts`:
  ```typescript
  export const notifications = {
    list: (params?: { limit?: number; offset?: number }) => api.get('/notifications/', { params }),
    markRead: (id: number) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
    unreadCount: () => api.get('/notifications/unread-count'),
  };
  ```
- **Add** a notification bell icon in the sidebar header or top nav area:
  1. Show a `Bell` icon (lucide-react) with an unread count badge (red circle with number)
  2. Poll `GET /notifications/unread-count` every 30 seconds (simple `setInterval`, no WebSocket needed yet)
  3. Clicking the bell opens a dropdown/panel showing recent notifications
  4. Each notification shows: icon (based on type), title, time ago, read/unread state
  5. Clicking a notification marks it as read and navigates to the `link` URL
  6. "Mark all as read" button at the top of the panel
- **Style:** Match the existing sidebar/dark theme. Unread notifications have a subtle green left border.

### Task 14.3 — Finding Detail Page (frontend)

- [ ] **Files:** `frontend/src/pages/FindingDetail.tsx` (new), `frontend/src/App.tsx`, `frontend/src/lib/api.ts`
- **Create** a new page at route `/projects/:projectId/findings/:findingId`
- **The page should show:**
  1. **Header:** Finding title, severity badge (color-coded), status badge
  2. **Metadata section:** CVE ID (linked to NVD), CVSS score, EPSS score, affected asset, scanner that found it, first seen / last seen dates
  3. **Description:** Full finding description
  4. **Remediation:** Current remediation text (editable textarea) + "Get AI Suggestion" button
  5. **AI Suggestion panel:** When "Get AI Suggestion" is clicked, call the existing AI remediation endpoint, show the result in a styled panel with a green border
  6. **Status actions:** Buttons to change status: "Open", "In Progress", "Resolved", "False Positive"
  7. **History/Timeline:** (stretch) Show when the finding was first seen, last seen, status changes
- **Navigation:** From the Findings page table, clicking a finding row should navigate to this detail page.
- **Add** route in `App.tsx`: `<Route path="/projects/:projectId/findings/:findingId" element={<FindingDetail />} />`
- **Style:** Dark theme, same card layout as other pages. Use the full width for the detail content.

### Task 14.4 — Dashboard Improvements (frontend)

- [ ] **Files:** `frontend/src/pages/Dashboard.tsx`
- **Current state:** Dashboard shows basic stat cards and a severity chart.
- **Improvements:**
  1. **Trend chart:** Add a line chart showing findings over time (last 30 days). X-axis = date, Y-axis = open finding count. Use the existing charting library or add `recharts` if not present. Group by severity.
  2. **Recent scan activity:** Show the last 5 scans with status, duration, and finding count. Link to scan details.
  3. **Top vulnerable assets:** Show top 5 assets ranked by total open findings (critical weighted x4, high x3, medium x2, low x1). Show a mini bar chart or progress bar.
  4. **Quick actions panel:** Buttons for "New Scan", "Export Report", "View All Findings" — shortcuts to common tasks.
  5. **Finding age widget:** Show how many findings are older than 30/60/90 days (SLA tracking).
- **Backend support:** If any of these need new endpoints (e.g., findings over time), create them:
  ```python
  @router.get("/findings/stats/trend")
  async def findings_trend(project_id: int, days: int = 30, ...):
      # Return daily finding counts for the last N days grouped by severity
  ```
- **Keep the dashboard fast.** Use efficient SQL aggregations, not N+1 queries.

---

## Phase 15: RBAC, Additional Scanners & Compliance

> **Priority:** P2 — Enterprise features for teams and compliance.
> **Context:** Multi-user teams need role-based access. More scanner integrations increase coverage. Compliance mapping helps enterprises justify security work.

### Task 15.1 — Role-Based Access Control (backend)

- [ ] **Files:** `backend/app/models/base.py`, `backend/app/api/v1/endpoints/users.py`, `backend/app/core/security.py`
- **Add** a Role model or enum:
  ```python
  class UserRole(str, Enum):
      ADMIN = "admin"       # Full access, manage users, manage all projects
      MANAGER = "manager"   # Create/manage projects, run scans, view all project data
      ANALYST = "analyst"   # View findings, update finding status, cannot run scans
      VIEWER = "viewer"     # Read-only access to assigned projects
  ```
- **Add** `role` field to User model (default="analyst").
- **Add** a ProjectMember junction table:
  ```python
  class ProjectMember(Base):
      __tablename__ = "project_members"
      user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
      project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
      role = Column(String(50), default="analyst")  # Role within this project
      added_at = Column(DateTime, default=func.now())
  ```
- **Create Alembic migration.**
- **Update** all endpoints to check permissions:
  1. Admin: full access
  2. Manager: CRUD on their projects, can assign users to projects
  3. Analyst: can view and update findings on their assigned projects
  4. Viewer: read-only on assigned projects
- **Add** endpoints:
  ```
  POST   /projects/{id}/members    — Add a user to a project (admin/manager)
  DELETE /projects/{id}/members/{user_id} — Remove user from project
  GET    /projects/{id}/members    — List project members
  ```

### Task 15.2 — Team Management UI (frontend)

- [ ] **Files:** `frontend/src/pages/Settings.tsx` (or `frontend/src/pages/TeamManagement.tsx` new)
- **Add** a "Team" section in Settings (or a separate page):
  1. List all users (admin only) with role, email, active status
  2. Create user form (admin only): username, email, role selector
  3. Edit user: change role, toggle active, reset password
  4. Project membership: on the project settings, show/manage who has access
- **Role indicator:** Show the current user's role in the sidebar (small badge under username)

### Task 15.3 — Additional Scanner: OpenVAS Integration

- [ ] **Files:** `backend/app/services/scanners.py`, `backend/app/services/scan_profiles.py`
- **Add** OpenVAS/GVM scanner integration:
  1. Connect to OpenVAS via its GMP (Greenbone Management Protocol) API
  2. Create a scan target, start scan, poll for completion, parse results
  3. Map OpenVAS findings to the VSCX Finding model
- **Add** to scan profiles:
  ```python
  "full_audit": {
      "label": "Full Security Audit",
      "description": "Comprehensive scan using OpenVAS + Nmap + Nuclei. Takes 30+ minutes.",
      "steps": [
          {"scanner": "nmap", "options": "-sV -sC -O -T4 -p-"},
          {"scanner": "nuclei", "options": "-severity critical,high,medium,low"},
          {"scanner": "openvas", "options": "full_and_fast"},
      ],
      "timeout": 3600,
  }
  ```
- **Install:** Add OpenVAS/GVM to the install script as an optional component.
- **Config:** Add `OPENVAS_HOST`, `OPENVAS_PORT`, `OPENVAS_USERNAME`, `OPENVAS_PASSWORD` to settings.

### Task 15.4 — Compliance Framework Mapping

- [ ] **Files:** `backend/app/models/base.py`, `backend/app/services/compliance.py` (new), `backend/app/api/v1/endpoints/compliance.py` (new)
- **Create** a compliance mapping system:
  1. Define compliance frameworks as JSON data files: `backend/app/data/compliance/`
     - `cis_benchmarks.json` — CIS Controls v8 mapping
     - `nist_csf.json` — NIST Cybersecurity Framework
     - `owasp_top10.json` — OWASP Top 10 2021
  2. Each framework entry maps a control ID to related CVE patterns, finding titles, or scanner check IDs
  3. A ComplianceReport model tracks compliance posture per project per framework
- **Endpoints:**
  ```
  GET  /compliance/frameworks        — List available frameworks
  GET  /compliance/{project_id}/{framework}  — Get compliance status for a project
  POST /compliance/{project_id}/{framework}/generate — Generate/refresh compliance report
  ```
- **The compliance report** should show: total controls, controls met, controls failed, controls not tested. For each control: ID, title, status, linked findings.
- **Frontend:** Add a "Compliance" page showing a compliance dashboard with framework selector and control-by-control status table.

### Task 15.5 — Compliance UI (frontend)

- [ ] **Files:** `frontend/src/pages/Compliance.tsx` (new), `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/lib/api.ts`
- **Add** a "Compliance" nav item in the sidebar with a `ClipboardCheck` icon (lucide-react)
- **Add** route in `App.tsx`: `/compliance`
- **Page layout:**
  1. Framework selector: tabs or dropdown for CIS, NIST, OWASP
  2. Summary cards: Total controls, Passing, Failing, Not Assessed — with percentage bar
  3. Controls table: ID, Title, Status (green checkmark / red X / gray dash), Linked Findings count
  4. Clicking a control row expands to show linked findings
- **Style:** Same dark theme. Status colors: green for passing, red for failing, gray for not assessed.

---

## Reference

### Stable Checkpoint
```
Commit: c20c2c8
Date: 2026-03-15
Description: Fix login page crash and deployment issues
Command: git checkout c20c2c8
```

### Key Paths
```
backend/app/core/config.py          — Settings, env vars
backend/app/models/base.py          — Database models
backend/app/api/v1/endpoints/       — API routes
backend/app/services/scanners.py    — Scanner implementations
backend/app/services/tasks.py       — Celery scan execution
backend/app/services/celery_app.py  — Celery configuration
frontend/src/pages/                 — Page components
frontend/src/components/            — Shared components
frontend/src/lib/api.ts             — API client
frontend/src/index.css              — CSS variables, theme
docker/docker-compose.yml           — Docker infrastructure
```

### Testing
```bash
# Backend tests
cd backend && python -m pytest tests/ -v

# Frontend type check
cd frontend && npx tsc --noEmit

# Check celery worker logs for scan issues
docker-compose -f docker/docker-compose.yml logs --tail=50 celery

# Check backend logs for startup issues
docker-compose -f docker/docker-compose.yml logs --tail=50 backend
```

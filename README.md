# XOGAME.AI

A video-first recruitment MVP with a standalone marketing site, searchable opportunities, a reusable professional profile, video upload, free applications, employer review, and organisation verification. All critical actions persist in SQLite.

**Open access by design:** no accounts, signup, login, passwords, tokens, or sessions. Everyone shares one fictional candidate and can explore every workspace, including administration. Use synthetic information only. This is a functional demo, not a private production recruitment service. See [spec overrides](docs/OVERRIDES.md) and [release decisions](docs/OPEN_DECISIONS.md).

[Workspace preview](docs/screenshots/workspace.png) · [Landing preview](docs/screenshots/landing.png) · [Mobile preview](docs/screenshots/mobile.png)

Verified locally: **8 API tests + 7 browser tests**, production build, ESLint, Ruff, Prettier, responsive layouts and automated accessibility scans pass.

## Structure

- `frontend/` — React 19, Vite, strict TypeScript, Tailwind CSS 4, TanStack Query, React Router.
- `backend/` — FastAPI, Pydantic, versioned SQLite migration, idempotent development seed, local video processing.
- `landing/` — independent HTML, CSS and ES6 JavaScript, custom SVG/DOM previews; no framework.
- `tests/` — API integration tests and Playwright browser journeys.
- `docs/` — API guide, decisions and task-by-task implementation status.

## Requirements

Python 3.12+, Node.js 22.12+ (or 24), npm, **ffmpeg and ffprobe** on PATH. Video validation and conversion need both binaries. Install them with your operating system's package manager (`brew install ffmpeg` on macOS or `sudo apt-get install ffmpeg` on Debian/Ubuntu).

## Run the complete build

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm ci --prefix frontend
npm --prefix frontend run build
python -m backend.seed
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

On Windows, activate with `.venv\Scripts\activate` and ensure ffmpeg is on PATH. The seed and version-1 schema migration also run automatically at startup. Repeated starts preserve saved data. SQLite and media files are ignored by Git.

Open:

- App: <http://localhost:8000/jobs>
- Standalone landing: <http://localhost:8000/landing/>
- Interactive API documentation: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/v1/health>

For frontend development, keep FastAPI running and start `npm --prefix frontend run dev`. Use <http://localhost:5173>; Vite proxies `/api` and `/landing` to FastAPI. Each application starts independently: the backend has its own server, the frontend its Vite server, and the landing can be served with `python -m http.server 8080 --directory landing`. The standalone landing links to port 5173 when served separately. A different deployment can set an explicit app URL in `landing/app.js`.

## Configuration

Defaults work without creating an environment file. Copy `.env.example` to `.env` to change them; start FastAPI with `uvicorn backend.main:app --env-file .env --port 8000`. Vite reads its environment at build time; set `VITE_API_URL` in the build shell or `frontend/.env` for a separate backend. Same-origin `/api/v1` is recommended.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_PATH` | `backend/xogame.db` | SQLite file, relative to the working directory or absolute |
| `MEDIA_PATH` | `backend/media` | Local media directory; never mount as static files |
| `MAX_VIDEO_MB` | `100` | Upload size limit |
| `MAX_VIDEO_SECONDS` | `120` | Validated duration limit |
| `CORS_ORIGINS` | localhost/127.0.0.1 on 5173 | Comma-separated permitted browser origins |
| `VITE_API_URL` | `/api/v1` | Frontend API base URL |

No secrets are required. Invalid integer media configuration fails at startup. Open access means media API routes are intentionally reachable without authentication; unguessable identifiers do not provide privacy.

## Try the full journey

1. Open **Professional profile**. The fictional Alex Morgan profile is editable; add/remove repeatable education, experience, projects and certifications, then save.
2. Open **Video résumé**, select a short MP4/WebM, and explicitly consent. Upload progress, cancellation, processing, failure and ready states are real. The server probes the actual file and produces playable MP4. PDF/text resumes are rejected.
3. Open an opportunity, review the saved profile and video, check sharing consent, then submit a **free application**. Incomplete profiles, unavailable jobs and duplicate applications are rejected by the API.
4. Open **Employer workspace**, choose **Forma Studio**, then **Applicant review**. Review the snapshot and video, save a note, and shortlist or reject. Revisit **My applications** to see the persisted status and events.
5. Choose **Orbit Works** in Employer workspace. Its draft cannot publish until approved. Open **Platform review**, approve the fictional organisation, then return and publish the draft. For a new organisation, first save its details, upload evidence and submit for review.

All seeded organisations and jobs are fictional and explicitly labeled as demo records. Eight active opportunities are publicly discoverable initially. Draft, closed, expired, submitted, rejected and suspended fixtures exercise availability rules. No successful application or ready video is fabricated: upload a real test clip first.

## Checks

```bash
.venv/bin/ruff check backend tests/test_api.py scripts
.venv/bin/ruff format --check backend tests/test_api.py scripts
.venv/bin/python -m pytest -q
npm --prefix frontend run lint
npm --prefix frontend run build
cd frontend
npx playwright install chromium
CHROMIUM_PATH="$(node -e "process.stdout.write(require('playwright').chromium.executablePath())")" npx playwright test
```

On this managed environment `/usr/bin/chromium` is available and is the default test executable. Browser tests start port **8010** with a disposable SQLite database and media directory; they never use your development records. Tests cover persisted profile/video/application/review journeys, free fees, stale transitions, duplicate prevention, invalid media, search and network recovery, verification gating, dialog Escape/focus restoration, mobile navigation, and overflow at 320/375/768/1024/1440px. GitHub Actions runs these checks on pushes and pull requests. It verifies code; it does not deploy a staging environment.

## Data, backup and reset

Migration version 1 is recorded in SQLite's `migrations` table. Database writes use transactions; application uniqueness is enforced in SQLite, and status updates require the expected current state. Application snapshots preserve exactly the profile shared at submission.

Stop API uploads before taking a database-and-media snapshot:

```bash
.venv/bin/python scripts/backup.py create backend work/backup
.venv/bin/python scripts/backup.py restore work/backup work/restored
DATABASE_PATH=work/restored/xogame.db MEDIA_PATH=work/restored/media .venv/bin/uvicorn backend.main:app --port 8000
```

Choose a new destination each time. Restoration checks SQLite integrity and rewrites stored media paths. Back up both database **and** media. A restore into a temporary directory was tested during the audit. For a fresh local demo, stop the server, move `backend/xogame.db` (and any `-wal`/`-shm` files) and `backend/media` to a backup directory, then run `python -m backend.seed`. Never do this on data you intend to retain.

Successful video replacement revokes older ready videos, including playback from earlier applications. Explicit deletion also revokes playback. Restart-interrupted processing is marked failed with retry guidance. Background processing runs in the API process; a durable external worker, signed private object storage, quotas, rate limiting, finalized legal policies and real-user privacy remain release decisions, not implemented production guarantees.

See [API contracts](docs/API.md), [task status](docs/IMPLEMENTATION_STATUS.md), and [open decisions](docs/OPEN_DECISIONS.md). The original BUILD_SPEC is preserved, with completed applicable items checked and user overrides documented at the top.

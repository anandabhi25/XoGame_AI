# User-directed specification overrides

The build request takes precedence over BUILD_SPEC v1.0:
- React + Vite + strict TypeScript + Tailwind replaces Next.js.
- FastAPI + SQLite replaces NestJS + Prisma + PostgreSQL.
- Open access replaces all registration, authentication, credentials, tokens, sessions, RBAC and password recovery. No login or signup screens are built. A shared candidate workspace and explicit organisation selector support evaluation immediately.
- Standalone vanilla landing page is additional required scope.
- Alabaster/white/ink and cobalt #0055FF replace the original black/ivory theme.

Open access means everyone can view and modify shared demo information, including administration. Organisation-scoped endpoints prevent accidental cross-organisation selection but do not establish identity or privacy. Do not enter sensitive or real candidate information. Private authenticated deployment is outside this explicitly open-access build.

The managed workspace reserves /workspace/.git read-only; this repository lives at /workspace/xogame.

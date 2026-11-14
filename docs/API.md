# API contracts

Base path: `/api/v1`. Interactive schemas: `/docs`. Raw schema: `/openapi.json` (also checked in as `docs/openapi.json`).

**Every endpoint is open access.** There are no authorization headers, tokens or cookies. Organisation IDs scope record selection, not user permissions. No real personal data should be used.

## Response convention

Successful calls return `{ "data": ... }`. Search also returns `meta` with page, limit, total and totalPages. Mutations return success only after SQLite commits. Errors use `{ "error": { "code": "HTTP_409", "message": "..." } }`. Validation errors have code `VALIDATION_ERROR` and `details` containing field/message pairs. HTTP status is authoritative. Request IDs are returned in `X-Request-ID`. Request bodies and PII are not logged.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Health |
| GET | `/api/v1/config` | Config |
| GET | `/api/v1/jobs` | Jobs |
| GET | `/api/v1/jobs/{job_id}` | Job Detail |
| GET | `/api/v1/candidate/profile` | Profile |
| PUT | `/api/v1/candidate/profile` | Save Profile |
| GET | `/api/v1/candidate/readiness` | Get Readiness |
| GET | `/api/v1/jobs/{job_id}/eligibility` | Eligibility |
| POST | `/api/v1/candidate/videos` | Upload Video |
| GET | `/api/v1/candidate/videos/current` | Current Video |
| GET | `/api/v1/videos/{video_id}/media` | Media |
| DELETE | `/api/v1/candidate/videos/{video_id}` | Delete Video |
| POST | `/api/v1/jobs/{job_id}/applications` | Apply |
| GET | `/api/v1/candidate/applications` | Applications |
| GET | `/api/v1/candidate/notifications` | Notifications |
| PATCH | `/api/v1/candidate/notifications/{notification_id}/read` | Read Notification |
| GET | `/api/v1/organisations` | Organisations |
| POST | `/api/v1/organisations` | Create Org |
| POST | `/api/v1/organisations/{org_id}/documents` | Upload Document |
| GET | `/api/v1/admin/documents/{document_id}` | Document |
| POST | `/api/v1/organisations/{org_id}/verification` | Submit Verification |
| GET | `/api/v1/admin/verifications` | Verifications |
| PATCH | `/api/v1/admin/verifications/{org_id}` | Verify |
| GET | `/api/v1/employer/{org_id}/jobs` | Employer Jobs |
| POST | `/api/v1/employer/{org_id}/jobs` | Create Job |
| PUT | `/api/v1/employer/{org_id}/jobs/{job_id}` | Update Job |
| POST | `/api/v1/employer/{org_id}/jobs/{job_id}/{action}` | Publish Job |
| GET | `/api/v1/employer/{org_id}/applications` | Employer Applications |
| PATCH | `/api/v1/employer/{org_id}/applications/{application_id}/status` | Update Status |
| POST | `/api/v1/employer/{org_id}/applications/{application_id}/notes` | Add Note |
| GET | `/api/v1/admin/users` | Users |
| PATCH | `/api/v1/admin/users/{candidate_id}` | Suspend |
| GET | `/api/v1/admin/audit` | Audit Log |

## Business rules

- Public search only includes published, non-expired jobs belonging to VERIFIED organisations. Filters compose in SQLite with server pagination. Keyword search is case-insensitive SQLite LIKE matching on title, skills, domain, description, summary and organisation name; `%` and `_` follow LIKE wildcard semantics. Sort is deterministic recent order, or title-first relevance when requested.
- Profile saves validate lengths, email, dates, salary ranges and repeatable sections. Readiness is calculated from saved fields plus the latest video state, consent and candidate suspension.
- Video upload is multipart `file` + `consent=true`. Filename, MIME, content signature, size, actual video stream and duration are checked. It returns 202 PROCESSING; poll `/candidate/videos/current` for READY/FAILED. Playback supports HTTP range requests. Replacement and deletion revoke older playback.
- Organisation evidence is multipart `file`, up to 10 MB, PDF/PNG/JPEG magic-byte validation. Files are returned as attachments. There is no malware scanner or identity boundary.
- Application submission requires `confirmProfileSharing=true` and the current `videoResumeId`. Optionally supply `Idempotency-Key`; reusing it for a different job/video is a conflict. SQLite prevents duplicates even without this header. A profile snapshot, video reference, event, notification and consent audit metadata are written transactionally. Fee is always zero.
- Status transitions: SUBMITTED → VIEWED/SHORTLISTED/REJECTED; VIEWED → SHORTLISTED/REJECTED; SHORTLISTED → REJECTED; REJECTED is terminal. `expectedCurrentStatus` prevents stale decisions.
- Verification transitions: NOT_SUBMITTED/REJECTED → SUBMITTED through submission with evidence; SUBMITTED → UNDER_REVIEW/VERIFIED/REJECTED; UNDER_REVIEW → VERIFIED/REJECTED; VERIFIED → SUSPENDED; SUSPENDED → VERIFIED/REJECTED. Rejection/suspension require a reason. Seeded SUBMITTED fixtures intentionally have no actual evidence.
- In-app notifications persist and can be marked read. Employer status changes become visible through polling or refresh.

## Error statuses

404 missing/scoped-out/unavailable record; 409 duplicate or stale/invalid state; 413 oversized file; 415 unsupported/mismatched media; 422 invalid schema, missing readiness/consent or policy; 403 suspended candidate mutation or unverified publication. These business-state 403 responses do not introduce authentication.

## Known contract limits

Pydantic request schemas and query parameters are fully documented in OpenAPI. Dynamic response envelopes do not yet have detailed generated Pydantic response models. Local startup failures are surfaced by uvicorn; a reverse proxy should handle process-level availability for deployment.

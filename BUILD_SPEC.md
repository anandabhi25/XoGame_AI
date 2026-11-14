# BUILD_SPEC.md

**Project:** XOGAME.AI  
**Specification Version:** 1.0  
**Source:** XOGAME PRD v1.0 (10 November 2026), existing HTML prototype, and Product/UX Gap Audit  
**Target Agent:** OpenAI Codex  
**Build Objective:** Production-oriented MVP  
**Priority:** P0 functionality first, P1 usability second, scope cleanup third

---

# 1. Project Overview & Core Goal

XOGAME.AI is a video-first recruitment platform where candidates create reusable professional profiles with video resumes, discover relevant jobs, and apply free of charge to opportunities published by verified employers. The product solves the limitations of text-only recruitment by giving candidates a richer professional identity and employers structured applications with video-based candidate evaluation.

## Core Product Principles

1. Video resumes are the only accepted resume format; reject PDF and text resume uploads.
2. Candidates can maintain structured information including skills, education, experience, projects, certifications, and employment preferences.
3. Job applications must always be free.
4. Only administrator-approved organisations may display verified badges or publish jobs.
5. Employers may review only candidate information they are authorised to access.
6. Candidates must explicitly consent to sharing professional information and video resumes.
7. Support desktop, tablet, and mobile devices.
8. Use a modular architecture that supports future assessments without implementing them in this MVP.
9. Preserve the existing premium black-and-ivory visual identity.
10. Prioritise job discovery and successful applications over marketing content.

## MVP Success Definition

The MVP is complete only when the following end-to-end journey works with persisted data:

Candidate registration
→ Professional profile creation
→ Video resume upload
→ Job discovery
→ Job details
→ Free application
→ Employer application review
→ Shortlist/reject decision
→ Candidate status update.

An administrator must be able to verify employers before their jobs become publicly available.

Do not mark the MVP complete based on visually functional pages, simulated confirmations, or hardcoded datasets.

## Implementation Rules for Codex

- Inspect the existing repository before making changes.
- Treat the supplied HTML prototype as the visual reference, not the final architecture.
- Preserve working visual components where appropriate.
- Do not preserve prototype-only simulated behaviours.
- Do not introduce features absent from this specification.
- Do not substitute mock functionality for required backend behaviour.
- Use TypeScript and strict typing.
- Prefer simple, maintainable implementations over unnecessary abstractions.
- Use real persistent application state for all critical journeys.
- Implement and test one functional vertical slice at a time.
- Maintain a clear distinction between completed features, mocks, and deferred functionality.
- Never display a successful action unless the backend confirms success.
- Do not invent real employer identities, verification statuses, payment transactions, or candidate data.
- Document assumptions and unresolved business decisions rather than silently treating them as approved requirements.

---

# 2. Tech Stack & Constraints

## 2.1 Existing Prototype

The supplied prototype is a standalone HTML application containing:

- HTML5 markup.
- Inline CSS.
- Vanilla JavaScript.
- Six hardcoded job records.
- Client-side keyword and city filtering.
- Dynamically rendered job details.
- Simulated application modal.
- Placeholder registration and employer onboarding actions.
- Temporary toast notifications.
- Basic responsive CSS.

The prototype has no observable backend integration, database persistence, real authentication, or upload infrastructure.

## 2.2 Target Technology Stack

Use the technology direction specified in the PRD.

| Layer | Required Technology | Implementation Convention |
|---|---|---|
| Frontend | Next.js + React + TypeScript | App Router |
| Styling | Tailwind CSS | Shared design tokens and reusable components |
| Backend | Node.js + NestJS | REST API with modular services |
| Database | PostgreSQL | Prisma ORM and versioned migrations |
| Validation | Zod frontend, class-validator backend | Validate on both client and server |
| Authentication | Secure email/password authentication | Argon2id hashing and HttpOnly session cookies |
| Authorization | RBAC | Candidate, employer, organisation admin, platform admin |
| Media storage | AWS S3 or compatible object storage | Private buckets and signed access URLs |
| Video processing | Background worker | Queue-based asynchronous processing |
| State management | React state + TanStack Query | Local UI state separated from server state |
| Forms | React Hook Form + Zod | Accessible validation |
| Testing | Vitest/Jest + Playwright | Unit, integration, E2E |
| API documentation | OpenAPI/Swagger | Versioned endpoints |
| Logging | Structured server logs | Request IDs and audit events |
| Deployment | Managed cloud infrastructure | Separate development, staging, production |

Use a modular monolith for the backend.

Do not introduce microservices, Kafka, Kubernetes, Redis-based caching, or a dedicated search engine unless required by an observed technical need.

Redis may be introduced only if necessary for the selected production-grade background processing implementation.

## 2.3 Recommended Repository Structure

```text
xogame/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/
│   │   │   │   ├── (auth)/
│   │   │   │   ├── candidate/
│   │   │   │   ├── employer/
│   │   │   │   └── admin/
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── layout/
│   │   │   │   ├── jobs/
│   │   │   │   ├── candidate/
│   │   │   │   ├── employer/
│   │   │   │   └── video/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   └── public/
│   └── api/
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── candidates/
│       │   ├── videos/
│       │   ├── organisations/
│       │   ├── verification/
│       │   ├── jobs/
│       │   ├── applications/
│       │   ├── recruitment/
│       │   ├── notifications/
│       │   ├── administration/
│       │   ├── audit/
│       │   └── common/
│       └── prisma/
├── packages/
│   └── shared/
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── decisions/
│   └── testing/
├── tests/
├── .env.example
├── docker-compose.yml
├── BUILD_SPEC.md
└── README.md
```

Keep cross-module business logic in backend services rather than React components.

## 2.4 Design System

Preserve the existing visual identity wherever it does not conflict with usability.

### Design Tokens

```css
:root {
  --color-ink: #171717;
  --color-paper: #ffffff;
  --color-wash: #f6f6f4;
  --color-border: #e7e7e7;
  --color-muted: #737373;
  --color-success: #176b45;
  --color-danger: #b42318;
  --color-warning: #a15c07;

  --content-width: 1160px;
  --radius-sm: 3px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Typography

- Use Inter or an equivalent sans-serif for interface copy.
- Use a restrained serif display font for major headings.
- Preserve the XOGAME wordmark design only after confirming the approved brand treatment.
- Do not force a cursive font on every navigation brand element.
- Maintain readable contrast and minimum practical body text sizes.

### Responsive Breakpoints

- Mobile: 320–767px.
- Tablet: 768–1023px.
- Desktop: 1024px and above.

### Accessibility

Implement WCAG 2.2 AA-aligned interaction patterns.

- Use semantic HTML.
- Ensure buttons and links have accessible names.
- Provide visible keyboard focus.
- Support keyboard-only navigation.
- Implement accessible dialogs with focus management.
- Provide accessible validation errors.
- Do not use colour as the only means of communicating status.
- Respect reduced-motion preferences.
- Provide captions or appropriate accessibility guidance for candidate video playback.
- Prevent horizontal overflow at 320px width.

## 2.5 Security Constraints

- Hash passwords using Argon2id.
- Store authentication sessions in secure HttpOnly cookies.
- Enable Secure cookies in production.
- Apply SameSite and CSRF protection appropriate to the authentication architecture.
- Validate all API input server-side.
- Enforce RBAC and record ownership on every protected endpoint.
- Restrict private video access using short-lived signed URLs.
- Never expose permanent public candidate-video URLs.
- Reject unsupported file types and oversized uploads.
- Validate file contents, not only filename extensions.
- Enforce upload ownership and processing-state checks.
- Rate-limit authentication, search abuse, and file-upload initiation.
- Log sensitive administrative and recruitment actions.
- Do not expose passwords, private verification documents, secrets, or signed media URLs in application logs.
- Use environment variables for credentials.
- Provide backup and restoration procedures.
- Keep production candidate information out of development seed data.

## 2.6 Product Decisions Not Yet Approved

The PRD explicitly leaves the following decisions unresolved:

- Initial launch geography.
- Employer posting pricing.
- Maximum video duration and size.
- Supported video formats.
- Public candidate discoverability.
- Employer verification evidence.
- Video retention and deletion policy.
- Assessment mandatory/optional rules.
- Assessment pricing and refunds.
- Notification channels.
- Data retention and applicable legal requirements.

Implementation rule:

Do not invent binding business policies.

For unresolved decisions:

1. Implement configurable policy interfaces where necessary.
2. Use clearly documented development-only defaults.
3. Keep these values outside hardcoded frontend business logic.
4. Mark unresolved decisions in `docs/decisions/OPEN_DECISIONS.md`.
5. Require an approved configuration before production deployment.

For local development, permit MP4 and WebM videos with a configurable sample limit of 100 MB and 120 seconds. These are implementation defaults, not approved product limits.

For MVP, restrict candidate-profile access to authorised employer users through submitted applications unless another policy is explicitly approved.

---

# 3. Prioritized Build Tasks (Checklist)

## Phase 1 — Critical PRD Gaps & Core Flows

Complete Phase 1 before spending significant effort on Phase 2 polish.

### Epic 1: Foundation and Architecture

- [ ] **P0-FND-01 — Initialize the application structure.** Configure a company-controlled repository with Next.js frontend, NestJS backend, shared types, environment configuration, formatting, linting, and strict TypeScript. **Acceptance:** Both applications build and start independently; repository structure matches Section 2.

- [ ] **P0-FND-02 — Configure PostgreSQL.** Implement Prisma schema, migrations, database connection handling, and local development setup. **Acceptance:** Database migrations run successfully from a clean environment and required entities persist.

- [ ] **P0-FND-03 — Establish API conventions.** Configure `/api/v1` routing, standardized responses, request validation, error handling, and OpenAPI documentation. **Acceptance:** Every implemented API endpoint has request/response schemas and documented error codes.

- [ ] **P0-FND-04 — Implement environment and secrets management.** Provide `.env.example`, development configuration, production-safe secret handling, and startup validation. **Acceptance:** Application fails clearly when required configuration is missing; no real secrets are committed.

- [ ] **P0-FND-05 — Create development seed data.** Replace the six JavaScript job objects with database-backed sample organisations and jobs. **Acceptance:** Seed data can be loaded and reset; sample accounts are explicitly marked as development-only.

- [ ] **P0-FND-06 — Implement audit logging.** Record identity, organisation verification, job publication, application status changes, and sensitive administrative actions. **Acceptance:** Audit records contain actor, action, target, timestamp, and permitted metadata.

### Epic 2: Homepage and Job Discovery

- [ ] **P0-UI-01 — Rebuild the HTML prototype as reusable React components.** Extract header, footer, hero, search form, job cards, employer sections, and dialogs. **Acceptance:** Components have isolated responsibilities and no duplicated page-level markup.

- [ ] **P0-UI-02 — Preserve the premium design system.** Implement shared typography, spacing, colours, buttons, and status tokens. **Acceptance:** All public pages use the same theme and remain visually aligned with the prototype.

- [ ] **P0-UI-03 — Build the responsive homepage `/`.** Show wordmark, keyword search, location, domain selector, Search action, recent jobs, verified employers, candidate CTA, employer CTA, and footer. **Acceptance:** All required homepage elements are visible and functional on mobile, tablet, and desktop.

- [ ] **P0-SRC-01 — Implement real job search.** Query published, active, non-expired jobs through the backend. **Acceptance:** Results originate from PostgreSQL; changing persisted jobs changes search results.

- [ ] **P0-SRC-02 — Implement keyword and skill search.** Search job title, skills, work domain, and relevant job description fields. **Acceptance:** Case-insensitive searches return relevant results using documented matching rules.

- [ ] **P0-SRC-03 — Implement location filtering.** Support city, location and remote-work discovery. **Acceptance:** Search filters work independently and in combination.

- [ ] **P0-SRC-04 — Implement domain/category selection.** Replace reliance on free-text domain inference with structured domain values. **Acceptance:** Every domain chip and directory link uses a canonical category ID.

- [ ] **P0-SRC-05 — Implement paginated results `/jobs`.** Display job title, organisation, verification status, location, employment type, experience, work arrangement, salary when disclosed, publication date, and summary. **Acceptance:** Results support pagination without loading all records into the browser.

- [ ] **P0-SRC-06 — Implement persistent search URLs.** Store search terms, filters, sort order, and page number in URL query parameters. **Acceptance:** Refreshing, sharing, and navigating back preserve the search state.

- [ ] **P0-SRC-07 — Implement job details `/jobs/[id]`.** Display every applicable PRD §6.3 field. **Acceptance:** Details are fetched by ID; unpublished jobs are inaccessible publicly; missing optional fields are not fabricated.

- [ ] **P0-SRC-08 — Enforce job availability.** Prevent application to draft, closed, expired, unpublished, or otherwise unavailable jobs. **Acceptance:** Both UI and API deny ineligible application attempts.

- [ ] **P0-UI-04 — Implement the verified-employer section.** Display organisations with confirmed verified status only. **Acceptance:** The UI never derives a verified badge from hardcoded presentation data.

### Epic 3: Authentication and Candidate Registration

- [ ] **P0-AUTH-01 — Build candidate registration `/signup`.** Collect full name, email, password, and explicit Terms/Privacy consent. **Acceptance:** Invalid submissions are rejected; valid candidates are persisted with the candidate role.

- [ ] **P0-AUTH-02 — Build secure login `/login`.** Authenticate users by email and password. **Acceptance:** Invalid credentials produce a generic error; successful authentication creates a secure session.

- [ ] **P0-AUTH-03 — Implement logout.** Terminate the authenticated session server-side. **Acceptance:** Protected routes become inaccessible after logout.

- [ ] **P0-AUTH-04 — Enforce role-based access.** Separate candidate, employer recruiter, organisation administrator, and platform administrator access. **Acceptance:** Unauthorised routes and API calls return 403 without leaking private data.

- [ ] **P0-AUTH-05 — Preserve application intent across authentication.** Return candidates to the selected job after login or registration. **Acceptance:** Authentication does not lose the job ID or create an application automatically.

- [ ] **P0-AUTH-06 — Enforce account status.** Block suspended accounts from protected actions. **Acceptance:** Suspended users cannot continue authenticated business operations.

### Epic 4: Candidate Professional Profile

- [ ] **P0-CAN-01 — Build candidate profile editor `/candidate/profile`.** Capture name, photograph, headline, location, preferred locations, summary, skills, experience, education, projects, certifications, languages, expected salary, notice period, and employment preferences. **Acceptance:** Every required PRD profile field can be stored and edited.

- [ ] **P0-CAN-02 — Implement repeatable profile sections.** Support multiple experience, education, project, and certification records. **Acceptance:** Records can be created, edited, and deleted independently.

- [ ] **P0-CAN-03 — Implement server-side profile validation.** Validate field formats, lengths, required application fields, and record ownership. **Acceptance:** Invalid data never persists even when client validation is bypassed.

- [ ] **P0-CAN-04 — Implement profile completion calculation.** Calculate completion based on approved minimum application requirements. **Acceptance:** Completion responds to actual saved data and never uses a hardcoded percentage.

- [ ] **P0-CAN-05 — Enforce video-only resume policy.** Remove or reject all PDF/text resume upload paths. **Acceptance:** Resume uploads accept only approved video formats while structured text profile fields remain available.

### Epic 5: Video Resume

- [ ] **P0-VID-01 — Build video resume upload `/candidate/video`.** Support authenticated upload initiation, format validation, size validation, progress display, and cancellation. **Acceptance:** Unsupported files receive explicit validation errors.

- [ ] **P0-VID-02 — Implement private video storage.** Store media in a private S3-compatible bucket. **Acceptance:** Media is inaccessible through unauthenticated permanent public URLs.

- [ ] **P0-VID-03 — Implement background processing.** Validate media metadata and prepare playable output asynchronously. **Acceptance:** Video state transitions through pending, uploading, processing, ready, or failed as appropriate.

- [ ] **P0-VID-04 — Implement video preview.** Provide controlled playback after processing succeeds. **Acceptance:** Candidates can preview their own uploaded video before applying.

- [ ] **P0-VID-05 — Implement video replacement and deletion.** Allow replacement with another valid video and deletion subject to the approved retention policy. **Acceptance:** Previously active video cannot remain available through stale access links after access is revoked.

- [ ] **P0-VID-06 — Implement video consent settings.** Capture explicit consent for recording/uploading and employer sharing. **Acceptance:** Applications cannot share a video without valid consent.

- [ ] **P0-VID-07 — Block applications without a ready video.** Validate successful processing before application creation. **Acceptance:** Processing, failed, deleted, or missing videos do not satisfy the video requirement.

### Epic 6: Employer Registration and Verification

- [ ] **P0-EMP-01 — Build employer registration `/employer/signup`.** Capture legal organisation name, organisation type, website, business email, registered address, industry, representative, and contact details. **Acceptance:** Organisations and their initial administrator are persisted.

- [ ] **P0-EMP-02 — Implement verification submission.** Accept configured verification evidence using secure uploads. **Acceptance:** Submission changes status from NOT_SUBMITTED to SUBMITTED and creates an audit record.

- [ ] **P0-EMP-03 — Build verification administration `/admin/verifications`.** Display pending submissions and permitted evidence to authorised platform administrators. **Acceptance:** Administrators can review submissions without exposing documents to unrelated accounts.

- [ ] **P0-EMP-04 — Implement approve/reject actions.** Require administrator authorization and record decisions. **Acceptance:** Only an approved verification request can transition an organisation to VERIFIED.

- [ ] **P0-EMP-05 — Enforce verified-only publishing.** Block unverified, rejected, and suspended organisations from publishing jobs. **Acceptance:** Unauthorized publication fails at the API level regardless of UI state.

- [ ] **P0-EMP-06 — Derive verification badges from persisted status.** Never hardcode the verified flag. **Acceptance:** Verified badges disappear when an organisation loses verified eligibility.

### Epic 7: Employer Job Management

- [ ] **P0-JOB-01 — Build employer dashboard `/employer/dashboard`.** Display organisation details, verification status, drafts, active jobs, closed jobs, and applicant counts. **Acceptance:** Counts reflect actual persisted records.

- [ ] **P0-JOB-02 — Build job creation `/employer/jobs/new`.** Capture title, domain, description, responsibilities, skills, experience, qualifications, location, work arrangement, employment type, optional salary, deadline, and vacancies. **Acceptance:** Valid jobs can be saved as drafts.

- [ ] **P0-JOB-03 — Implement job publication.** Require VERIFIED organisation status and complete job information. **Acceptance:** Published jobs become discoverable through the public search API.

- [ ] **P0-JOB-04 — Implement job editing.** Permit authorized organisation users to edit supported fields. **Acceptance:** Updates persist and are reflected in job details.

- [ ] **P0-JOB-05 — Implement job closure.** Allow authorized employers to close published jobs. **Acceptance:** Closed jobs reject new applications and display the correct status.

- [ ] **P0-JOB-06 — Implement job listing management `/employer/jobs`.** Display draft, published, closed, and expired job records. **Acceptance:** Employers cannot view or modify jobs belonging to other organisations.

### Epic 8: Free Job Application

- [ ] **P0-APP-01 — Implement Apply action.** Open an authenticated application review flow from an eligible job. **Acceptance:** Unauthenticated candidates are redirected to login/signup with preserved job context.

- [ ] **P0-APP-02 — Validate profile and video readiness.** Check minimum required professional fields, active video status, and sharing consent on the server. **Acceptance:** Incomplete candidates receive explicit field-level remediation requirements.

- [ ] **P0-APP-03 — Build application review modal/page.** Display the exact candidate profile information and video resume that will be shared. **Acceptance:** The preview uses persisted candidate data, not a generic static summary.

- [ ] **P0-APP-04 — Enforce free applications.** Create applications without charging tokens or invoking payment services. **Acceptance:** Application fees are always zero; no wallet or assessment transaction is created.

- [ ] **P0-APP-05 — Persist applications.** Create an application linked to candidate, job, organisation, and active video reference. **Acceptance:** Successful submission produces an application ID and stored timestamp.

- [ ] **P0-APP-06 — Prevent duplicate active applications.** Enforce uniqueness transactionally. **Acceptance:** Repeated submissions cannot produce duplicate active application records.

- [ ] **P0-APP-07 — Build application confirmation.** Display success only after backend confirmation. **Acceptance:** Candidate sees application reference, job details, and a link to application history.

- [ ] **P0-APP-08 — Build `/candidate/applications`.** List submitted applications and their current statuses. **Acceptance:** Statuses reflect authorized employer updates.

### Epic 9: Employer Applicant Review

- [ ] **P0-REC-01 — Build applicant list `/employer/jobs/[id]/applications`.** Show applicants associated with the employer's job. **Acceptance:** List excludes applications from unrelated organisations.

- [ ] **P0-REC-02 — Build applicant detail view.** Display permitted structured candidate information. **Acceptance:** Only authorized employer users may access candidate records.

- [ ] **P0-REC-03 — Implement employer video playback.** Generate time-limited video access after authorization checks. **Acceptance:** Employers can play the video associated with the application; unrelated employers cannot.

- [ ] **P0-REC-04 — Implement shortlist and reject actions.** Update application status using backend-controlled transitions. **Acceptance:** Status changes persist and create application events.

- [ ] **P0-REC-05 — Propagate status updates.** Display new application status to the candidate. **Acceptance:** Candidate application history reflects employer changes after refresh or refetch.

### Epic 10: Platform Administration

- [ ] **P0-ADM-01 — Build `/admin/dashboard`.** Restrict access to platform administrators. **Acceptance:** Administrators can access verification and permitted user-management functions.

- [ ] **P0-ADM-02 — Implement user administration.** Permit authorized administrators to view and suspend accounts. **Acceptance:** Suspension is enforced by backend authorization.

- [ ] **P0-ADM-03 — Implement secure upload validation.** Validate video and verification-document upload types, sizes, and ownership. **Acceptance:** Unsupported or malicious files cannot become trusted application media.

- [ ] **P0-ADM-04 — Implement access control tests.** Test cross-user, cross-role, and cross-organisation access. **Acceptance:** Unauthorized requests return 401/403/404 as appropriate without exposing protected content.

---

## Phase 2 — UX Polish, Empty/Error/Loading States

This is the second phase of this BUILD_SPEC implementation plan.

It is not the PRD's separately deferred assessment-engine Phase 2.

### Search UX

- [ ] **P1-UX-01 — Add search loading state.** Show skeleton job cards while results load. **Acceptance:** Users receive visible feedback during network requests.

- [ ] **P1-UX-02 — Improve zero-results state.** Show "No jobs found", preserve selected filters, and provide Reset filters. **Acceptance:** Reset returns users to the unfiltered job listing.

- [ ] **P1-UX-03 — Handle search errors.** Display a retry action when the search API fails. **Acceptance:** Retrying preserves keyword, location, domain, and filters.

- [ ] **P1-UX-04 — Add experience, employment type, and work-arrangement filters.** Implement PRD P1 discovery filters. **Acceptance:** Filters compose correctly and persist in the URL.

- [ ] **P1-UX-05 — Implement search sorting.** Support relevance and most-recent sorting. **Acceptance:** Results use deterministic server-side sorting.

- [ ] **P1-UX-06 — Add verified-employer filtering.** Support explicit verified-only results. **Acceptance:** Filtering uses authoritative organisation verification status.

### Candidate UX

- [ ] **P1-UX-07 — Add inline form validation.** Display errors next to invalid fields and summarize errors when appropriate. **Acceptance:** Users can identify and correct validation failures using keyboard or screen reader.

- [ ] **P1-UX-08 — Add account recovery.** Implement secure password reset or an approved recovery mechanism. **Acceptance:** Users can recover access without exposing account existence unnecessarily.

- [ ] **P1-UX-09 — Add profile completion guidance.** Highlight missing application-critical fields. **Acceptance:** Each missing requirement links to the relevant editor section.

- [ ] **P1-UX-10 — Add upload progress and retry UI.** Display progress, processing, failed, ready, and retry states. **Acceptance:** Recoverable upload failures can be retried without losing candidate profile data.

- [ ] **P1-UX-11 — Add application submission loading state.** Disable repeated submission while a request is pending. **Acceptance:** A retry or double-click cannot create duplicate applications.

- [ ] **P1-UX-12 — Add application failure recovery.** Display actionable error messages and preserve user context. **Acceptance:** Failed submissions never display success and can be safely retried.

- [ ] **P1-UX-13 — Implement candidate dashboard `/candidate/dashboard`.** Show profile completion, video status, recommended jobs, recent applications, application statuses, notifications, and relevant assessment placeholders only when enabled. **Acceptance:** Dashboard data originates from backend APIs; disabled future features are not presented as operational.

- [ ] **P1-UX-14 — Implement application notifications.** Generate in-app confirmations and status-change notifications. **Acceptance:** Notifications persist and link to the correct application.

### Employer UX

- [ ] **P1-UX-15 — Add empty applicant states.** Show a clear message when no applications exist. **Acceptance:** Empty states do not display fabricated candidates.

- [ ] **P1-UX-16 — Add employer verification progress.** Display submitted, under-review, verified, rejected, and suspended states. **Acceptance:** State transitions match backend verification records.

- [ ] **P1-UX-17 — Add employer applicant filters.** Support filtering by application status and permitted candidate attributes. **Acceptance:** Filters operate only within the authorised organisation and job.

- [ ] **P1-UX-18 — Add internal recruitment notes.** Save notes visible only to authorized employer users. **Acceptance:** Candidates and unrelated employers cannot access notes.

- [ ] **P1-UX-19 — Add recruitment activity history.** Display application status changes with timestamps. **Acceptance:** History reflects stored application events.

- [ ] **P1-UX-20 — Add organisation member management.** Allow organisation administrators to invite and assign recruiter permissions. **Acceptance:** Invitations and role changes cannot grant platform-admin privileges.

### Navigation and Accessibility

- [ ] **P1-UX-21 — Implement mobile navigation.** Replace hidden desktop links with an accessible menu. **Acceptance:** All essential public and role-specific destinations remain reachable on mobile.

- [ ] **P1-UX-22 — Implement accessible dialogs.** Trap focus, restore focus, support Escape, and expose appropriate dialog labels. **Acceptance:** Modal workflows pass keyboard interaction tests.

- [ ] **P1-UX-23 — Implement dedicated error pages.** Create 404, 403, unexpected-error, and unavailable-service states. **Acceptance:** Error messages provide safe recovery actions.

- [ ] **P1-UX-24 — Implement functional legal and support pages.** Provide Privacy, Terms, and Support routes. **Acceptance:** Footer links navigate correctly; registration captures policy acceptance.

- [ ] **P1-UX-25 — Run responsive and accessibility testing.** Validate at 320px, 375px, 768px, 1024px, and 1440px. **Acceptance:** No critical overflow, inaccessible controls, broken layouts, or keyboard traps.

### Quality and Operations

- [ ] **P1-QA-01 — Implement automated E2E tests.** Cover candidate application, employer recruitment, and security scenarios from PRD §29. **Acceptance:** Critical journeys pass against a test database.

- [ ] **P1-QA-02 — Implement monitoring and error reporting.** Capture API errors, upload failures, search latency, and application failures. **Acceptance:** Errors can be correlated to requests without leaking private data.

- [ ] **P1-QA-03 — Implement backups and recovery testing.** Configure database backups and document restoration steps. **Acceptance:** A test restoration succeeds.

- [ ] **P1-QA-04 — Configure staging deployment and CI/CD.** Run type checks, linting, tests, and migrations in the delivery pipeline. **Acceptance:** Failed checks prevent deployment.

- [ ] **P1-QA-05 — Instrument MVP metrics.** Track registrations, profile completions, video upload success/failure, searches, applications, verification activity, and employer reviews. **Acceptance:** Events use documented schemas without collecting unnecessary private candidate information.

---

## Phase 3 — Scope Cleanup

- [ ] **P2-CLEAN-01 — Remove simulated application success.** Delete the frontend-only `confirmApply()` behaviour that displays success without backend persistence. **Acceptance:** Every success notification follows a confirmed API response.

- [ ] **P2-CLEAN-02 — Remove placeholder registration actions.** Replace `showToast()` placeholders with real navigation. **Acceptance:** Sign-in, registration, employer onboarding, and profile CTAs lead to implemented routes.

- [ ] **P2-CLEAN-03 — Remove hardcoded verification badges.** Replace static "VERIFIED ORGANIZATION" strings with verification-derived status. **Acceptance:** Unverified organisations never display verified badges.

- [ ] **P2-CLEAN-04 — Remove runtime hardcoded job arrays.** Move all sample jobs into development seed data. **Acceptance:** Public job search uses backend records exclusively.

- [ ] **P2-CLEAN-05 — Correct industry shortcut mapping.** Replace first-word string matching with domain IDs. **Acceptance:** Every shortcut returns semantically appropriate results.

- [ ] **P2-CLEAN-06 — Remove duplicated job descriptions.** Separate summary and full description. **Acceptance:** Job details do not repeat identical blocks unnecessarily.

- [ ] **P2-CLEAN-07 — Standardize navigation and routing.** Replace DOM visibility toggles for job pages with Next.js routes. **Acceptance:** Browser back, forward, refresh, and deep linking work.

- [ ] **P2-CLEAN-08 — Simplify homepage assessment marketing.** Keep only a brief future-capabilities statement if desired. **Acceptance:** Users are not led to believe unavailable assessments are operational.

- [ ] **P2-CLEAN-09 — Consolidate CSS.** Remove duplicate or conflicting wordmark and typography overrides. **Acceptance:** Components use shared design tokens.

- [ ] **P2-CLEAN-10 — Remove unnecessary prototype decorations.** Normalize icons, decorative numbering, button labels, and inactive controls. **Acceptance:** Every interactive-looking control has a meaningful action.

- [ ] **P2-CLEAN-11 — Remove unused components and dependencies.** Delete obsolete code after migration. **Acceptance:** No dead prototype handlers or unnecessary runtime packages remain.

---

# 4. User Flows & State Logic

## 4.1 Candidate Registration

### Route

`/signup`

### Expected Flow

1. Display full name, email, password, password confirmation, and Terms/Privacy consent.
2. Validate fields client-side.
3. Submit registration to backend.
4. Repeat all security-relevant validation server-side.
5. Reject duplicate email registration.
6. Create user with CANDIDATE role.
7. Persist consent version and timestamp.
8. Establish authenticated session.
9. Redirect to `/candidate/profile`.
10. If registration originated from Apply, preserve intended job and return to it after completing prerequisites.

### Validation

Development defaults:

```text
fullName:
  required
  trimmed length 2–120 characters

email:
  required
  valid email structure
  normalized for duplicate checking
  maximum 254 characters

password:
  required
  minimum 12 characters
  maximum 128 characters
  checked against the supported password policy

passwordConfirmation:
  must equal password

termsAccepted:
  must be true
```

Never persist password confirmation.

### States

```text
IDLE
VALIDATING
SUBMITTING
SUCCESS
VALIDATION_ERROR
DUPLICATE_EMAIL
NETWORK_ERROR
```

### Edge Cases

- Duplicate email → show safe account-exists guidance.
- Weak password → reject.
- Missing consent → block submission.
- Network failure → retain entered non-sensitive fields and permit retry.
- Duplicate submit → disable button while request is pending.
- Existing authenticated candidate → redirect to dashboard.
- Employer account → do not silently change account role.
- Suspended account → deny authenticated access.

---

## 4.2 Candidate Profile Creation

### Route

`/candidate/profile`

### Steps

1. Fetch candidate profile.
2. Populate saved fields.
3. Display editable professional sections.
4. Validate changes.
5. Save each section or explicit Save action.
6. Recalculate profile completion.
7. Preserve changes across page refresh.

### Minimum Application Readiness

Until a stricter founder-approved profile policy exists, use this development rule:

```text
required:
  fullName
  professionalHeadline
  location
  professionalSummary
  at least one skill
  at least one education or experience record
  active video with READY status
  valid video sharing consent
```

This is a configurable implementation assumption, not a PRD-approved mandatory-field list.

Use backend configuration for readiness rules.

### States

```text
EMPTY
INCOMPLETE
COMPLETE
SAVING
SAVE_SUCCESS
SAVE_ERROR
```

### Edge Cases

- Blank required field → show validation.
- Invalid salary value → reject.
- Duplicate certification or skill → prevent duplicates where appropriate.
- Save failure → retain unsaved edits.
- User refreshes after save → load persisted records.
- User attempts editing another profile → return 403.

---

## 4.3 Video Resume Upload

### Route

`/candidate/video`

### Steps

1. Display current video status.
2. Display approved upload limits.
3. Require necessary video-processing/sharing consent.
4. User selects a video.
5. Validate extension, declared MIME type, and configured size limit client-side.
6. Request an authenticated upload authorization.
7. Upload to private storage.
8. Confirm upload with backend.
9. Backend validates stored media.
10. Start asynchronous processing.
11. Show processing status.
12. Enable preview when status becomes READY.
13. Enable replacement/deletion subject to retention policy.

### Video States

```text
NOT_UPLOADED
PENDING_UPLOAD
UPLOADING
PROCESSING
READY
FAILED
DELETED
```

### Edge Cases

| Condition | Required Response |
|---|---|
| Unsupported video type | Reject with supported format guidance |
| Exceeds size limit | Reject before upload when detectable; verify again server-side |
| Corrupted video | Mark FAILED and offer replacement |
| Interrupted upload | Allow safe retry without creating an active partial video |
| Processing failure | Show failed state with retry/replacement path |
| Processing pending | Do not permit application |
| User replaces video | Preserve old ready video until replacement succeeds, subject to policy |
| User deletes active video | Enforce approved retention/access policy and update readiness |
| Unauthorized video request | Deny access |
| Expired signed playback URL | Request fresh authorized URL |

Never make candidate videos publicly accessible by default.

---

## 4.4 Job Search

### Routes

`/`

`/jobs`

### Inputs

```text
keyword
city
domainId
skills
experienceMin
experienceMax
employmentType
workArrangement
salaryMin
salaryMax
datePosted
companyId
verifiedOnly
sort
page
limit
```

Implement the MVP filters first; add P1/P2 filters according to the task checklist.

### Steps

1. User enters keyword, location, or domain.
2. User selects Search.
3. Navigate to `/jobs` with query parameters.
4. Fetch results from backend.
5. Return only publicly eligible jobs.
6. Render paginated cards.
7. Display result count.
8. Permit sorting and filter changes.
9. Preserve search state in URL.

### States

```text
IDLE
LOADING
SUCCESS
EMPTY
ERROR
```

### Search Rules

- Match keywords case-insensitively.
- Trim whitespace.
- Apply filters using AND between different filter categories.
- Match multiple permitted values within one category according to documented OR semantics.
- Return only PUBLISHED jobs from currently eligible organisations.
- Exclude CLOSED and EXPIRED jobs from active discovery by default.
- Use deterministic sorting.
- Default page size: 10.
- Maximum page size: 50.
- Default sorting: RELEVANCE when keyword exists, NEWEST otherwise.
- Do not fabricate relevance scores or result counts.

### Edge Cases

- Empty search → show recent eligible jobs.
- Zero results → show empty state and reset action.
- Invalid page → return validation error or normalize to page 1.
- Page beyond result count → show empty pagination state safely.
- Search service unavailable → show retry.
- Stale query → cancel or ignore outdated frontend responses.
- Location "Remote" → match jobs marked REMOTE.
- Domain shortcut → use canonical domain ID.
- Deleted/unpublished job → remove from active results.

---

## 4.5 Job Detail

### Route

`/jobs/[id]`

### Required Content

```text
jobTitle
organisationName
verificationStatus
organisationProfile
description
responsibilities
requiredSkills
qualifications
experience
location
workArrangement
employmentType
salaryIfDisclosed
applicationDeadlineIfApplicable
assessmentRequirementsIfApplicable
assessmentChargesIfApplicable
applyButton
```

### Apply Button States

```text
ELIGIBLE
LOGIN_REQUIRED
PROFILE_INCOMPLETE
VIDEO_REQUIRED
VIDEO_PROCESSING
CONSENT_REQUIRED
ALREADY_APPLIED
JOB_CLOSED
JOB_EXPIRED
SUBMITTING
```

### Edge Cases

- Job ID not found → 404.
- Job unpublished → 404 for public users.
- Job closed → show closed status; disable Apply.
- Deadline passed → disable Apply.
- Already applied → show View Application.
- Invalid employer verification → prevent new applications according to eligibility policy.
- Salary not disclosed → display "Not disclosed", not zero.
- No assessments configured → do not invent assessment steps.
- Future assessment unsupported → do not provide a nonfunctional payment/start action.

---

## 4.6 Free Job Application

### Route

`/jobs/[id]/apply`

A responsive modal may be used, but the workflow must support deep linking and browser navigation.

### Exact Flow

1. User selects Apply.
2. Backend checks job eligibility.
3. If unauthenticated, redirect to login with a safe return URL.
4. If authenticated as non-candidate, block candidate application.
5. Fetch candidate readiness.
6. If incomplete, display missing requirements.
7. Redirect candidate to missing profile/video sections.
8. After completion, restore application context.
9. Display actual profile and video information to be shared.
10. Display "Application fee: Free (₹0)".
11. Request explicit confirmation.
12. Submit application creation request.
13. Backend revalidates all requirements.
14. Persist application transactionally.
15. Create initial SUBMITTED status event.
16. Return application ID.
17. Display persistent confirmation.
18. Make application visible in candidate history and employer applicant list.

### Critical Rules

```text
applicationFee = 0
tokenDeduction = 0
paymentRequired = false
```

Do not instantiate wallet transactions as a side effect of applying.

### Submission States

```text
NOT_STARTED
CHECKING_ELIGIBILITY
BLOCKED
READY_FOR_REVIEW
SUBMITTING
SUBMITTED
FAILED
ALREADY_SUBMITTED
```

### Edge Cases

| Condition | Required Response |
|---|---|
| Missing professional fields | Show missing requirements |
| Missing video | Route to video upload |
| Video processing | Block until READY |
| Consent missing | Request consent |
| Duplicate application | Return existing application context, never create duplicate |
| Job closes during submission | Reject safely |
| Candidate session expires | Require reauthentication and preserve job context |
| Network timeout | Check idempotent submission result before retry |
| API validation failure | Display exact supported remediation |
| Database failure | Roll back transaction |
| Successful submission | Show persisted application reference |

### Transaction Requirements

- Enforce candidate/job uniqueness for active applications using database constraints.
- Use an idempotency key for submission requests.
- Create application and initial event atomically.
- Never send success before commit.
- Queue notifications only after successful persistence.
- Do not expose another candidate's application through predictable IDs.

---

## 4.7 Employer Registration and Verification

### Routes

`/employer/signup`

`/employer/verification`

`/admin/verifications`

### Flow

1. Employer creates organisation account.
2. Organisation receives NOT_SUBMITTED verification status.
3. Administrator/representative uploads required evidence.
4. Backend validates files and metadata.
5. Organisation submits verification.
6. Status becomes SUBMITTED, then UNDER_REVIEW when review begins.
7. Platform administrator reviews evidence.
8. Administrator approves or rejects.
9. Approved organisation becomes VERIFIED.
10. Only verified organisations may publish jobs.

### Verification States

```text
NOT_SUBMITTED
SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

### Edge Cases

- Missing evidence → reject submission.
- Invalid document type → reject upload.
- Unauthorized reviewer → 403.
- Rejected organisation → show reason where permitted and supported resubmission workflow.
- Suspended organisation → block publication.
- Verification status changed during publication → recheck in transaction.
- Duplicate approval request → avoid duplicate state transitions.
- Previously verified organisation suspended → remove verified eligibility immediately.

---

## 4.8 Employer Job Management

### Routes

`/employer/dashboard`

`/employer/jobs`

`/employer/jobs/new`

`/employer/jobs/[id]/edit`

### Job States

```text
DRAFT
PUBLISHED
CLOSED
EXPIRED
```

Additional moderation state may be stored separately.

### Rules

- DRAFT jobs are not publicly discoverable.
- Only VERIFIED organisations may publish.
- Published jobs require complete required fields.
- Closed jobs cannot accept new applications.
- Expired jobs cannot accept new applications.
- Employers may edit only their own organisation's jobs.
- Job changes must be audited.
- Existing applications remain historically accessible according to privacy and retention policy.

### Edge Cases

- Publish without verification → 403.
- Publish with incomplete fields → 422.
- Edit unrelated organisation job → 403/404.
- Close already closed job → return stable state without duplicate effects.
- Deadline expires → mark ineligible immediately at query/application validation time.
- Concurrent modification → enforce updatedAt/version checks where necessary.

---

## 4.9 Employer Applicant Review

### Route

`/employer/jobs/[id]/applications`

### Flow

1. Employer recruiter opens an owned job.
2. System fetches applications.
3. Employer selects a candidate.
4. System checks organisation membership and permissions.
5. Display structured profile and video.
6. Employer reviews information.
7. Employer selects Shortlist or Reject.
8. Backend validates status transition.
9. Save new status and application event.
10. Candidate dashboard reflects updated status.

### Application Statuses

```text
SUBMITTED
VIEWED
SHORTLISTED
ASSESSMENT_PENDING
INTERVIEW
SELECTED
REJECTED
WITHDRAWN
```

Only implement the statuses and transitions supported by MVP workflows; retain the complete enum for future extension.

### Initial Allowed Transitions

```text
SUBMITTED -> VIEWED
SUBMITTED -> SHORTLISTED
SUBMITTED -> REJECTED

VIEWED -> SHORTLISTED
VIEWED -> REJECTED

SHORTLISTED -> INTERVIEW

INTERVIEW -> SELECTED
INTERVIEW -> REJECTED
```

Other transitions require explicit backend rules and product approval.

### Edge Cases

- Candidate video unavailable → show error and protected retry, never an unrestricted fallback URL.
- Employer membership revoked → block access immediately.
- Candidate sharing consent withdrawn → enforce resulting access restrictions.
- Invalid status transition → 409.
- Concurrent recruiter updates → use optimistic concurrency control.
- Empty applicant list → show empty state.
- Rejected applicant → retain authorized historical records according to policy.
- Unrelated organisation → deny access.

---

## 4.10 Candidate Application Tracking

### Route

`/candidate/applications`

### Flow

1. Fetch current candidate's applications.
2. Display job, employer, submission date, and status.
3. Show status timeline where events exist.
4. Open application details.
5. Reflect employer updates after refetch or notification.

### Edge Cases

- No applications → show discovery CTA.
- Job subsequently closed → preserve existing application history.
- Employer changes status → display new status.
- Candidate attempts accessing another application → deny.
- Notification delivery fails → persisted application status remains authoritative.

---

## 4.11 Global UI State Rules

Use explicit state rather than overlapping Boolean flags.

Recommended async state model:

```typescript
type AsyncStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error";

interface AsyncState<T> {
  status: AsyncStatus;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

Rules:

- Never display both loading and success indicators simultaneously.
- Never replace an error with a success toast.
- Never clear user-entered data after a recoverable error.
- Disable dangerous repeat actions while pending.
- Provide an explicit retry for recoverable network failures.
- Display role-appropriate access-denied states.
- Keep server state authoritative.
- Use optimistic updates only where rollback and concurrency behaviour are defined.
- Do not show fake counts, candidates, applications, or transactions.

---

# 5. Data Models & API Contracts

## 5.1 General API Convention

Base URL:

```text
/api/v1
```

Use JSON request/response bodies except signed-media uploads.

### Success Envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "req_example"
  }
}
```

### Paginated Success Envelope

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "requestId": "req_example"
  }
}
```

### Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "details": [
      {
        "field": "email",
        "message": "Enter a valid email address."
      }
    ]
  },
  "meta": {
    "requestId": "req_example"
  }
}
```

### HTTP Status Conventions

| Code | Meaning |
|---|---|
| 200 | Successful read/update |
| 201 | Resource created |
| 204 | Successful action without response body |
| 400 | Malformed request |
| 401 | Authentication required |
| 403 | Authenticated but unauthorized |
| 404 | Resource not found or deliberately concealed |
| 409 | Duplicate/conflicting state |
| 413 | Upload exceeds permitted size |
| 415 | Unsupported media type |
| 422 | Valid request structure but failed business validation |
| 429 | Rate limit exceeded |
| 500 | Unexpected server failure |
| 503 | Service temporarily unavailable |

Use consistent UUID identifiers and ISO 8601 UTC timestamps.

## 5.2 Core Database Entities

Implement these entities in Prisma.

```text
User
CandidateProfile
CandidateEducation
CandidateExperience
CandidateSkill
CandidateProject
CandidateCertification
VideoResume
Organisation
OrganisationMember
VerificationRequest
VerificationDocument
Job
JobSkill
Application
ApplicationEvent
Notification
ConsentRecord
AuditLog
IdempotencyRecord
```

Future assessment and wallet entities must remain outside the MVP runtime implementation.

### User

```typescript
type UserRole =
  | "CANDIDATE"
  | "EMPLOYER_RECRUITER"
  | "ORG_ADMIN"
  | "PLATFORM_ADMIN";

type UserStatus = "ACTIVE" | "SUSPENDED";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
```

Persist password hashes separately in the authentication model.

Never return password hashes in API responses.

Allow organisation members to carry organisation-scoped roles independently from global platform privileges.

### Candidate Profile

```typescript
interface CandidateProfile {
  id: string;
  userId: string;
  professionalHeadline: string | null;
  location: string | null;
  preferredLocations: string[];
  professionalSummary: string | null;
  profilePhotoKey: string | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  noticePeriodDays: number | null;
  employmentPreferences: string[];
  skills: CandidateSkill[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  projects: CandidateProject[];
  certifications: CandidateCertification[];
  languages: string[];
  profileCompletionPercent: number;
  videoResumeId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

```typescript
interface CandidateSkill {
  id: string;
  name: string;
}

interface CandidateExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

interface CandidateEducation {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface CandidateProject {
  id: string;
  title: string;
  description: string | null;
  projectUrl: string | null;
}

interface CandidateCertification {
  id: string;
  name: string;
  issuer: string | null;
  issuedAt: string | null;
  credentialUrl: string | null;
}
```

Store salary currency explicitly when implementing salary fields; do not assume all records use INR if international rollout is enabled.

### Video Resume

```typescript
type VideoStatus =
  | "PENDING_UPLOAD"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "DELETED";

interface VideoResume {
  id: string;
  candidateId: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
  status: VideoStatus;
  processingErrorCode: string | null;
  sharingConsent: boolean;
  createdAt: string;
  processedAt: string | null;
}
```

Never expose `storageKey` as a public download endpoint.

### Organisation

```typescript
type VerificationStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

interface Organisation {
  id: string;
  legalName: string;
  displayName: string;
  organisationType: string;
  website: string | null;
  businessEmail: string;
  registeredAddress: string;
  industry: string;
  representativeName: string;
  contactInformation: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}
```

### Organisation Member

```typescript
interface OrganisationMember {
  id: string;
  organisationId: string;
  userId: string;
  role: "ORG_ADMIN" | "RECRUITER";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
}
```

### Verification Request

```typescript
interface VerificationRequest {
  id: string;
  organisationId: string;
  status: VerificationStatus;
  documentIds: string[];
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}
```

Store verification files privately and separately from candidate video files.

### Job

```typescript
type JobStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "EXPIRED";

type WorkArrangement = "REMOTE" | "HYBRID" | "ONSITE";

type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "TEMPORARY";

interface Job {
  id: string;
  organisationId: string;
  title: string;
  domainId: string;
  description: string;
  summary: string;
  responsibilities: string[];
  requiredSkills: string[];
  qualifications: string[];
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  city: string;
  state: string | null;
  country: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  applicationDeadline: string | null;
  vacancies: number;
  status: JobStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Verification display must be joined from Organisation rather than independently hardcoded on Job.

### Application

```typescript
type ApplicationStatus =
  | "SUBMITTED"
  | "VIEWED"
  | "SHORTLISTED"
  | "ASSESSMENT_PENDING"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  organisationId: string;
  videoResumeId: string;
  sharedProfileSnapshot: Record<string, unknown>;
  status: ApplicationStatus;
  applicationFee: 0;
  submittedAt: string;
  updatedAt: string;
}
```

Persist a permitted application snapshot so historical review is deterministic.

Enforce current authorization and consent rules before exposing the snapshot or video.

### Application Event

```typescript
interface ApplicationEvent {
  id: string;
  applicationId: string;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  actorUserId: string;
  createdAt: string;
}
```

### Consent Record

```typescript
interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  policyVersion: string;
  granted: boolean;
  recordedAt: string;
}
```

### Audit Log

```typescript
interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  requestId: string;
  createdAt: string;
}
```

Do not store raw video content, passwords, access tokens, or sensitive uploaded documents in audit metadata.

---

## 5.3 Required API Endpoints

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/candidate/register` | Register candidate |
| POST | `/auth/employer/register` | Register initial employer administrator |
| POST | `/auth/login` | Authenticate |
| POST | `/auth/logout` | Terminate session |
| GET | `/auth/me` | Get current user |
| POST | `/auth/password-reset/request` | Request recovery, P1 |
| POST | `/auth/password-reset/confirm` | Complete recovery, P1 |

### Candidate

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/candidate/profile` | Get own profile |
| PATCH | `/candidate/profile` | Update profile |
| GET | `/candidate/profile/readiness` | Validate application readiness |
| GET | `/candidate/applications` | Get application history |
| GET | `/candidate/applications/:id` | Get owned application |

Implement repeatable education, experience, skill, project, and certification management through nested validated profile updates or dedicated endpoints.

### Video

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/candidate/videos/upload-init` | Authorize private upload |
| POST | `/candidate/videos/:id/complete` | Confirm uploaded file |
| GET | `/candidate/videos/:id/status` | Get processing status |
| GET | `/candidate/videos/:id/playback` | Get authorized short-lived playback URL |
| DELETE | `/candidate/videos/:id` | Delete/revoke video according to policy |

### Job Discovery

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/jobs` | Search eligible jobs |
| GET | `/jobs/:id` | Get public job details |
| GET | `/domains` | Get canonical work domains |
| GET | `/organisations/featured` | Get verified featured employers |

### Applications

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/jobs/:id/application-eligibility` | Check candidate eligibility |
| POST | `/jobs/:id/applications` | Submit application |
| GET | `/candidate/applications` | List owned applications |
| GET | `/candidate/applications/:id` | View owned application |

### Employer

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/employer/organisation` | Get owned organisation |
| PATCH | `/employer/organisation` | Update permitted organisation details |
| POST | `/employer/verification` | Submit verification |
| GET | `/employer/verification` | View status |
| GET | `/employer/jobs` | List organisation jobs |
| POST | `/employer/jobs` | Create draft |
| PATCH | `/employer/jobs/:id` | Update job |
| POST | `/employer/jobs/:id/publish` | Publish verified organisation job |
| POST | `/employer/jobs/:id/close` | Close job |
| GET | `/employer/jobs/:id/applications` | List applicants |
| GET | `/employer/applications/:id` | View applicant |
| PATCH | `/employer/applications/:id/status` | Update status |

### Administration

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/verifications` | List verification requests |
| GET | `/admin/verifications/:id` | Review submission |
| POST | `/admin/verifications/:id/approve` | Approve organisation |
| POST | `/admin/verifications/:id/reject` | Reject organisation |
| GET | `/admin/users` | Manage users |
| POST | `/admin/users/:id/suspend` | Suspend user |
| GET | `/admin/audit-logs` | View permitted audit events |

All endpoints require appropriate authentication, authorization, validation, and audit coverage.

---

## 5.4 Example Request and Response Contracts

### Candidate Registration

Request:

```json
{
  "fullName": "Demo Candidate",
  "email": "candidate@example.com",
  "password": "ExampleStrongPassword123!",
  "termsAccepted": true,
  "privacyAccepted": true,
  "policyVersion": "current"
}
```

Response: `201 Created`

```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Demo Candidate",
      "email": "candidate@example.com",
      "role": "CANDIDATE",
      "status": "ACTIVE"
    }
  }
}
```

Authentication credentials must be managed through secure cookies rather than exposing long-lived session tokens in local storage.

### Job Search

Request:

```text
GET /api/v1/jobs?keyword=developer&city=Bengaluru&workArrangement=HYBRID&page=1&limit=10
```

Response:

```json
{
  "data": [
    {
      "id": "job-demo-001",
      "title": "Senior Software Engineer",
      "organisation": {
        "id": "org-demo-001",
        "displayName": "Demo Technology Organisation",
        "verificationStatus": "VERIFIED"
      },
      "city": "Bengaluru",
      "country": "India",
      "workArrangement": "HYBRID",
      "employmentType": "FULL_TIME",
      "experienceMinYears": 4,
      "experienceMaxYears": 7,
      "salaryMin": 1500000,
      "salaryMax": 2500000,
      "salaryCurrency": "INR",
      "salaryPeriod": "YEAR",
      "summary": "Develop scalable software applications.",
      "publishedAt": "2026-11-10T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

All example records are synthetic development data.

Never display them as genuine verified employers in a production environment.

### Application Eligibility

Response:

```json
{
  "data": {
    "eligible": false,
    "jobEligible": true,
    "alreadyApplied": false,
    "missingRequirements": [
      {
        "code": "VIDEO_NOT_READY",
        "message": "Upload and complete processing of your video resume.",
        "actionUrl": "/candidate/video"
      }
    ],
    "applicationFee": {
      "amount": 0,
      "currency": "INR"
    }
  }
}
```

### Submit Application

Request:

```text
POST /api/v1/jobs/{jobId}/applications
Idempotency-Key: unique-client-generated-key
```

```json
{
  "confirmProfileSharing": true,
  "videoResumeId": "550e8400-e29b-41d4-a716-446655440001"
}
```

Response: `201 Created`

```json
{
  "data": {
    "applicationId": "550e8400-e29b-41d4-a716-446655440002",
    "jobId": "550e8400-e29b-41d4-a716-446655440003",
    "status": "SUBMITTED",
    "applicationFee": 0,
    "submittedAt": "2026-11-14T10:00:00Z"
  }
}
```

### Duplicate Application

Response: `409 Conflict`

```json
{
  "error": {
    "code": "ALREADY_APPLIED",
    "message": "You have already applied to this job.",
    "details": {
      "applicationId": "550e8400-e29b-41d4-a716-446655440002"
    }
  }
}
```

### Employer Status Update

Request:

```text
PATCH /api/v1/employer/applications/{applicationId}/status
```

```json
{
  "status": "SHORTLISTED",
  "expectedCurrentStatus": "VIEWED"
}
```

Response:

```json
{
  "data": {
    "applicationId": "550e8400-e29b-41d4-a716-446655440002",
    "previousStatus": "VIEWED",
    "status": "SHORTLISTED",
    "updatedAt": "2026-11-14T12:00:00Z"
  }
}
```

Reject invalid or stale transitions with `409 Conflict`.

---

## 5.5 Frontend State Management

Use TanStack Query for server-derived state.

Suggested query keys:

```typescript
const queryKeys = {
  currentUser: ["auth", "me"],
  candidateProfile: ["candidate", "profile"],
  candidateReadiness: ["candidate", "readiness"],
  candidateApplications: ["candidate", "applications"],
  jobs: (filters: Record<string, unknown>) => ["jobs", filters],
  job: (id: string) => ["job", id],
  applicationEligibility: (jobId: string) => [
    "application-eligibility",
    jobId
  ],
  employerJobs: ["employer", "jobs"],
  employerApplicants: (jobId: string) => [
    "employer",
    "jobs",
    jobId,
    "applications"
  ],
  verificationQueue: ["admin", "verifications"]
};
```

Use local React state for:

```text
modalOpen
mobileMenuOpen
activeFormStep
unsavedFormValues
selectedLocalFile
uploadProgress
notificationVisibility
```

Do not duplicate server state in a global frontend store without a demonstrated requirement.

Invalidate relevant queries after successful mutations.

---

## 5.6 Database Constraints

Implement at minimum:

```text
User.email:
  unique using normalized email semantics

CandidateProfile.userId:
  unique

OrganisationMember:
  unique (organisationId, userId)

Application:
  enforce at most one active application per (candidateId, jobId)

Job:
  index organisationId
  index status
  index domainId
  index city
  index publishedAt

Application:
  index jobId
  index candidateId
  index organisationId
  index status

ApplicationEvent:
  index applicationId, createdAt

VerificationRequest:
  index organisationId, status

VideoResume:
  index candidateId, status

AuditLog:
  index actorUserId
  index resourceType, resourceId
  index createdAt
```

Define whether withdrawn applications can be resubmitted before implementing partial unique constraints.

Until that policy is approved, enforce one application per candidate/job pair.

Use database transactions for:

- Application submission.
- Application status updates and event creation.
- Employer verification decisions.
- Job publication eligibility checks.
- Sensitive organisation membership updates.

---

## 5.7 Development Data

Replace the existing hardcoded JavaScript job objects with a seed script.

Create synthetic development records covering:

```text
Organisations:
  Verified
  Submitted
  Rejected
  Suspended

Jobs:
  Published
  Draft
  Closed
  Expired
  Remote
  Hybrid
  On-site

Candidates:
  Empty profile
  Incomplete profile
  Complete profile without video
  Video processing
  Video ready
  Existing application

Applications:
  Submitted
  Viewed
  Shortlisted
  Rejected
```

Use clearly fictional test identities and `.example` email addresses.

Ensure public search returns only eligible seeded jobs from verified organisations.

Do not seed fake real-world employer verification claims into production.

---

## 5.8 Critical Automated Test Cases

Implement at least the following E2E test scenarios:

```text
TEST-CAN-001:
Candidate registers successfully.

TEST-CAN-002:
Candidate creates and updates a profile.

TEST-CAN-003:
Candidate uploads an allowed video.

TEST-CAN-004:
Candidate cannot upload PDF as a resume.

TEST-CAN-005:
Candidate cannot apply while video is processing.

TEST-CAN-006:
Candidate can apply with a complete profile and ready video.

TEST-APP-001:
Application fee is always zero.

TEST-APP-002:
Repeated submission does not create duplicate applications.

TEST-APP-003:
Application appears in candidate history.

TEST-APP-004:
Application appears in the correct employer's applicant list.

TEST-APP-005:
Closed job rejects new applications.

TEST-APP-006:
Application failure does not display success.

TEST-EMP-001:
Unverified employer cannot publish.

TEST-EMP-002:
Platform administrator can approve verification.

TEST-EMP-003:
Approved employer can publish.

TEST-EMP-004:
Employer can play authorized candidate video.

TEST-EMP-005:
Employer can shortlist an application.

TEST-EMP-006:
Candidate sees updated status.

TEST-SEC-001:
Candidate cannot access another candidate's private profile.

TEST-SEC-002:
Employer cannot access another organisation's applications.

TEST-SEC-003:
Suspended account cannot perform restricted actions.

TEST-SEC-004:
Unsupported upload is rejected.

TEST-SEC-005:
Unauthorized API access is denied.

TEST-UX-001:
Homepage works at 320px mobile width.

TEST-UX-002:
Search state survives refresh.

TEST-UX-003:
Empty search results provide recovery.

TEST-UX-004:
Application modal supports keyboard navigation.

TEST-UX-005:
Network error preserves user-entered data.
```

## 5.9 Definition of Done

The coding agent must not claim completion until:

- All Phase 1 P0 tasks are implemented.
- Required candidate and employer journeys use persistent backend data.
- Employer verification is administrator-controlled.
- Video resumes can be securely uploaded and played.
- Applications remain free.
- Duplicate applications are prevented.
- Employer application review works.
- Candidates can view application statuses.
- Critical authorization and privacy tests pass.
- Mobile and desktop layouts function.
- No prototype-only success placeholders remain in critical flows.
- Database migrations work from a clean environment.
- Critical E2E tests pass.
- README contains setup, environment, migration, seed, and run instructions.
- API contracts are documented.
- Unresolved business policies are recorded.
- Production release blockers are explicitly identified.

### Final Codex Deliverables

Produce:

```text
1. Working Next.js frontend
2. Working NestJS backend
3. PostgreSQL schema and migrations
4. Development seed script
5. Candidate authentication and profile workflows
6. Secure video resume workflow
7. Job search and detail pages
8. Free application workflow
9. Employer verification and recruitment workflows
10. Platform administration functionality
11. Automated tests
12. API documentation
13. README.md
14. .env.example
15. OPEN_DECISIONS.md
16. IMPLEMENTATION_STATUS.md
```

In `IMPLEMENTATION_STATUS.md`, record for every task:

```text
Task ID
Status: COMPLETE | PARTIAL | BLOCKED | NOT_STARTED
Files changed
API endpoints added
Tests executed
Known limitations
Dependencies
```

Do not mark a task COMPLETE unless its acceptance criteria pass.

---

# 6. Out of Scope (Do Not Build)

## 6.1 Assessment Engine — Deferred Product Phase 2

Do not implement:

- AI voice interviews.
- AI-assisted video interviews.
- Proctored assessments.
- Objective test engines.
- Subjective assessment engines.
- Coding challenge execution.
- CAD/CAM assessment integrations.
- Cognitive assessment engines.
- AI-based candidate scoring.
- Automated pass/fail assessment decisions.
- Assessment attempt management.
- Assessment sequencing.
- Assessment result analytics.
- Assessment-provider integrations.

The PRD documents these as future capabilities.

Keep the backend architecture extensible, but do not build the assessment subsystem during this MVP.

Do not display operational "Start Assessment" actions until the corresponding functionality exists.

## 6.2 Wallet and Payments — Deferred Product Phase 2

Do not implement:

- Token purchases.
- Candidate wallet top-ups.
- Razorpay payment integration.
- Token deductions.
- Assessment billing.
- AI assessment cost calculations.
- Refund processing.
- Token transaction history.
- Payment reconciliation.
- Assessment charge multipliers.
- Payment-related administration.

All job applications must remain free.

Do not create a simulated wallet to make the interface look complete.

## 6.3 Advanced Recruitment Features

Do not build:

- Public searchable candidate directories.
- Employer sourcing marketplaces.
- Candidate recommendation engines.
- AI job-match scoring.
- AI resume rewriting.
- Resume-to-video generation.
- Automated candidate ranking.
- Recruiter CRM integrations.
- Interview scheduling.
- Calendar integrations.
- Bulk candidate email campaigns.
- Advanced analytics dashboards.
- Recruitment report exports beyond explicitly approved MVP needs.
- Third-party applicant tracking system integrations.

The initial product must demonstrate reliable candidate applications and employer review before adding advanced recruitment capabilities.

## 6.4 Additional Authentication and Communication

Do not build unless separately approved:

- Social login.
- LinkedIn login.
- Google login.
- WhatsApp authentication.
- Biometric authentication.
- SMS OTP authentication.
- WhatsApp notification delivery.
- Full real-time messaging.
- Candidate/employer chat.
- Video calling.

Email/password authentication is the MVP implementation default. The architecture must not prevent later adoption of approved email/mobile passwordless methods.

## 6.5 Mobile Applications

Do not build:

- Native Android application.
- Native iOS application.
- React Native application.
- Flutter application.
- Separate mobile backend.
- App-store deployment.

Build a responsive web application only.

## 6.6 Architecture Overengineering

Do not introduce:

- Microservices.
- Kubernetes.
- Kafka.
- Elasticsearch/OpenSearch before search requirements justify them.
- GraphQL.
- Complex event-sourcing architecture.
- Multi-region deployment.
- Unnecessary distributed infrastructure.
- Custom authentication cryptography.
- Multiple competing frontend state libraries.

Use a modular monolith and established libraries.

## 6.7 Prototype Bloat to Remove

Remove or replace:

- Fake application success messages.
- Static verified badges.
- Production UI driven by six hardcoded job objects.
- Placeholder login and registration toasts.
- Placeholder employer onboarding actions.
- Nonfunctional call-to-action buttons.
- Duplicate job-description sections.
- Broken industry shortcuts.
- Inconsistent navigation.
- Conflicting wordmark font overrides.
- Unnecessary decorative industry numbering.
- Prominent assessment marketing implying functionality that is not available.
- Any static candidate count, application count, job count, or success metric presented as live data.

## 6.8 Do Not Change These Business Rules

Never:

- Accept PDF or text files as candidate resumes.
- Charge candidates to apply.
- Deduct tokens during job application.
- Mark employers verified without administrator approval.
- Allow unverified employers to publish jobs.
- Allow an employer to access unrelated organisations' applications.
- Share candidate video without valid authorization and consent.
- Create applications without validating job eligibility.
- Permit duplicate active applications.
- Show submission success before persistence.
- Expose private video files publicly.
- Add production features based solely on visual placeholders.
- Override unresolved founder decisions without recording and obtaining approval.

## 6.9 Execution Order and Stopping Rules

Codex must follow this execution order:

```text
STEP 1:
Inspect existing repository and prototype.

STEP 2:
Set up modular frontend, backend, database, and shared contracts.

STEP 3:
Implement authentication and role-based access.

STEP 4:
Implement candidate professional profile.

STEP 5:
Implement secure video resume upload and preview.

STEP 6:
Implement employer registration and verification.

STEP 7:
Implement job management and persistent job search.

STEP 8:
Implement free job application with eligibility checks.

STEP 9:
Implement employer applicant review and application statuses.

STEP 10:
Implement required administration workflows.

STEP 11:
Implement UX states, notifications, accessibility, and error recovery.

STEP 12:
Remove obsolete prototype functionality.

STEP 13:
Run automated E2E, authorization, and responsive tests.

STEP 14:
Produce implementation status, documentation, and unresolved decisions.
```

### Execution Constraints

1. Complete working vertical slices rather than creating many disconnected placeholder pages.
2. Prioritize backend-enforced business correctness over visual completeness.
3. Do not add unrequested features.
4. Do not fake integrations or database persistence.
5. Do not display unsupported production claims.
6. Preserve existing working code where appropriate.
7. Run relevant tests after each major feature.
8. Fix errors caused by implementation before declaring a task complete.
9. Document blockers instead of silently skipping requirements.
10. Do not declare the MVP production-ready while unresolved security, privacy, retention, or launch-policy decisions remain.

### Final Product Acceptance Statement

XOGAME.AI is ready for MVP acceptance when a real candidate can register, build a structured professional profile, upload a video resume, discover an eligible job, submit a free application, and track its status while a verified employer can securely publish the job, review the candidate's video and professional information, and advance or reject the application.

**Build this complete experience first. Everything else is secondary.**
# Open decisions and release boundaries

The current build is an **open-access, synthetic-data MVP** as explicitly requested. It is suitable for demonstrating persisted workflows. It is not a private recruitment system. Every visitor can operate the candidate, employer, and platform review workspaces. This follows the user override, not a security guarantee.

| Decision | Current development behavior | Before real recruitment |
|---|---|---|
| Identity and privacy | No login, signup, password, session, token or permission boundary; shared candidate | Product owner must decide whether continued open access is compatible with intended data |
| Geography and currency | Fictional Indian cities; per-record salary currency; no geography restriction | Approve launch geography and legal obligations |
| Video limits | Configurable 100 MB, 120 sec, MP4/WebM; ffprobe validation and H.264/AAC output | Approve formats, duration, captions and limits |
| Storage and processing | Non-static local media directory, served by explicit open API route; FastAPI background task | Approve durable storage, processing workers, quotas and recovery model |
| Retention | Successful replacement revokes older ready videos. Deletion immediately revokes playback, including past applications. Profile snapshots and events remain. | Approve retention/deletion policy, legal basis and backup retention |
| Verification evidence | PDF/PNG/JPEG with size and magic-byte checks, downloaded as attachments | Approve evidence, malware scanning, review procedure and private handling |
| Verification fixtures | Fictional organisations in multiple states; seed approvals are sample data, not real certification | Replace synthetic fixtures only under an approved release policy |
| Profile readiness | Name, headline, location, summary, skill, education/experience, ready consenting video | Approve application-critical fields |
| Applications | Free, one application per job and shared candidate, even after rejection | Approve withdrawal and resubmission rules |
| Employer pricing | No payments or wallets | Approve any future employer pricing separately |
| Notifications | Persisted in-app only, polling updates | Approve channels and delivery expectations |
| Team permissions | Organisation selector and scoped records, no identity enforcement or invitation system | Decide team administration if identity is later introduced |
| Legal pages | Functional demo disclosures, no claim of finalized legal policy | Obtain reviewed Terms, Privacy and retention policies |
| Deployment | Runnable single-host build and verification CI; no cloud staging provisioned | Choose hosting, TLS, backup schedule, resource limits and operator |

No assessment engine, AI scoring, wallet, token payments, messaging or native mobile app is implemented.

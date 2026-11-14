import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Plus,
  Send,
  Upload,
} from "lucide-react";
import { API, api, date, label } from "./api";
import { Badge, Dialog, Empty, ErrorBox, Loading, PageHeading } from "./ui";
import type { Application, Job, JobFields, Organisation } from "./types";
const blankJob: JobFields = {
  title: "",
  domainId: "engineering",
  summary: "",
  description: "",
  responsibilities: "",
  qualifications: "",
  skills: [],
  city: "",
  country: "India",
  workArrangement: "HYBRID",
  employmentType: "FULL_TIME",
  experienceMinYears: 0,
  experienceMaxYears: 5,
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: "INR",
  salaryPeriod: "YEAR",
  deadline: "",
  vacancies: 1,
};
export function Employer() {
  const cache = useQueryClient();
  const [orgId, setOrgId] = useState(
    () => localStorage.getItem("xogame-org") || "org-1",
  );
  const path = useLocation().pathname;
  const [selectedJob, setSelectedJob] = useState(
    () => path.match(/\/employer\/jobs\/([^/]+)\/applications/)?.[1] || "",
  );
  const [tab, setTab] = useState(
    path.endsWith("/applications") ? "applicants" : "jobs",
  );
  const [edit, setEdit] = useState<Job | JobFields | null>(() =>
    path.endsWith("/jobs/new") ? { ...blankJob } : null,
  );
  const [onboarding, setOnboarding] = useState(false);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const orgs = useQuery({
    queryKey: ["organisations"],
    queryFn: () => api<Organisation[]>("/organisations"),
  });
  const jobs = useQuery({
    queryKey: ["employer-jobs", orgId],
    queryFn: () => api<Job[]>(`/employer/${orgId}/jobs`),
  });
  const applicants = useQuery({
    queryKey: ["applicants", orgId, status, keyword, selectedJob],
    queryFn: () =>
      api<Application[]>(
        `/employer/${orgId}/applications?jobId=${selectedJob}&status=${status}&keyword=${encodeURIComponent(keyword)}`,
      ),
    refetchInterval: 10000,
  });
  const action = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api(`/employer/${orgId}/jobs/${id}/${action}`, "POST"),
    onSuccess: () => cache.invalidateQueries(),
  });
  const submitVerification = useMutation({
    mutationFn: () => api(`/organisations/${orgId}/verification`, "POST"),
    onSuccess: () => cache.invalidateQueries(),
  });
  const evidence = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append("file", file);
      return api(`/organisations/${orgId}/documents`, "POST", data);
    },
    onSuccess: () => cache.invalidateQueries(),
  });
  const org = orgs.data?.data.find((o) => o.id === orgId);
  return (
    <>
      <PageHeading
        eyebrow="EMPLOYER WORKSPACE"
        title="Good teams start with good people."
        description="Publish thoughtful opportunities. Give every introduction a closer look."
        action={
          <button
            className="button secondary"
            onClick={() => setOnboarding(true)}
          >
            <Plus size={14} />
            Add organisation
          </button>
        }
      />
      <div className="panel organisation-switch">
        <div>
          <span className="mono">ACTIVE ORGANISATION</span>
          <select
            aria-label="Active organisation"
            value={orgId}
            onChange={(e) => {
              setOrgId(e.target.value);
              setSelectedJob("");
              localStorage.setItem("xogame-org", e.target.value);
              action.reset();
            }}
          >
            {orgs.data?.data.map((o) => (
              <option key={o.id} value={o.id}>
                {o.displayName}
              </option>
            ))}
          </select>
        </div>
        {org && <Badge status={org.verificationStatus} />}
        <p>Shared demo controls. Anyone can explore this workspace.</p>
      </div>
      <ErrorBox error={orgs.error} retry={() => orgs.refetch()} />
      {org && org.verificationStatus !== "VERIFIED" && (
        <div className="panel verification-panel">
          <h2>One review before your first post.</h2>
          <p>
            {["SUBMITTED", "UNDER_REVIEW"].includes(org.verificationStatus)
              ? "Your organisation is in the review queue. Use Platform review to complete the demo verification."
              : "Upload PDF, PNG, or JPEG evidence (up to 10 MB), then submit for review."}
          </p>
          {org.reason && <p className="error-text">{org.reason}</p>}
          {["NOT_SUBMITTED", "REJECTED"].includes(org.verificationStatus) && (
            <div className="form-actions">
              <label className="button secondary file-button">
                <Upload size={14} />
                {evidence.isPending ? "Uploading…" : "Upload evidence"}
                <input
                  aria-label="Upload organisation evidence"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) evidence.mutate(file);
                  }}
                />
              </label>
              <button
                className="button primary"
                disabled={submitVerification.isPending || evidence.isPending}
                onClick={() => submitVerification.mutate()}
              >
                Submit for review
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          {evidence.isSuccess && (
            <p className="saved">
              <Check size={14} />
              Evidence uploaded.
            </p>
          )}
          <ErrorBox error={evidence.error} />
          <ErrorBox error={submitVerification.error} />
        </div>
      )}
      <div className="employer-metrics">
        <div>
          <span className="mono">PUBLISHED JOBS</span>
          <strong>
            {jobs.data?.data.filter(
              (j) =>
                j.status === "PUBLISHED" &&
                j.deadline >= new Date().toISOString().slice(0, 10),
            ).length ?? "—"}
          </strong>
        </div>
        <div>
          <span className="mono">DRAFTS</span>
          <strong>
            {jobs.data?.data.filter((j) => j.status === "DRAFT").length ?? "—"}
          </strong>
        </div>
        <div>
          <span className="mono">APPLICATIONS</span>
          <strong>
            {jobs.data?.data.reduce(
              (sum, j) => sum + (j.applicantCount || 0),
              0,
            ) ?? "—"}
          </strong>
        </div>
      </div>
      <div className="tabs-row">
        <div>
          <button
            className={tab === "jobs" ? "active" : ""}
            onClick={() => setTab("jobs")}
          >
            Opportunities
          </button>
          <button
            className={tab === "applicants" ? "active" : ""}
            onClick={() => setTab("applicants")}
          >
            Applicant review
          </button>
        </div>
        {tab === "jobs" && (
          <button
            className="button primary small-button"
            onClick={() => setEdit({ ...blankJob })}
          >
            <Plus size={14} />
            Create opportunity
          </button>
        )}
      </div>
      <ErrorBox error={action.error} />
      {tab === "jobs" ? (
        <>
          <ErrorBox error={jobs.error} retry={() => jobs.refetch()} />
          {jobs.isPending ? (
            <Loading />
          ) : jobs.data?.data.length ? (
            <div className="employer-job-list">
              {jobs.data.data.map((j) => (
                <article className="panel employer-job" key={j.id}>
                  <div>
                    <div className="inline-row">
                      <h3>{j.title}</h3>
                      <Badge
                        status={
                          j.deadline < new Date().toISOString().slice(0, 10)
                            ? "EXPIRED"
                            : j.status
                        }
                      />
                    </div>
                    <p>
                      {j.city} · {label(j.workArrangement)} · {j.applicantCount}{" "}
                      applicants
                    </p>
                  </div>
                  <div className="job-actions">
                    <button
                      className="button secondary small-button"
                      onClick={() => setEdit(j)}
                    >
                      Edit
                    </button>
                    {j.status !== "PUBLISHED" ? (
                      <button
                        className="button primary small-button"
                        disabled={action.isPending}
                        onClick={() =>
                          action.mutate({ id: j.id, action: "publish" })
                        }
                      >
                        Publish
                        <ArrowUpRight size={13} />
                      </button>
                    ) : (
                      <button
                        className="button secondary small-button"
                        disabled={action.isPending}
                        onClick={() =>
                          action.mutate({ id: j.id, action: "close" })
                        }
                      >
                        Close job
                      </button>
                    )}
                    <button
                      className="text-button"
                      onClick={() => {
                        setTab("applicants");
                        setSelectedJob(j.id);
                        setStatus("");
                      }}
                    >
                      Review applicants
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty title="Tell candidates about the work.">
              <p>Create your first opportunity to get started.</p>
            </Empty>
          )}
        </>
      ) : (
        <>
          <div className="applicant-filters">
            <select
              aria-label="Filter applicants by job"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              <option value="">All opportunities</option>
              {jobs.data?.data.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <input
              aria-label="Search applicants"
              placeholder="Search name, skill, or experience"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              aria-label="Application status filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {["SUBMITTED", "VIEWED", "SHORTLISTED", "REJECTED"].map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <ErrorBox
            error={applicants.error}
            retry={() => applicants.refetch()}
          />
          {applicants.isPending ? (
            <Loading />
          ) : applicants.data?.data.length ? (
            <div className="applicant-list">
              {applicants.data.data.map((a) => (
                <Applicant key={a.id} application={a} orgId={orgId} />
              ))}
            </div>
          ) : (
            <Empty title="No introductions to review yet.">
              <p>Applications to this organisation’s jobs will appear here.</p>
            </Empty>
          )}
        </>
      )}
      {edit && (
        <Dialog
          title={"id" in edit ? "Edit opportunity" : "Create an opportunity"}
          onClose={() => setEdit(null)}
        >
          <JobEditor
            initial={edit}
            orgId={orgId}
            onDone={() => setEdit(null)}
          />
        </Dialog>
      )}
      {onboarding && (
        <Dialog
          title="Introduce your organisation."
          onClose={() => setOnboarding(false)}
        >
          <OrganisationEditor
            onDone={(id) => {
              setOrgId(id);
              localStorage.setItem("xogame-org", id);
              setOnboarding(false);
            }}
          />
        </Dialog>
      )}
    </>
  );
}
function JobEditor({
  initial,
  orgId,
  onDone,
}: {
  initial: Job | JobFields;
  orgId: string;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<JobFields>(() => {
    if ("id" in initial) {
      const {
        id: _id,
        status: _status,
        publishedAt: _pub,
        organisation: _org,
        applicantCount: _count,
        ...fields
      } = initial;
      return fields;
    }
    return initial;
  });
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      api(
        `/employer/${orgId}/jobs${"id" in initial ? `/${initial.id}` : ""}`,
        "id" in initial ? "PUT" : "POST",
        draft,
      ),
    onSuccess: () => {
      cache.invalidateQueries();
      onDone();
    },
  });
  const set = (
    key: keyof JobFields,
    value: string | number | null | string[],
  ) => setDraft((d) => ({ ...d, [key]: value }));
  const field = (
    key: keyof JobFields,
    name: string,
    type = "text",
    required = true,
  ) => (
    <label key={key}>
      {name}
      {required ? " *" : ""}
      <input
        required={required}
        type={type}
        min={type === "number" ? 0 : undefined}
        value={String(draft[key] ?? "")}
        onChange={(e) =>
          set(
            key,
            type === "number"
              ? e.target.value === ""
                ? null
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
    </label>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <p className="dialog-intro">
        Describe the work, the team, and what a good fit looks like. New jobs
        are saved as drafts.
      </p>
      <div className="form-grid">
        {field("title", "Role title")}
        <label>
          Domain *
          <select
            value={draft.domainId}
            onChange={(e) => set("domainId", e.target.value)}
          >
            {[
              "engineering",
              "design",
              "product",
              "marketing",
              "operations",
              "finance",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        {(
          [
            "summary",
            "description",
            "responsibilities",
            "qualifications",
          ] as const
        ).map((k) => (
          <label key={k} className="span-2">
            {label(k)} *
            <textarea
              required
              rows={k === "description" ? 4 : 2}
              minLength={
                k === "description" ? 30 : k === "qualifications" ? 5 : 10
              }
              value={draft[k]}
              onChange={(e) => set(k, e.target.value)}
            />
          </label>
        ))}
        <label className="span-2">
          Skills (comma separated) *
          <input
            required
            value={draft.skills.join(",")}
            onChange={(e) => set("skills", e.target.value.split(","))}
          />
        </label>
        {field("city", "City")}
        {field("country", "Country")}
        <label>
          Work arrangement
          <select
            value={draft.workArrangement}
            onChange={(e) => set("workArrangement", e.target.value)}
          >
            {["HYBRID", "REMOTE", "ON_SITE"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Employment type
          <select
            value={draft.employmentType}
            onChange={(e) => set("employmentType", e.target.value)}
          >
            {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {field("experienceMinYears", "Minimum years", "number")}
        {field("experienceMaxYears", "Maximum years", "number")}
        {field("salaryMin", "Minimum salary", "number", false)}
        {field("salaryMax", "Maximum salary", "number", false)}
        {field("salaryCurrency", "Currency")}
        <label>
          Salary period
          <select
            value={draft.salaryPeriod}
            onChange={(e) => set("salaryPeriod", e.target.value)}
          >
            <option>YEAR</option>
            <option>MONTH</option>
          </select>
        </label>
        {field("deadline", "Application deadline", "date")}
        {field("vacancies", "Openings", "number")}
      </div>
      <ErrorBox error={save.error} />
      <div className="dialog-actions">
        <button className="button primary" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save opportunity"}
          <Check size={14} />
        </button>
      </div>
    </form>
  );
}
function OrganisationEditor({ onDone }: { onDone: (id: string) => void }) {
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api<Organisation>("/organisations", "POST", { ...data, synthetic: true }),
    onSuccess: (result) => {
      cache.invalidateQueries();
      onDone(result.data.id);
    },
  });
  const fields: Record<string, string> = {
    displayName: "Display name",
    legalName: "Legal organisation name",
    organisationType: "Organisation type",
    website: "Website (https://)",
    businessEmail: "Business email",
    registeredAddress: "Registered address",
    industry: "Industry",
    representativeName: "Representative",
    contactInformation: "Contact details",
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(
          Object.fromEntries(new FormData(e.currentTarget)) as Record<
            string,
            string
          >,
        );
      }}
    >
      <p className="dialog-intro">
        Use fictional demo details. Upload evidence after saving, then submit
        for platform review.
      </p>
      <div className="form-grid">
        {Object.entries(fields).map(([key, name]) => (
          <label key={key}>
            {name} *
            <input
              required
              name={key}
              type={
                key === "businessEmail"
                  ? "email"
                  : key === "website"
                    ? "url"
                    : "text"
              }
              minLength={key === "registeredAddress" ? 5 : 2}
            />
          </label>
        ))}
      </div>
      <ErrorBox error={save.error} />
      <div className="dialog-actions">
        <button className="button primary" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save organisation"}
          <ArrowRight size={14} />
        </button>
      </div>
    </form>
  );
}
function Applicant({
  application: a,
  orgId,
}: {
  application: Application;
  orgId: string;
}) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [mediaError, setMediaError] = useState(false);
  const status = useMutation({
    mutationFn: (next: string) =>
      api(`/employer/${orgId}/applications/${a.id}/status`, "PATCH", {
        status: next,
        expectedCurrentStatus: a.status,
      }),
    onSuccess: () => cache.invalidateQueries(),
  });
  const addNote = useMutation({
    mutationFn: () =>
      api(`/employer/${orgId}/applications/${a.id}/notes`, "POST", {
        body: note,
      }),
    onSuccess: () => {
      setNote("");
      cache.invalidateQueries();
    },
  });
  return (
    <article className="panel applicant">
      <div className="application-top">
        <div>
          <span className="tiny-muted">
            {a.job.title} · Applied {date(a.submittedAt)}
          </span>
          <h2>{a.profile?.fullName}</h2>
          <p>
            {a.profile?.professionalHeadline} · {a.profile?.location}
          </p>
        </div>
        <Badge status={a.status} />
      </div>
      <div className="form-actions">
        <button
          className="button secondary small-button"
          onClick={() => {
            setOpen(!open);
            if (!open && a.status === "SUBMITTED") status.mutate("VIEWED");
          }}
        >
          {open ? "Close profile" : "Review profile & video"}
          <ArrowUpRight size={13} />
        </button>
        {!["REJECTED", "SHORTLISTED"].includes(a.status) && (
          <button
            className="button primary small-button"
            disabled={status.isPending}
            onClick={() => status.mutate("SHORTLISTED")}
          >
            Shortlist
            <Check size={13} />
          </button>
        )}
        {a.status !== "REJECTED" && (
          <button
            className="button secondary small-button danger"
            disabled={status.isPending}
            onClick={() => status.mutate("REJECTED")}
          >
            Reject
          </button>
        )}
      </div>
      <ErrorBox error={status.error} />
      {open && (
        <div className="applicant-expanded">
          <p>{a.profile?.professionalSummary}</p>
          <p className="tiny-muted">
            {a.profile?.email} · {a.profile?.languages.join(", ")}
          </p>
          <div className="job-tags">
            {a.profile?.skills.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <video
            controls
            src={`${API}/videos/${a.videoId}/media`}
            aria-label={`${a.profile?.fullName} video resume`}
            onError={() => setMediaError(true)}
          />
          {mediaError && (
            <p className="error-text">
              Video unavailable or deleted by the candidate.
            </p>
          )}
          {(
            ["experience", "education", "projects", "certifications"] as const
          ).map((section) =>
            a.profile?.[section].length ? (
              <section key={section}>
                <h3>{label(section)}</h3>
                {a.profile[section].map((entry, index) => (
                  <div key={entry.id || index}>
                    <strong>{entry.title}</strong>
                    <p className="tiny-muted">
                      {entry.organisation} · {entry.startDate} –{" "}
                      {entry.endDate || "Present"}
                    </p>
                    <p>{entry.description}</p>
                    {entry.url && <p>{entry.url}</p>}
                  </div>
                ))}
              </section>
            ) : null,
          )}
          <h3>Employment preferences</h3>
          <p>
            {a.profile?.employmentPreferences.join(", ") || "Not provided"} ·
            Preferred locations:{" "}
            {a.profile?.preferredLocations.join(", ") || "Not provided"}
          </p>
          <p className="tiny-muted">
            Expected salary: {a.profile?.expectedSalaryMin ?? "Not provided"} –{" "}
            {a.profile?.expectedSalaryMax ?? "Not provided"}{" "}
            {a.profile?.salaryCurrency} · Notice:{" "}
            {a.profile?.noticePeriodDays ?? "Not provided"} days
          </p>
          <h3>Recruitment notes</h3>
          <p className="tiny-muted">Notes are public in this open demo.</p>
          {a.notes?.map((n) => (
            <div className="recruitment-note" key={n.id}>
              <p>{n.body}</p>
              <small>{date(n.created_at)}</small>
            </div>
          ))}
          <form
            className="note-form"
            onSubmit={(e) => {
              e.preventDefault();
              addNote.mutate();
            }}
          >
            <input
              aria-label="Recruitment note"
              value={note}
              maxLength={5000}
              required
              placeholder="Add a considered note…"
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="button primary small-button"
              disabled={addNote.isPending}
            >
              <Send size={14} />
              Save
            </button>
          </form>
          <ErrorBox error={addNote.error} />
          <h3>Activity</h3>
          <div className="application-events">
            {a.events.map((event) => (
              <div key={event.id}>
                <Check size={12} />
                {label(event.status)}
                <span>{date(event.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
export function Admin() {
  const cache = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});
  const orgs = useQuery({
    queryKey: ["verifications"],
    queryFn: () => api<Organisation[]>("/admin/verifications"),
  });
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      api<{ id: string; fullName: string; suspended: boolean }[]>(
        "/admin/users",
      ),
  });
  const logs = useQuery({
    queryKey: ["audit"],
    queryFn: () =>
      api<{ id: string; action: string; target: string; created_at: string }[]>(
        "/admin/audit",
      ),
  });
  const verify = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/admin/verifications/${id}`, "PATCH", {
        status,
        reason: reason[id] || "",
      }),
    onSuccess: () => cache.invalidateQueries(),
  });
  const suspend = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      api(`/admin/users/${id}`, "PATCH", { suspended }),
    onSuccess: () => cache.invalidateQueries(),
  });
  return (
    <>
      <PageHeading
        eyebrow="PLATFORM REVIEW"
        title="Trust starts with a closer look."
        description="Review organisations, manage the demo candidate, and follow activity."
      />
      <div className="admin-notice">
        <span className="mono">OPEN ACCESS</span> Administrative controls are
        public in this MVP. Use synthetic evidence only.
      </div>
      <div className="section-title">
        <h2>Organisation verification</h2>
        <span className="mono">
          {orgs.data?.data.filter((o) =>
            ["SUBMITTED", "UNDER_REVIEW"].includes(o.verificationStatus),
          ).length || 0}{" "}
          AWAITING REVIEW
        </span>
      </div>
      <ErrorBox error={orgs.error} retry={() => orgs.refetch()} />
      <ErrorBox error={verify.error} />
      {orgs.isPending ? (
        <Loading />
      ) : (
        <div className="verification-list">
          {orgs.data?.data.map((org) => (
            <article className="panel verification-item" key={org.id}>
              <div className="application-top">
                <div>
                  <h3>{org.displayName}</h3>
                  <p className="tiny-muted">
                    {org.legalName} · {org.industry}
                  </p>
                </div>
                <Badge status={org.verificationStatus} />
              </div>
              <details>
                <summary>Organisation details & evidence</summary>
                <p>{org.registeredAddress}</p>
                <p>
                  {org.website} · {org.businessEmail}
                </p>
                <p>
                  {org.representativeName} · {org.contactInformation}
                </p>
                {org.documents?.length ? (
                  org.documents.map((d) => (
                    <a
                      className="text-button"
                      key={d.id}
                      href={`${API}/admin/documents/${d.id}`}
                      download
                    >
                      {d.filename}
                      <ArrowUpRight size={13} />
                    </a>
                  ))
                ) : (
                  <p className="tiny-muted">
                    Synthetic seed fixture; no verification evidence attached.
                  </p>
                )}
              </details>
              {org.reason && (
                <p className="tiny-muted">Decision: {org.reason}</p>
              )}
              {["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "SUSPENDED"].includes(
                org.verificationStatus,
              ) && (
                <>
                  <label className="reason-field">
                    Decision reason
                    <input
                      value={reason[org.id] || ""}
                      onChange={(e) =>
                        setReason({ ...reason, [org.id]: e.target.value })
                      }
                      placeholder="Required when rejecting or suspending"
                    />
                  </label>
                  <div className="form-actions">
                    {["SUBMITTED", "UNDER_REVIEW", "SUSPENDED"].includes(
                      org.verificationStatus,
                    ) && (
                      <>
                        <button
                          className="button primary small-button"
                          disabled={verify.isPending}
                          onClick={() =>
                            verify.mutate({ id: org.id, status: "VERIFIED" })
                          }
                        >
                          Approve
                          <Check size={13} />
                        </button>
                        <button
                          className="button secondary small-button danger"
                          disabled={verify.isPending || !reason[org.id]?.trim()}
                          onClick={() =>
                            verify.mutate({ id: org.id, status: "REJECTED" })
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {org.verificationStatus === "SUBMITTED" && (
                      <button
                        className="button secondary small-button"
                        disabled={verify.isPending}
                        onClick={() =>
                          verify.mutate({ id: org.id, status: "UNDER_REVIEW" })
                        }
                      >
                        Mark under review
                      </button>
                    )}
                    {org.verificationStatus === "VERIFIED" && (
                      <button
                        className="button secondary small-button danger"
                        disabled={verify.isPending || !reason[org.id]?.trim()}
                        onClick={() =>
                          verify.mutate({ id: org.id, status: "SUSPENDED" })
                        }
                      >
                        Suspend publishing
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="section-title">
        <h2>Candidate management</h2>
      </div>
      <ErrorBox error={users.error} retry={() => users.refetch()} />
      <ErrorBox error={suspend.error} />
      {users.data?.data.map((u) => (
        <div className="panel user-management" key={u.id}>
          <strong>{u.fullName}</strong>
          <Badge status={u.suspended ? "SUSPENDED" : "ACTIVE"} />
          <button
            className="button secondary small-button"
            disabled={suspend.isPending}
            onClick={() =>
              suspend.mutate({ id: u.id, suspended: !u.suspended })
            }
          >
            {u.suspended ? "Restore candidate" : "Suspend candidate"}
          </button>
        </div>
      ))}
      <div className="section-title">
        <h2>Activity log</h2>
        <span className="mono">LATEST 200 EVENTS</span>
      </div>
      <ErrorBox error={logs.error} retry={() => logs.refetch()} />
      <div className="panel audit-log">
        {logs.data?.data.map((log) => (
          <div key={log.id}>
            <strong>{label(log.action)}</strong>
            <span className="mono">{log.target}</span>
            <time>{date(log.created_at)}</time>
          </div>
        ))}
      </div>
    </>
  );
}

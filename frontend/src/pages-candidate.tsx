import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  Plus,
  Trash2,
  Upload,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { API, api, date, label } from "./api";
import { Badge, Empty, ErrorBox, JobCard, Loading, PageHeading } from "./ui";
import type {
  Application,
  Config,
  Job,
  Notification,
  Profile,
  ProfileFields,
  RecordEntry,
  Video,
} from "./types";

export function CandidateDashboard() {
  const cache = useQueryClient();
  const p = useQuery({
    queryKey: ["profile"],
    queryFn: () => api<Profile>("/candidate/profile"),
  });
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: () => api<Application[]>("/candidate/applications"),
    refetchInterval: 15000,
  });
  const jobs = useQuery({
    queryKey: ["recent-jobs"],
    queryFn: () => api<Job[]>("/jobs?limit=2"),
  });
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<Notification[]>("/candidate/notifications"),
    refetchInterval: 15000,
  });
  const read = useMutation({
    mutationFn: (id: string) =>
      api(`/candidate/notifications/${id}/read`, "PATCH"),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title="A little more you."
        description="Your story, your applications, and what comes next."
        action={
          <Link className="button secondary" to="/candidate/profile">
            Edit your profile
            <ArrowUpRight size={14} />
          </Link>
        }
      />
      <ErrorBox error={p.error} retry={() => p.refetch()} />
      {p.isPending ? (
        <Loading />
      ) : (
        p.data && (
          <div className="dashboard-summary">
            <div className="panel completion-card">
              <div className="eyebrow">YOUR INTRODUCTION</div>
              <h2>{p.data.data.fullName || "Start with your story."}</h2>
              <p>{p.data.data.professionalHeadline}</p>
              <div className="completion-row">
                <span>Application readiness</span>
                <strong className="mono">
                  {p.data.data.profileCompletionPercent}%
                </strong>
              </div>
              <progress
                value={p.data.data.profileCompletionPercent}
                max="100"
              />
              {p.data.data.missingRequirements.map((r) => (
                <Link
                  className="requirement-link"
                  key={r.code}
                  to={r.actionUrl}
                >
                  {r.message}
                  <ArrowRight size={13} />
                </Link>
              ))}
              {p.data.data.eligible && (
                <span className="verified-label">
                  <CircleCheck size={15} />
                  You’re ready to make your next move.
                </span>
              )}
            </div>
            <div className="panel dashboard-numbers">
              <div>
                <span className="mono">APPLICATIONS</span>
                <strong>{applications.data?.data.length ?? "—"}</strong>
                <Link to="/candidate/applications">
                  View your activity
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div>
                <span className="mono">VIDEO RÉSUMÉ</span>
                <strong className="video-status-text">
                  {p.data.data.video
                    ? label(p.data.data.video.status)
                    : "Not uploaded"}
                </strong>
                <Link to="/candidate/video">
                  Manage your introduction
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )
      )}
      <div className="section-title">
        <h2>Keep the possibilities open.</h2>
        <Link to="/jobs" className="text-button">
          All opportunities
          <ArrowRight size={14} />
        </Link>
      </div>
      <ErrorBox error={jobs.error} retry={() => jobs.refetch()} />
      <div className="job-grid dashboard-job-grid">
        {jobs.data?.data.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      <div className="section-title">
        <h2>Latest updates</h2>
      </div>
      <ErrorBox error={notes.error} />
      <ErrorBox error={read.error} />
      <div className="panel notifications">
        {notes.data?.data.length ? (
          notes.data.data.map((n) => (
            <div
              className={n.read ? "notification read" : "notification"}
              key={n.id}
            >
              <span className="requirement-dot" />
              <div>
                <Link to="/candidate/applications">{n.message}</Link>
                <small>{date(n.created_at)}</small>
              </div>
              {!n.read && (
                <button
                  className="text-button"
                  onClick={() => read.mutate(n.id)}
                  disabled={read.isPending}
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="muted">
            You’re all caught up. Application updates will appear here.
          </p>
        )}
      </div>
    </>
  );
}
export function ProfileEditor() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: () => api<Profile>("/candidate/profile"),
  });
  const [draft, setDraft] = useState<ProfileFields | null>(null);
  useEffect(() => {
    if (query.data && !draft) {
      const {
        id: _id,
        eligible: _eligible,
        missingRequirements: _missing,
        profileCompletionPercent: _percent,
        video: _video,
        ...fields
      } = query.data.data;
      setDraft(fields);
    }
  }, [query.data, draft]);
  const save = useMutation({
    mutationFn: () => api<Profile>("/candidate/profile", "PUT", draft),
    onSuccess: () => {
      cache.invalidateQueries();
    },
  });
  const set = <K extends keyof ProfileFields>(
    key: K,
    value: ProfileFields[K],
  ) => {
    save.reset();
    setDraft((d) => (d ? { ...d, [key]: value } : null));
  };
  if (query.isPending) return <Loading />;
  if (!draft)
    return <ErrorBox error={query.error} retry={() => query.refetch()} />;
  const textField = (
    key: keyof ProfileFields,
    name: string,
    required = false,
    type = "text",
  ) => (
    <label key={key}>
      {name}
      {required && <span className="required"> *</span>}
      <input
        type={type}
        value={String(draft[key] ?? "")}
        required={required}
        maxLength={
          key === "fullName" ? 120 : key === "professionalHeadline" ? 200 : 500
        }
        onChange={(e) => set(key, e.target.value as never)}
      />
    </label>
  );
  const listField = (
    key:
      "skills" | "preferredLocations" | "languages" | "employmentPreferences",
    name: string,
  ) => (
    <label key={key}>
      {name}
      <input
        value={draft[key].join(",")}
        placeholder="Separate with commas"
        onChange={(e) => set(key, e.target.value.split(","))}
      />
    </label>
  );
  const recordSections = [
    "experience",
    "education",
    "projects",
    "certifications",
  ] as const;
  return (
    <>
      <PageHeading
        eyebrow="PROFESSIONAL PROFILE"
        title="The person behind the experience."
        description="A reusable introduction, ready for your next opportunity."
      />
      <ErrorBox error={query.error} retry={() => query.refetch()} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="profile-form"
      >
        <div className="panel form-section">
          <div className="form-section-title">
            <span className="mono">01</span>
            <div>
              <h2>The essentials</h2>
              <p>Start with what you’d like people to know.</p>
            </div>
          </div>
          <div className="form-grid">
            {textField("fullName", "Full name", true)}
            {textField("email", "Professional email", true, "email")}
            {textField("professionalHeadline", "Professional headline", true)}
            {textField("location", "Location", true)}
            <label className="span-2">
              About you<span className="required"> *</span>
              <textarea
                required
                rows={4}
                maxLength={5000}
                value={draft.professionalSummary}
                onChange={(e) => set("professionalSummary", e.target.value)}
              />
            </label>
            {listField("skills", "Skills")}
            {listField("preferredLocations", "Preferred locations")}
            {listField("languages", "Languages")}
            {listField("employmentPreferences", "Employment preferences")}
            {textField(
              "photoUrl",
              "Photograph URL (optional HTTPS address)",
              false,
              "url",
            )}
          </div>
          <p className="tiny-muted">
            These are shared demonstration fields. Use fictional details.
          </p>
        </div>
        {recordSections.map((section, index) => (
          <div className="panel form-section" key={section}>
            <div className="form-section-title">
              <span className="mono">0{index + 2}</span>
              <div>
                <h2>{label(section)}</h2>
                <p>
                  {section === "education" || section === "experience"
                    ? "At least one education or experience record is needed to apply."
                    : "Add the work and milestones that matter to you."}
                </p>
              </div>
              <button
                className="button secondary small-button"
                type="button"
                onClick={() =>
                  set(section, [
                    ...draft[section],
                    {
                      id: crypto.randomUUID(),
                      title: "",
                      organisation: "",
                      description: "",
                      startDate: "",
                      endDate: "",
                      url: "",
                    },
                  ])
                }
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            {draft[section].length === 0 ? (
              <p className="empty-section">No {section} added yet.</p>
            ) : (
              draft[section].map((entry, i) => {
                const change = (key: keyof RecordEntry, value: string) =>
                  set(
                    section,
                    draft[section].map((r, j) =>
                      j === i ? { ...r, [key]: value } : r,
                    ),
                  );
                return (
                  <div className="record-editor" key={entry.id || i}>
                    <div className="record-editor-head">
                      <strong>
                        {label(section)} {i + 1}
                      </strong>
                      <button
                        className="icon-button danger"
                        type="button"
                        aria-label={`Remove ${section} ${i + 1}`}
                        onClick={() =>
                          set(
                            section,
                            draft[section].filter((_, j) => j !== i),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="form-grid">
                      <label>
                        {section === "education"
                          ? "Qualification"
                          : section === "certifications"
                            ? "Certification"
                            : "Title"}{" "}
                        *
                        <input
                          required
                          maxLength={200}
                          value={entry.title}
                          onChange={(e) => change("title", e.target.value)}
                        />
                      </label>
                      <label>
                        {section === "education"
                          ? "Institution"
                          : section === "certifications"
                            ? "Issuer"
                            : "Organisation"}
                        <input
                          maxLength={200}
                          value={entry.organisation}
                          onChange={(e) =>
                            change("organisation", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Start / issue date
                        <input
                          type="date"
                          value={entry.startDate}
                          onChange={(e) => change("startDate", e.target.value)}
                        />
                      </label>
                      <label>
                        End date (leave blank if current)
                        <input
                          type="date"
                          value={entry.endDate}
                          onChange={(e) => change("endDate", e.target.value)}
                        />
                      </label>
                      <label className="span-2">
                        Description
                        <textarea
                          rows={2}
                          maxLength={3000}
                          value={entry.description}
                          onChange={(e) =>
                            change("description", e.target.value)
                          }
                        />
                      </label>
                      {(section === "projects" ||
                        section === "certifications") && (
                        <label className="span-2">
                          Project / credential link
                          <input
                            type="url"
                            value={entry.url}
                            onChange={(e) => change("url", e.target.value)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}
        <div className="panel form-section">
          <div className="form-section-title">
            <span className="mono">06</span>
            <div>
              <h2>A few practical details</h2>
              <p>
                Optional information to help teams understand your preferences.
              </p>
            </div>
          </div>
          <div className="form-grid">
            {(
              [
                "expectedSalaryMin",
                "expectedSalaryMax",
                "noticePeriodDays",
              ] as const
            ).map((key) => (
              <label key={key}>
                {key === "noticePeriodDays"
                  ? "Notice period (days)"
                  : key === "expectedSalaryMin"
                    ? "Expected minimum salary"
                    : "Expected maximum salary"}
                <input
                  type="number"
                  min="0"
                  max={key === "noticePeriodDays" ? 365 : undefined}
                  value={draft[key] ?? ""}
                  onChange={(e) =>
                    set(
                      key,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
            ))}
            <label>
              Salary currency
              <input
                maxLength={3}
                pattern="[A-Z]{3}"
                value={draft.salaryCurrency}
                onChange={(e) =>
                  set("salaryCurrency", e.target.value.toUpperCase())
                }
              />
            </label>
          </div>
        </div>
        <div className="sticky-save">
          <div role="status">
            {save.isSuccess ? (
              <span className="saved">
                <Check size={15} />
                Profile saved.
              </span>
            ) : (
              <span className="tiny-muted">
                Applications share a saved profile snapshot. This demo workspace
                is public.
              </span>
            )}
          </div>
          <button className="button primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save professional profile"}
            <ArrowRight size={14} />
          </button>
        </div>
        <ErrorBox error={save.error} />
      </form>
    </>
  );
}
export function VideoPage() {
  const cache = useQueryClient();
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const request = useRef<XMLHttpRequest | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const config = useQuery({
    queryKey: ["config"],
    queryFn: () => api<Config>("/config"),
  });
  const current = useQuery({
    queryKey: ["video"],
    queryFn: () => api<Video | null>("/candidate/videos/current"),
    refetchInterval: (q) =>
      q.state.data?.data?.status === "PROCESSING" ? 2000 : false,
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/candidate/videos/${id}`, "DELETE"),
    onSuccess: () => cache.invalidateQueries(),
  });
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );
  function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = input.current?.files?.[0];
    if (!file || !config.data) return;
    setError(null);
    if (
      !["video/mp4", "video/webm"].includes(file.type) ||
      !/\.(mp4|webm)$/i.test(file.name)
    ) {
      setError(
        new Error(
          "Select an MP4 or WebM video. PDF and text resumes are not accepted.",
        ),
      );
      return;
    }
    if (file.size > config.data.data.maxVideoMB * 1024 * 1024) {
      setError(
        new Error(
          `Video must be smaller than ${config.data.data.maxVideoMB} MB.`,
        ),
      );
      return;
    }
    const data = new FormData();
    data.append("file", file);
    data.append("consent", String(consent));
    const xhr = new XMLHttpRequest();
    request.current = xhr;
    xhr.open("POST", API + "/candidate/videos");
    setProgress(0);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        cache.invalidateQueries();
        if (input.current) input.current.value = "";
      } else {
        let message = "Upload failed. Please retry.";
        try {
          message = JSON.parse(xhr.responseText).error.message;
        } catch {
          /* Preserve the recovery message for a non-JSON response. */
        }
        setError(new Error(message));
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(
        new Error("Upload interrupted. Check your connection and retry."),
      );
    };
    xhr.onabort = () => {
      setProgress(null);
      setError(
        new Error("Upload cancelled. You can choose a video and try again."),
      );
    };
    xhr.send(data);
  }
  const video = current.data?.data;
  return (
    <>
      <PageHeading
        eyebrow="VIDEO RÉSUMÉ"
        title="Let them meet you."
        description="A short introduction. A real sense of who you are."
      />
      <div className="video-page-grid">
        <div>
          <div className="panel video-panel">
            <div className="section-title">
              <h2>Your introduction</h2>
              {video && <Badge status={video.status} />}
            </div>
            <ErrorBox error={current.error} retry={() => current.refetch()} />
            {current.isPending ? (
              <Loading />
            ) : video?.status === "READY" ? (
              <>
                <video
                  controls
                  src={`${API}/videos/${video.id}/media`}
                  aria-label="Your saved video resume"
                />
                <p className="tiny-muted">
                  {video.filename} · {Math.round(video.duration || 0)} seconds.
                  Include spoken descriptions or captions for accessible
                  playback.
                </p>
                <button
                  className="text-button danger"
                  onClick={() => {
                    if (
                      confirm(
                        "Delete this video and revoke playback, including from submitted applications?",
                      )
                    )
                      del.mutate(video.id);
                  }}
                  disabled={del.isPending}
                >
                  <Trash2 size={14} />
                  Delete video and revoke access
                </button>
              </>
            ) : video?.status === "PROCESSING" ? (
              <div className="processing-state">
                <span className="spinner" />
                <h3>Preparing your introduction.</h3>
                <p>We’re checking the video and creating a playable version.</p>
              </div>
            ) : (
              <div className="video-empty">
                <VideoIcon size={32} strokeWidth={1} />
                <h3>Your story belongs here.</h3>
                <p>Upload a short introduction to get started.</p>
                {video?.error && <p className="error-text">{video.error}</p>}
              </div>
            )}
            <ErrorBox error={del.error} />
          </div>
          <form className="panel upload-form" onSubmit={upload}>
            <h2>
              {video ? "Replace your introduction" : "Add your video résumé"}
            </h2>
            <p>
              MP4 or WebM · Up to {config.data?.data.maxVideoMB ?? "…"} MB ·{" "}
              {config.data?.data.maxVideoSeconds ?? "…"} seconds maximum
            </p>
            <label className="upload-drop">
              <Upload size={25} strokeWidth={1.5} />
              <strong>Choose a video file</strong>
              <span>Only video résumés are accepted.</span>
              <input
                ref={input}
                aria-label="Choose video resume"
                type="file"
                accept="video/mp4,video/webm,.mp4,.webm"
                required
                disabled={progress !== null}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I consent to processing this video and sharing it with employers
              when I explicitly apply. I understand this demo is public.
            </label>
            <ErrorBox error={error} />
            <ErrorBox error={config.error} retry={() => config.refetch()} />
            {progress !== null && (
              <div role="status">
                <progress value={progress} max="100" />
                <p className="tiny-muted">
                  {progress === 100
                    ? "Upload received. Preparing processing…"
                    : `Uploading ${progress}%`}
                </p>
              </div>
            )}
            <div className="form-actions">
              <button
                className="button primary"
                disabled={
                  !consent ||
                  !config.data ||
                  progress !== null ||
                  video?.status === "PROCESSING"
                }
              >
                {progress !== null ? "Uploading…" : "Upload introduction"}
                <ArrowUpRight size={15} />
              </button>
              {progress !== null && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => request.current?.abort()}
                >
                  <X size={14} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        <aside className="panel video-guidance">
          <div className="eyebrow">A GOOD FIRST TAKE</div>
          <h2>
            You don’t need
            <br />a perfect script.
          </h2>
          <p>Start with a few simple things.</p>
          <ol>
            <li>
              <strong>Introduce yourself.</strong>
              <p>Your name, what you do, and what you care about.</p>
            </li>
            <li>
              <strong>Show how you think.</strong>
              <p>
                Tell a short story about a project or problem you worked on.
              </p>
            </li>
            <li>
              <strong>Look ahead.</strong>
              <p>The kind of work and team you want to be part of.</p>
            </li>
          </ol>
          <div className="guidance-bottom">
            Keep it clear. Find a quiet spot. Be yourself.
          </div>
          <Link to="/jobs" className="text-button">
            Find your next role
            <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
    </>
  );
}
export function Applications() {
  const result = useQuery({
    queryKey: ["applications"],
    queryFn: () => api<Application[]>("/candidate/applications"),
    refetchInterval: 10000,
  });
  return (
    <>
      <PageHeading
        eyebrow="YOUR APPLICATIONS"
        title="Every next step, in view."
        description="Follow your introductions from first hello to what comes next."
        action={
          <Link className="button secondary" to="/jobs">
            Find opportunities
            <ArrowUpRight size={14} />
          </Link>
        }
      />
      <ErrorBox error={result.error} retry={() => result.refetch()} />
      {result.isPending ? (
        <Loading />
      ) : result.data?.data.length ? (
        <div className="application-list">
          {result.data.data.map((app) => (
            <article className="panel application-card" key={app.id}>
              <div className="application-top">
                <div>
                  <span className="tiny-muted">
                    {app.job.organisation.displayName} · Demo employer
                  </span>
                  <h2>{app.job.title}</h2>
                  <p className="tiny-muted">
                    Applied {date(app.submittedAt)} · Application fee: ₹0
                  </p>
                </div>
                <Badge status={app.status} />
              </div>
              <div className="application-events">
                {app.events.map((event) => (
                  <div key={event.id}>
                    <CircleCheck size={14} />
                    <strong>{label(event.status)}</strong>
                    <span>{date(event.created_at)}</span>
                  </div>
                ))}
              </div>
              <div className="application-reference mono">
                REFERENCE / {app.id}
              </div>
            </article>
          ))}
        </div>
      ) : !result.error ? (
        <Empty title="Your next chapter is still unwritten.">
          <p>
            Find a role that speaks to you and send your first introduction.
          </p>
          <Link to="/jobs" className="button primary">
            Explore opportunities
            <ArrowUpRight size={14} />
          </Link>
        </Empty>
      ) : null}
    </>
  );
}

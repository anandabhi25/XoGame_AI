export interface RecordEntry {
  id: string;
  title: string;
  organisation: string;
  startDate: string;
  endDate: string;
  description: string;
  url: string;
}
export interface Video {
  id: string;
  filename: string;
  status: string;
  consent: boolean;
  duration: number | null;
  error: string | null;
}
export interface Requirement {
  code: string;
  message: string;
  actionUrl: string;
}
export interface Readiness {
  eligible: boolean;
  missingRequirements: Requirement[];
  profileCompletionPercent: number;
  video: Video | null;
}
export interface ProfileFields {
  fullName: string;
  email: string;
  professionalHeadline: string;
  location: string;
  professionalSummary: string;
  photoUrl: string;
  preferredLocations: string[];
  skills: string[];
  experience: RecordEntry[];
  education: RecordEntry[];
  projects: RecordEntry[];
  certifications: RecordEntry[];
  languages: string[];
  employmentPreferences: string[];
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  salaryCurrency: string;
  noticePeriodDays: number | null;
}
export interface Profile extends ProfileFields, Readiness {
  id: string;
}
export interface OrganisationFields {
  displayName: string;
  legalName: string;
  organisationType: string;
  website: string;
  businessEmail: string;
  registeredAddress: string;
  industry: string;
  representativeName: string;
  contactInformation: string;
  synthetic: boolean;
}
export interface Organisation extends OrganisationFields {
  id: string;
  verificationStatus: string;
  reason: string;
  documents?: { id: string; filename: string }[];
}
export interface JobFields {
  title: string;
  domainId: string;
  summary: string;
  description: string;
  responsibilities: string;
  qualifications: string;
  skills: string[];
  city: string;
  country: string;
  workArrangement: string;
  employmentType: string;
  experienceMinYears: number;
  experienceMaxYears: number;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  deadline: string;
  vacancies: number;
}
export interface Job extends JobFields {
  id: string;
  status: string;
  publishedAt: string | null;
  organisation: Organisation;
  applicantCount?: number;
}
export interface Envelope<T> {
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
export interface Eligibility extends Readiness {
  alreadyApplied: boolean;
  jobEligible: boolean;
}
export interface Application {
  id: string;
  job: Job;
  status: string;
  submittedAt: string;
  videoId: string;
  profile?: ProfileFields;
  events: { id: string; status: string; created_at: string }[];
  notes?: { id: string; body: string; created_at: string }[];
}
export interface Notification {
  id: string;
  application_id: string;
  message: string;
  created_at: string;
  read: boolean;
}
export interface Config {
  domains: string[];
  maxVideoMB: number;
  maxVideoSeconds: number;
  videoFormats: string[];
  applicationFee: number;
}

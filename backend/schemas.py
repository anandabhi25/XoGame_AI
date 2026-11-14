from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

class Record(StrictModel):
    id: str = ''
    title: str = Field(min_length=1, max_length=200)
    organisation: str = Field(default='', max_length=200)
    startDate: str = Field(default='', max_length=10)
    endDate: str = Field(default='', max_length=10)
    description: str = Field(default='', max_length=3000)
    url: str = Field(default='', max_length=500)

class Profile(StrictModel):
    fullName: str = Field(default='', max_length=120)
    email: str = Field(default='candidate@example.com', max_length=254, pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    professionalHeadline: str = Field(default='', max_length=200)
    location: str = Field(default='', max_length=200)
    professionalSummary: str = Field(default='', max_length=5000)
    photoUrl: str = Field(default='', max_length=500, pattern=r'^(|https://[^\s]+)$')
    preferredLocations: list[str] = Field(default_factory=list, max_length=30)
    skills: list[str] = Field(default_factory=list, max_length=50)
    experience: list[Record] = Field(default_factory=list, max_length=30)
    education: list[Record] = Field(default_factory=list, max_length=30)
    projects: list[Record] = Field(default_factory=list, max_length=30)
    certifications: list[Record] = Field(default_factory=list, max_length=30)
    languages: list[str] = Field(default_factory=list, max_length=30)
    employmentPreferences: list[str] = Field(default_factory=list, max_length=10)
    expectedSalaryMin: int | None = Field(default=None, ge=0)
    expectedSalaryMax: int | None = Field(default=None, ge=0)
    salaryCurrency: str = Field(default='INR', pattern=r'^[A-Z]{3}$')
    noticePeriodDays: int | None = Field(default=None, ge=0, le=365)

    @model_validator(mode='after')
    def salary_range(self):
        if self.expectedSalaryMin is not None and self.expectedSalaryMax is not None and self.expectedSalaryMin > self.expectedSalaryMax:
            raise ValueError('Minimum salary must not exceed maximum salary')
        self.skills = list(dict.fromkeys(s.strip() for s in self.skills if s.strip()))
        if any(len(s) > 100 for s in self.skills + self.languages + self.preferredLocations):
            raise ValueError('List entries must be at most 100 characters')
        return self

class Organisation(StrictModel):
    displayName: str = Field(min_length=2, max_length=150)
    legalName: str = Field(min_length=2, max_length=200)
    organisationType: str = Field(default='Private company', max_length=100)
    website: str = Field(pattern=r'^https://[^\s]+$', max_length=500)
    businessEmail: str = Field(pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$', max_length=254)
    registeredAddress: str = Field(min_length=5, max_length=1000)
    industry: str = Field(min_length=2, max_length=100)
    representativeName: str = Field(min_length=2, max_length=120)
    contactInformation: str = Field(min_length=3, max_length=200)
    synthetic: bool = True

class Job(StrictModel):
    title: str = Field(min_length=3, max_length=200)
    domainId: Literal['engineering','design','product','marketing','operations','finance']
    summary: str = Field(min_length=10, max_length=500)
    description: str = Field(min_length=30, max_length=20000)
    responsibilities: str = Field(min_length=10, max_length=10000)
    qualifications: str = Field(min_length=5, max_length=5000)
    skills: list[str] = Field(min_length=1, max_length=30)
    city: str = Field(min_length=2, max_length=100)
    country: str = Field(default='India', min_length=2, max_length=100)
    workArrangement: Literal['REMOTE','HYBRID','ON_SITE'] = 'HYBRID'
    employmentType: Literal['FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP'] = 'FULL_TIME'
    experienceMinYears: int = Field(default=0, ge=0, le=50)
    experienceMaxYears: int = Field(default=5, ge=0, le=50)
    salaryMin: int | None = Field(default=None, ge=0)
    salaryMax: int | None = Field(default=None, ge=0)
    salaryCurrency: str = Field(default='INR', pattern=r'^[A-Z]{3}$')
    salaryPeriod: Literal['YEAR','MONTH'] = 'YEAR'
    deadline: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    vacancies: int = Field(default=1, ge=1, le=10000)

    @model_validator(mode='after')
    def ranges(self):
        from datetime import date
        date.fromisoformat(self.deadline)
        if self.experienceMinYears > self.experienceMaxYears:
            raise ValueError('Minimum experience must not exceed maximum')
        if self.salaryMin is not None and self.salaryMax is not None and self.salaryMin > self.salaryMax:
            raise ValueError('Minimum salary must not exceed maximum')
        return self

class Apply(StrictModel):
    confirmProfileSharing: bool
    videoResumeId: str

class Decision(StrictModel):
    status: Literal['VERIFIED','REJECTED','UNDER_REVIEW','SUSPENDED']
    reason: str = Field(default='', max_length=2000)

class Transition(StrictModel):
    status: Literal['VIEWED','SHORTLISTED','REJECTED']
    expectedCurrentStatus: str

class Note(StrictModel):
    body: str = Field(min_length=1, max_length=5000)

class Suspension(StrictModel):
    suspended: bool

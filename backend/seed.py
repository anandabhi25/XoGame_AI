"""Idempotent, explicitly fictional development fixtures. Never real verification claims."""

from datetime import date, timedelta
from .db import connect, migrate, now, audit
from .schemas import Profile, Organisation, Job

CANDIDATE = "demo-candidate"


def seed():
    migrate()
    with connect() as c:
        if c.execute("SELECT 1 FROM profiles LIMIT 1").fetchone():
            return
        p = Profile(
            fullName="Alex Morgan (demo)",
            professionalHeadline="Product designer",
            location="Bengaluru",
            professionalSummary="I turn complex workflows into thoughtful, accessible products. This is a fictional profile for exploring XOGAME.",
            skills=["Product design", "Figma", "Prototyping"],
            education=[
                {
                    "title": "B.Des. Communication Design",
                    "organisation": "Example Design School",
                }
            ],
        )
        c.execute(
            "INSERT INTO profiles VALUES(?,?,0)", (CANDIDATE, p.model_dump_json())
        )
        for i, (name, industry, status) in enumerate(
            [
                ("Forma Studio", "Design", "VERIFIED"),
                ("Northstar Labs", "Engineering", "VERIFIED"),
                ("Goodwork Co.", "Product", "VERIFIED"),
                ("Fieldnote", "Marketing", "VERIFIED"),
                ("Orbit Works", "Operations", "SUBMITTED"),
                ("Sample Rejected Co.", "Finance", "REJECTED"),
                ("Sample Suspended Co.", "Engineering", "SUSPENDED"),
            ]
        ):
            o = Organisation(
                displayName=name,
                legalName=name + " (fictional demo)",
                website=f"https://company-{i}.example",
                businessEmail=f"team@company-{i}.example",
                registeredAddress="100 Example Street, Bengaluru",
                industry=industry,
                representativeName="Demo Representative",
                contactInformation="demo@example.com",
            )
            c.execute(
                "INSERT INTO organisations VALUES(?,?,?,?)",
                (f"org-{i + 1}", o.model_dump_json(), status, ""),
            )
        fixtures = [
            (
                "Senior Product Designer",
                "design",
                "Bengaluru",
                "HYBRID",
                0,
                ["Figma", "Product design", "Prototyping"],
                1800000,
                2800000,
            ),
            (
                "Frontend Engineer",
                "engineering",
                "Remote",
                "REMOTE",
                1,
                ["React", "TypeScript", "CSS"],
                1600000,
                2600000,
            ),
            (
                "Product Manager",
                "product",
                "Mumbai",
                "HYBRID",
                2,
                ["Strategy", "Analytics", "Roadmaps"],
                2200000,
                3400000,
            ),
            (
                "Brand Designer",
                "design",
                "Remote",
                "REMOTE",
                0,
                ["Branding", "Typography", "Figma"],
                1200000,
                2000000,
            ),
            (
                "Content Strategist",
                "marketing",
                "Delhi",
                "ON_SITE",
                3,
                ["Writing", "Content strategy", "SEO"],
                900000,
                1600000,
            ),
            (
                "Backend Engineer",
                "engineering",
                "Bengaluru",
                "HYBRID",
                1,
                ["Python", "APIs", "SQL"],
                1800000,
                3000000,
            ),
            (
                "UX Researcher",
                "design",
                "Pune",
                "HYBRID",
                2,
                ["Research", "Interviews", "Usability"],
                1400000,
                2200000,
            ),
            (
                "Growth Marketer",
                "marketing",
                "Mumbai",
                "REMOTE",
                3,
                ["Analytics", "Campaigns", "Growth"],
                1200000,
                1900000,
            ),
            (
                "Operations Associate",
                "operations",
                "Bengaluru",
                "ON_SITE",
                4,
                ["Operations", "Planning"],
                600000,
                1000000,
            ),
        ]
        for i, (title, domain, city, arr, org, skills, low, high) in enumerate(
            fixtures
        ):
            j = Job(
                title=title,
                domainId=domain,
                city=city,
                workArrangement=arr,
                summary=f"Help a small, thoughtful team shape better products through {skills[0].lower()}.",
                description="Work closely with a multidisciplinary team to solve practical problems for people. You will own meaningful work from the first conversation through delivery, with room to test ideas and improve how the team works.",
                responsibilities="Own projects from discovery to delivery.\nCollaborate with design, engineering and product partners.\nShare work early and use feedback to improve outcomes.",
                qualifications="Relevant hands-on experience and a portfolio of considered work. Clear communication and curiosity about how people use products.",
                skills=skills,
                experienceMinYears=2,
                experienceMaxYears=5,
                salaryMin=low,
                salaryMax=high,
                deadline=(date.today() + timedelta(days=60)).isoformat(),
            )
            status = "DRAFT" if org == 4 else "PUBLISHED"
            c.execute(
                "INSERT INTO jobs VALUES(?,?,?,?,?,?)",
                (
                    f"job-{i + 1}",
                    f"org-{org + 1}",
                    j.model_dump_json(),
                    status,
                    now() if status == "PUBLISHED" else None,
                    now(),
                ),
            )
        for suffix, status, days in [
            ("draft", "DRAFT", 30),
            ("closed", "CLOSED", 30),
            ("expired", "PUBLISHED", -1),
        ]:
            j.deadline = (date.today() + timedelta(days=days)).isoformat()
            c.execute(
                "INSERT INTO jobs VALUES(?,?,?,?,?,?)",
                ("job-" + suffix, "org-1", j.model_dump_json(), status, now(), now()),
            )
        audit(c, "SEED_INITIALIZED", "workspace", {"synthetic": True})


if __name__ == "__main__":
    seed()
    print("Synthetic demo data initialized. Existing records are preserved.")

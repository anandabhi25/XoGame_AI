import subprocess
import pytest
from fastapi.testclient import TestClient
from backend import db
from backend.main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    # main imports MEDIA_PATH directly; patch both.
    monkeypatch.setattr(db, "MEDIA_PATH", tmp_path / "media")
    monkeypatch.setattr("backend.main.MEDIA_PATH", tmp_path / "media")
    with TestClient(app) as client:
        yield client


def video(client, tmp_path):
    target = tmp_path / "sample.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "color=c=blue:s=320x240:d=1",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(target),
        ],
        check=True,
    )
    with target.open("rb") as f:
        r = client.post(
            "/api/v1/candidate/videos",
            files={"file": ("sample.mp4", f, "video/mp4")},
            data={"consent": "true"},
        )
    assert r.status_code == 202, r.text
    v = client.get("/api/v1/candidate/videos/current").json()["data"]
    assert v["status"] == "READY", v
    return v


def test_search_and_validation(client):
    r = client.get("/api/v1/jobs").json()
    assert r["meta"]["total"] == 8
    assert all(j["organisation"]["verificationStatus"] == "VERIFIED" for j in r["data"])
    assert client.get("/api/v1/jobs?keyword=React").json()["meta"]["total"] == 1
    assert (
        client.get("/api/v1/jobs?city=remote&domainId=design").json()["meta"]["total"]
        == 1
    )
    assert client.get("/api/v1/jobs?experience=-1").status_code == 422
    assert client.get("/api/v1/jobs/job-draft").status_code == 404
    assert client.get("/api/v1/jobs/job-expired").status_code == 404
    assert client.get("/api/v1/health").status_code == 200


def test_video_rejects_false_content(client):
    for name, mime in [("resume.pdf", "application/pdf"), ("fake.mp4", "video/mp4")]:
        r = client.post(
            "/api/v1/candidate/videos",
            files={"file": (name, b"%PDF-test", mime)},
            data={"consent": "true"},
        )
        assert r.status_code == 415, r.text


def test_full_candidate_recruitment_journey(client, tmp_path):
    assert not client.get("/api/v1/jobs/job-1/eligibility").json()["data"]["eligible"]
    p = client.get("/api/v1/candidate/profile").json()["data"]
    body = {
        k: v
        for k, v in p.items()
        if k
        not in [
            "id",
            "eligible",
            "missingRequirements",
            "profileCompletionPercent",
            "video",
        ]
    }
    body["professionalHeadline"] = "Updated designer"
    assert client.put("/api/v1/candidate/profile", json=body).status_code == 200
    assert (
        client.get("/api/v1/candidate/profile").json()["data"]["professionalHeadline"]
        == "Updated designer"
    )
    v = video(client, tmp_path)
    assert client.get("/api/v1/videos/" + v["id"] + "/media").status_code == 200
    payload = {"confirmProfileSharing": True, "videoResumeId": v["id"]}
    assert (
        client.post(
            "/api/v1/jobs/job-1/applications",
            json={**payload, "confirmProfileSharing": False},
        ).status_code
        == 422
    )
    r = client.post(
        "/api/v1/jobs/job-1/applications",
        json=payload,
        headers={"Idempotency-Key": "test-1"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["data"]["applicationFee"] == 0
    ident = r.json()["data"]["applicationId"]
    assert (
        client.post(
            "/api/v1/jobs/job-1/applications",
            json=payload,
            headers={"Idempotency-Key": "test-1"},
        ).json()["data"]["applicationId"]
        == ident
    )
    assert (
        client.post("/api/v1/jobs/job-1/applications", json=payload).status_code == 409
    )
    assert len(client.get("/api/v1/employer/org-1/applications").json()["data"]) == 1
    assert client.get("/api/v1/employer/org-2/applications").json()["data"] == []
    assert (
        client.patch(
            f"/api/v1/employer/org-2/applications/{ident}/status",
            json={"status": "SHORTLISTED", "expectedCurrentStatus": "SUBMITTED"},
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"/api/v1/employer/org-1/applications/{ident}/status",
            json={"status": "SHORTLISTED", "expectedCurrentStatus": "SUBMITTED"},
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/api/v1/employer/org-1/applications/{ident}/status",
            json={"status": "REJECTED", "expectedCurrentStatus": "SUBMITTED"},
        ).status_code
        == 409
    )
    assert (
        client.get("/api/v1/candidate/applications").json()["data"][0]["status"]
        == "SHORTLISTED"
    )
    assert (
        client.post(
            f"/api/v1/employer/org-1/applications/{ident}/notes",
            json={"body": "Strong presentation"},
        ).status_code
        == 201
    )
    assert "notes" not in client.get("/api/v1/candidate/applications").json()["data"][0]
    assert (
        client.post("/api/v1/jobs/job-closed/applications", json=payload).status_code
        == 409
    )
    assert client.delete("/api/v1/candidate/videos/" + v["id"]).status_code == 200
    assert client.get("/api/v1/videos/" + v["id"] + "/media").status_code == 404


def test_verification_controls_publication(client):
    assert client.post("/api/v1/employer/org-5/jobs/job-9/publish").status_code == 403
    assert (
        client.patch(
            "/api/v1/admin/verifications/org-5", json={"status": "VERIFIED"}
        ).status_code
        == 200
    )
    assert client.post("/api/v1/employer/org-5/jobs/job-9/publish").status_code == 200
    assert client.get("/api/v1/jobs/job-9").status_code == 200
    assert client.post("/api/v1/employer/org-2/jobs/job-9/close").status_code == 404
    assert (
        client.patch(
            "/api/v1/admin/verifications/org-5",
            json={"status": "SUSPENDED", "reason": "Demo review"},
        ).status_code
        == 200
    )
    assert client.get("/api/v1/jobs/job-9").status_code == 404


def test_suspension_and_profile_validation(client):
    assert (
        client.patch(
            "/api/v1/admin/users/demo-candidate", json={"suspended": True}
        ).status_code
        == 200
    )
    assert not client.get("/api/v1/candidate/readiness").json()["data"]["eligible"]
    assert client.put("/api/v1/candidate/profile", json={}).status_code == 403
    assert (
        client.put(
            "/api/v1/candidate/profile",
            json={"expectedSalaryMin": 100, "expectedSalaryMax": 50},
        ).status_code
        == 422
    )
    assert client.get("/api/v1/missing").status_code == 404


def test_organisation_onboarding_and_evidence(client):
    org = {
        "displayName": "Example Works",
        "legalName": "Example Works Demo",
        "website": "https://works.example",
        "businessEmail": "team@works.example",
        "registeredAddress": "123 Example Avenue",
        "industry": "Engineering",
        "representativeName": "Demo Person",
        "contactInformation": "demo@example.com",
    }
    created = client.post("/api/v1/organisations", json=org)
    assert created.status_code == 201
    ident = created.json()["data"]["id"]
    assert (
        client.patch(
            "/api/v1/admin/verifications/" + ident, json={"status": "VERIFIED"}
        ).status_code
        == 409
    )
    assert client.post(f"/api/v1/organisations/{ident}/verification").status_code == 422
    assert (
        client.post(
            f"/api/v1/organisations/{ident}/documents",
            files={"file": ("evidence.exe", b"executable", "application/octet-stream")},
        ).status_code
        == 415
    )
    assert (
        client.post(
            f"/api/v1/organisations/{ident}/documents",
            files={
                "file": ("demo.pdf", b"%PDF-1.7\n synthetic fixture", "application/pdf")
            },
        ).status_code
        == 201
    )
    assert client.post(f"/api/v1/organisations/{ident}/verification").status_code == 200
    assert (
        client.patch(
            "/api/v1/admin/verifications/" + ident, json={"status": "UNDER_REVIEW"}
        ).status_code
        == 200
    )
    assert (
        client.patch(
            "/api/v1/admin/verifications/" + ident, json={"status": "REJECTED"}
        ).status_code
        == 422
    )
    assert (
        client.patch(
            "/api/v1/admin/verifications/" + ident, json={"status": "VERIFIED"}
        ).status_code
        == 200
    )


def test_profile_snapshot_replacement_and_processing_block(client, tmp_path):
    import json

    first = video(client, tmp_path)
    payload = {"confirmProfileSharing": True, "videoResumeId": first["id"]}
    assert (
        client.post("/api/v1/jobs/job-1/applications", json=payload).status_code == 201
    )
    with db.connect() as c:
        original = json.loads(
            c.execute("SELECT profile_snapshot FROM applications").fetchone()[0]
        )
        p = original.copy()
        p["professionalHeadline"] = "Changed later"
    assert client.put("/api/v1/candidate/profile", json=p).status_code == 200
    app = client.get("/api/v1/employer/org-1/applications").json()["data"][0]
    assert app["profile"]["professionalHeadline"] == original["professionalHeadline"]
    second = video(client, tmp_path)
    assert second["id"] != first["id"]
    assert client.get("/api/v1/videos/" + first["id"] + "/media").status_code == 404
    with db.connect() as c:
        c.execute("UPDATE videos SET status='PROCESSING' WHERE id=?", (second["id"],))
    assert not client.get("/api/v1/jobs/job-2/eligibility").json()["data"]["eligible"]
    assert (
        client.post(
            "/api/v1/jobs/job-2/applications",
            json={**payload, "videoResumeId": second["id"]},
        ).status_code
        == 422
    )


def test_job_edit_pagination_and_profile_ranges(client):
    result = client.get("/api/v1/jobs?limit=2&page=2").json()
    assert len(result["data"]) == 2 and result["meta"]["totalPages"] == 4
    assert (
        client.get("/api/v1/jobs?keyword=salaryCurrency").json()["meta"]["total"] == 0
    )
    existing = client.get("/api/v1/jobs/job-1").json()["data"]
    body = {
        k: v
        for k, v in existing.items()
        if k not in ["id", "status", "publishedAt", "organisation"]
    }
    body["title"] = "Updated Product Designer"
    assert client.put("/api/v1/employer/org-1/jobs/job-1", json=body).status_code == 200
    assert client.get("/api/v1/jobs?keyword=Updated").json()["meta"]["total"] == 1
    body["skills"] = [" "]
    assert client.post("/api/v1/employer/org-1/jobs", json=body).status_code == 422
    assert (
        client.put(
            "/api/v1/candidate/profile",
            json={"education": [{"title": "Test", "startDate": "2026-99-20"}]},
        ).status_code
        == 422
    )

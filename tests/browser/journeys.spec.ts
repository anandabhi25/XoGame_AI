import AxeBuilder from "../../frontend/node_modules/@axe-core/playwright";
import { test, expect } from "../../frontend/node_modules/@playwright/test";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
const videoPath = join(tmpdir(), "xogame-browser-test.mp4");
test.beforeAll(() => {
  execFileSync("ffmpeg", [
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
    videoPath,
  ]);
});
test("candidate profile → video → free application → employer shortlist", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/candidate/profile");
  await page.getByLabel("Professional headline").fill("Interaction designer");
  await page.getByRole("button", { name: "Save professional profile" }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Professional headline")).toHaveValue(
    "Interaction designer",
  );
  await page.goto("/candidate/video");
  await page.getByLabel("Choose video resume").setInputFiles(videoPath);
  await page.getByLabel("I consent to processing this video").check();
  await page.getByRole("button", { name: "Upload introduction" }).click();
  await expect(page.locator(".badge.ready")).toBeVisible({ timeout: 30000 });
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBeGreaterThan(0);
  await page.goto("/jobs/job-1");
  await page.getByRole("button", { name: "Review application" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Interaction designer", { exact: false }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review application" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Review application" }).click();
  await dialog.getByLabel("I consent to sharing this saved").check();
  await dialog.getByRole("button", { name: "Submit free application" }).click();
  await expect(page.locator(".success-box")).toContainText(
    "Application submitted.",
  );
  await page.goto("/candidate/applications");
  await expect(page.locator(".application-card")).toHaveCount(1);
  await expect(
    page.getByText("Application fee: ₹0", { exact: false }),
  ).toBeVisible();
  await page.goto("/employer/dashboard");
  await page
    .getByRole("button", { name: "Applicant review", exact: true })
    .click();
  await page.getByRole("button", { name: "Review profile & video" }).click();
  await expect(page.locator("video")).toBeVisible();
  await expect(page.locator(".badge.viewed")).toBeVisible();
  await page.getByRole("button", { name: "Shortlist", exact: true }).click();
  await expect(page.locator(".badge.shortlisted")).toBeVisible();
  await page.getByLabel("Recruitment note").fill("Clear project explanation.");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Clear project explanation.")).toBeVisible();
  await page.goto("/candidate/applications");
  await expect(page.locator(".badge.shortlisted")).toBeVisible();
  expect(errors).toEqual([]);
});
test("search URLs, empty recovery and API error retry", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByLabel("Role, company, or skill").fill("React");
  await page
    .getByRole("button", { name: "Find opportunities", exact: true })
    .click();
  await expect(page.locator(".job-card")).toHaveCount(1);
  await expect(page).toHaveURL(/keyword=React/);
  await page.reload();
  await expect(page.getByLabel("Role, company, or skill")).toHaveValue("React");
  await page.getByLabel("Role, company, or skill").fill("zznomatch");
  await page
    .getByRole("button", { name: "Find opportunities", exact: true })
    .click();
  await expect(
    page.getByText("No jobs found.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page.locator(".job-card")).toHaveCount(8);
  await page.route("**/api/v1/jobs?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Test service interrupted" } }),
    }),
  );
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(page.getByText("Test service interrupted")).toBeVisible({
    timeout: 10000,
  });
  await page.unroute("**/api/v1/jobs?*");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".job-card")).toHaveCount(3);
});
test("verification gates publishing and persists decisions", async ({
  page,
}) => {
  await page.goto("/employer/dashboard");
  await page.getByLabel("Active organisation").selectOption("org-5");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByText("Only verified organisations can publish jobs"),
  ).toBeVisible();
  await page.goto("/admin/dashboard");
  const org = page.locator(".verification-item").filter({
    has: page.getByRole("heading", { name: "Orbit Works", exact: true }),
  });
  await org.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(org.locator(".badge.verified")).toBeVisible();
  await page.goto("/employer/dashboard");
  await page.getByLabel("Active organisation").selectOption("org-5");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator(".employer-job .badge.published")).toBeVisible();
});
test("responsive routes, mobile navigation and landing preview", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/jobs",
      "/jobs/job-1",
      "/candidate/profile",
      "/candidate/video",
      "/candidate/dashboard",
      "/candidate/applications",
      "/employer/dashboard",
      "/admin/dashboard",
      "/privacy",
      "/landing/",
    ]) {
      await page.goto(route);
      await page.locator("h1").waitFor();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/jobs");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("link", { name: "Video résumé", exact: true }).click();
  await expect(page).toHaveURL("/candidate/video");
  await page.goto("/landing/");
  await page
    .getByRole("button", { name: "Play interactive introduction preview" })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause introduction preview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Engineering", exact: true }).click();
  await expect(
    page.getByText("Frontend Engineer", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("failed application never shows success; form errors retain entered values", async ({
  page,
}) => {
  await page.goto("/jobs/job-2");
  await page.getByRole("button", { name: "Review application" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("I consent to sharing this saved").check();
  await page.route("**/api/v1/jobs/job-2/applications", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { message: "Application could not be saved" },
      }),
    }),
  );
  await dialog.getByRole("button", { name: "Submit free application" }).click();
  await expect(
    dialog.getByText("Application could not be saved"),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(page.locator(".success-box")).toHaveCount(0);
  await expect(
    dialog.getByLabel("I consent to sharing this saved"),
  ).toBeChecked();
  await page.goto("/candidate/profile");
  await page.getByLabel("Professional headline").fill("Unsaved but preserved");
  await page.route("**/api/v1/candidate/profile", (r) =>
    r.request().method() === "PUT"
      ? r.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "Profile could not be saved" },
          }),
        })
      : r.continue(),
  );
  await page.getByRole("button", { name: "Save professional profile" }).click();
  await expect(page.getByText("Profile could not be saved")).toBeVisible();
  await expect(page.getByLabel("Professional headline")).toHaveValue(
    "Unsaved but preserved",
  );
});
test("create a complete job draft, publish and discover it", async ({
  page,
}) => {
  await page.goto("/employer/jobs/new");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Role title").fill("Interface designer demo");
  await dialog
    .getByLabel("Summary", { exact: false })
    .fill("Design considered interfaces for the fictional demo team.");
  await dialog
    .getByLabel("Description", { exact: false })
    .fill(
      "Work with a small interdisciplinary team to design accessible interfaces and improve everyday user workflows.",
    );
  await dialog
    .getByLabel("Responsibilities")
    .fill("Own interaction design and share prototypes with the team.");
  await dialog
    .getByLabel("Qualifications")
    .fill("Experience building accessible product interfaces.");
  await dialog
    .getByLabel("Skills (comma separated)")
    .fill("Figma, Product design");
  await dialog.getByLabel("City", { exact: false }).fill("Bengaluru");
  await dialog
    .getByLabel("Application deadline")
    .fill(new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10));
  await dialog.getByRole("button", { name: "Save opportunity" }).click();
  await expect(dialog).not.toBeVisible();
  const job = page.locator(".employer-job").filter({
    has: page.getByRole("heading", {
      name: "Interface designer demo",
      exact: true,
    }),
  });
  await expect(job.locator(".badge.draft")).toBeVisible();
  await job.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(job.locator(".badge.published")).toBeVisible();
  await page.goto("/jobs?keyword=Interface%20designer%20demo");
  await expect(page.locator(".job-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Interface designer demo", exact: true }),
  ).toBeVisible();
});

test("automated accessibility checks on desktop and mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/jobs",
      "/candidate/profile",
      "/candidate/video",
      "/candidate/dashboard",
      "/candidate/applications",
      "/employer/dashboard",
      "/admin/dashboard",
      "/landing/",
    ]) {
      await page.goto(route);
      await page.locator("h1").waitFor();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(result.violations, `${width}px ${route}`).toEqual([]);
    }
  }
});

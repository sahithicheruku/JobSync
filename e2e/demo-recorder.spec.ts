import { test, expect, type Locator, type Page } from "@playwright/test";

test.setTimeout(600_000);
const pause = (p: Page, s: number) => p.waitForTimeout(s * 1000);

async function login(p: Page) {
  await p.goto("/signin");
  await p.getByPlaceholder("id@example.com").fill(process.env.E2E_EMAIL!);
  await p.getByLabel("Password").fill(process.env.E2E_PASSWORD!);

  const loginButton = p.getByRole("button", { name: "Login" });
  await expect(loginButton).toBeEnabled({ timeout: 10_000 });
  await loginButton.click();

  await expect(p).toHaveURL(/\/dashboard(?:$|\/)/, {
    timeout: 30_000,
  });
}
async function hideIssuesBadge(p: Page) {
  await p.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "html,body{height:900px!important;overflow:hidden!important}body>div:not(#demo-caption){height:900px!important;min-height:900px!important;max-height:900px!important;overflow:auto!important}";
    document.documentElement.appendChild(style);
    const hide = () => document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (el.textContent?.trim() === "Issues") Object.assign(el.style, { display: "none", visibility: "hidden", opacity: "0", pointerEvents: "none" });
    });
    const start = () => {
      hide();
      new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    };
    if (document.documentElement) start(); else new MutationObserver(start).observe(document, { childList: true });
  });
}

async function showCaption(p: Page, title: string, body: string) {
  await p.evaluate(({ title, body }) => {
    document.getElementById("demo-caption")?.remove();
    const n = document.createElement("div"); n.id = "demo-caption";
    n.innerHTML = `<div style="font-size:26px;font-weight:800;margin-bottom:8px">${title}</div><div style="font-size:21px;font-weight:600;line-height:1.35">${body}</div>`;
    Object.assign(n.style, { position: "fixed", inset: "auto 0 0", width: "100%", height: "140px", boxSizing: "border-box", zIndex: "2147483647", pointerEvents: "none", background: "rgba(9,15,28,.98)", color: "white", padding: "22px 48px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", fontFamily: "system-ui,sans-serif" });
    document.body.appendChild(n);
  }, { title, body });
  await pause(p, 4);
}
const hideCaption = (p: Page) => p.evaluate(() => document.getElementById("demo-caption")?.remove());
async function slowScroll(p: Page, px = 600) { for (let i = 0; i < Math.ceil(px / 180); i++) { await p.mouse.wheel(0, 180); await pause(p, .45); } }
async function nav(p: Page, name: string, url: RegExp, title: string, body: string) {
  const link = p.getByRole("link", { name, exact: true });
  await expect(link).toBeVisible();
  await link.click();

  try {
    await expect(p).toHaveURL(url, { timeout: 8_000 });
  } catch {
    const href = await link.getAttribute("href");
    if (href) {
      await p.goto(href);
      await expect(p).toHaveURL(url, { timeout: 15_000 });
    } else {
      throw new Error(`Navigation failed for ${name}`);
    }
  }

  await pause(p, 2);
  await showCaption(p, title, body);
}
async function section(p: Page, heading: string, title: string, body: string) {
  const h = p.getByRole("heading", { name: heading, exact: true }); await expect(h).toBeVisible(); await h.scrollIntoViewIfNeeded(); await showCaption(p, title, body);
}
async function combo(p: Page, label: string, value: string, placeholder: string) {
  await p.getByLabel(label).click(); const input = p.getByPlaceholder(placeholder); await input.fill(value); await pause(p, .7);
  const option = p.getByRole("option", { name: value, exact: true });
  if (await option.count()) await option.click(); else await p.getByText(`Create: ${value}`, { exact: true }).click();
}
async function firstOption(select: Locator) { if (await select.locator("option").count() > 1) await select.selectOption({ index: 1 }); }

test("JobSync complete portfolio walkthrough", async ({ browser }) => {
  const auth = await browser.newContext(); const authPage = await auth.newPage(); await login(authPage); const storageState = await auth.storageState(); await auth.close();
  const context = await browser.newContext({ storageState, viewport: { width: 1440, height: 1040 }, recordVideo: { dir: "test-results/demo-video", size: { width: 1440, height: 1040 } } });
  const p = await context.newPage();
    await hideIssuesBadge(p);
    await p.goto("/dashboard"); await expect(p).toHaveURL(/\/dashboard$/); await pause(p, 3);
    await showCaption(p, "Dashboard", "Track applications, interviews, offers, deadlines, and overall job-search progress."); await slowScroll(p, 500);
    await nav(p, "My Jobs", /\/dashboard\/myjobs$/, "My Jobs", "Manage saved opportunities and track each role through the application lifecycle."); await slowScroll(p, 350);

    await p.getByTestId("add-job-btn").click(); await expect(p.getByTestId("add-job-dialog-title")).toBeVisible();
    await showCaption(p, "Add Job", "Save the complete opportunity before deciding whether to apply.");
    await p.getByPlaceholder("Copy and paste job link here").fill("https://example.com/jobs/product-analyst");
    await combo(p, "Job Title", "Product Data Analyst", "Create or Search title"); await combo(p, "Company", "Northstar Labs", "Create or Search company"); await combo(p, "Job Location", "Remote - United States", "Create or Search location");
    await p.getByText("Full-time", { exact: true }).click(); await p.getByLabel("Job Source").click();
    const source = p.getByRole("option", { name: "LinkedIn", exact: true }); if (await source.count()) await source.click(); else await p.getByRole("option").nth(1).click();
    await p.getByLabel("Select Job Status").click(); await p.getByRole("option").first().click();
    await p.getByLabel("Select Salary Range").click(); await p.getByRole("option").first().click();
    await p.getByLabel("Job Description").locator("div").fill("Build dashboards and product insights with SQL, Python, experimentation, stakeholder communication, and production data quality practices.");
    await p.getByLabel("Resume").click(); await p.getByRole("option").first().click(); await pause(p, 5);
    await showCaption(p, "Save Opportunity", "JobSync keeps the role, resume, deadlines, application status, and job description together.");
    const save = p.getByTestId("save-job-btn"); await expect(save).toBeEnabled();
    await save.click(); await pause(p, 4);
    await expect(p).toHaveURL(/\/dashboard\/myjobs\/[^/]+$/, {
      timeout: 30_000,
    });
    const createdJobUrl = p.url();
    await showCaption(p, "Draft", "Saved for review before marking this opportunity as applied.");

    await showCaption(p, "Pre-Application Analysis", "Evaluate resume-to-job fit before deciding whether to apply."); await expect(p.getByText("Product Data Analyst")).toBeVisible();
    const match = p.getByRole("dialog"); if (!(await match.isVisible())) await p.getByRole("button", { name: "Match with AI" }).click();
    await expect(match).toContainText("Explainable job match"); await firstOption(match.locator("select")); await match.getByRole("button", { name: "Analyze fit" }).click();
    await expect(match).toContainText(/\d+\/100|Score unavailable|Analysis failed/, { timeout: 90_000 }); await showCaption(p, "Explainable AI Match", "Compare resume evidence with job requirements and identify strengths and gaps before applying."); await pause(p, 2); await match.getByRole("button", { name: /Close|Dismiss/i }).click().catch(() => {});
    await expect(p.getByRole("button", { name: "Keep Saved" })).toBeVisible(); await showCaption(p, "Application Decision", "Review the analysis, then apply or keep the opportunity saved for later.");

    await p.getByRole("heading", { name: "AI-Powered Learning Recommendations" }).scrollIntoViewIfNeeded(); await showCaption(p, "Learning Recommendations", "Identify matched skills, missing skills, and useful courses for the target role."); await p.getByRole("button", { name: "Get Recommendations" }).click(); const recommendationResult = p.getByText(/Recommended Courses|All Set!|Matched Skills|Missing Skills/).or(p.locator('a[href*="course" i], [data-testid*="course" i], [data-testid*="recommend" i]')).first(); await recommendationResult.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {}); await pause(p, 6);
    await p.getByRole("button", { name: "Keep Saved" }).click(); await pause(p, 3);

    await nav(
      p,
      "My Jobs",
      /\/dashboard\/myjobs$/,
      "Existing Job Analysis",
      "Re-run AI matching on jobs already saved in JobSync."
    );

    const jobs = p.locator('a[href^="/dashboard/myjobs/"]');

    await expect.poll(
      () => jobs.count(),
      { timeout: 15_000 }
    ).toBeGreaterThanOrEqual(2);

    let existingJobHref: string | null = null;

    for (const job of await jobs.all()) {
      const href = await job.getAttribute("href");

      if (
        href &&
        new URL(href, p.url()).pathname !==
          new URL(createdJobUrl).pathname
      ) {
        existingJobHref = href;
        break;
      }
    }

    if (!existingJobHref) {
      throw new Error("Could not find a second existing job.");
    }

    await p.goto(existingJobHref);

    await expect(p).toHaveURL(/\/dashboard\/myjobs\/[^/]+$/, {
      timeout: 15_000,
    });

    let second = p.locator('[role="dialog"][data-state="open"]').last();

    const openedAutomatically = await second
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (!openedAutomatically) {
      const matchButton = p.getByRole("button", { name: "Match with AI" });

      await expect(matchButton).toBeVisible({ timeout: 15_000 });
      await matchButton.click();

      second = p.locator('[role="dialog"][data-state="open"]').last();
      await expect(second).toBeVisible({ timeout: 15_000 });
    }

    await expect(second).toBeVisible({ timeout: 15_000 });

    const secondResume = second.locator("select").first();

    await expect(secondResume).toBeVisible({ timeout: 15_000 });

    await expect.poll(
      () => secondResume.locator('option:not([value=""])').count(),
      { timeout: 30_000 }
    ).toBeGreaterThan(0);

    await secondResume.selectOption({ index: 1 });

    const secondAnalyze = second.getByRole("button", {
      name: "Analyze fit"
    });

    await expect(secondAnalyze).toBeEnabled({ timeout: 15_000 });
    await secondAnalyze.click();

    await expect(second).toContainText(
      /\d+\/100|Score unavailable|Analysis failed/,
      { timeout: 90_000 }
    );

    await showCaption(
      p,
      "Existing Job Analysis",
      "Re-run AI matching on jobs already saved in JobSync."
    );

    await pause(p, 2);

    await second
      .getByRole("button", { name: /Close|Dismiss/i })
      .click()
      .catch(() => {});

    await nav(p, "Career Intelligence", /\/dashboard\/career$/, "Career Intelligence", "Turn saved jobs, analyses, and outcomes into actionable career insights.");
    for (const [h, t, b] of [["Learning priorities", "Career Insights", "See recurring skill gaps and the saved roles that best match your background."], ["Best-fit saved roles", "Career Insights", "See recurring skill gaps and the saved roles that best match your background."], ["Skill-gap heatmap", "Skill-Gap Heatmap", "See which missing skills appear most often across analyzed jobs."]] as const) if (await p.getByRole("heading", { name: h, exact: true }).count()) await section(p, h, t, b);
    const resumeAnalysisPair = await p.evaluate(() => {
      const visible = (element: Element) => {
        const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const selects = Array.from(document.querySelectorAll("select")).filter(visible);
      for (let first = 0; first < selects.length; first++) for (let second = first + 1; second < selects.length; second++) {
        const hasValidOption = (select: HTMLSelectElement) => Array.from(select.options).some((option) => option.value.trim() !== "");
        if (!hasValidOption(selects[first] as HTMLSelectElement) || !hasValidOption(selects[second] as HTMLSelectElement)) continue;
        let container: Element | null = selects[first].parentElement;
        while (container && !container.contains(selects[second])) container = container.parentElement;
        if (container) {
          const marker = "data-demo-resume-analysis";
          document.querySelectorAll(`[${marker}]`).forEach((element) => element.removeAttribute(marker));
          container.setAttribute(marker, "true");
          return { first, second };
        }
      }
      return null;
    });
    if (resumeAnalysisPair) {
      const resumeAnalysisSection = p.locator('[data-demo-resume-analysis="true"]');
      await resumeAnalysisSection.scrollIntoViewIfNeeded();
      await showCaption(p, "Resume Analysis", "Review your resume independently or explain fit against a selected target job.");
      const selects = p.locator("select");
      for (const index of [resumeAnalysisPair.first, resumeAnalysisPair.second]) {
        const select = selects.nth(index);
        const value = await select.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value).find((value) => value.trim() !== ""));
        if (value) await select.selectOption(value);
      }
      const analysisButton = resumeAnalysisSection.locator("button:visible").last();
      if (await analysisButton.count()) {
        await analysisButton.click();
        await expect(p.getByText(/\d+\/100|Score unavailable|Analysis failed/).first()).toBeVisible({ timeout: 90_000 });
      }
    } else {
      await showCaption(p, "Resume Analysis", "Review your resume independently or explain fit against a selected target job.");
    }
    await pause(p, 2);
    for (const [h, t, b] of [
      ["Match score history", "Match Score History", "Track how resume-to-job scores change across saved analyses over time."],
      ["Compare resume versions", "Resume Comparison", "Compare saved analysis snapshots before and after resume changes."],
      ["Interview Prep", "Interview Prep", "Generate job-specific technical, behavioral, and skill-gap preparation from the selected resume and job."],
      ["Recent AI analyses", "Recent AI Analyses", "Reopen previous resume reviews and job-fit results without starting over."],
      ["Export career report", "Career Report", "Export career insights and saved analysis history as a structured report."],
      ["Mock Interview", "Mock Interview", "Practice realistic role-specific interview questions and receive feedback on each answer."],
      ["Career assistant", "Career Assistant", "Ask questions using your resume, target job, and saved analysis context."]
    ] as const) {

      if (h === "Interview Prep") {
        const target = p.getByRole("button", { name: /Generate Interview Prep|Generating/ });
        await expect(target).toBeVisible();
        await target.scrollIntoViewIfNeeded();
        await showCaption(p, t, b);

        await p.getByRole("button", { name: "Generate Interview Prep" }).click();

        await expect(
          p.getByRole("heading", { name: "Your Interview Preparation" })
        ).toBeVisible({ timeout: 90_000 });

        await pause(p, 5);
        continue;
      }

      if (h === "Export career report") {
        const target = p.getByRole("button", {
          name: "Export Career Report",
          exact: true
        });

        await expect(target).toBeVisible();
        await target.scrollIntoViewIfNeeded();
        await showCaption(p, t, b);

        const downloadPromise = p.waitForEvent("download");
        await target.click();
        const download = await downloadPromise;

        if (download.suggestedFilename()) {
          await pause(p, 4);
        }

        continue;
      }

      if (h === "Mock Interview") {
        const startButton = p.getByRole("button", {
          name: "Start Mock Interview"
        });

        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.scrollIntoViewIfNeeded();
        await showCaption(p, t, b);

        await startButton.click();

        const mockCard = p
          .getByRole("heading", { name: "Mock Interview", exact: true })
          .locator("..")
          .locator("..");

        await expect(
          mockCard.getByText("Interviewer", { exact: true }).first()
        ).toBeVisible({ timeout: 90_000 });

        await pause(p, 4);

        const answer = mockCard.getByLabel("Your answer");

        await answer.fill(
          "In a recent software project, I broke the problem into smaller deliverables, prioritized the highest-impact work, communicated progress clearly, and validated the result with testing before deployment."
        );

        await pause(p, 2);

        await mockCard.getByRole("button", {
          name: "Submit Answer"
        }).click();

        await expect.poll(
          () => mockCard.getByText("Interviewer", { exact: true }).count(),
          { timeout: 90_000 }
        ).toBeGreaterThanOrEqual(2);

        await showCaption(
          p,
          "Mock Interview Feedback",
          "JobSync evaluates the response, provides improvement guidance, and continues with the next interview question."
        );

        await pause(p, 5);

        await mockCard.getByRole("button", {
          name: "End Interview"
        }).click();

        continue;
      }

      await section(p, h, t, b);

      if (h === "Recent AI analyses") {
        const viewResult = p.getByRole("button", {
          name: "View Result"
        }).first();

        if (await viewResult.count()) {
          await viewResult.click();
          await pause(p, 6);
        }
      }
    }

    await p.getByRole("button", { name: "What are my biggest skill gaps?" }).click(); await p.getByRole("button", { name: "Ask assistant" }).click(); await expect(p.getByText("Evidence:")).toBeVisible({ timeout: 90_000 }); await showCaption(p, "Career Assistant", "Ask questions using your resume, target job, and saved analysis context."); await pause(p, 2);
    await nav(
      p,
      "Dashboard",
      /\/dashboard$/,
      "JobSync",
      "JobSync combines job tracking, explainable AI matching, career intelligence, learning recommendations, and interview preparation in one workflow."
    );
    await pause(p, 4);
    await hideCaption(p);
});

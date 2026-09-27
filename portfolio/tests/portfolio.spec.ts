import { expect, test } from '@playwright/test';

for (const [name, width, height] of [
  ['small mobile', 320, 740], ['mobile', 375, 812], ['tablet', 768, 1024],
  ['laptop', 1024, 768], ['desktop', 1440, 900], ['large desktop', 1920, 1080],
] as const) {
  test(`${name}: homepage and case study`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page).toHaveTitle('Your Name | Software Engineer · Full Stack · AI');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('#experience')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await page.getByRole('link', { name: 'View projects' }).click();
    const screenshot = page.getByRole('img', { name: /JobSync dashboard/ });
    await expect.poll(() => screenshot.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    for (const section of ['home', 'about', 'projects', 'skills', 'contact']) {
      await page.getByRole('navigation').getByRole('link', { name: new RegExp(`^${section}$`, 'i') }).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('[aria-disabled="true"]').first()).not.toHaveAttribute('href');
    await page.getByRole('link', { name: 'Back to top' }).click();
    await page.screenshot({ path: `test-results/${name.replace(' ', '-')}-home.png`, fullPage: true });
    await page.getByRole('link', { name: 'View case study' }).click();
    await expect(page).toHaveURL(/\/projects\/jobsync$/);
    await expect(page).toHaveTitle('JobSync Case Study | Full-stack & AI Engineering');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /JobSync Case Study/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('#experience')).toHaveCount(0);
    for (const section of ['overview', 'architecture', 'ai-ml-pipeline', 'core-features', 'my-contribution', 'technical-decisions', 'tech-stack', 'testing', 'deployment', 'future-improvements']) {
      await expect(page.locator(`#${section}`)).toHaveCount(1);
      await page.getByRole('navigation', { name: 'Case study sections' }).locator(`a[href="#${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
    }
    await expect(page.getByRole('figure', { name: 'JobSync system architecture' })).toBeVisible();
    await expect(page.locator('.pipeline-steps li')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Back to top' }).click();
    await expect(page).toHaveURL(/#main$/);
    await page.screenshot({ path: `test-results/${name.replace(' ', '-')}-case-study.png`, fullPage: true });
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    expect(errors).toEqual([]);
  });
}

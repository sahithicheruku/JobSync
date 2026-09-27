# Engineering portfolio

Independent Next.js App Router / TypeScript / Tailwind CSS app. The parent folder is the featured JobSync application and is not required to run this portfolio.

## Local development

```sh
cd portfolio
npm ci
npm run dev
```

Open http://localhost:3001. No environment variables, database, or external services are required.

## Content

Edit `data/content.ts` to replace the name, initials, resume URL, and public contact/project URLs. Missing links render as labeled, non-interactive placeholders. Add a public resume to `public/` and set `profile.resume` to its path when ready. The dashboard screenshot is copied from the existing JobSync project.

`app/layout.tsx` contains page and Open Graph metadata. Search indexing is disabled while personal details are placeholders. Set `profile.siteUrl` to the final public HTTPS origin to enable canonical URLs and absolute Open Graph image URLs; set `profile.readyToPublish` to true only after the content is ready. Both pages have their own title and description. `app/icon.svg` is a neutral favicon placeholder.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser check covers both routes at six widths (320, 375, 768, 1024, 1440, and 1920 pixels), keyboard skip navigation, section links, diagram rendering, metadata, screenshot loading, placeholders, browser errors, and horizontal overflow. Run the build first; tests start a separate production server on port 3002 and stop it afterward.

## Vercel

Select `portfolio` as the Root Directory and use the Next.js preset. Keep the standard build/output settings. This first version has no server-side data requirements.

## Current scope

Routes: `/` and `/projects/jobsync`.

The homepage retains the original visual design, highlights the target engineering roles, and features JobSync alongside technical skills.

The case study covers overview, architecture, AI/ML pipeline, core features, contribution prompts, technical decisions, tech stack, testing, deployment, and future improvements. React/CSS diagrams describe the actual backend service routing and distinguish skill extraction, set-based skill comparison, embedding-based course ranking, and LLM-generated review.

Technical case-study content lives in `data/jobsync.ts`; confirm and replace the contribution prompts before publishing. They deliberately do not claim individual ownership. Existing JobSync tests are described, but were not run as part of the portfolio checks.

Still needed: name/initials, resume, email/social links, public JobSync repository and verified demo URLs, final portfolio domain, and specific personal contributions. No private company code or assets are included.

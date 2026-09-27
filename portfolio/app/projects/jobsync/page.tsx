import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, Navbar, PublicLink } from '@/components/Portfolio';
import { ArchitectureDiagram, AiPipelineDiagram } from '@/components/JobSyncDiagrams';
import { contributions, decisions, features, improvements, stack } from '@/data/jobsync';
import { jobSync, profile } from '@/data/content';

const title = 'JobSync Case Study | Full-stack & AI Engineering';
const description = 'Explore JobSync’s Next.js and FastAPI architecture, NLP skill extraction, semantic course recommendations, testing, deployment, and technical tradeoffs.';
export const metadata: Metadata = {
  title, description,
  alternates: profile.siteUrl ? { canonical: '/projects/jobsync' } : undefined,
  openGraph: { title, description, type: 'article', ...(profile.siteUrl ? { url: '/projects/jobsync', images: [{ url: '/jobsync-dashboard.png', alt: 'JobSync application dashboard' }] } : {}) },
  twitter: { card: 'summary', title, description },
};
const sections = ['Overview', 'Architecture', 'AI/ML pipeline', 'Core features', 'My contribution', 'Technical decisions', 'Tech stack', 'Testing', 'Deployment', 'Future improvements'];
const sectionId = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function JobSyncCaseStudy() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Navbar home={false} />
    <main id="main" tabIndex={-1} className="shell case-study">
      <header className="case-hero">
        <Link className="back-link" href="/#projects">← Back to projects</Link>
        <p className="eyebrow">FEATURED PROJECT / ENGINEERING CASE STUDY</p>
        <h1>JobSync<span className="text-accent">AI Career Intelligence Platform</span></h1>
        <p className="hero-copy">{jobSync.description}</p>
        <div className="actions"><PublicLink href={jobSync.github}>GitHub</PublicLink><PublicLink href={jobSync.demo}>Live demo</PublicLink></div>
      </header>
      <nav className="case-nav" aria-label="Case study sections">{sections.map(title => <a href={`#${sectionId(title)}`} key={title}>{title}</a>)}</nav>
      <section id="overview" className="case-section" aria-labelledby="overview-title">
        <h2 id="overview-title">Overview</h2><div className="case-grid">
          <div><h3>The problem</h3><p>Job seekers manage applications, resume versions, job descriptions, skills, and learning resources across disconnected tools. Comparing requirements and tracking follow-up work adds another layer of organization.</p></div>
          <div><h3>The solution</h3><p>JobSync brings these tasks into one application. It combines a structured application tracker with resume feedback, skill comparison, and course recommendations to support the job-search workflow.</p></div>
        </div>
      </section>
      <section id="architecture" className="case-section" aria-labelledby="architecture-title"><h2 id="architecture-title">Architecture</h2><p>Next.js serves the interface and backend. Prisma persists application data in SQLite, while a separate FastAPI service handles Python NLP and recommendation workloads.</p><ArchitectureDiagram /></section>
      <section id="ai-ml-pipeline" className="case-section" aria-labelledby="pipeline-title"><h2 id="pipeline-title">AI/ML pipeline</h2><p>Skill analysis and course ranking follow the sequence below. Resume feedback uses a separate language-model path.</p><AiPipelineDiagram /></section>
      <section id="core-features" className="case-section" aria-labelledby="features-title"><h2 id="features-title">Core features</h2><div className="case-grid">{features.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section id="my-contribution" className="case-section" aria-labelledby="contribution-title"><h2 id="contribution-title">My contribution</h2><p className="editorial-note">Contribution details pending confirmation. The technical descriptions document the project; they do not imply sole authorship. These entries will be replaced with specific, verified contributions.</p><dl className="contribution-list">{contributions.map(([title, prompt]) => <div key={title}><dt>{title}</dt><dd>{prompt}</dd></div>)}</dl></section>
      <section id="technical-decisions" className="case-section" aria-labelledby="decisions-title"><h2 id="decisions-title">Technical decisions</h2><p>Implementation choices visible in the code, with their engineering tradeoffs.</p><div className="decision-list">{decisions.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section id="tech-stack" className="case-section" aria-labelledby="stack-title"><h2 id="stack-title">Tech stack</h2><dl className="case-grid stack-list">{stack.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl></section>
      <section id="testing" className="case-section" aria-labelledby="testing-title"><h2 id="testing-title">Testing</h2><p>The JobSync repository includes Jest tests for components and server actions, including company and job workflows. Playwright scenarios cover sign-in, adding jobs, and profile interactions.</p><p>These describe the existing test suite, not a claim of complete coverage or a passing JobSync run. ML quality evaluation and provider-output regression checks remain areas for improvement.</p></section>
      <section id="deployment" className="case-section" aria-labelledby="deployment-title"><h2 id="deployment-title">Deployment</h2><p>Docker Compose defines separate Next.js and FastAPI containers. The web service reaches the ML service over the container network, and a mounted data directory persists SQLite and uploaded files. Configuration and provider credentials are supplied through environment variables.</p><p>The project includes Google Cloud deployment tooling. The portfolio itself is a separate Next.js application configured for Vercel; a currently available JobSync demo URL still needs confirmation.</p></section>
      <section id="future-improvements" className="case-section" aria-labelledby="future-title"><h2 id="future-title">Future improvements</h2><p>Planned directions, not features claimed as implemented.</p><ul className="work-list">{improvements.map(item => <li key={item}>{item}</li>)}</ul></section>
      <div className="case-end"><Link className="action" href="/#projects">← Back to projects</Link><Link className="action action-primary" href="/#contact">Get in touch →</Link></div>
    </main><Footer home={false} />
  </>;
}

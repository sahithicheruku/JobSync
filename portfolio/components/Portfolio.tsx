import Image from 'next/image';
import Link from 'next/link';
import { ArchitectureDiagram } from './JobSyncDiagrams';
import { jobSync, profile, skills } from '@/data/content';

export function PublicLink({ href, children, primary = false }: { href: string | null; children: React.ReactNode; primary?: boolean }) {
  const className = `action ${primary ? 'action-primary' : ''}`;
  return href ? <a className={className} href={href}>{children}<span aria-hidden="true">↗</span></a> : <span className={`${className} unavailable`} aria-disabled="true" title="Public link to be added">{children}<span className="pending">Soon</span></span>;
}

export function Navbar({ home = true }: { home?: boolean }) {
  const prefix = home ? '' : '/';
  return <header className="site-header"><nav className="shell nav" aria-label="Main navigation">
    <a href={`${prefix}#home`} className="wordmark" aria-label={`${profile.name}, home`}><span className="monogram">{profile.initials}<span>.</span></span><span className="wordmark-label">ENGINEERING PORTFOLIO</span></a>
    <div className="nav-links">{['Home', 'About', 'Projects', 'Skills', 'Contact'].map(item => <a key={item} href={`${prefix}#${item.toLowerCase()}`}>{item}</a>)}</div>
  </nav></header>;
}

export function Hero() {
  return <section id="home" className="shell hero">
    <div><p className="eyebrow"><span className="status-dot" />SOFTWARE · SYSTEMS · APPLIED AI</p>
      <p className="hero-name">Hi, I’m {profile.name}.</p>
      <h1>Software Engineer.<br /><span className="text-accent">Full-stack systems.<br />Applied AI.</span></h1>
      <p className="hero-copy">I work across responsive interfaces, backend APIs, and AI/ML integration. My technical background includes Python NLP services and cloud deployment—connecting software engineering with full-stack and AI engineering work.</p>
      <div className="actions"><a className="action action-primary" href="#projects">View projects <span aria-hidden="true">↗</span></a><PublicLink href={profile.resume}>View resume</PublicLink></div>
      <p className="role-line">Software Engineer · Full Stack Developer · AI Engineer</p><div className="hero-social"><PublicLink href={profile.github}>GitHub</PublicLink><PublicLink href={profile.linkedin}>LinkedIn</PublicLink><a href="#contact">Contact <span aria-hidden="true">↗</span></a></div>
    </div>
    <aside className="engineering-note" aria-label="Engineering focus"><div className="note-heading"><span>ENGINEERING FOCUS</span><span aria-hidden="true">↙</span></div>
      {[['01', 'Product & interface', 'Responsive experiences. Real product requirements.'], ['02', 'Backend & cloud', 'APIs, data, and deployed applications.'], ['03', 'Applied intelligence', 'NLP, semantic matching, and LLM integration.']].map(([number, title, text]) => <div className="focus-row" key={number}><span className="mono">{number}</span><div><h2>{title}</h2><p>{text}</p></div></div>)}
      <div className="note-footer">Software Engineer <span>/</span> Full Stack Developer <span>/</span> AI Engineer</div>
    </aside>
  </section>;
}

function SectionHeading({ number, label, title }: { number: string; label: string; title: string }) {
  return <div className="section-heading"><p className="eyebrow"><span className="section-number">{number}</span>{label}</p><h2>{title}</h2></div>;
}

export function About() {
  return <section id="about" className="shell section about"><SectionHeading number="01" label="ABOUT" title="Engineering across the stack." /><div className="about-copy"><p>My technical background combines full-stack software engineering, backend development, and AI/ML integration. JobSync brings these areas together through application tracking, resume analysis, and course recommendations.</p><p>I work across the application lifecycle—from responsive interfaces and backend APIs to database integration, containerized development, and cloud deployment.</p><div className="about-signoff">Product context. Technical depth. End-to-end delivery.</div></div></section>;
}

function Chips({ items }: { items: string[] }) {
  return <ul className="chips" aria-label="Technologies">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

export function Projects() {
  return <section id="projects" className="shell section"><SectionHeading number="02" label="FEATURED ENGINEERING PROJECT" title="A closer look at JobSync." /><article className="project"><div className="project-top"><div><p className="eyebrow">FEATURED PROJECT / FULL STACK + AI</p><h3>{jobSync.title}<span aria-hidden="true">↗</span></h3><p className="project-subtitle">{jobSync.subtitle}</p></div><p>{jobSync.description}</p></div>
    <figure className="project-image"><div className="image-bar"><span className="image-dots" aria-hidden="true">● ● ●</span><span>JobSync / Application dashboard</span><span aria-hidden="true">↗</span></div><Image src="/jobsync-dashboard.png" alt="JobSync dashboard showing application activity, job status summaries, and recent applications" width={1920} height={1080} sizes="(max-width: 1200px) 92vw, 1120px" className="dashboard-image" /><figcaption>Application dashboard · Existing JobSync interface</figcaption></figure>
    <div className="project-details"><div><h4>One workspace for the job-search workflow.</h4><ul className="features">{jobSync.features.map(feature => <li key={feature}><span aria-hidden="true">↗</span>{feature}</li>)}</ul><Chips items={jobSync.stack} /><div className="actions"><PublicLink href={jobSync.github}>GitHub</PublicLink><PublicLink href={jobSync.demo}>Live demo</PublicLink><Link className="action action-primary" href="/projects/jobsync">View case study <span aria-hidden="true">→</span></Link></div></div><ArchitectureDiagram /></div>
  </article></section>;
}

export function Skills() {
  return <section id="skills" className="shell section"><SectionHeading number="03" label="TECHNICAL TOOLKIT" title="Tools I work with." /><div className="skills-grid">{skills.map(group => <div key={group.category}><h3>{group.category}</h3><p>{group.items.join(' · ')}</p></div>)}</div></section>;
}

export function Contact() {
  return <section id="contact" className="shell section contact"><div><p className="eyebrow"><span className="section-number">04</span>CONTACT</p><h2>Let’s talk about<br />the work.</h2><p>Software engineering, full-stack development, and AI engineering opportunities.</p></div><div className="contact-links"><PublicLink href={profile.email ? `mailto:${profile.email}` : null}>Email</PublicLink><PublicLink href={profile.linkedin}>LinkedIn</PublicLink><PublicLink href={profile.github}>GitHub</PublicLink><p>Personal contact details will be added here.</p></div></section>;
}

export function Footer({ home = true }: { home?: boolean }) {
  return <footer className="shell footer"><span>{profile.name} <span className="text-accent">/</span> Software Engineer</span><a href={home ? "#home" : "#main"}>Back to top ↑</a></footer>;
}

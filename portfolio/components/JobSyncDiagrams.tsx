import { pipeline } from '@/data/jobsync';

export function ArchitectureDiagram() {
  return (
    <figure className="architecture" aria-label="JobSync system architecture">
      <p className="eyebrow">SYSTEM AT A GLANCE</p>
      <div className="architecture-root">Next.js / React interface</div>
      <span className="connector" aria-hidden="true">↓</span>
      <div className="architecture-root">Next.js API routes &amp; server actions<small>NextAuth · Application logic · Service requests</small></div>
      <div className="system-branches">
        {[
          ['Persistence', 'Prisma → SQLite', 'Applications, profiles, resumes, and activities'],
          ['Language models', 'LangChain → OpenAI / Ollama', 'Resume feedback and job-match analysis'],
          ['Python ML service', 'FastAPI → spaCy / Sentence Transformers', 'Skill extraction, comparison, and course ranking'],
        ].map(([label, tools, purpose]) => (
          <div className="architecture-branch" key={label}>
            <span className="connector" aria-hidden="true">↓</span>
            <div><strong>{label}</strong><p>{tools}</p><small>{purpose}</small></div>
          </div>
        ))}
      </div>
      <figcaption>The web backend connects the interface to persistence, language-model providers, and the Python service. Arrows show request dependencies; results return to the interface.</figcaption>
    </figure>
  );
}

export function AiPipelineDiagram() {
  return (
    <figure className="pipeline-diagram" aria-label="Skill analysis and course recommendation pipeline">
      <ol className="pipeline-steps">
        {pipeline.map(([title, description], index) => (
          <li key={title}>
            <span className="eyebrow">STEP {index + 1}</span>
            <h3>{title}</h3><p>{description}</p>
            {index < pipeline.length - 1 && <span className="pipeline-arrow" aria-hidden="true">↓</span>}
          </li>
        ))}
      </ol>
      <figcaption>Read from top to bottom. Fuzzy matching enriches extraction before skill comparison; embeddings are used for course ranking.</figcaption>
      <div className="llm-path"><h3>Separate path: AI resume feedback</h3><p>Resume + job description → Next.js backend → LangChain → OpenAI or Ollama → generated feedback, ATS analysis, and job-match score.</p><p>The LLM score, skill-overlap percentage, and course similarity describe different things; none is a validated hiring prediction.</p></div>
    </figure>
  );
}

// Technical descriptions verified against the JobSync source in the parent project.
// Contribution entries are prompts, not claims of individual ownership.
export const features = [
  ['Application tracking', 'Store companies, roles, application dates, statuses, and related activities.'],
  ['Resume management', 'Upload PDF resumes, build structured resumes, and manage multiple versions.'],
  ['AI resume review', 'Generate feedback on strengths, weaknesses, and suggested improvements.'],
  ['Job-resume matching', 'Compare a resume with a job description using LLM-generated analysis and a match score.'],
  ['ATS analysis', 'Include ATS friendliness and keyword alignment in AI feedback. These are model assessments, not guarantees of ATS acceptance.'],
  ['Skill extraction', 'Use spaCy phrase matching, noun chunks, and RapidFuzz matching against known skills.'],
  ['Skill-gap analysis', 'Compare normalized skill sets to identify matched, missing, and additional skills.'],
  ['Course recommendations', 'Rank course skill embeddings against missing-skill embeddings using cosine similarity.'],
  ['Activity dashboard', 'Review application summaries, recent jobs, weekly activity, and a calendar heatmap.'],
];
export const contributions = [
  ['Full-stack implementation', 'Describe the workflows you implemented and your individual scope.'],
  ['Frontend development', 'Identify the pages, components, and responsive improvements you owned.'],
  ['Backend & database', 'Specify your API, server-action, Prisma, and data-model contributions.'],
  ['AI / ML integration', 'Confirm which extraction, provider-integration, and recommendation work you performed.'],
  ['Deployment', 'Describe your role in Docker configuration and Google Cloud deployment.'],
  ['Testing', 'Identify the Jest and Playwright checks you wrote or maintained.'],
];
export const decisions = [
  ['Separate web and ML services', 'Next.js handles web workflows; FastAPI hosts Python NLP and recommendation dependencies. This gives the ML service its own runtime, with service availability and network errors to manage.'],
  ['Two complementary analysis paths', 'LLM calls generate qualitative resume feedback. The Python service extracts and compares skills and ranks courses. Their scores represent different calculations and should not be presented as interchangeable.'],
  ['Prisma with SQLite', 'The current application uses Prisma over a file-backed SQLite database. A move to PostgreSQL would require migration and deployment work; it is a future improvement, not current infrastructure.'],
  ['Embeddings for course ranking', 'all-MiniLM-L6-v2 encodes skills for cosine-similarity ranking. Skill-gap comparison itself uses normalized set membership, so extraction quality directly affects which courses are requested.'],
  ['Provider integration through LangChain', 'The source includes OpenAI and Ollama paths for resume review and matching. Provider configuration and generated output need careful handling; model responses are not verified hiring outcomes.'],
];
export const stack = [
  ['Frontend', 'Next.js, React, TypeScript, Tailwind CSS, shadcn/ui'],
  ['Backend', 'Next.js API routes and server actions, NextAuth'],
  ['AI / ML', 'Python, FastAPI, spaCy, RapidFuzz, Sentence Transformers, OpenAI, Ollama, LangChain'],
  ['Database', 'Prisma ORM, SQLite'],
  ['DevOps', 'Docker, Docker Compose, Google Cloud'],
  ['Testing', 'Jest, React Testing Library, Playwright'],
];
export const improvements = [
  'Migrate SQLite to PostgreSQL with a tested data migration.',
  'Evaluate updated AI models against representative resume and job-description examples.',
  'Improve extraction and recommendation quality with a labeled evaluation set.',
  'Explore vector search as the course collection grows.',
  'Move long-running analysis into background jobs.',
  'Add structured logs, request tracing, and service-health monitoring.',
  'Harden production authentication and uploaded-file handling.',
  'Add repeatable CI/CD checks for both web and ML services.',
];
export const pipeline = [
  ['Text input', 'Resume text or extracted PDF text, plus job-description text.'],
  ['Skill extraction', 'spaCy phrase matching and noun chunks, with RapidFuzz matches against known skills.'],
  ['Skill comparison', 'Normalize case and compare sets to find matched, missing, and additional skills.'],
  ['Embedding', 'Encode missing skills with all-MiniLM-L6-v2; use the course skill embeddings.'],
  ['Semantic ranking', 'Calculate cosine similarity and select the highest-ranked courses.'],
  ['Results', 'Return skill gaps, the skill-overlap percentage, and course recommendations.'],
];

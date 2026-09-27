// Replace null values with your public URLs. Never put credentials here.
export const profile = {
  name: 'Your Name',
  initials: 'YN',
  siteUrl: null as string | null, // Final public https URL, without a trailing slash.
  readyToPublish: false, // Enable after replacing placeholders and confirming contributions.
  email: null as string | null,
  github: null as string | null,
  linkedin: null as string | null,
  resume: null as string | null,
};

export const jobSync = {
  title: 'JobSync',
  subtitle: 'AI Career Intelligence Platform',
  description: 'A centralized workspace for the job search: track applications, manage resumes, compare skills with job requirements, and find relevant learning resources.',
  github: null as string | null,
  demo: null as string | null,
  features: ['Application tracking', 'AI resume review', 'ATS analysis', 'Job-resume matching', 'Skill-gap detection', 'Semantic matching', 'Course recommendations', 'Resume management'],
  stack: ['Next.js', 'TypeScript', 'FastAPI', 'spaCy', 'Sentence Transformers', 'Prisma', 'Docker', 'GCP'],
};

export const skills = [
  { category: 'Languages', items: ['Java', 'TypeScript', 'JavaScript', 'Python', 'SQL'] },
  { category: 'Frontend', items: ['React', 'Next.js', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Spring Boot', 'FastAPI', 'REST APIs', 'Microservices', 'Kafka'] },
  { category: 'Data', items: ['PostgreSQL', 'SQLite', 'Prisma', 'Redis'] },
  { category: 'AI / ML', items: ['NLP', 'spaCy', 'Sentence Transformers', 'LLM APIs', 'Semantic similarity', 'LangChain'] },
  { category: 'Cloud & DevOps', items: ['AWS', 'GCP', 'Azure', 'Docker', 'Git', 'GitHub'] },
];

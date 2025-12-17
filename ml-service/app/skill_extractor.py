import spacy
from spacy.matcher import PhraseMatcher
from rapidfuzz import fuzz
from typing import List

# Known technical skills database
KNOWN_SKILLS = [
    "python", "r", "sql", "java", "scala", "c++", "c#", "golang", "go", "rust",
    "javascript", "typescript", "react", "angular", "vue", "svelte", "next.js", "node.js",
    "django", "flask", "fastapi", "spring boot", "express", "gin", "fiber",
    "mysql", "postgresql", "mongodb", "cassandra", "oracle", "redis", "dynamodb",
    "hadoop", "hbase", "etl", "nosql", "elasticsearch", "sqlite",
    "tableau", "power bi", "qlikview", "apache superset", "looker", "metabase",
    "matplotlib", "seaborn", "plotly", "d3.js", "chart.js",
    "machine learning", "deep learning", "tensorflow", "keras", "pytorch",
    "scikit-learn", "xgboost", "lightgbm", "catboost", "nlp", "computer vision",
    "transformers", "bert", "gpt", "llm", "generative ai", "ai", "artificial intelligence",
    "apache spark", "apache kafka", "apache flink", "databricks", "snowflake",
    "aws", "amazon web services", "google cloud", "gcp", "azure", "docker", "kubernetes",
    "google bigquery", "aws s3", "aws lambda", "aws ec2", "aws rds", "aws ecs", "aws eks",
    "terraform", "ansible", "chef", "puppet", "cloudformation",
    "apache airflow", "data pipeline", "apache nifi", "kafka streams", "pulsar",
    "data integration", "data modeling", "data governance", "data quality",
    "jenkins", "git", "github", "gitlab", "bitbucket", "ci/cd", "circleci", "travis ci",
    "microservices", "devops", "cloud computing", "serverless", "lambda functions",
    "network security", "cybersecurity", "docker containers", "container orchestration",
    "agile", "scrum", "kanban", "jira", "confluence",
    "project management", "business intelligence", "data visualization",
    "database administration", "dba", "machine learning algorithms",
    "data architecture", "data engineering", "data science", "big data",
    "computer networks", "digital transformation", "data wrangling",
    "business analysis", "digital marketing", "customer relations",
    "market research", "data analysis", "excel", "google sheets",
    "procurement", "supply chain management", "logistics",
    "rest api", "restful api", "graphql", "grpc", "websockets", "soap",
    "html", "css", "sass", "scss", "tailwind", "bootstrap",
    "webpack", "vite", "rollup", "babel", "eslint", "prettier",
    "redux", "mobx", "zustand", "context api", "react query",
    "prisma", "typeorm", "sequelize", "mongoose", "drizzle",
    "linux", "ubuntu", "centos", "debian", "bash", "shell scripting",
    "monitoring", "prometheus", "grafana", "datadog", "new relic", "splunk",
    "logging", "elk stack", "elasticsearch", "logstash", "kibana",
    "testing", "unit testing", "integration testing", "e2e testing",
    "jest", "mocha", "chai", "pytest", "junit", "selenium", "cypress", "playwright",
]

class SkillExtractor:
    def __init__(self):
        """Initialize the skill extractor with spaCy model"""
        try:
            self.nlp = spacy.load("en_core_web_md")
        except OSError:
            print("Downloading spaCy model...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_md"])
            self.nlp = spacy.load("en_core_web_md")

        self.matcher = PhraseMatcher(self.nlp.vocab)
        patterns = [self.nlp.make_doc(skill) for skill in KNOWN_SKILLS]
        self.matcher.add("SKILLS", patterns)

        # Terms to filter out from extracted skills
        self.irrelevant_terms = [
            "ability", "skills", "team", "knowledge", "experience", "strong", "good",
            "excellent", "that", "a", "the", "and", "or", "in", "for", "management",
            "product managers", "orders", "prothesis", "leadership", "communication",
            "efficient", "result", "september", "services", "work", "working", "years",
            "year", "position", "role", "company", "business", "development", "engineer"
        ]

    def extract_from_text(self, text: str) -> List[str]:
        """
        Extract technical skills from given text

        Args:
            text: Input text (resume, job description, etc.)

        Returns:
            List of extracted skills
        """
        if not text or not isinstance(text, str):
            return []

        text = text.lower()
        doc = self.nlp(text)

        # Find direct matches using PhraseMatcher
        matches = self.matcher(doc)
        matched_skills = [doc[start:end].text for _, start, end in matches]

        # Extract lemmatized tokens
        lemmatized_tokens = [
            token.lemma_ for token in doc
            if not token.is_stop and not token.is_punct
        ]

        # Extract noun chunks
        noun_chunks = [chunk.text for chunk in doc.noun_chunks]

        # Filter out irrelevant noun chunks
        filtered_noun_chunks = [
            chunk for chunk in noun_chunks
            if all(term not in chunk for term in self.irrelevant_terms)
        ]

        # Combine all skills
        all_skills = set(matched_skills + filtered_noun_chunks)

        # Add fuzzy matches for known skills
        fuzzy_matches = [
            skill for skill in KNOWN_SKILLS
            if any(fuzz.partial_ratio(skill, token) > 85 for token in lemmatized_tokens)
        ]

        combined_skills = list(set(all_skills).union(fuzzy_matches))

        # Final cleanup - remove skills that are too generic or irrelevant
        cleaned_skills = [
            skill for skill in combined_skills
            if len(skill) > 2 and skill not in self.irrelevant_terms
        ]

        return sorted(list(set(cleaned_skills)))

    def extract_from_resume(self, resume_text: str) -> List[str]:
        """Extract skills from resume text"""
        return self.extract_from_text(resume_text)

    def extract_from_job_description(self, job_description: str) -> List[str]:
        """Extract required skills from job description"""
        return self.extract_from_text(job_description)

    def compare_skills(self, resume_skills: List[str], job_skills: List[str]) -> dict:
        """
        Compare resume skills with job requirements

        Returns:
            Dictionary with matched, missing, and extra skills
        """
        resume_set = set([s.lower() for s in resume_skills])
        job_set = set([s.lower() for s in job_skills])

        matched = list(resume_set.intersection(job_set))
        missing = list(job_set - resume_set)
        extra = list(resume_set - job_set)

        # Calculate match percentage
        match_percentage = (len(matched) / len(job_set) * 100) if job_set else 0

        return {
            "matched_skills": sorted(matched),
            "missing_skills": sorted(missing),
            "extra_skills": sorted(extra),
            "match_percentage": round(match_percentage, 2),
            "total_required": len(job_set),
            "total_matched": len(matched)
        }

# JobSync - Intelligent Job Search Management Platform

## 🚀 Live Demo

**Try it now:** [http://35.200.153.53:3000/](http://35.200.153.53:3000/)

**Demo Credentials:**
- **Email:** admin@example.com
- **Password:** password123

---

JobSync is a web app companion for managing your job search journey. This free and open-source project is designed to help job seekers efficiently track and organize their job applications with AI-powered resume analysis and personalized course recommendations. Say goodbye to the chaos of scattered information and hello to a streamlined, intuitive, and powerful job search experience.

Job searching can be overwhelming, with numerous applications to track and deadlines to meet. JobSeeker Assistant is here to simplify this process, allowing you to focus on big picture and keep track of your job search related activities. JobSync app platform empowers you with the tools you need to stay organized, informed, and proactive throughout your job search.

### Dashboard

![App Snapshot](./screenshots/jobsync-dashboard-screenshot.png?raw=true "App Snapshot Image")

### Jobs Applied list

![App Snapshot](./screenshots/jobsync-myjobs.png?raw=true "My Jobs Page Snapshot Image")

### AI Resume review

![JobSync AI Demo](./screenshots/jobsync-ai.gif)

### AI Job match

![JobSync AI Demo](./screenshots/jobsync-ai-jobmatch.gif)

## ✨ Key Features

### 📊 Job Application Tracking
- **Application Tracker:** Keep a detailed record of all your job applications, including company details, job titles, application dates, and current status.
- **Activity Monitoring Dashboard:** Visualize your job search progress with an interactive dashboard that provides insights into your application activities, success rates, and upcoming tasks.
- **GitHub-style Activity Calendar:** Track your daily application patterns with a visual heatmap.

### 🤖 AI-Powered Analysis
- **AI Resume Review:** Get intelligent feedback on your resume using OpenAI GPT-3.5 with detailed analysis and improvement suggestions.
- **Job-Resume Matching:** Receive AI-powered match scores (0-100) comparing your resume against job descriptions with gap analysis.
- **ATS Friendliness Score:** Understand how well your resume will perform in Applicant Tracking Systems.

### 🎓 Smart Course Recommendations
- **ML-Powered Skill Extraction:** Automatically extract skills from resumes and job descriptions using spaCy NLP.
- **Personalized Course Suggestions:** Get relevant course recommendations from 585+ Coursera courses based on your skill gaps.
- **Semantic Matching:** Uses Sentence Transformers (all-MiniLM-L6-v2) for intelligent skill comparison with 90%+ accuracy.

### 📝 Resume Management
- **Resume Builder:** Create and manage multiple versions of your resume.
- **File Upload Support:** Upload existing resumes in PDF format for AI analysis.
- **Resume-Job Analysis:** Identify missing skills and strengths for each job application.


## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with React 19 and App Router
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Server-Side Rendering (SSR)** for optimal performance

### Backend
- **Node.js** with Next.js API Routes
- **NextAuth.js** for authentication
- **Prisma ORM** with SQLite database
- **RESTful API** architecture

### ML/AI Services
- **Python FastAPI** microservice (Port 8000)
- **spaCy** (en_core_web_md) for NLP and skill extraction
- **Sentence Transformers** (all-MiniLM-L6-v2) for semantic similarity
- **OpenAI GPT-3.5** for resume review and job matching
- **LangChain** for AI orchestration
- **RapidFuzz** for fuzzy string matching

### Deployment
- **Docker** & **Docker Compose** for containerization
- **Google Cloud Platform** (GCP Compute Engine)
- **Microservices Architecture** with 6 layers
- **Cloud-native design** for scalability

## 🆓 Free to Use and Self-Hosted
JobSync is completely free to use and open source. It provides a powerful job search management tool at no cost and ensures that everyone has access to the resources they need. Additionally, JobSync is designed to be self-hosted, giving you full control over your data. By using Docker, you can easily set up and run JobSync on your own server, ensuring a secure and personalized experience.


## Installation

### Using Docker

#### Step 1 - Clone repo
* **Alternatively you can also download the source code using download link**

```sh
git clone https://github.com/sahithicheruku/JobSync.git
cd JobSync
```

#### Step 2 - Change environment variables
* ** You must create a .env file before proceeding. Refer to .env.example and create or change to .env with your environment variables**
  
#### 2.1 Generate auth secret (Optional) 

These methods will generate a random string that you can use as your AUTH_SECRET. Make sure to set this in your environment variables:

For example, add it to your .env local file:

```sh
AUTH_SECRET="your_generated_secret"
```

##### For npm

```sh
    npm exec auth secret
```
OR
```sh
    npx auth secret
```

##### Using the openssl command available on Linux and Mac OS X:

```sh
    openssl rand -base64 33
```

#### 2.2 Change username and password (Optional) 

You can use default username (admin@example) and password (password123) or change it in you .env file

#### Step 3 - Build docker image and run container
* **Please make sure you have <a href="https://www.docker.com">docker</a> installed and running**
* Please make sure you are in you project directory in your terminal

```sh
docker compose up
```

#### Step 4 - Access the app
* **Open [http://localhost:3000](http://localhost:3000) with your browser to access the app.**
* If you encounter port conflicts, please change it in the docker file

## 🙏 Credits & Technologies

### Frontend & UI
- [React](https://github.com/facebook/react) - UI library
- [Next.js](https://github.com/vercel/next.js) - React framework
- [shadcn/ui](https://github.com/shadcn-ui/ui) - UI components
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) - CSS framework
- [Tiptap](https://github.com/ueberdosis/tiptap) - Rich text editor
- [Nivo](https://github.com/plouc/nivo) - Data visualization

### Backend & Database
- [Prisma](https://github.com/prisma/prisma) - ORM
- [SQLite](https://github.com/sqlite/sqlite) - Database
- [NextAuth.js](https://github.com/nextauthjs/next-auth) - Authentication

### AI & ML
- [OpenAI](https://openai.com) - GPT-3.5 API
- [LangChain](https://github.com/langchain-ai/langchain) - AI framework
- [spaCy](https://github.com/explosion/spaCy) - NLP library
- [Sentence Transformers](https://github.com/UKPLab/sentence-transformers) - Embeddings
- [Ollama](https://github.com/ollama/ollama) - Local LLM runtime
- [FastAPI](https://github.com/tiangolo/fastapi) - ML service framework
- [RapidFuzz](https://github.com/maxbachmann/RapidFuzz) - Fuzzy matching

### Deployment & DevOps
- [Docker](https://www.docker.com/) - Containerization
- [Google Cloud Platform](https://cloud.google.com/) - Cloud hosting

## 🤖 AI Integration

JobSync supports two AI providers for resume analysis and job matching:

### OpenAI (Recommended)

**GPT-3.5-turbo** is the default and recommended provider for production use.

**Setup:**
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
```
3. Select "OpenAI" as the provider in Settings page
4. Choose "gpt-3.5-turbo" as the model

**Features:**
- ✅ High-quality resume reviews with detailed feedback
- ✅ Accurate job-resume matching with scoring (0-100)
- ✅ ATS friendliness analysis
- ✅ Skill gap identification
- ✅ Professional improvement suggestions

### Ollama (Local Alternative)

For privacy-focused users who want to run AI locally without external API calls.

**Setup:**
1. Install [Ollama](https://ollama.com)
2. Download the llama3.1 model:
```sh
ollama pull llama3.1
```
3. Ensure Ollama is running (default: `http://localhost:11434`)
4. Select "Ollama" as provider in Settings
5. Choose "llama3.1" as the model

**Note:** The response quality depends on input content. For optimal results:
- Keep input under 3000 tokens
- Avoid special characters
- Remove unnecessary details from job descriptions
- The 8B variant is recommended for most use cases

### ML Service (Skill Extraction & Course Recommendations)

The Python ML service runs independently and provides:
- **Skill Extraction:** Identifies 150+ technical skills using spaCy NLP
- **Course Recommendations:** Matches skills to 585 Coursera courses
- **Semantic Analysis:** Uses transformer models for intelligent matching

This service runs on port 8000 and is automatically started with Docker Compose.

### Note

- If you are updating from an old version and already logged in, please try logging out and login again.


<div align="center">

# ?? HealthLens AI

### *Your Personal AI-Powered Health Report Analyst*

[![Live Demo](https://img.shields.io/badge/??%20Live%20Demo-healthlens--ai--omega.vercel.app-6366f1?style=for-the-badge)](https://healthlens-ai-omega.vercel.app)
[![Backend API](https://img.shields.io/badge/??%20API-Render.com-22c55e?style=for-the-badge)](https://healthlens-backend-i3py.onrender.com/api/v1/health)

> **Turn complex medical lab reports into clear, actionable health insights — powered by AI.**

</div>

---

## ?? Problem Statement

Every year, millions of people receive lab reports filled with medical jargon they don't understand. Most people:
- ? Don't know what their biomarker values mean
- ? Have to wait days to get doctor's interpretation
- ? Can't track how their health changes over time
- ? Miss early warning signs hidden in their reports

## ?? Our Solution

**HealthLens AI** instantly analyzes your lab reports using AI and gives you:
- ? Plain-English explanations of every biomarker
- ? Color-coded risk indicators (Normal / Borderline / High Risk)
- ? Historical trend tracking across multiple reports
- ? An AI health assistant you can ask questions to
- ? Personalized insights based on your health profile

---

## ?? Live Demo

> **Try it now:** [https://healthlens-ai-omega.vercel.app](https://healthlens-ai-omega.vercel.app)

### Demo Credentials
| Field | Value |
|-------|-------|
| **Email** | `demo@healthlens.ai` |
| **Password** | `Demo@12345` |

### Sample Reports (for testing)
Upload any of these sample reports after logging in:
- `Cardiovascular_Lipid_and_Thyroid_Demo.pdf`
- `Complete_Blood_Count_and_Vitamins_Demo.pdf`
- `Comprehensive_Metabolic_Panel_Demo.pdf`

(Available in the `sample_reports/` folder)

---

## ? Features

| Feature | Description |
|---------|-------------|
| ?? **Smart OCR** | Extracts data from PDF & image lab reports using Tesseract OCR |
| ?? **AI Analysis** | Powered by Groq LLM (Qwen 3.8B) with structured JSON output |
| ?? **Biomarker Trends** | Visual trend charts across multiple reports over time |
| ?? **Health Assistant** | Ask questions about your reports in plain English |
| ?? **RAG Knowledge Base** | Medical knowledge retrieval for accurate context |
| ?? **Private & Secure** | Each user's data is completely isolated and encrypted |
| ?? **Responsive Design** | Works seamlessly on mobile, tablet, and desktop |
| ?? **Beautiful UI** | GSAP-animated landing page with glassmorphism design |

---

## ??? Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + TypeScript** | UI Framework |
| **Vite** | Build Tool |
| **TailwindCSS** | Styling |
| **GSAP** | Animations |
| **Recharts** | Data Visualization |
| **Supabase JS** | Auth & Storage |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | REST API Framework |
| **Python 3.12** | Runtime |
| **Groq API (Qwen 3.8B)** | LLM for AI Analysis |
| **Instructor** | Structured JSON output from LLM |
| **Tesseract OCR** | PDF/Image text extraction |
| **pdf2image + PyPDF** | Document processing |
| **Supabase** | Database + File Storage |
| **PostgreSQL** | Relational Database |
| **Docker** | Containerization |

### Deployment
| Service | Component |
|---------|-----------|
| **Vercel** | Frontend hosting |
| **Render.com** | Backend API hosting |
| **Supabase** | Database + Auth + Storage |

---

## ??? Architecture

```
+---------------------------------------------------------+
¦                    User Browser                          ¦
¦           React + TypeScript (Vercel)                    ¦
+---------------------------------------------------------+
                       ¦ HTTPS API calls
                       ?
+---------------------------------------------------------+
¦              FastAPI Backend (Render.com)                ¦
¦  +---------+  +----------+  +--------+  +----------+  ¦
¦  ¦  OCR    ¦  ¦ AI/LLM   ¦  ¦  RAG   ¦  ¦  Auth    ¦  ¦
¦  ¦Tesseract¦  ¦Groq+Qwen ¦  ¦Knowledge¦  ¦Supabase  ¦  ¦
¦  +---------+  +----------+  +--------+  +----------+  ¦
+---------------------------------------------------------+
                       ¦
                       ?
+---------------------------------------------------------+
¦                  Supabase Cloud                          ¦
¦         PostgreSQL DB + File Storage + Auth             ¦
+---------------------------------------------------------+
```

---

## ?? Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- Tesseract OCR installed
- Supabase account + Groq API key

### Backend
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## ?? Project Structure

```
health-lens/
+-- backend/
¦   +-- app/
¦   ¦   +-- api/          # FastAPI route handlers
¦   ¦   +-- core/         # Config, DB, settings
¦   ¦   +-- services/     # OCR, LLM, RAG, Storage
¦   +-- Dockerfile
¦   +-- requirements.txt
+-- frontend/
¦   +-- src/
¦   ¦   +-- components/   # React components
¦   ¦   +-- pages/        # Landing, Login, Dashboard
¦   ¦   +-- services/     # API client
¦   +-- vite.config.ts
+-- sample_reports/       # Demo lab reports for testing
+-- docker-compose.yml
```

---

## ????? Built By

**Piyush Verma** — Full Stack Developer & AI Integration

---

<div align="center">

**Built with ?? for better health understanding**

[?? Live App](https://healthlens-ai-omega.vercel.app) • [?? API](https://healthlens-backend-i3py.onrender.com/api/v1/health)

</div>

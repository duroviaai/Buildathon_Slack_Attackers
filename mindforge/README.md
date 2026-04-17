# MindForge

AI-powered personalized learning platform.

## Features

| Feature | Description |
|---|---|
| AI Chatbot | Conversational AI tutor powered by SambaNova |
| Flashcards | Auto-generate flashcards from notes |
| Quizzes | AI-generated quizzes with instant feedback |
| Notes | Upload PDFs/images with OCR text extraction |
| Streaks | Daily learning streak tracking |
| Learner Profiling | Adaptive difficulty based on performance |
| Teacher Dashboard | Manage students and content |
| Auth | Google OAuth, JWT, email OTP |

## Tech Stack

- **Backend:** Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt
- **Frontend:** HTML, Tailwind CSS, Vanilla JS
- **AI:** SambaNova API (OpenAI-compatible)
- **OCR:** Tesseract + pdfplumber
- **Database:** SQLite

## Project Structure

```
mindforge/
├── backend/
│   ├── models/       # SQLAlchemy models
│   ├── routes/       # Flask blueprints
│   ├── services/     # Business logic & AI integrations
│   └── utils/        # Helpers & validators
├── frontend/
│   ├── pages/        # Feature pages
│   ├── components/   # Reusable HTML components
│   └── assets/       # CSS, JS, images
└── docs/             # API & architecture docs
```

## Setup

### 1. Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Configure environment
Copy `.env` and fill in your keys:
```
SECRET_KEY=...
JWT_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SAMBANOVA_API_KEY=...
```

### 3. Run
```bash
python run.py
```

### 4. Open
Navigate to: `http://127.0.0.1:5000`

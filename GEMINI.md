# StoryWeaver (织梦者)

> 🎭 AI-driven novel creation and interactive reading platform.

## Project Overview

StoryWeaver is a full-stack application that combines AI-assisted writing tools with an interactive "text adventure" game engine. It allows users to create novels with AI help (outlines, chapter writing, character generation) and play interactive stories with branching narratives.

### Architecture

*   **Backend:** Python 3.12+ with FastAPI. Handles API requests, database interactions (SQLAlchemy + SQLite), and AI model integration (OpenAI/Anthropic).
*   **Frontend:** Next.js 14 (TypeScript). Provides the user interface for writing, reading, and managing stories. Uses Tailwind CSS and shadcn/ui for styling.
*   **Database:** SQLite (default) for local development, easily switchable to other SQL databases supported by SQLAlchemy.
*   **AI Integration:** Leverages LLMs for content generation.

## Building and Running

### Prerequisites

*   Docker & Docker Compose (Recommended)
*   OR: Python 3.10+, Node.js 18+

### Quick Start (Docker)

The easiest way to run the entire stack is using Docker Compose.

1.  **Configure Environment:**
    Create a `backend/.env` file (see `backend/.env.example` for reference).
    ```bash
    # Essential settings
    JWT_SECRET_KEY=your-secure-secret-key
    OPENAI_API_KEY=your-api-key
    DATABASE_URL=sqlite:///./data/story.db
    ```

2.  **Start Services:**
    ```bash
    docker compose up -d
    ```

    *   Backend: `http://localhost:8000`
    *   Frontend: `http://localhost:3000`

### Manual Development

#### Backend

1.  Navigate to `backend/`.
2.  Create and activate a virtual environment.
3.  Install dependencies: `pip install -r requirements.txt`.
4.  Run the server:
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```

#### Frontend

1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`.
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Development Conventions

### Backend (Python/FastAPI)

*   **Structure:**
    *   `app/main.py`: Application entry point and middleware configuration.
    *   `app/routers/`: API route definitions, organized by domain (e.g., `novels.py`, `ai.py`).
    *   `app/models/`: SQLAlchemy ORM models.
    *   `app/schemas/`: Pydantic models for request/response validation.
    *   `app/services/`: Business logic and AI integration.
*   **Style:** Follow PEP 8. Use type hints for all function signatures.
*   **Database:** Use Alembic for migrations (if configured) or `init_db()` in `main.py` for initial setup.

### Frontend (Next.js/React)

*   **Structure:**
    *   `app/`: Next.js App Router pages and layouts.
    *   `components/`: Reusable React components (UI library, editor, etc.).
    *   `lib/`: Utility functions, API clients (`api.ts`), and store definitions.
*   **Styling:** Tailwind CSS with utility classes.
*   **State Management:** Zustand (inferred from `package.json` and typical usage patterns).

### API Interactions

*   **Prefix:** All backend API endpoints are prefixed with `/api`.
*   **Client:** The frontend uses a typed API client in `frontend/lib/api.ts` to communicate with the backend. Always use this client for data fetching.

## Key Configuration Files

*   `docker-compose.yml`: Defines services for backend and frontend.
*   `backend/requirements.txt`: Python dependencies.
*   `frontend/package.json`: Node.js dependencies and scripts.
*   `backend/.env`: Backend configuration (secrets, DB URL, API keys).

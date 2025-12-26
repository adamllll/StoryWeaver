# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**StoryWeaver (织梦者)** - AI-powered novel creation and interactive reading platform

- **Tech Stack**: Next.js 14 + TypeScript + FastAPI + SQLite + AI Services (OpenAI/Claude)
- **Architecture**: Frontend-Backend separation with RESTful APIs
- **Constraints**: Optimized for 2-core 2GB server
- **Current Status**: MVP complete (65% frontend, 100% backend), now optimizing and testing

---

## Essential Commands

### Development Workflow

```bash
# Start entire project (recommended)
./start.sh                    # Auto-install deps and start both frontend & backend

# Stop all services
./stop.sh

# Manual start - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Manual start - Frontend
cd frontend
npm run dev

# Run tests
cd backend && pytest                    # Backend tests
cd frontend && npm test                 # Frontend unit tests
cd frontend && npm run test:coverage    # With coverage

# Linting
cd frontend && npm run lint             # Frontend ESLint
cd backend && source venv/bin/activate && python -m pytest --pylint  # Backend (if configured)

# Build
cd frontend && npm run build            # Next.js production build

# Docker commands
docker build -t storyweaver-backend:latest ./backend   # Build backend image
docker build -t storyweaver-frontend:latest ./frontend # Build frontend image
docker-compose up -d                    # Start all services with Docker Compose
docker-compose down                     # Stop all Docker services
```

### Database Operations

```bash
# Database auto-creates on first backend startup
# Located at: backend/story_weaver.db

# Migration (manual)
cd backend
python migrate_db.py  # If exists

# Reset database (CAUTION)
rm backend/story_weaver.db  # Will recreate on next start
```

---

## Code Architecture

### High-Level Structure

```
story-weaver/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # App entry + CORS config
│   │   ├── config.py    # Environment settings
│   │   ├── database.py  # SQLAlchemy setup
│   │   ├── models/      # ORM models (User/Novel/Chapter/Character)
│   │   ├── schemas/     # Pydantic schemas (API contracts)
│   │   ├── routers/     # API endpoints by feature
│   │   ├── services/    # Business logic layer
│   │   └── utils/       # Helpers (auth, prompts)
│   └── requirements.txt
│
└── frontend/            # Next.js 14 (App Router)
    ├── app/            # Pages (file-based routing)
    │   ├── (auth)/    # Login/Register
    │   ├── novels/    # Novel list & details
    │   ├── workspace/ # Editor & creation
    │   └── read/      # Reading interface
    ├── components/
    │   ├── ui/        # shadcn/ui components
    │   ├── editor/    # Tiptap editor + AI assistant
    │   └── providers/ # React Context
    ├── lib/
    │   ├── api.ts     # Type-safe API client (USE THIS!)
    │   ├── store.ts   # Zustand global state
    │   └── hooks.ts   # Reusable hooks
    └── package.json
```

### Key Architectural Patterns

**Backend (FastAPI)**
- **Layered Architecture**: Router → Schema → Service → Model
- **Dependency Injection**: `Depends(get_db)`, `Depends(get_current_user)`
- **JWT Authentication**: Token-based auth with secure key validation
- **AI Service Abstraction**: `services/ai_service.py` wraps OpenAI/Claude APIs with retry logic

**Frontend (Next.js)**
- **Server Components by Default**: Use `"use client"` only when needed (state, effects, events)
- **Centralized API Client**: Always use `lib/api.ts` for backend calls
- **State Management**: Zustand (`lib/store.ts`) for auth and global state
- **Component Library**: shadcn/ui (customizable, not a black box)

### Critical Data Flows

**AI Content Generation**:
```
User Input (Editor)
  → Frontend AI Assistant Component
  → apiClient.post('/api/ai/continue', {...})
  → Backend Router (routers/ai.py)
  → AI Service (services/ai_service.py)
  → OpenAI/Claude API
  → Response → Frontend → Rich Text Editor
```

**Authentication Flow**:
```
Login Form
  → POST /api/auth/login
  → JWT Token Generated
  → Stored in localStorage (frontend)
  → Sent in Authorization header for protected routes
  → Backend verifies with JWT_SECRET_KEY
```

---

## Development Conventions

### Backend Standards

**Code Style**:
```python
# ✅ REQUIRED: Type hints + docstrings
from typing import List, Optional
from pydantic import BaseModel

class NovelCreate(BaseModel):
    """Schema for creating a new novel."""
    title: str
    description: Optional[str] = None
    category: str

@router.post("/novels", response_model=NovelResponse)
async def create_novel(
    novel: NovelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> NovelResponse:
    """Create a new novel for the authenticated user."""
    # Implementation
    pass

# ❌ AVOID: No type hints, no docstring
def bad_function(data):
    return data
```

**Database Conventions**:
- Table names: plural lowercase with underscores (`users`, `world_settings`)
- Column names: lowercase with underscores (`created_at`, `user_id`)
- Foreign keys: `<table_singular>_id` (e.g., `user_id`, `novel_id`)
- Always use relationships for navigating between models

**API Response Format**:
```python
# Success: Return Pydantic model directly (FastAPI auto-serializes)
return NovelResponse(id=1, title="...", ...)

# Error: Use HTTPException with standard status codes
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Novel not found"
)
```

### Frontend Standards

**TypeScript Strictness**:
```typescript
// ✅ REQUIRED: Complete interfaces, no 'any'
interface NovelCardProps {
  title: string;
  author: string;
  category: string;
  onSelect?: (id: number) => void;
}

export function NovelCard({ title, author, category, onSelect }: NovelCardProps) {
  return <div>...</div>;
}

// ❌ FORBIDDEN: Using 'any'
function BadComponent(props: any) { ... }
```

**API Client Usage** (MANDATORY):
```typescript
// ✅ ALWAYS use the centralized API client
import { apiClient } from '@/lib/api';

const novels = await apiClient.get<Novel[]>('/api/novels');

try {
  const result = await apiClient.post('/api/novels', novelData);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  }
}

// ❌ NEVER use raw fetch() directly
const response = await fetch('http://localhost:8000/api/novels'); // DON'T!
```

**Component Organization**:
- **Pages** (`app/`): Minimal logic, compose components
- **Business Components** (`components/editor/`, `components/novel/`): Feature-specific
- **UI Components** (`components/ui/`): shadcn/ui only, don't create custom ones unless absolutely necessary

### Naming Conventions

**Files**:
- Backend: `snake_case.py` (e.g., `ai_service.py`, `reading_progress.py`)
- Frontend: `kebab-case.tsx` for pages, `PascalCase.tsx` for components

**Variables & Functions**:
- Backend: `snake_case` (Pythonic)
- Frontend: `camelCase` (JavaScript convention)

**Constants**:
- Backend: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET_KEY`, `DEFAULT_TIMEOUT`)
- Frontend: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config objects

---

## AI Services Integration

### Environment Variables Required

**Backend** (`.env`):
```bash
# CRITICAL: Must be set for AI features
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1  # Or custom endpoint
CLAUDE_API_KEY=sk-ant-...  # Optional

# CRITICAL: Must change in production
JWT_SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=sqlite:///./story_weaver.db

# Security
DEBUG=false  # MUST be false in production
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### AI Prompt Templates

Located in `backend/app/utils/prompts.py`:
- `OUTLINE_SYSTEM_PROMPT`: Novel outline generation
- `CONTINUE_SYSTEM_PROMPT`: Chapter continuation
- `EXPAND_SYSTEM_PROMPT`: Content expansion
- `CHARACTER_SYSTEM_PROMPT`: Character generation
- `BRANCH_SYSTEM_PROMPT`: Interactive branch generation
- `FORMAT_OPTIMIZE_SYSTEM_PROMPT`: Format optimization

**When modifying prompts**:
1. Test thoroughly with multiple inputs
2. Document version changes in `docs/02-提示词设计文档.md`
3. Verify output format matches Pydantic schema expectations

---

## Testing Strategy

### Backend Tests (pytest)

```bash
cd backend
source venv/bin/activate
pytest                          # Run all tests
pytest tests/test_auth.py      # Specific module
pytest -v                      # Verbose
pytest --cov=app               # With coverage
```

**Test Structure**:
```python
# tests/test_novels.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_novel_success():
    """Test successful novel creation."""
    response = client.post(
        "/api/novels",
        json={"title": "Test", "category": "fantasy"},
        headers={"Authorization": "Bearer <token>"}
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Test"
```

### Frontend Tests (Jest + React Testing Library)

```bash
cd frontend
npm test                       # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

**Test Structure**:
```typescript
// __tests__/components/NovelCard.test.tsx
import { render, screen } from '@testing-library/react';
import { NovelCard } from '@/components/novel/NovelCard';

describe('NovelCard', () => {
  it('renders novel information correctly', () => {
    render(<NovelCard title="Test Novel" author="Author" category="Fantasy" />);
    expect(screen.getByText('Test Novel')).toBeInTheDocument();
  });
});
```

---

## Specialized Agents & Tools

**⚠️ IMPORTANT: Agent Usage Policy**

When working on this project, you MUST proactively use the Task tool with specialized agents for:

1. **Exploring the codebase** - Use `subagent_type=Explore` when:
   - Searching for files, functions, or patterns
   - Understanding how a feature is implemented
   - Finding all usages of a component/function
   - Investigating bugs or errors

2. **Planning implementations** - Use `subagent_type=Plan` when:
   - Designing new features
   - Refactoring existing code
   - Making architectural decisions

**DO NOT** manually search through files one by one. **ALWAYS** launch an Explore agent first to efficiently gather context.

### Available Agents

The following expert agents are available in this project. Invoke with `@<agent-name>`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `@frontend-developer` | React/Next.js development | Frontend component creation, routing, state management |
| `@backend-architect` | FastAPI architecture | API design, database modeling, service layer refactoring |
| `@debugger` | Debug code issues | Runtime errors, logic bugs, performance bottlenecks |
| `@test-engineer` | Testing strategy | Writing tests, improving coverage, test architecture |
| `@prompt-engineer` | AI prompt optimization | Improving AI generation quality, prompt refinement |
| `@ui-ux-designer` | UI/UX design | Component design, user flow, accessibility |
| `@error-detective` | Error diagnosis | Investigating hard-to-find bugs, log analysis |
| `@api-documenter` | API documentation | OpenAPI/Swagger docs, API usage guides |
| `@code-reviewer` | Code review | Pull request reviews, code quality checks |
| `@deployment-engineer` | Deployment & DevOps | Docker setup, deployment scripts, production config |
| `@architect-reviewer` | Architecture review | System design, scalability, technical debt assessment |

**Usage Example**:
```
@frontend-developer I need to create a new component for displaying novel statistics with charts
@debugger The AI generation is failing intermittently, check backend/app/services/ai_service.py
```

### Task Tool Usage Examples

```
# When user asks to fix a bug:
Task(subagent_type="Explore", prompt="Find all files related to [feature] and identify the bug...")

# When user asks to add a feature:
Task(subagent_type="Plan", prompt="Design implementation plan for [feature]...")

# When user asks about codebase structure:
Task(subagent_type="Explore", prompt="Explore the codebase structure and explain...")
```

---

## Common Issues & Solutions

### Backend Won't Start

1. **Check Python version**: `python3 --version` (need 3.10+)
2. **Activate venv**: `source backend/venv/bin/activate`
3. **Verify .env**: Ensure `OPENAI_API_KEY` and `JWT_SECRET_KEY` are set
4. **Check port**: `lsof -i :8000` (kill if occupied)
5. **View logs**: `tail -f backend.log`

### Frontend Build Fails

1. **Clear cache**: `rm -rf .next node_modules && npm install`
2. **Check Node version**: `node --version` (need 18+)
3. **Verify .env.local**: Must exist with `NEXT_PUBLIC_API_URL`
4. **Type errors**: Run `npm run lint` to see all issues

### AI Generation Errors

1. **API Key**: Verify `OPENAI_API_KEY` in backend `.env`
2. **Network**: Test with `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. **Rate limits**: Check if API quota exceeded
4. **Prompt length**: Verify context doesn't exceed model limits (check `services/ai_service.py`)

### CORS Errors

- Frontend and backend origins must match in `backend/app/main.py` (lines 83-91)
- Ensure `FRONTEND_URL` in backend `.env` includes the frontend URL

### Docker Build Fails

**Symptom**: Frontend Docker build fails with `Cannot find module 'autoprefixer'` or similar devDependency errors

**Root Cause**: Builder stage missing devDependencies (TypeScript, PostCSS, etc.) required for Next.js build

**Solution**: Ensure `frontend/Dockerfile` builder stage uses `npm ci` (NOT `npm ci --only=production`)

**Correct Pattern**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci  # Install ALL dependencies (including devDependencies)
COPY . .
RUN npm run build
```

**Why This Works**:
- Build stage needs devDependencies (TypeScript compiler, PostCSS plugins, etc.)
- Runtime stage uses Next.js standalone output (no devDependencies needed)
- Final image remains lightweight despite full build dependencies

---

## Important Files Reference

### Configuration
- `backend/.env` - Backend environment variables (NEVER commit!)
- `frontend/.env.local` - Frontend environment variables (NEVER commit!)
- `backend/app/config.py` - Backend settings management
- `frontend/next.config.js` - Next.js configuration

### Database
- `backend/app/models/` - SQLAlchemy ORM models
- `backend/app/database.py` - Database connection setup
- `backend/story_weaver.db` - SQLite database file (auto-created)

### API Layer
- `backend/app/routers/` - All API endpoints
- `backend/app/schemas/` - Request/response schemas
- `frontend/lib/api.ts` - Frontend API client

### AI Integration
- `backend/app/services/ai_service.py` - AI service wrapper
- `backend/app/utils/prompts.py` - Prompt templates
- `backend/app/routers/ai.py` - AI generation endpoints

### UI Components
- `frontend/components/ui/` - shadcn/ui base components
- `frontend/components/editor/` - Rich text editor + AI assistant
- `frontend/lib/store.ts` - Global state management

---

## Security Checklist

**Before deploying to production**:
- [ ] Change `JWT_SECRET_KEY` from default value
- [ ] Set `DEBUG=false` in backend `.env`
- [ ] Review CORS origins in `backend/app/main.py`
- [ ] Ensure database file has proper permissions
- [ ] Never commit `.env` or `.env.local` files
- [ ] Rate limit AI API calls (configured in `ai_service.py`)
- [ ] Use HTTPS in production
- [ ] Set secure password hashing (already uses Argon2)

---

## Project Status & Roadmap

**Current Phase**: Optimization & Testing (Week 4)

**Completed** ✅:
- Full authentication system (JWT)
- Novel & chapter CRUD
- AI generation (outline, continue, expand, optimize)
- Rich text editor with Tiptap
- Interactive branching system
- Character & world settings management
- Reading interface
- Docker containerization (frontend + backend)

**In Progress** 🔄:
- Unit test coverage
- E2E tests with Playwright
- Performance optimization
- Production deployment setup

**Future** 📋:
- Consistency validation (detect plot contradictions)
- Export to TXT/PDF
- Reading statistics dashboard

---

## Contributing Guidelines

1. **Branch naming**: `feature/short-description`, `fix/issue-description`
2. **Commit messages**: Follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
3. **Code review**: All changes require review before merging
4. **Tests**: Add tests for new features
5. **Documentation**: Update this file if architecture changes

---

**Last Updated**: 2025-12-26
**Project Version**: 1.0.0
**Maintained By**: Course Project Team

For detailed project context, design decisions, and development history, see the original extensive documentation in `docs/` directory.

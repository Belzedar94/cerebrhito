# CerebrHito - AI-Powered Child Development Assistant

CerebrHito is an innovative AI-powered platform designed to assist parents and professionals in tracking and supporting child development. The application combines advanced AI technologies with expert knowledge in child neuropsychology to provide personalized guidance and support.

## Key Features

- **AI Visual Analysis System**: Process and analyze photos/videos to track developmental progress
- **Interactive AI Assistant**: 24/7 multimodal assistant with voice interface powered by Groq LLM and ElevenLabs TTS
- **Activity Planning System**: Weekly calendar with age-appropriate activities and tracking
- **Development Tracking**: Personalized timelines, milestone tracking, and progress visualization

## Technology Stack

- **Frontend**: React.js, Next.js, TypeScript, TailwindCSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: Supabase (PostgreSQL + Vector embeddings)
- **AI Integration**: 
  - Groq LLM (llama-3.1-70b-versatile)
  - ElevenLabs TTS (Eleven_turbo_v2_5)
- **Authentication**: JWT + Supabase Auth

## Project Structure

### Backend

```
backend/
├── src/
│   ├── config/         # Configuration files (Supabase, env, etc.)
│   ├── controllers/    # Request handlers
│   ├── db/            # Database migrations and schemas
│   ├── middleware/    # Express middleware (auth, validation, etc.)
│   ├── models/        # Data models and types
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic and external services
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Helper functions and utilities
├── scripts/           # Utility scripts (migrations, etc.)
└── tests/            # Test files
```

### Frontend

```
frontend/
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # Reusable UI components
│   ├── lib/          # Core functionality (auth, API, etc.)
│   ├── store/        # State management
│   ├── styles/       # Global styles and Tailwind config
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Helper functions
└── public/          # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Groq API key
- ElevenLabs API key

### Environment Setup

1. Backend (.env):
```bash
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_DB_URL=your_supabase_db_url

# AI Services
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Security
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

2. Frontend (.env.local):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cerebrhito.git
cd cerebrhito
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Run database migrations:
```bash
cd backend
npm run db:migrate
```

5. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Development Guide

### Authentication Flow

The authentication system uses a combination of Supabase Auth and JWT tokens:

1. User signs up/in through the frontend forms
2. Backend validates credentials with Supabase Auth
3. On success, generates a JWT token with user info
4. Frontend stores token in localStorage
5. Protected routes/requests include token in Authorization header

Key files:
- `backend/src/services/auth.ts`: Core authentication logic
- `backend/src/middleware/auth.ts`: Route protection middleware
- `frontend/src/lib/auth/AuthContext.tsx`: Auth state management

### Database Schema

The database uses Supabase (PostgreSQL) with the following key tables:

- `users`: User accounts and profiles
- `children`: Child profiles linked to users
- `activities`: Developmental activities and games
- `milestones`: Developmental milestones
- `activity_logs`: Activity completion tracking
- `milestone_tracking`: Milestone achievement tracking
- `media`: Photos/videos with analysis data
- `ai_chat_history`: AI assistant conversation history

See `backend/src/db/migrations/00001_initial_schema.sql` for complete schema.

### Adding New Features

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Implement backend components:
   - Add routes in `backend/src/routes/`
   - Create controllers in `backend/src/controllers/`
   - Add business logic in `backend/src/services/`
   - Define types in `backend/src/types/`

3. Implement frontend components:
   - Create pages in `frontend/src/app/`
   - Add components in `frontend/src/components/`
   - Define types in `frontend/src/types/`
   - Add API calls in `frontend/src/lib/`

4. Write tests and documentation

5. Create a pull request

## Current Status

- ✅ Project structure and configuration
- ✅ Database schema and migrations
- ✅ Authentication system
- ✅ Interactive AI Assistant
- ✅ Activity Planning System
- ✅ Development Tracking
- ⏳ AI Visual Analysis System (postponed)

## Improvement Plan

### 1. Architecture & Structure Improvements

#### 1.1 Backend Service Layer
- ✅ Service Locator pattern implementation
- ✅ Unified error handling system
- ✅ Service interfaces for testability
- ⏳ Dependency injection system

#### 1.2 Custom Error Handling
- ✅ Error codes and localization
- ✅ Proper error logging
- ✅ Error middleware implementation

### 2. Database & Data Layer Improvements

#### 2.1 Query Optimization
- ✅ Database connection pooling
- ⏳ Query caching layer
- ⏳ Complex query optimization

#### 2.2 Data Validation
- ✅ Input validation middleware
- ✅ Data sanitization layer
- ✅ Database constraints

### 3. Frontend Improvements

#### 3.1 State Management
- ✅ Redux architecture
- ✅ Data persistence layer
- ⏳ Re-render optimization

#### 3.2 Performance Optimization
- ⏳ Code splitting
- ⏳ Loading states
- ⏳ Bundle size optimization

### 4. Security Improvements

#### 4.1 Authentication
- ✅ Refresh tokens
- ✅ Rate limiting
- ✅ Enhanced password requirements

#### 4.2 Data Protection
- ✅ End-to-end encryption
- ✅ Audit logging
- ⏳ Enhanced backup system

### 5. Testing Strategy

- ⏳ Unit testing framework
- ⏳ Test coverage requirements
- ⏳ Integration tests

### 6. Monitoring & Logging

- ✅ Health checks
- ✅ Performance monitoring
- ✅ Error tracking

### 7. Documentation

- ⏳ OpenAPI/Swagger documentation
- ⏳ Example requests/responses
- ⏳ Error code documentation

### Implemented Features

#### Interactive AI Assistant
- Multimodal interface with text and voice
- Powered by Groq LLM (llama-3.1-70b-versatile)
- Voice synthesis with ElevenLabs TTS
- Context-aware responses using conversation history
- Expert knowledge in child development
- Empathetic and professional communication

#### Activity Planning System
- Age-appropriate activity suggestions
- AI-generated personalized activities
- Activity scheduling and reminders
- Progress tracking and completion logs
- Activity categories and tags
- Professional activity creation
- AI feedback on completed activities

#### Development Tracking
- Milestone tracking and achievement
- Development progress statistics
- Category-based progress tracking
- AI-generated development reports
- Age-appropriate milestone suggestions
- Professional milestone creation
- Comprehensive progress visualization

## License

This project is licensed under the MIT License - see the LICENSE file for details.
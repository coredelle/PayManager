# PayMyValue - Diminished Value Claims Platform

## Overview

PayMyValue is a full-stack web application that helps consumers generate professional diminished value (DV) and total loss appraisals after car accidents. The platform targets everyday drivers in Georgia, Florida, and North Carolina who need to file claims with at-fault insurers.

**Core Features:**
- Free AI-powered pre-qualification estimate for diminished value
- Full paid appraisal workflow with multi-step case creation
- Professional PDF report and demand letter generation (planned)
- State-specific legal context for GA, FL, and NC
- User authentication with case management dashboard

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state
- **Styling:** Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool:** Vite with custom plugins for Replit integration

The frontend follows a pages-based structure with shared components. Key pages include landing, authentication, dashboard, case creation wizard, and valuation results.

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript with ESM modules
- **API Pattern:** RESTful endpoints under `/api/*` prefix
- **Session Management:** express-session with cookie-based auth
- **Password Hashing:** bcrypt for secure credential storage

The server handles authentication, case CRUD operations, and pre-qualification estimates. Routes are registered in a single file with middleware for protected endpoints.

### Data Storage
- **Database:** PostgreSQL via Drizzle ORM
- **Schema Location:** `shared/schema.ts` (shared between client and server)
- **Migrations:** Drizzle Kit with `db:push` command

**Core Entities:**
- Users (authentication and profile)
- Cases (appraisal cases with vehicle, repair, and valuation data)
- PrequalLeads (free estimate submissions before signup)

### Authentication
- Session-based authentication with HTTP-only cookies
- Custom auth context (`useAuth` hook) wrapping React Query
- Protected routes redirect to `/auth` when unauthenticated

### State-Specific Legal Context
The platform includes a legal context service (`server/services/legalContext.ts`) with:
- DV statute summaries per state
- Key case law references (e.g., State Farm v. Mabry for Georgia)
- Negotiation angles for insurance disputes
- Compliance notes including statutes of limitations

## External Dependencies

### Third-Party Services (Prepared but not required for MVP)
- **OpenAI API:** For AI-powered negotiation assistant and chat features
- **Stripe:** For payment processing (environment variable prepared)
- **MarketCheck API:** For vehicle market data and valuations (referenced in attached requirements)

### Database
- PostgreSQL database required via `DATABASE_URL` environment variable
- Connection pooling through `pg` package

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod` - Database ORM and schema validation
- `@tanstack/react-query` - Async state management
- `express-session` - Session handling
- `bcrypt` - Password hashing
- Radix UI primitives - Accessible UI components
- `wouter` - Client-side routing

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret (has dev fallback)
- `OPENAI_API_KEY` - For AI features (optional for MVP)
- `STRIPE_SECRET_KEY` - For payments (optional for MVP)
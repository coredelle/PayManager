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
The platform includes a legal context service (`server/services/stateLaw.ts`) with:
- DV statute summaries per state
- Key case law references (e.g., State Farm v. Mabry, GEICO v. Bouldin for Georgia)
- Negotiation angles for insurance disputes
- Compliance notes including statutes of limitations
- System prompts for AI with jurisdiction-specific instructions

### Valuation Engine Services
Located in `server/services/`:

**marketData.ts** - MarketCheck API Integration:
- `decodeVin()` - VIN decoding via NeoVIN Enhanced Decoder
- `fetchRetailComps()` - Comparable retail listings (excludes auction/wholesale)
- `fetchMarketPricing()` - Market pricing data to replace BlackBook values

**appraisalEngine.ts** - Core Valuation Logic:
- `generatePreAccidentValue()` - Combines MarketCheck price (60%) + comp median (40%)
- `generatePostRepairValue()` - Stigma deduction based on repair severity, mileage, age, prior accidents, state
- `computeDVAmount()` - Full DV calculation: Pre-Accident FMV - Post-Repair FMV
- `quickEstimate()` - Fast estimate for pre-qualification

**aiNarratives.ts** - OpenAI Integration:
- `generateAppraisalNarrative()` - Professional appraisal report generation
- `generateDemandLetter()` - Formal demand letter to insurers
- `generateNegotiationResponse()` - Coaching for adjuster negotiations

### API Endpoints
New endpoints for valuation engine:
- `POST /api/vin/decode` - Decode a VIN
- `POST /api/comps` - Fetch comparable listings
- `POST /api/appraisal/estimate` - Quick estimate (no AI)
- `POST /api/appraisal/full` - Full appraisal with AI narrative generation
- `POST /api/chat/negotiation` - Negotiation chatbot
- `GET /api/chat/:caseId/history` - Chat history

## External Dependencies

### Third-Party Services
- **OpenAI API:** For AI-powered appraisal narratives, demand letters, and negotiation coaching
- **MarketCheck API:** For VIN decoding, comparable listings, and market pricing
- **Stripe:** For payment processing (planned)

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
- `MARKETCHECK_API_KEY` - For MarketData valuation API
- `STRIPE_SECRET_KEY` - For payments (optional for MVP)
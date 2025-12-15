# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zyva** is a SaaS CRM platform for automating customer relationship processes, integrating contacts management, visual automation flows, Kanban pipeline, and multi-channel messaging (WhatsApp, Email, Instagram).

## Tech Stack

### Backend
- **Framework**: Fastify 5.x with TypeScript
- **Database**: PostgreSQL 16 with Prisma ORM 6.x
- **Cache/Queues**: Redis 7 + BullMQ 5.x
- **Authentication**: JWT with @fastify/jwt
- **Validation**: Zod 3.x

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand 5.x
- **Data Fetching**: Tanstack Query 5.x
- **Forms**: React Hook Form 7.x + Zod validation

### Infrastructure
- **Development**: Docker Compose (PostgreSQL + Redis containers)
- **Deployment**: Frontend on Vercel, Backend on Railway (planned)

## Key Commands

### Backend (from `backend/` directory)

```bash
# Development
npm run dev                    # Start dev server with tsx watch (http://localhost:3001)

# Database
npm run prisma:migrate        # Create and apply new migration
npm run prisma:generate       # Generate Prisma Client after schema changes
npm run prisma:studio         # Open Prisma Studio GUI (http://localhost:5555)
npm run prisma:reset          # Reset database (DESTRUCTIVE - use with caution)

# Build
npm run build                 # Compile TypeScript to dist/
npm start                     # Run production build
```

### Frontend (from `frontend/` directory)

```bash
# Development
npm run dev                   # Start Next.js dev server (http://localhost:3000)

# Build
npm run build                 # Production build
npm start                     # Serve production build
npm run lint                  # Run ESLint
```

### Docker (from root directory)

```bash
# Core services
docker-compose up -d          # Start PostgreSQL + Redis
docker-compose down           # Stop all services
docker-compose ps             # Check container status
docker-compose logs -f        # Follow logs

# With admin tools
docker-compose --profile tools up -d    # Include pgAdmin + Redis Commander

# Database access
docker exec -it zyva-postgres psql -U zyva -d zyva_db    # PostgreSQL CLI
docker exec -it zyva-redis redis-cli                      # Redis CLI
```

## Architecture

### Backend Structure

The backend follows a **modular architecture** where each feature is organized into a self-contained module:

```
backend/src/
├── modules/              # Feature modules (auth, contacts, flows, campaigns, etc.)
│   └── [module]/
│       ├── [module].schema.ts      # Zod validation schemas
│       ├── [module].service.ts     # Business logic
│       ├── [module].controller.ts  # Request handlers
│       └── [module].routes.ts      # Fastify routes
├── integrations/         # External API integrations (WhatsApp, Instagram, Email)
├── jobs/                 # BullMQ queues and workers
│   ├── queues/          # Job queue definitions
│   └── workers/         # Job processors
├── middlewares/          # Fastify middleware (auth, error handling, rate limiting)
├── lib/                  # Shared utilities (prisma client, redis client, logger)
└── server.ts            # Application entry point
```

**Module Pattern**: Each module exports routes that are registered in `server.ts` with a prefix (e.g., `/api/auth`, `/api/contacts`). Controllers handle HTTP logic, services contain business logic and database operations.

### Frontend Structure

Uses **Next.js App Router** with route groups for organization:

```
frontend/app/
├── (auth)/              # Public authentication pages (login, cadastro)
├── (app)/               # Protected dashboard pages
│   ├── layout.tsx      # Shared layout with navigation
│   ├── dashboard/      # Main dashboard
│   ├── clientes/       # Contacts management
│   ├── automacoes/     # Flow builder
│   ├── pipeline/       # Kanban view
│   └── campanhas/      # Campaigns
├── layout.tsx          # Root layout
└── page.tsx            # Landing page
```

**State Management**:
- Zustand stores for client state (`stores/auth.ts`, etc.)
- Tanstack Query for server state with automatic caching
- API client configured in `lib/api.ts` with Axios

### Database Schema (Prisma)

**Multi-tenancy model**: Users belong to Organizations. Key entities:

- `User` + `Organization` - Authentication and multi-tenancy (ADMIN/LOJA roles)
- `Contact` - CRM contacts with custom fields, tags, Kanban position
- `Tag` - Segmentation tags (many-to-many with Contacts)
- `KanbanColumn` - Pipeline stages for contacts
- `Flow` + `FlowExecution` - Visual automation builder with execution history
- `Campaign` + `Message` - Bulk messaging campaigns with delivery tracking
- `Integration` - External API credentials (WhatsApp, Instagram, Email)
- `BirthdayAutomation` - Automated birthday message configuration

**Important relationships**:
- User → Organization (one-to-one, user.organizationId)
- Contact → Organization via User (contacts are organization-scoped)
- Flow nodes stored as JSON (`nodes` and `edges` columns)
- Custom fields on Contact stored as JSON

### Authentication Flow

1. **Register**: Creates User + Organization in transaction, returns JWT
2. **Login**: Validates credentials, updates lastLoginAt, returns JWT
3. **Protected routes**: Use `@authenticate` middleware that validates JWT and injects `request.user` with `{ userId, role, organizationId }`
4. **Frontend**: Zustand `auth` store persists token, Axios interceptor adds `Authorization: Bearer` header

Location: `backend/src/middlewares/auth.middleware.ts`

## Development Workflow

### Creating New Features

Follow this pattern when adding features:

1. **Database**: Add Prisma models to `backend/prisma/schema.prisma`, run `npm run prisma:migrate`
2. **Backend Module**:
   - Create `schema.ts` with Zod validators for input/output
   - Create `service.ts` with business logic (Prisma operations)
   - Create `controller.ts` with request handlers
   - Create `routes.ts` to define endpoints
   - Register routes in `server.ts`
3. **Frontend**:
   - Create page in `app/(app)/[feature]/page.tsx`
   - Add API calls in `lib/api.ts`
   - Create components in `components/[feature]/`
   - Add Zustand store if needed for local state

### Testing Changes

Backend health check: `curl http://localhost:3001/health`

Frontend health check: Visit `http://localhost:3000`

Verify database state: `npm run prisma:studio` (from backend/)

### Common Patterns

**Error Handling**: Services throw errors with descriptive messages. Controllers catch and return appropriate HTTP status codes.

**Async Jobs**: Use BullMQ for background work (sending messages, executing flows). Define queue in `jobs/queues/`, worker in `jobs/workers/`.

**Validation**: Always validate input with Zod schemas defined in `[module].schema.ts`. Use `schema.parse()` to validate and throw on error.

**Database Queries**: Use Prisma Client from `lib/prisma.ts`. For complex operations, use transactions: `prisma.$transaction(async (tx) => { ... })`.

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://zyva:zyva123@localhost:5432/zyva_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Important Notes

- **Multi-tenancy**: Always scope queries by `organizationId` to prevent data leakage between organizations
- **Migrations**: Never edit existing migrations. Create new ones with `prisma:migrate`
- **JWT Secret**: Change default JWT_SECRET in production
- **Prisma Client**: Run `prisma:generate` after any schema changes to update types
- **Docker**: Ensure Docker services are running before starting backend (`docker-compose up -d`)
- **Port conflicts**: Backend uses 3001, Frontend uses 3000, PostgreSQL 5432, Redis 6379

## Current Implementation Status

**Completed**:
- ✅ Docker environment (PostgreSQL + Redis)
- ✅ Backend authentication system (register, login, JWT)
- ✅ Frontend authentication pages (login, cadastro)
- ✅ Basic dashboard
- ✅ Prisma schema with all entities
- ✅ Multi-tenancy with Organizations

**In Progress/TODO** (see doc/ folder for detailed plans):
- Contacts CRUD (PHASE 2)
- Kanban pipeline (PHASE 3)
- Flow builder with visual editor (PHASE 4)
- WhatsApp/Email/Instagram integrations (PHASE 5-6)
- Campaign system (PHASE 6)
- Birthday automation (PHASE 7)

## Additional Documentation

Comprehensive documentation exists in the `doc/` folder:
- `COMECE_AQUI.md` - Quick start guide
- `PLANO_DESENVOLVIMENTO.md` - Phase-by-phase implementation plan
- `ARQUITETURA_TECNICA.md` - Technical architecture details
- `ESTRUTURA_PROJETO.md` - Complete file structure
- `ROTAS_E_NAVEGACAO.md` - Route mapping
- `REDIS_STRUCTURE.md` - Redis data structures
- `ANALISE_SCHEMA.md` - Database schema analysis

Refer to these documents for detailed implementation guidance for each phase.

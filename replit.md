# SignCraft 3D - 3D Signage Letter Generator

## Overview

SignCraft 3D is a web-based 3D signage letter generator that allows users to create custom 3D printable signage letters. The application features a visual editor with real-time 3D preview, customizable text and fonts, wiring channel configuration for LED/neon integration, mounting hole patterns, and export to common 3D printing formats (STL, OBJ, 3MF).

The project follows an editor-first interface design inspired by Figma, Tinkercad, and Linear, prioritizing canvas space for 3D preview with accessible tool controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for editor state (letter settings, wiring, mounting, view options)
- **Data Fetching**: TanStack React Query for server state management
- **3D Rendering**: React Three Fiber with Three.js for WebGL-based 3D preview
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful JSON API under `/api/` prefix
- **Build System**: esbuild for server bundling, Vite for client bundling
- **Development**: Hot module replacement via Vite middleware in development mode

### Key API Endpoints
- `GET /api/fonts` - Available font options
- `GET/POST /api/projects` - Project CRUD operations
- `POST /api/export` - Generate and download 3D files (STL/OBJ/3MF)

### Data Storage
- **Current**: In-memory storage using `MemStorage` class for projects
- **Schema**: Drizzle ORM configured for PostgreSQL (schema defined but database integration pending)
- **Validation**: Zod schemas for all data structures shared between client and server

### 3D Generation
- Server-side STL generation using custom triangle mesh algorithms
- Generates geometry for letter shapes, wiring channels, and mounting holes
- Binary STL format output for 3D printer compatibility

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI and editor components
    pages/        # Route pages (editor, not-found)
    lib/          # Utilities, state stores, query client
    hooks/        # Custom React hooks
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Data persistence layer
  stl-generator.ts # 3D mesh generation
shared/           # Shared types and schemas
  schema.ts       # Zod validation schemas
```

## External Dependencies

### Frontend Libraries
- `@react-three/fiber` + `@react-three/drei` - 3D rendering and helpers
- `three` - WebGL 3D library
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management
- `wouter` - Routing
- Radix UI primitives - Accessible component foundations
- `tailwindcss` - Utility-first CSS

### Backend Libraries
- `express` - HTTP server framework
- `drizzle-orm` + `drizzle-kit` - Database ORM (PostgreSQL configured)
- `zod` - Runtime validation
- `connect-pg-simple` - PostgreSQL session store (available for future auth)

### Database
- PostgreSQL configured via `DATABASE_URL` environment variable
- Schema includes users table and project storage capabilities
- Currently using in-memory storage; database integration ready when provisioned

### Build Tools
- Vite for frontend development and production builds
- esbuild for server bundling
- TypeScript for type safety across the stack
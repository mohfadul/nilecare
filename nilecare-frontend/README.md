# NileCare Frontend

React-based frontend for the NileCare Healthcare Platform.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Material-UI 5** for UI components
- **React Query** for data fetching
- **Zustand** for state management
- **React Router** for navigation
- **React Hook Form + Zod** for form validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Copy `.env.example` to `.env.development` and configure:

```
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_WS_URL=ws://localhost:7000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests with Cypress

## Project Structure

```
src/
├── api/              # API clients
├── components/       # Reusable components
│   ├── auth/        # Auth components
│   ├── common/      # Common UI components
│   └── layout/      # Layout components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── store/           # Zustand stores
├── types/           # TypeScript types
├── utils/           # Utility functions
└── config/          # Configuration files
```

## Authentication

The app uses JWT-based authentication with automatic token refresh. The auth flow:

1. User logs in via `/login`
2. Token stored in localStorage via Zustand persist
3. Token automatically added to API requests
4. On 401, user redirected to login

## Development Guidelines

- Use TypeScript for all files
- Follow Material-UI theming
- Use React Query for server state
- Use Zustand for client state
- Implement proper error boundaries
- Ensure accessibility (WCAG 2.1 AA)
- Write tests for critical flows

## Phase 1 Checklist

- [x] Project setup
- [x] API client configuration
- [x] Auth API integration
- [x] Auth store with Zustand
- [x] Auth guards and role gates
- [x] Login page
- [x] Global layout with sidebar
- [x] Routing setup
- [ ] Install dependencies
- [ ] Test login flow
- [ ] Verify token persistence
- [ ] Check responsive layout

## Next Steps

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Test login with backend API
- Proceed to Phase 2: Patient & Appointments


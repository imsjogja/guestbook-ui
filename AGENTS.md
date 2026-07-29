# GuestFlow UI — Agent Guide

This document is intended for AI coding agents working on the **GuestFlow UI** project. It describes the architecture, conventions, build/test process, and deployment setup as it actually exists in the repository today.

---

## Project Overview

GuestFlow UI is a React 19 + TypeScript single-page application (SPA) that serves as the admin dashboard for the GuestFlow platform — a guest-management system for events, invitations, RSVP, QR check-in, seating arrangement, and multi-channel communication (WhatsApp/Email).

The user-facing copy is written in **Bahasa Indonesia** (e.g. *Tamu*, *Acara*, *Undangan*, *Dasbor*, *Check-in*, *Tempat Duduk*), while source-code comments and identifier names are in English.

This project is intentionally separate from the backend. It requires the GuestFlow Go backend to be running (typically on `http://localhost:8080` in development) and must be configured with the backend API URL.

---

## Technology Stack

- **Framework / Library:** React 19 (function components + hooks)
- **Language:** TypeScript 5.9
- **Build Tool:** Vite 7 (development server, production bundling)
- **Routing:** React Router DOM v7 (`BrowserRouter`)
- **State Management:** Zustand v5 (two stores: auth, tenant/workspace)
- **HTTP Client:** Axios via `src/lib/api.ts`
- **Styling:** Tailwind CSS 3.4 + custom CSS variables in `src/index.css`
- **UI Components:** shadcn/ui-style primitives under `src/components/ui` (built on Radix UI primitives + `class-variance-authority`)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod (`@hookform/resolvers`)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **QR Codes:** `qrcode` library
- **Date/Time:** `date-fns`, `dayjs`
- **Testing:** Vitest 4
- **Linting:** ESLint 9 is installed, but **no configuration file exists** (see [Known Issues / Notes](#known-issues--notes))

---

## Repository Layout

```
guestbook-ui/
├── index.html                 # SPA entry HTML; script points to /src/main.tsx
├── package.json               # Scripts, dependencies, dev dependencies
├── vite.config.ts             # Vite config: alias @/src, dev port 3000, react plugin
├── tsconfig.json              # Composite TS config referencing tsconfig.app.json and tsconfig.node.json
├── tsconfig.app.json          # App TS config: strict, ES2022, bundler module resolution, @/ alias
├── tsconfig.node.json         # TS config for Vite config file only
├── tailwind.config.js         # Tailwind theme, custom colors, spacing, shadows, animations, dark mode
├── postcss.config.cjs        # PostCSS: tailwindcss + autoprefixer
├── Dockerfile                # Multi-stage build: node:24-alpine → nginx:1.27-alpine
├── docker-compose.yml        # Local Docker run (UI on port 3000, API at localhost:8080)
├── docker-compose.production.yml # Production Docker run on host port 13000
├── nginx.conf                # SPA nginx rules: cache assets, fall back to index.html
├── public/                   # Static assets served as-is (e.g. guestflow-login-hero.mp4)
├── dist/                     # Vite production build output (git-ignored, but exists locally)
├── web/static/               # Empty in this repo; README mentions copying dist here for Go backend static serving
├── src/
│   ├── main.tsx              # React root mount + BrowserRouter
│   ├── App.tsx               # Route definitions and route guards
│   ├── index.css             # Tailwind directives + CSS variables for theming
│   ├── components/           # Layout, navigation, feature-specific components
│   │   ├── ui/               # ~50 shadcn/ui primitive components (button, card, dialog, form, sidebar, etc.)
│   │   ├── AuthenticatedLayout.tsx
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── EventContextSelector.tsx
│   │   ├── EventRequired.tsx
│   │   ├── FeatureGate.tsx
│   │   ├── TrialBanner.tsx
│   │   ├── WorkspaceOnboarding.tsx
│   │   ├── WhatsAppOnboardingCard.tsx
│   │   └── QRCodeSVG.tsx
│   ├── hooks/                # Custom React hooks (~20) that integrate with the API
│   │   ├── index.ts          # Public barrel exports for hooks
│   │   ├── useAuth.ts
│   │   ├── useEvents.ts
│   │   ├── useGuests.ts
│   │   ├── useGuestDetail.ts
│   │   ├── useRSVP.ts
│   │   ├── useCheckin.ts
│   │   ├── useSeating.ts
│   │   ├── useTemplates.ts
│   │   ├── useCampaigns.ts
│   │   ├── useMessages.ts
│   │   ├── useTeam.ts
│   │   ├── useWhatsAppMessaging.ts
│   │   ├── useSubscription.ts
│   │   └── ...
│   ├── lib/                  # Utilities, API client, normalizers, CSV helpers
│   │   ├── api.ts            # Axios client + request/response interceptors + workspace URL rewriting
│   │   ├── utils.ts          # cn() helper (clsx + tailwind-merge)
│   │   ├── auth-session.ts
│   │   ├── workspace.ts      # Bootstrap workspace (tenants, events) on login
│   │   ├── normalizers.ts    # Backend snake_case → frontend camelCase normalization
│   │   ├── guest-csv.ts
│   │   ├── rsvp-csv.ts
│   │   ├── slugify.ts
│   │   ├── whatsapp-onboarding.ts
│   │   └── *.test.ts         # Co-located unit tests
│   ├── pages/                # Route-level page components (function components)
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Acara.tsx
│   │   ├── Tamu.tsx
│   │   ├── TamuDetail.tsx
│   │   ├── Undangan.tsx
│   │   ├── RSVP.tsx
│   │   ├── Checkin.tsx
│   │   ├── TempatDuduk.tsx
│   │   ├── TemplateKomunikasi.tsx
│   │   ├── RiwayatPesan.tsx
│   │   ├── Tim.tsx
│   │   ├── Pengaturan.tsx
│   │   └── ...
│   ├── store/                # Zustand stores
│   │   ├── authStore.ts      # access/refresh token, user, login/logout (persisted to localStorage)
│   │   └── tenantStore.ts    # current tenant, current event, tenant list (persisted to localStorage)
│   └── types/                # Global TypeScript interfaces
│       └── index.ts
└── .github/workflows/
    ├── deploy-production.yml   # CI/CD: test, build, SSH deploy to production server
    └── notify-whatsapp.yml     # Sends GitHub issue events to a GuestFlow webhook
```

**Note:** The README mentions a `src/services/` directory, but it does not exist in the current codebase. API calls are made directly from the hooks and `lib/api.ts`.

---

## Build and Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server on **http://localhost:3000** |
| `npm run build` | Type-check with `tsc -b` and produce a production bundle in `dist/` |
| `npm run preview` | Serve the built `dist/` bundle locally with Vite preview |
| `npm test` | Run all Vitest tests once (`vitest run`) |
| `npm run lint` | **Currently fails** — ESLint 9 is installed but `eslint.config.js`/`eslint.config.mjs` is missing (see below) |

The dev server does **not** proxy API calls. The frontend makes requests directly to the backend origin configured by `VITE_API_BASE_URL`, so the backend must allow CORS from the dev origin.

---

## Runtime Architecture

### Entry and Routing

- `src/main.tsx` mounts the React root and wraps the app in `BrowserRouter`.
- `src/App.tsx` defines all routes and guards.

Route layout:

- **Public / auth routes:** `/login`, `/register`, `/verify-email`, `/reset-password`, `/magic-login` (no sidebar layout).
- **Authenticated routes:** wrapped by `AuthenticatedLayout`, which checks for an access token and bootstraps the workspace (tenant + event list). If there is no tenant yet, it shows `WorkspaceOnboarding` instead of the sidebar.
- **Event-scoped routes:** further wrapped by `EventRequired`; they only render when a current event is selected in the tenant store. If not, the user sees an Indonesian prompt asking them to select an event.
- Fallback `*` redirects to `/`.

### State Management

Two Zustand stores persist to `localStorage`:

- `useAuthStore` (`src/store/authStore.ts`): `accessToken`, `refreshToken`, `user`, `isLoading`, `error`. Keys: `gf_access_token`, `gf_refresh_token`, `gf_user`.
- `useTenantStore` (`src/store/tenantStore.ts`): `currentTenant`, `currentEvent`, `tenants`, `isLoading`. Keys: `gf_current_tenant`, `gf_current_event`.

`AuthenticatedLayout` calls `bootstrapWorkspace()` on login to load the tenant list and event list, restoring the previously selected workspace if still available.

### API Client (`src/lib/api.ts`)

The Axios instance is the single source of truth for backend communication:

- Base URL: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'`
- Request interceptor attaches:
  - `Authorization: Bearer <accessToken>`
  - `X-Tenant-ID: <currentTenant.id>`
- Request interceptor rewrites URLs via `resolveWorkspacePath()` based on the current tenant and event. For example:
  - `/guests` → `/tenants/{tenantId}/guests`
  - `/events` → `/tenants/{tenantId}/events`
  - `/checkins` → `/tenants/{tenantId}/events/{eventId}/checkin/...`
  - `/seating` → `/tenants/{tenantId}/events/{eventId}/tables`
  - Some paths change HTTP methods (e.g. `/events/{id}/publish` becomes `POST`, `/invitations/{id}/revoke` becomes `DELETE`, and all `PUT` methods are converted to `PATCH`).
- Response interceptor handles `401` by refreshing the access token using `/auth/refresh`. If refresh fails, the session is expired and the user is redirected to `/login`.

### Backend Conventions

The backend uses **snake_case** in JSON payloads. The frontend converts:

- Backend responses → frontend camelCase types via normalizers (`src/lib/normalizers.ts`, and helper functions in hooks like `useEvents.ts`, `useGuests.ts`).
- Frontend partial objects → backend snake_case payloads before `POST`/`PATCH`/`DELETE` (e.g. `toEventPayload`, `toEventUpdatePayload`, `buildGuestPayload`).

---

## Code Style Guidelines

- **TypeScript:** strict mode enabled. `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports` are on. Unreferenced variables will fail the build.
- **Module aliases:** `@/` resolves to `src/`. Use `import { ... } from '@/components/ui/...'` etc.
- **Function components:** default export for pages, named export for hooks and most helpers.
- **Tailwind classes:** prefer `cn()` from `src/lib/utils.ts` to merge conditional classes. Tailwind theme tokens are used via semantic names (`bg-primary`, `text-muted-foreground`) and custom hex values (`text-[#4f46e5]`, `bg-[#f8fafc]`).
- **Dark mode:** the `dark` class is toggled on `document.documentElement` in `Topbar.tsx`. Tailwind `darkMode: ["class"]` is configured.
- **UI primitives:** use components from `src/components/ui`. They are built with Radix primitives, `class-variance-authority` (CVA), and `cn()`.
- **Error / loading states:** hooks expose `isLoading`, `error`, and `refetch`. Network errors are surfaced in Indonesian (e.g. *“Tidak dapat terhubung ke server. Pastikan backend Docker aktif.”*).
- **Accessibility:** existing components use `aria-label`, `sr-only`, and keyboard shortcuts where appropriate. Maintain this when adding new interactive components.
- **Language:** UI labels and user-facing strings must be in **Bahasa Indonesia**. Code comments, variable names, and TypeScript types should remain in English.

---

## Testing Instructions

- Test runner: **Vitest**.
- Test files are co-located with the source code: `src/lib/*.test.ts` and `src/hooks/*.test.ts`.
- No separate `__tests__` or `tests/` directory exists.
- Run tests with `npm test`.
- Current status: **37 tests in 14 files pass** as of the last run.
- There are currently no component/integration tests for pages or `src/components/ui`.

---

## Deployment

### 1. GitHub Actions (Primary)

`.github/workflows/deploy-production.yml` runs on every push to `main` (and supports `workflow_dispatch`):

1. Checks out the repo.
2. Sets up Node 24 with `npm ci`.
3. Runs `npm test -- --run`.
4. Runs `npm run build`.
5. Deploys via SSH to the production server at `/home/ubuntu/apps/guestflow/ui`.
6. Runs `git pull --ff-only origin main` and `docker compose -f docker-compose.production.yml up -d --build`.
7. Health-checks `http://127.0.0.1:13000/`.

Required GitHub secrets: `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`.

### 2. Docker / Docker Compose

- `Dockerfile` builds the app with `node:24-alpine`, then serves with `nginx:1.27-alpine` on port 80.
- `docker-compose.yml` is for local Docker usage and points to `http://localhost:8080/api/v1`.
- `docker-compose.production.yml` binds host port `13000` and uses the build arg `VITE_API_BASE_URL` from the environment (defaults to `/api/v1`).
- `nginx.conf` ensures the SPA fallback to `index.html` and long-term caching for `/assets/`.

### 3. Vercel / Netlify / Go Backend Static

The README also documents Vercel, Netlify, and serving the `dist/` folder from the Go backend under `/admin`. The frontend is a standard static Vite build, so any static host that supports SPA fallbacks works.

---

## Environment and Security Considerations

### Environment Variables

Vite only exposes env variables that begin with `VITE_` to the browser bundle. The only required env variable is:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Create a local `.env` or `.env.local` file. `.env*` is git-ignored. Do **not** commit real secrets.

### Security Notes

- **Tokens are stored in `localStorage`**. This is a deliberate SPA choice; be aware of XSS risks when adding any HTML-injection or `dangerouslySetInnerHTML` usage (e.g. `QRCodeSVG` already uses it for SVG markup).
- The API client automatically attaches `Authorization` and `X-Tenant-ID` headers. Do not hardcode tenant IDs or API keys in components.
- The backend must be configured to allow CORS from the frontend origin(s). See README for the Go CORS example.
- Vite environment variables are **baked into the bundle at build time**, so production builds need a separate `VITE_API_BASE_URL` value (e.g. via Docker `ARG` or CI env).

---

## Known Issues / Notes

- **`npm run lint` fails.** ESLint 9 is installed and the `lint` script exists, but there is no `eslint.config.js`, `eslint.config.mjs`, or `eslint.config.cjs` file. To use linting, add an ESLint flat config. Until then, do not rely on `npm run lint` in CI.
- The production build emits a Vite warning about the main JS chunk being larger than 500 kB. This is expected for a dashboard app that bundles many Radix primitives and Recharts; it does not block the build.
- The `web/static` directory is currently empty. It is documented in the README as a destination for copying the built UI when serving from the Go backend, but it is not part of the Vite build or Docker build.
- The `dist/` folder exists in the working tree but is git-ignored. Do not modify it manually; regenerate it with `npm run build`.
- The README lists 16 pages and a `src/services` directory, but the current source has additional pages (e.g. `Gift`, `Plan`, `TimAcara`, `VerifyEmail`, `MagicLogin`, `ResetPassword`) and no `services` directory. Always verify the actual file tree before adding new code.

---

## Quick Reference for Agents

- Start coding: `npm run dev` (port 3000)
- Verify before committing: `npm test` and `npm run build`
- Add new UI: use `src/components/ui` primitives; follow CVA + `cn()` patterns
- Add new API integration: add a hook in `src/hooks/`, re-export it from `src/hooks/index.ts` if needed, and use `api` from `src/lib/api.ts`
- Add new route: add it in `src/App.tsx` inside the appropriate layout guard
- User-facing text: write in **Bahasa Indonesia**
- Backend payload fields: use **snake_case**; normalize responses to **camelCase**
- Workspace context: most endpoints require a tenant and often an event to be selected; check `EventRequired` and `resolveWorkspacePath` behavior before adding new API paths

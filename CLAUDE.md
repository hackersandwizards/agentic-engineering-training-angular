# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

### Backend (.NET 10)
```bash
cd backend/CrmApi
dotnet build                    # Compile
dotnet run                      # Run on http://localhost:5000 (auto-seeds DB on first run)
dotnet run --urls http://localhost:5000  # Explicit port binding
```

### Frontend (Angular 21)
```bash
cd frontend
npm install                     # Install dependencies
npx ng serve                    # Dev server on http://localhost:4200 (proxies /api to :5000)
npx ng build                    # Production build to dist/frontend
```

Both must be running simultaneously for full functionality. The Angular dev server proxies `/api/*` requests to the .NET backend via `src/proxy.conf.json` — no CORS configuration needed.

### Testing
No test suites are configured. Angular schematics are set with `skipTests: true` in `angular.json`.

### Verifying the backend API
```bash
# Health check
curl http://localhost:5000/api/v1/health-check

# Login (returns JWT)
curl -X POST http://localhost:5000/api/v1/login/access-token \
  -H 'Content-Type: application/json' \
  -d '{"username":"dev@example.com","password":"DevPassword"}'

# Use token for authenticated requests
curl http://localhost:5000/api/v1/users/me -H 'Authorization: Bearer <token>'
```

## Architecture

### Backend
Controller-based ASP.NET Core Web API. No separate DTOs folder — request/response records are co-located at the bottom of each controller file. No custom middleware, no Swagger, no ASP.NET Identity.

- **Program.cs**: All DI registration, middleware pipeline, and database seeding in one file
- **3 controllers** under `api/v1`: `AuthController`, `UsersController`, `ContactsController`
- **AppDbContext**: EF Core with SQLite, snake_case column mapping via Fluent API (not annotations), auto-sets `UpdatedAt` on save
- **JwtService**: Singleton, generates 24h JWT tokens with claims: `sub` (user GUID), `email`, `is_superuser`
- **Authorization**: `[Authorize]` attribute + named policy `"Superuser"` (claim-based: `is_superuser = "True"`)
- **JSON serialization**: `SnakeCaseLower` naming policy globally configured — all API responses use snake_case

### Frontend
Angular 21 standalone components (no NgModules). All components use inline templates and styles.

- **Auth state**: Signal-based `AuthStore` (injectable service with `signal`/`computed`) — token persisted to `localStorage`, user object in memory. `DashboardLayoutComponent.ngOnInit` rehydrates user from token via `testToken` API call.
- **Routing**: Lazy-loaded via `loadComponent`. Guest routes (`/login`, `/signup`) use `guestGuard`. Authenticated routes use `authGuard` wrapping `DashboardLayoutComponent`. Admin routes add `superuserGuard`.
- **HTTP layer**: Functional interceptors — `authInterceptor` attaches Bearer token, `errorInterceptor` catches 401 → clears auth → redirects to `/login`.
- **UI pattern**: Angular Material components. CRUD operations use `MatDialog` with dedicated dialog components (add/edit/delete). `MatSnackBar` for notifications. `MatTable` for data display.
- **Pagination**: All list views use server-side skip/limit pagination (page size 5) with manual page tracking via signals.

### Data Flow
1. User logs in → `AuthService.login()` → backend returns `{access_token, user}` → `AuthStore.setAuth()` stores token in localStorage and user in signal
2. `authInterceptor` attaches `Authorization: Bearer <token>` to all HTTP requests
3. On page refresh, `DashboardLayoutComponent.ngOnInit` calls `testToken` to rehydrate user from stored JWT
4. On 401, `errorInterceptor` calls `AuthStore.clearAuth()` and navigates to `/login`

### Key Conventions
- **Backend**: Request/response records use C# `record` types with `init` properties. `UserResponse.From(user)` static factory pattern for entity-to-response mapping.
- **Frontend**: `inject()` function for DI (not constructor injection). `fb.nonNullable.group()` for reactive forms. Angular 21 `@if`/`@else if` control flow syntax (not `*ngIf`). `signal()` for component state.
- **API contract**: All JSON keys are snake_case. Paginated endpoints return `{data: T[], count: number}`. Errors return `{detail: string}`.

### Ownership Model
- Superusers see all contacts and can manage all users
- Regular users only see their own contacts (filtered server-side by `owner_id`)
- Contact ownership is set automatically to the current user on creation
- Superusers cannot delete themselves (enforced in both backend and frontend)

### Default Seed Data
3 users seeded on first run: `dev@example.com` (superuser), `alice@example.com`, `bob@example.com` — with 10 contacts total. Seeder runs via `DatabaseSeeder.SeedAsync()` called from `Program.cs` and is idempotent (checks `AnyAsync` before inserting).

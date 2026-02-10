# AI Tools Live Demo — 45 Minutes

A live demo of Claude Code CLI for 5 workshop groups: Business Analysis, Development, QA & Testing, Documentation, Release Management.

**Goal:** Showcase what AI tools can do in each group's domain — before the groups go into their own pain points and discovery sessions.

**Tool:** Claude Code CLI (only)
**Codebase:** This Angular 21 + .NET 10 CRM application

---

## Pre-Demo Checklist

Run 30 minutes before the demo:

```bash
# 1. Fresh database (delete old one so seeder re-runs)
rm -f backend/CrmApi/crm.db

# 2. Start backend
cd backend/CrmApi && dotnet run &
# Verify: curl http://localhost:5000/api/v1/health-check

# 3. Start frontend
cd frontend && npx ng serve &
# Verify: open http://localhost:4200 in browser

# 4. Get a token for curl demos
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/login/access-token \
  -H 'Content-Type: application/json' \
  -d '{"username":"dev@example.com","password":"DevPassword"}' | jq -r '.access_token')

# 5. Verify token works
curl -s http://localhost:5000/api/v1/users/me -H "Authorization: Bearer $TOKEN" | jq

# 6. Clean git state
git stash  # or git checkout .

# 7. Open Claude Code in project root (fresh session)
claude
```

**Setup:**
- Terminal font: min 18pt for projector
- Split screen: Terminal (left) + Browser (right)
- Browser: http://localhost:4200 ready

---

## Schedule

| Time | Duration | Section |
|------|----------|---------|
| 00:00–03:00 | 3 min | Opening — show the app, set context |
| 03:00–11:00 | 8 min | **Business Analysis** — extract rules, generate stories |
| 11:00–20:00 | 9 min | **Development** — implement search, security audit |
| 20:00–28:00 | 8 min | **QA & Testing** — generate test suite + test plan |
| 28:00–36:00 | 8 min | **Documentation** — OpenAPI spec + architecture diagrams |
| 36:00–43:00 | 7 min | **Release Management** — CI/CD pipeline + release checklist |
| 43:00–45:00 | 2 min | Summary + transition to group work |

---

## 00:00–03:00 — Opening (3 min)

### Talk

> We have a real CRM application here — Angular 21 frontend, .NET 10 backend, SQLite database, JWT authentication. About 2,000 lines of code across 30+ files. The AI has never seen this code before. I'll run through five scenarios in 40 minutes — one for each group.

### Action

1. **Browser:** Log in as `dev@example.com` / `DevPassword`
2. Show Dashboard, Contacts list, Admin panel
3. Back to terminal

> The AI doesn't know this code. It will read it for the first time now. Let's start with Business Analysis.

---

## 03:00–11:00 — Business Analysis (8 min)

### Pain Point (1 min)

> Imagine a new business analyst joins this project. No specs, no Confluence, just code. How long does it take to understand the business rules? Days? A sprint?

### Demo 1: Extract Business Rules from Code (4 min)

**Copy-paste this prompt into Claude Code:**

```
Analyze this CRM application and extract all implemented business rules. Give me a structured list with:
1. Rule name
2. Where implemented (file + line number)
3. Description in business language (no tech jargon)

Focus on: permissions, validations, data flow, security rules.
```

**What the audience will see:**

The AI reads all controllers and produces rules like:

| Rule | Location | Description |
|------|----------|-------------|
| Contact visibility | `ContactsController.cs:32-33` | Regular users only see their own contacts. Admins see all. |
| Contact ownership | `ContactsController.cs:69` | New contacts automatically belong to the creator. |
| Superuser self-deletion blocked | `UsersController.cs:83-84` and `UsersController.cs:198-199` | Admins cannot delete their own account. |
| Password constraints | `AuthController.cs:62` | 8-40 characters required. |
| Email uniqueness | `AuthController.cs:65` | No duplicate emails allowed. |
| Inactive user login blocked | `AuthController.cs:34-35` | Login refused for deactivated accounts. |
| Token lifetime | `appsettings.json:16` | JWT tokens expire after 24 hours (1440 min). |
| Organisation required | `ContactsController.cs:59-63` | Max 255 chars, cannot be empty. |
| Permission checks on edit/delete | `ContactsController.cs:95-96, 114-115, 148-149` | Non-owners get 403 Forbidden. |

> In 30 seconds, the AI found every single business rule — with exact file references. A business analyst would normally need a full sprint for this.

### Demo 2: Generate User Stories (3 min)

**Copy-paste this prompt:**

```
Based on the current state of the application: What features are obviously missing? Generate 5 user stories in the format:
"As a [role] I want to [function] so that [benefit]."
With acceptance criteria. Prioritize by business value.
```

**What the audience will see:**

The AI identifies gaps in the actual code:

1. **Contact Search** — The `ContactsController.cs:22` only accepts `skip` and `limit`, no search parameter
2. **Contact Export** — No CSV/Excel export endpoint exists
3. **Audit Trail** — `AppDbContext.cs` tracks `UpdatedAt` but no audit log of who changed what
4. **Password Reset** — Only password change exists (`UsersController.cs:53-75`), requiring the old password — no reset flow
5. **Contact Categories/Tags** — `Contact.cs` only has `Organisation` and `Description`, no tags or categories

> The AI didn't just write user stories — it derived them from gaps in the actual code. It knows what's there and sees what's missing.

---

## 11:00–20:00 — Development (9 min)

### Pain Point (1 min)

> For the developers: You get user story #1 from the BA demo — implement contact search. You barely know the code. You need to change frontend AND backend. Product owner wants it tomorrow. How long just to understand the code and find the right places to change?

### Demo 3: Live Feature Implementation — Contact Search (7 min)

**Copy-paste this prompt:**

```
Implement a search function for contacts:

Backend: Extend GET /api/v1/contacts with an optional query parameter "search" that filters by Organisation and Description (case-insensitive LIKE search).

Frontend: Add a search field above the contacts table in contacts.component.ts. Use a MatFormField with debounce (300ms). The search should trigger on every keystroke and update the table.

Follow existing patterns:
- Backend: snake_case JSON, same controller style as existing endpoints
- Frontend: signal() for state, inject() for DI, inline template/styles
```

**What the audience sees:**

1. Claude Code reads `ContactsController.cs`, `contacts.component.ts`, `contact.service.ts`
2. Modifies backend — adds `search` query parameter to `Index()` action
3. Modifies service — adds `search` parameter to `getContacts()`
4. Modifies component — adds `MatFormField` with a `searchQuery` signal and `debounceTime`
5. All changes follow the existing patterns exactly

**Live verification (in browser):**

1. Reload the Contacts page
2. Type "Open" in the search field — only OpenAI contact visible
3. Clear field — all contacts return

> Watch how the AI works: it reads existing code first, understands the patterns, then implements consistently. Same naming conventions, same style. It even added the right RxJS import for debounceTime.

### Demo 4: Security Audit (1 min)

**Copy-paste this prompt:**

```
Find the 3 most critical security issues in this codebase.
```

**Expected findings:**

1. **Hardcoded JWT Secret** — `appsettings.json:13`: `"this-is-a-dev-secret-key-minimum-32-characters-long"` committed to git
2. **Hardcoded Seed Passwords** — `DatabaseSeeder.cs:35,44`: `"AlicePassword123"` and `"BobPassword123"` in plain text
3. **No Rate Limiting** — `AuthController.cs:24`: Login endpoint has no brute-force protection

> Three seconds — three critical security issues. A manual security audit takes days.

---

## 20:00–28:00 — QA & Testing (8 min)

### Pain Point (1 min)

> For the QA group: This project has zero tests. None. The `angular.json:14` literally says `skipTests: true` for every schematic. The backend has no test project. How long does a QA team normally need to build a complete test suite for an application like this?

### Demo 5: Generate Backend Test Suite (4 min)

**Copy-paste this prompt:**

```
Create an xUnit test suite for the ContactsController.

Create:
1. A test project backend/CrmApi.Tests/CrmApi.Tests.csproj
2. Tests for all CRUD operations on /api/v1/contacts
3. Tests for ownership rules (regular user sees only own contacts, superuser sees all)
4. Tests for validation (empty organisation, name too long)
5. Use WebApplicationFactory<Program> for integration tests with InMemory SQLite

Focus on business rules, not infrastructure.
```

**What the audience sees:**

1. Claude Code creates the test project with correct NuGet references
2. Creates test class with setup (WebApplicationFactory, InMemory DB, seed data)
3. Generates tests like:
   - `GetContacts_AsRegularUser_ReturnsOnlyOwnContacts`
   - `GetContacts_AsSuperuser_ReturnsAllContacts`
   - `CreateContact_WithEmptyOrganisation_ReturnsBadRequest`
   - `DeleteContact_OfOtherUser_AsRegularUser_ReturnsForbidden`
   - `CreateContact_SetsOwnerToCurrentUser`

**Live verification:**

```bash
cd backend/CrmApi.Tests && dotnet test
```

> Look at the test names. These aren't generic tests. `GetContacts_AsRegularUser_ReturnsOnlyOwnContacts` — that's exactly the ownership rule we found in the BA demo. The AI understands the business logic and tests precisely that.

### Demo 6: E2E Test Plan (3 min)

**Copy-paste this prompt:**

```
Create a structured E2E test plan for the entire CRM application.
Format: Markdown table with columns:
- Test ID
- Feature area
- Test case description
- Precondition
- Expected result
- Priority (P1/P2/P3)

Group by feature areas: Auth, Contacts, Admin, Settings.
Consider both roles (Superuser vs. regular user).
```

**Expected output — a table with ~25-30 test cases, e.g.:**

| ID | Area | Test Case | Precondition | Expected Result | Prio |
|----|------|-----------|-------------|-----------------|------|
| TC-01 | Auth | Login with valid credentials | Seed data present | Dashboard shown, token in localStorage | P1 |
| TC-02 | Auth | Login with wrong password | — | Error "Incorrect email or password" | P1 |
| TC-03 | Auth | Login with inactive account | User with is_active=false | Error "User account is inactive" | P1 |
| TC-07 | Contacts | Regular user sees only own contacts | Login as alice@example.com | Only "Acme Corp" and "TechStart Inc" visible | P1 |
| TC-08 | Contacts | Superuser sees all contacts | Login as dev@example.com | All 10 contacts visible | P1 |
| TC-15 | Admin | Superuser cannot delete self | Login as dev@example.com | Delete button not visible for own user | P1 |

> Notice: The AI knows the seed data. It knows Alice has exactly 2 contacts — Acme Corp and TechStart Inc — because it read `DatabaseSeeder.cs`. The test cases aren't generic, they're specific to THIS application.

---

## 28:00–36:00 — Documentation (8 min)

### Pain Point (1 min)

> For the documentation group: The current README is minimal. There's no API schema, no architecture diagram, no deployment guide. If a new developer starts tomorrow, where do they even begin?

### Demo 7: Generate OpenAPI Specification (3 min)

**Copy-paste this prompt:**

```
Generate a complete OpenAPI 3.0 specification (YAML) for this API. Extract all endpoints, request/response schemas, authentication, and error responses from the actual code.

Note:
- All JSON keys are snake_case (configured in Program.cs)
- Auth via Bearer JWT Token
- Paginated responses: { data: T[], count: number }
- Error responses: { detail: string }

Save as backend/openapi.yaml
```

**What the audience sees:**

A YAML file with:
- Correct paths from `[Route]` and `[Http*]` attributes across all 3 controllers
- Request bodies from the `record` types (`LoginRequest`, `CreateContactRequest`, etc.)
- Response schemas with snake_case properties (from response records)
- Security schema (Bearer JWT)
- Correct HTTP status codes (201 for Create, 403 for Forbidden, etc.)

> The AI didn't use a template. It extracted routes, record types, the JSON naming policy, and status codes from the actual code. It's accurate because it comes from the code, not from assumptions.

### Demo 8: Architecture Diagrams (4 min)

**Copy-paste this prompt:**

```
Create two Mermaid diagrams for this application:

1. A C4 architecture diagram (Container level) showing:
   - Browser (Angular SPA)
   - Angular Dev Server (Proxy)
   - .NET API
   - SQLite Database
   - JWT Auth Flow

2. A sequence diagram for the login flow:
   - From user input in the browser
   - Through Angular Service, Interceptor
   - To backend AuthController
   - JWT generation
   - Back to localStorage

Format as Markdown with embedded Mermaid blocks.
```

**What the audience sees — two diagrams reflecting the actual code:**

Diagram 1 — Container architecture:
- Angular SPA (port 4200) with Angular Material UI
- Proxy configuration (from `src/proxy.conf.json`)
- .NET API (port 5000) with 3 controllers
- SQLite database (crm.db)
- JWT Authentication Service

Diagram 2 — Login sequence:
- `LoginComponent` → `AuthService.login()`
- `authInterceptor` attaches token
- `AuthController.Login()` → `BCrypt.Verify()` → `JwtService.GenerateToken()`
- Response → `AuthStore.setAuth()` → localStorage + signal
- Redirect to dashboard → `DashboardLayoutComponent.ngOnInit()` → `testToken()`

> These diagrams aren't generic. The sequence diagram shows the exact flow as implemented: LoginComponent calls AuthService.login(), the AuthStore saves the token in localStorage AND the signal, and on page reload DashboardLayoutComponent.ngOnInit() calls testToken to rehydrate the user. That's all from `login.component.ts`, `auth.store.ts`, and `dashboard-layout.component.ts`.

---

## 36:00–43:00 — Release Management (7 min)

### Pain Point (1 min)

> For the release management group: There's no CI/CD pipeline, no automated checks, no deployment script. Every push could break main. How long does it normally take to build this from scratch? Days of YAML debugging?

### Demo 9: GitHub Actions CI/CD Pipeline (4 min)

**Copy-paste this prompt:**

```
Create a GitHub Actions CI/CD pipeline as .github/workflows/ci.yml with these stages:

1. Build & Test Backend:
   - .NET 10 setup
   - dotnet restore, build, test (include the test project we created earlier)

2. Build & Lint Frontend:
   - Node.js 22 setup
   - npm ci
   - npx ng build --configuration production

3. Security Check:
   - dotnet list package --vulnerable
   - npm audit

4. Release (only on main, manual trigger):
   - Semantic version tag
   - GitHub Release with auto-generated changelog

Consider:
- Backend is in backend/CrmApi/
- Frontend is in frontend/
- SQLite DB needs no service setup
- Add caching for NuGet and npm
```

**What the audience sees:**

A complete CI/CD YAML file with:
- Parallel jobs for backend and frontend
- Correct `working-directory` paths (`backend/CrmApi` and `frontend`)
- NuGet and npm cache configuration
- Backend tests with the xUnit project
- Frontend production build
- Security audit step
- Release job with condition on `main` branch and `workflow_dispatch`

> Notice the details: The pipeline knows the backend is in `backend/CrmApi`, that we need .NET 10, that the frontend build is in `frontend`. It even added caching for NuGet and npm so the pipeline doesn't re-download everything every time.

### Demo 10: Release Checklist + Changelog (2 min)

**Copy-paste this prompt:**

```
Based on the current state of the application, create:

1. A pre-release checklist (Markdown) with everything that must be checked before a production deployment. Reference the security issues we found earlier.

2. A changelog in Keep-a-Changelog format for version 1.0.0, based on actually implemented features.
```

**Expected output:**

**Pre-release checklist** (referencing real problems):
- [ ] Move JWT secret from `appsettings.json:13` to environment variable (currently hardcoded)
- [ ] Move seed passwords from `DatabaseSeeder.cs:35,44` to configuration
- [ ] Add rate limiting to login endpoint (`AuthController.cs:24`)
- [ ] Enforce HTTPS (currently `http://localhost:5000`)
- [ ] Replace SQLite with production DB (PostgreSQL/SQL Server)
- [ ] Replace `EnsureCreatedAsync()` with EF Core migrations (`DatabaseSeeder.cs:14`)
- [ ] Test frontend production build (`npx ng build`)
- [ ] Configure CORS policy (currently dev-proxy only)

**Changelog:**
```
## [1.0.0] - 2026-02-10
### Added
- JWT-based authentication (login, signup, token validation)
- Contact management (CRUD) with owner-based access control
- User management for superusers
- Dashboard with contact statistics
- Profile and password management
- Server-side pagination (page size: 5)
- Automatic database seeding with 3 users and 10 contacts
```

> The checklist isn't generic. It references the actual problems we found in the security audit, with file names and line numbers. And the changelog was generated from the actually implemented code, not from git commits.

---

## 43:00–45:00 — Summary (2 min)

### Talk

> Let's recap what we accomplished in 40 minutes:
>
> **Business Analysis**: Extracted all business rules and generated 5 prioritized user stories — all derived from code analysis.
>
> **Development**: Implemented a new feature (contact search) across frontend and backend, plus found three critical security issues.
>
> **QA**: Went from zero tests to a running integration test suite and a complete E2E test plan.
>
> **Documentation**: Generated an OpenAPI specification, architecture diagrams, and a sequence diagram — all extracted from real code.
>
> **Release Management**: Built a CI/CD pipeline, a release checklist with concrete action items, and a changelog.
>
> All of this with ONE tool, on ONE codebase, in 40 minutes.
>
> Now it's your turn. Go into your groups and think about: Where in your daily work would these capabilities make the biggest difference? What pain points could AI tools solve? We'll reconvene in 45 minutes.

---

## Fallback Strategies

### If a live demo hangs or fails

For each demo, pre-generate the output during rehearsal and save as files:

```
fallback/
  01-business-rules.md
  02-user-stories.md
  03-search-feature.patch       # git diff of implemented feature
  04-security-audit.md
  05-backend-tests/             # generated test files
  06-e2e-testplan.md
  07-openapi.yaml
  08-architecture-diagrams.md
  09-ci-pipeline.yml
  10-release-checklist.md
```

### Per-demo fallback procedure

1. **If Claude Code takes >60 seconds**: Say "This is taking longer than expected. Let me show you the result from my rehearsal." → open file from `fallback/`
2. **If backend isn't running**: All API-related demos still work as pure code analysis. Skip the browser verification.
3. **If feature implementation doesn't compile**: Apply the prepared patch: `git apply fallback/03-search-feature.patch`
4. **If tests fail**: "In a live environment there are sometimes timing differences. Here are the tests from the rehearsal." → show terminal screenshot

### General tips

- **Between demos**: Run `git checkout .` to reset the codebase (unless you want the feature to persist)
- **Timing**: If a demo runs long, shorten the next. Development demo is most flexible (security audit can be skipped)
- **Audience questions**: Answer briefly, then redirect: "Great question — that's exactly what your group should discuss."

---

## Technical Requirements

```
[ ] macOS/Linux terminal with min 18pt font
[ ] Claude Code CLI installed and authenticated
[ ] .NET 10 SDK installed
[ ] Node.js 22+ installed
[ ] Git installed
[ ] Chrome browser with DevTools
[ ] Stable internet connection (for Claude API)
[ ] Backup mobile hotspot in case WiFi fails
[ ] Projector resolution tested (terminal + browser visible side by side)
[ ] All fallback/ files pre-generated and verified during rehearsal
```

---

## Key File References

These files are explicitly referenced or modified during the demo:

| File | Demo | Purpose |
|------|------|---------|
| `backend/CrmApi/Controllers/ContactsController.cs` | BA, Dev, QA | Business rules, search feature, tests |
| `backend/CrmApi/Controllers/AuthController.cs` | BA, Dev | Auth rules, security audit |
| `backend/CrmApi/Controllers/UsersController.cs` | BA, QA | Ownership, admin rules |
| `backend/CrmApi/appsettings.json` | Dev, RM | Hardcoded JWT secret |
| `backend/CrmApi/Seed/DatabaseSeeder.cs` | BA, QA, Dev | Seed data, security findings |
| `backend/CrmApi/Auth/JwtService.cs` | Doc | JWT flow in sequence diagram |
| `backend/CrmApi/Data/AppDbContext.cs` | Doc | DB schema for architecture |
| `frontend/src/app/features/contacts/contacts.component.ts` | Dev | Search field added here |
| `frontend/src/app/core/services/contact.service.ts` | Dev | Search parameter added here |
| `frontend/src/app/core/state/auth.store.ts` | Doc | Signal flow in sequence diagram |
| `frontend/src/app/features/auth/login/login.component.ts` | Doc | Login flow |
| `frontend/src/app/layout/dashboard-layout/dashboard-layout.component.ts` | Doc | Rehydration flow |
| `frontend/angular.json` | QA | `skipTests: true` as pain point |
| `frontend/src/proxy.conf.json` | Doc | Proxy config in architecture diagram |

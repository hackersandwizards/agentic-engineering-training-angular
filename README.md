# CRM Training App

Contact management application built with ASP.NET Core and Angular.

## Tech Stack

- **Backend**: ASP.NET Core (.NET 10), Entity Framework Core, SQLite, JWT authentication
- **Frontend**: Angular 21, Angular Material, RxJS

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v20+)

## Getting Started

### Backend

```bash
cd backend/CrmApi
dotnet run
```

Runs on `http://localhost:5000`. The database is created and seeded automatically on first run.

### Frontend

```bash
cd frontend
npm install
npx ng serve
```

Runs on `http://localhost:4200`. API requests are proxied to the backend via `proxy.conf.json`.

## Default Users

| Email | Password | Role |
|---|---|---|
| dev@example.com | DevPassword | Admin (superuser) |
| alice@example.com | AlicePassword123 | User |
| bob@example.com | BobPassword123 | User |

## Project Structure

```
backend/
  CrmApi/
    Program.cs              # App startup, DI, middleware
    Controllers/
      AuthController.cs     # Login, signup, token validation
      UsersController.cs    # User CRUD + admin management
      ContactsController.cs # Contact CRUD with ownership
    Models/
      User.cs               # User entity
      Contact.cs            # Contact entity
    Data/
      AppDbContext.cs        # EF Core context + snake_case mapping
    Auth/
      JwtService.cs         # JWT token generation
    Seed/
      DatabaseSeeder.cs     # Default users + contacts

frontend/
  src/app/
    core/
      models/               # TypeScript interfaces
      services/             # HTTP services (auth, user, contact)
      state/                # Signal-based auth store
      guards/               # Route guards (auth, guest, superuser)
      interceptors/         # HTTP interceptors (auth token, error handling)
    features/
      auth/                 # Login, Signup pages
      dashboard/            # Dashboard with stats
      contacts/             # Contact list + CRUD dialogs
      admin/                # User management + CRUD dialogs
      settings/             # Profile, password, account deletion
    layout/
      sidebar/              # Navigation sidebar
      navbar/               # Top bar with user menu
      dashboard-layout/     # Main layout wrapper
```

## API Endpoints

Base URL: `/api/v1`

### Auth

```bash
# Login (get bearer token)
POST /api/v1/login/access-token
{ "username": "dev@example.com", "password": "DevPassword" }

# Test token validity
POST /api/v1/login/test-token
Authorization: Bearer <token>

# Signup (public)
POST /api/v1/users/signup
{ "email": "user@example.com", "password": "password123", "full_name": "User Name" }
```

### Users (authenticated)

```bash
GET    /api/v1/users/me              # Current user profile
PATCH  /api/v1/users/me              # Update profile
PATCH  /api/v1/users/me/password     # Change password
DELETE /api/v1/users/me              # Delete account
```

### Users (admin only)

```bash
GET    /api/v1/users?skip=0&limit=5  # List users
POST   /api/v1/users                 # Create user
GET    /api/v1/users/{id}            # Get user
PATCH  /api/v1/users/{id}            # Update user
DELETE /api/v1/users/{id}            # Delete user
```

### Contacts (authenticated)

```bash
GET    /api/v1/contacts?skip=0&limit=5  # List (filtered by ownership for non-admins)
POST   /api/v1/contacts                 # Create contact
GET    /api/v1/contacts/{id}            # Get contact
PATCH  /api/v1/contacts/{id}            # Update contact
DELETE /api/v1/contacts/{id}            # Delete contact
```

### Health Check

```bash
GET /api/v1/health-check
# { "status": "ok" }
```

## License

This project is for training purposes.

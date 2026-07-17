# Employee Management System

A full-stack Employee Management System with secure authentication, role-based
access control, employee CRUD operations, organizational hierarchy, and a
responsive dashboard.

## Planned technology stack

- **Frontend:** React, Vite, TypeScript, and Material UI
- **Backend:** Node.js, Express.js, and TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT and bcrypt
- **Validation:** Zod

## Project structure

```text
employee-management-system/
├── backend/       # Express API, authentication, database, and tests
├── frontend/      # React application
├── .gitignore
└── README.md
```

## Core requirements

- Login, logout, password hashing, and protected routes
- Role-based access for Super Admin, HR Manager, and Employee
- Employee create, read, update, and delete operations
- Reporting-manager assignment and organizational tree
- Circular reporting prevention and direct-report listing
- Dashboard statistics for employees and departments
- Search, filtering, sorting, and validation
- Responsive user interface

## Role permissions

| Capability | Super Admin | HR Manager | Employee |
| --- | :---: | :---: | :---: |
| View all employees | Yes | Yes | No |
| Create and edit employees | Yes | Yes | No |
| Delete employees | Yes | No | No |
| Assign managers | Yes | Yes | No |
| Assign the Super Admin role | Yes | No | No |
| View and edit own limited profile fields | Yes | Yes | Yes |

All permissions will be enforced by the backend. Frontend restrictions are
provided for user experience only and are not treated as security controls.

## Planned API endpoints

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

GET    /api/organization/tree
GET    /api/employees/:id/reportees
PATCH  /api/employees/:id/manager

GET    /api/dashboard/stats
```

## Git workflow

- `main` contains stable, submission-ready releases.
- `develop` is the integration branch.
- Each feature is developed in a `feature/<feature-name>` branch.
- Feature pull requests target `develop` and use squash merging so each feature
  appears as one meaningful commit.
- The completed and tested `develop` branch is merged into `main` through a
  release pull request.

Example:

```bash
git switch develop
git switch -c feature/auth-rbac

# Implement and test the feature
git add frontend backend
git commit -m "feat(auth): implement JWT authentication and RBAC"
git push -u origin feature/auth-rbac
```

## Local development

Requirements: Node.js 22 or later and npm.

Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Copy the environment templates and start both applications in separate
terminals:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

cd backend && npm run dev
cd frontend && npm run dev
```

The default local addresses are:

- Frontend: `http://localhost:5173`
- Backend health endpoint: `http://localhost:4000/api/health`

API request examples and Postman instructions are available in
[`docs/api.md`](docs/api.md).

Backend logs are emitted through Winston. Development uses readable colored
logs, production uses structured JSON, and `LOG_LEVEL` controls verbosity.
HTTP logs include request IDs, status codes, and response duration without
recording request bodies, credentials, or authorization headers.

Environment templates:

```text
backend/.env.example
frontend/.env.example
```

Never commit real secrets or local `.env` files.

Backend integration tests require a disposable, migrated PostgreSQL database:

```bash
cd backend
TEST_DATABASE_URL=<test database URL> npm run test:integration
```

The integration suite creates uniquely named records and removes only those
records after it completes. It is skipped by the regular test command when
`TEST_DATABASE_URL` is not configured.

### Neon database setup

Create a Neon PostgreSQL project and copy its pooled and direct connection
strings into `backend/.env`:

```text
DATABASE_URL=<pooled Neon connection string>
DIRECT_URL=<direct Neon connection string>
```

The application uses the pooled URL at runtime. Prisma schema and migration
commands use the direct URL.

Create and seed the database after setting all `SEED_SUPER_ADMIN_*` variables:

```bash
cd backend
npm run db:validate
npm run db:deploy
npm run db:seed
```

When the schema changes during development, create the next migration with:

```bash
npm run db:migrate -- --name describe_your_change
```

## Development roadmap

1. Scaffold the frontend and backend applications.
2. Configure PostgreSQL, Prisma, and the initial Super Admin seed.
3. Implement JWT authentication and backend-enforced RBAC.
4. Implement employee CRUD, validation, and soft deletion.
5. Add reporting hierarchy and circular-assignment prevention.
6. Build search, filters, sorting, pagination, and dashboard statistics.
7. Add responsive UI, automated tests, API documentation, and screenshots.

## Status

React and Express foundations are in place. Feature implementation is pending.

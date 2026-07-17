# Playstack Employee Management System

A production-oriented full-stack Employee Management System built as a hiring assignment. It provides secure authentication, backend-enforced role-based access control, employee management, reporting hierarchy, dashboard analytics, global search, and CSV import/export workflows.

## Live demo

| Application | URL |
| --- | --- |
| Frontend | Add deployed frontend URL here |
| Backend API | Add deployed API URL here |
| API documentation | [docs/api.md](docs/api.md) |

## Highlights

- JWT authentication, password hashing, logout, protected routes, and automatic login redirect when a session expires
- Role-based access for Super Admin, HR Manager, and Employee
- Employee CRUD with validation, soft deletion, reporting-manager assignment, and circular-reporting protection
- Search by name or email with debounced autocomplete, filters, sorting, and pagination
- Dashboard KPIs and employee charts with Redis-backed statistics caching
- Expandable organizational reporting tree with direct-report counts
- Department directory and department-filtered employee lists
- Background-style CSV import/export progress, downloadable template, and import report
- Responsive React and Material UI interface

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Material UI |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL, Prisma ORM, Neon adapter |
| Cache | Redis |
| Authentication | JWT, bcrypt |
| Validation | Zod |
| Testing | Vitest, Supertest |
| Logging and security | Winston, Helmet, CORS, rate limiting |

## Screenshots

Add screenshots to `docs/screenshots/` using the filenames shown below. GitHub will display them automatically in this gallery.

### Login

![Playstack login page](docs/screenshots/login-page.png)

### Dashboard

![Dashboard overview](docs/screenshots/dashboard-page.png)

### Global search

![Global employee search results](docs/screenshots/global-search-results.png)

### Employee list

![Employee list with filters](docs/screenshots/employee-list-page.png)

### Employee pagination

![Employee list pagination](docs/screenshots/employee-pagination.png)

### Create employee

![Create employee form](docs/screenshots/create-employee-page.png)

### Edit employee

![Edit employee form](docs/screenshots/edit-employee-page.png)

### Employee details

![Employee details and direct reportees](docs/screenshots/view-employee-page.png)

### Employee profile

![Employee profile view](docs/screenshots/view-profile-page.png)

### My profile

![My profile page](docs/screenshots/my-profile-page.png)

### Departments

![Department directory](docs/screenshots/departments-page.png)

### Organization hierarchy

![Expandable organization reporting tree](docs/screenshots/organization-page.png)

### Import employees

![Employee CSV import workflow](docs/screenshots/import-employees-page.png)

### Export employees

![Employee CSV export workflow](docs/screenshots/export-employees-page.png)

### Sign out confirmation

![Sign out confirmation dialog](docs/screenshots/sign-out-dialog.png)

## Role permissions

| Capability | Super Admin | HR Manager | Employee |
| --- | :---: | :---: | :---: |
| Dashboard statistics | Yes | Yes | No |
| View all employees | Yes | Yes | No |
| Create employees | Yes | Yes | No |
| Edit employees | Yes | Yes, except Super Admin | Own permitted fields only |
| Delete employees | Yes | No | No |
| Assign reporting managers | Yes | Yes | No |
| Assign Super Admin role | Yes | No | No |
| View organization tree | Yes | Yes | No |
| Import and export CSV | Yes | Yes | No |
| View and edit own profile | Yes | Yes | Yes |

Permissions are enforced by the backend. Frontend visibility and route guards provide an additional user-experience layer but are not treated as the security boundary.

## Project structure

```text
employee-management-system/
├── backend/                 # Express API, Prisma, migrations, seeds, and tests
├── frontend/                # React application
├── docs/
│   ├── api.md               # API and Postman guide
│   └── screenshots/         # README screenshot assets
└── README.md
```

## Local setup

### Requirements

- Node.js 22 or later
- npm
- PostgreSQL database, or a Neon PostgreSQL project
- Redis is recommended for caching; the API continues without cache when Redis is unavailable

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set the PostgreSQL connection strings, a secure JWT secret, and the initial Super Admin values in `backend/.env`.

Important backend variables:

```text
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=1h
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
SEED_SUPER_ADMIN_EMAIL=
SEED_SUPER_ADMIN_PASSWORD=
SEED_SUPER_ADMIN_NAME=
SEED_SUPER_ADMIN_EMPLOYEE_ID=
```

Never commit real credentials or `.env` files.

### 3. Prepare the database

```bash
cd backend
npm run db:validate
npm run db:deploy
npm run db:seed
```

To populate a local demonstration database with realistic employees and hierarchy:

```bash
npm run db:seed:demo
```

### 4. Start the applications

Run these commands in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## Main API endpoints

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/dashboard/stats
GET    /api/dashboard/charts

GET    /api/employees
GET    /api/employees/search
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id
GET    /api/employees/:id/reportees
PATCH  /api/employees/:id/manager

POST   /api/employees/csv-jobs/import
POST   /api/employees/csv-jobs/export
GET    /api/employees/csv-jobs/:id
GET    /api/employees/csv-template

GET    /api/departments
GET    /api/organization/tree
```

Request examples, response formats, authentication instructions, and Postman testing steps are available in [docs/api.md](docs/api.md).

## Validation and business rules

- Email addresses and employee IDs are unique.
- Required fields, email, phone, salary, and dates are validated by the API.
- Employee IDs cannot be edited.
- Employee self-edit permissions are controlled by backend field configuration.
- HR Managers cannot create, modify, demote, or delete a Super Admin.
- Users cannot perform unsafe self-role changes.
- The last active Super Admin cannot be demoted, disabled, or deleted.
- Reporting relationships cannot point to the same employee or create a cycle.
- Deleted employees use soft deletion and are excluded from normal queries.

## Testing

Run backend unit and API tests:

```bash
cd backend
npm test
```

Run database integration tests against a disposable, migrated PostgreSQL database:

```bash
cd backend
TEST_DATABASE_URL=<test-database-url> npm run test:integration
```

Validate production builds:

```bash
cd backend
npm run build

cd ../frontend
npm run lint
npm run build
```

## Git workflow

- `main` is the stable production and submission branch.
- `develop` is the integration branch.
- New work is created in `feature/<feature-name>` branches.
- Tested feature branches are merged into `develop`.
- Release-ready `develop` is merged into `main` so both remain synchronized.

## Submission checklist

- [ ] Add deployed frontend and backend URLs
- [ ] Add all screenshots under `docs/screenshots/`
- [ ] Add demo video URL, if available
- [ ] Verify API documentation and Postman workflow
- [ ] Run backend tests and database integration tests
- [ ] Run frontend lint and production build
- [ ] Confirm `develop` and `main` are synchronized
- [ ] Verify that no credentials or local environment files are committed

## Author

Add your name, email, portfolio, and GitHub profile here.

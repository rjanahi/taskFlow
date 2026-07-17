# TaskFlow

TaskFlow is an internal work-item management application built for Managers and Members.

Managers can create work items, assign team members, control workflow transitions, review time-extension requests, and monitor deadlines.

Members can view only their assigned work, update progress through permitted workflow actions, request more time, and review the complete activity history.

## Features

### Authentication and authorization

* Register and log in with email and password
* JWT bearer-token authentication
* Manager and Member roles
* Public registration always creates a Member account
* Protected frontend routes
* Server-enforced role and assignment permissions

### Work-item management

* Create, read, update, and delete work items
* Priority, category, description, and due date fields
* Assign one or more Members
* Filter by phase, priority, and assignee
* Member-specific Assigned to Me view
* Automatic overdue calculation

### Controlled workflow

TaskFlow enforces the following workflow:

```text
Backlog
   ↓ assign
Assigned
   ↓ start
In Progress
   ↓ submit for review
In Review
   ├── accept → Done
   └── send back → In Progress
```

Managers may also:

* Cancel active items
* Reopen Done or Cancelled items
* Reassign Members
* Remove all assignees and return an active item to Backlog

Status values cannot be changed directly through the general update endpoint.

### Time-extension requests

* Assigned Members can request a later due date
* Only one pending request is allowed per item
* Managers can approve or reject requests
* Approval updates the work-item due date
* Rejection leaves the due date unchanged
* Decisions are recorded in the activity timeline

### Attachments

* One image attachment per work item
* JPEG, PNG, and WebP support
* Maximum file size of 5 MB
* Private authenticated retrieval
* Manager upload, replacement, and removal
* Member access only when assigned to the item

### Views

* Filterable work-item list
* Six-column Phase Board
* Fourteen-day deadline Timeline
* Highlighted Today marker
* Overdue styling
* Responsive horizontal scrolling
* Loading, error, and empty states

### Activity history

The detail page records actions including:

* Item creation and editing
* Assignment and reassignment
* Workflow transitions
* Time-extension requests and decisions
* Attachment changes

## Technology stack

### Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* TanStack Query
* Vitest
* React Testing Library

### Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT authentication
* Jest
* Supertest

### Infrastructure

* npm workspaces
* Docker Compose
* Separate development and integration-test databases

## Repository structure

```text
taskflow/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   ├── src/
│   │   ├── test/
│   │   └── storage/
│   └── web/
│       └── src/
├── compose.yaml
├── package.json
├── README.md
└── TEST_PLAN.md
```

## Prerequisites

Install:

* Node.js and npm
* Docker Desktop or another Docker environment with Compose
* Git

Confirm the tools are available:

```bash
node --version
npm --version
docker --version
docker compose version
git --version
```

## Environment configuration

### Backend

Copy the example file:

```bash
cp apps/api/.env.example apps/api/.env
```

Example development configuration:

```env
DATABASE_URL="postgresql://taskflow:taskflow_password@localhost:5432/taskflow?schema=public"

JWT_SECRET="replace-with-a-long-random-development-secret"
JWT_EXPIRES_IN="1d"

FRONTEND_URL="http://localhost:3000"
PORT=3001
NODE_ENV="development"
```

Do not commit the real `.env` file.

### Frontend

Copy the frontend example:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Configuration:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## Installation

From the repository root:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Confirm that it is healthy:

```bash
docker compose ps
```

Generate the Prisma client, apply committed migrations, and seed the database:

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
cd ../..
```

## Running the application

Start the API:

```bash
npm run dev:api
```

In a second terminal, start the frontend:

```bash
npm run dev:web
```

Open:

```text
Frontend: http://localhost:3000
API:      http://localhost:3001/api
```

The API watch process remains active after compilation and displays a message similar to:

```text
Found 0 errors. Watching for file changes.
```

That means the development server is still running and waiting for code changes.

## Seeded accounts

### Manager

```text
Email: manager@taskflow.local
Password: Manager123!
```

### Members

```text
member1@taskflow.local
member2@taskflow.local
member3@taskflow.local

Password: Member123!
```

The seeded data includes work items across every phase, an overdue item, assignments, activities, and a pending time-extension request.

## Main routes

```text
/login
/register
/dashboard
/work-items
/work-items/new
/work-items/[id]
/board
/timeline
```

## Main API endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Members

```text
GET /api/users/members
```

### Work items

```text
GET    /api/work-items
POST   /api/work-items
GET    /api/work-items/:id
PATCH  /api/work-items/:id
DELETE /api/work-items/:id
```

### Assignments

```text
PUT /api/work-items/:id/assignees
```

### Workflow actions

```text
POST /api/work-items/:id/actions/start
POST /api/work-items/:id/actions/submit-review
POST /api/work-items/:id/actions/accept
POST /api/work-items/:id/actions/send-back
POST /api/work-items/:id/actions/cancel
POST /api/work-items/:id/actions/reopen
```

### Attachments

```text
POST   /api/work-items/:id/attachment
GET    /api/work-items/:id/attachment
DELETE /api/work-items/:id/attachment
```

### Time extensions

```text
POST /api/work-items/:id/time-extension-requests
GET  /api/time-extension-requests
POST /api/time-extension-requests/:id/approve
POST /api/time-extension-requests/:id/reject
```

## Filtering work items

Managers may filter work items by:

```text
GET /api/work-items?status=IN_PROGRESS
GET /api/work-items?priority=URGENT
GET /api/work-items?assigneeId=<member-uuid>
```

Filters can be combined.

Members receive only items assigned to their authenticated account, regardless of query parameters.

## Overdue calculation

An item is overdue when:

```text
dueDate < current time
```

and its status is neither:

```text
DONE
CANCELLED
```

Overdue state is calculated by the server and returned as `isOverdue`.

It is not stored as a separate database status.

## Tests

### Run all workspace tests

```bash
npm run test
```

### Backend unit tests

```bash
npm run test:unit --workspace=api
```

### Backend integration tests

```bash
npm run test:e2e --workspace=api
```

The integration suite uses the PostgreSQL test service on port `5433`.

### Frontend tests

```bash
npm run test --workspace=web
```

### Frontend watch mode

```bash
npm run test:watch --workspace=web
```

## Build and lint

Run all available workspace lint commands:

```bash
npm run lint
```

Build both applications:

```bash
npm run build
```

## Resetting development data

Run the seed script again:

```bash
npm run prisma:seed --workspace=api
```

The seed script resets the development records before recreating the sample users, work items, assignments, activities, and extension request.

Do not run the development seed script against a production database.

## Stopping the database

Stop containers while retaining their volumes:

```bash
docker compose stop
```

Stop and remove containers:

```bash
docker compose down
```

To also delete local database volumes and all stored data:

```bash
docker compose down --volumes
```

## Security decisions

### Passwords

Passwords are hashed before storage and are never returned through API responses.

### Registration

Public registration always creates a Member. A client cannot register itself as a Manager.

### Authorization

The API checks:

* Authentication
* Required role
* Work-item assignment
* Legal workflow transition
* Ownership and visibility rules

Frontend role checks improve navigation but are not treated as the security boundary.

### Attachments

Uploaded files are checked for:

* Maximum size
* Permitted MIME type
* Supported image content

Files are stored privately and retrieved through an authenticated endpoint.

## Assessment tradeoffs

### JWT storage

The frontend stores the access token in `localStorage` for the scope and time limit of this assessment.

A production version should consider secure HTTP-only cookies, token rotation, refresh-token revocation, and stronger session management.

### One attachment

Each work item supports one image attachment. Uploading another image replaces the existing attachment.

### Board interaction

The Phase Board is a visual workflow view. Actions are performed from the work-item detail page rather than through drag and drop. This keeps every transition explicit and server validated.

### Timeline range

The Timeline displays fourteen days and moves seven days at a time. This keeps one week of context when navigating.

### Date handling

Dates are stored and transferred as UTC timestamps. Browser controls display and accept dates in the user’s local timezone.

## Known future improvements

* HTTP-only cookie authentication
* Refresh tokens and session revocation
* Pagination and server-side text search
* Drag-and-drop board actions
* Multiple attachments
* Notifications
* Audit-log export
* Accessibility audit
* Browser-level end-to-end tests
* Production object storage
* CI deployment pipeline

## Verification

Before submission, run:

```bash
npm install
docker compose up -d --wait postgres postgres_test
npm run lint
npm run test
npm run build
git status --short
```

The final command should show no unintended uncommitted files.

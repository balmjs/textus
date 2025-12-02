# 🏗️ Architecture Overview

This document provides a detailed overview of Textus' architecture, design decisions, and data flow.

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Authentication Flow](#authentication-flow)
- [API Design](#api-design)
- [Frontend Architecture](#frontend-architecture)
- [Deployment Architecture](#deployment-architecture)

## 🏛️ System Architecture

Textus follows a modern **JAMstack architecture** with:

- **Frontend**: Vue 3 SPA (Single Page Application)
- **API Layer**: Edge Functions (Cloudflare Pages / Vercel)
- **Database**: Turso (distributed SQLite)
- **ORM**: Drizzle (type-safe SQL)
- **Authentication**: JWT with HttpOnly cookies

```
┌─────────────────┐
│   Browser       │
│  (Vue 3 SPA)    │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Edge Functions │
│  (CF/Vercel)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Turso DB       │
│  (libSQL)       │
└─────────────────┘
```

## 🔧 Technology Stack

### Frontend

| Technology | Version | Purpose                      |
| ---------- | ------- | ---------------------------- |
| Vue        | 3.5     | UI framework                 |
| Vuetify    | 3.7     | Material Design 3 components |
| TypeScript | 5.7     | Type safety                  |
| Vite       | 6.0     | Build tool & dev server      |
| Pinia      | 2.2     | State management             |
| Vue Router | 4.4     | Client-side routing          |
| SASS       | 1.83    | CSS preprocessing            |

### Backend

| Technology  | Version | Purpose               |
| ----------- | ------- | --------------------- |
| Turso       | Latest  | Database (libSQL)     |
| Drizzle ORM | 0.36    | Type-safe SQL queries |
| bcryptjs    | 2.4     | Password hashing      |
| TypeScript  | 5.7     | Type safety           |

### Deployment

| Platform         | Use Case                             |
| ---------------- | ------------------------------------ |
| Cloudflare Pages | Edge deployment with Pages Functions |
| Vercel           | Serverless deployment with Functions |

## 📁 Project Structure

```
textus/
├── src/                        # Frontend (Vue 3)
│   ├── components/             # Reusable Vue components
│   │   ├── GroupCard.vue       # Display group with sites
│   │   ├── GroupDialog.vue     # Add/edit group modal
│   │   └── SiteDialog.vue      # Add/edit site modal
│   ├── views/                  # Page-level components
│   │   ├── HomeView.vue        # Main navigation view
│   │   └── LoginView.vue       # Authentication page
│   ├── stores/                 # Pinia stores
│   │   ├── auth.ts             # Authentication state
│   │   └── navigation.ts       # Groups/sites state
│   ├── utils/                  # Utility functions
│   │   └── api.ts              # API client
│   ├── types/                  # TypeScript types
│   │   └── index.ts            # Shared type definitions
│   ├── styles/                 # SASS styles
│   │   ├── main.scss           # Global styles
│   │   ├── variables.scss      # SASS variables
│   │   └── settings.scss       # Vuetify settings
│   ├── plugins/                # Vue plugins
│   │   └── vuetify.ts          # Vuetify configuration
│   ├── router/                 # Vue Router
│   │   └── index.ts            # Route definitions
│   ├── App.vue                 # Root component
│   ├── main.ts                 # Application entry
│   └── env.d.ts                # Environment types
│
├── server/                     # Backend service layer
│   ├── db/                     # Database
│   │   ├── schema.ts           # Drizzle schema
│   │   └── client.ts           # Database client
│   ├── api/                    # Business logic
│   │   └── service.ts          # NavigationService class
│   ├── utils/                  # Utilities
│   │   ├── auth.ts             # JWT & bcrypt
│   │   ├── response.ts         # HTTP responses
│   │   └── validation.ts       # Input validation
│   ├── types.ts                # Shared types
│   └── migrate.ts              # Migration runner
│
├── functions/                  # Cloudflare Pages Functions
│   └── api/
│       └── [[path]].ts         # API route handler
│
├── scripts/                    # Utility scripts
│   ├── generate-password.js    # Password hash generator
│   └── seed-data.sql           # Sample data
│
├── drizzle/                    # Generated migrations
├── public/                     # Static assets
├── docs/                       # Documentation
├── dist/                       # Build output
│
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── drizzle.config.ts           # Drizzle Kit config
├── wrangler.toml               # Cloudflare config
├── vercel.json                 # Vercel config
├── eslint.config.js            # ESLint config
├── .prettierrc                 # Prettier config
├── .env.example                # Environment template
└── README.md                   # Main documentation
```

## 🔄 Data Flow

### Read Flow (Guest)

```
User → Vue Component → Pinia Store → API Client → Edge Function
                                                        ↓
                                                   Turso DB
                                                        ↓
                                       Filter isPublic=1 rows
                                                        ↓
                                                   Response
```

### Write Flow (Admin)

```
User → Vue Component → Pinia Store → API Client → Edge Function
                                                        ↓
                                               Verify JWT Token
                                                        ↓
                                                   Turso DB
                                                        ↓
                                            Execute mutation
                                                        ↓
                                                   Response
```

## 🗄️ Database Schema

### Tables

#### `groups`

```sql
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  is_public INTEGER DEFAULT 1,  -- 0=private, 1=public
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### `sites`

```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  notes TEXT,
  order_num INTEGER NOT NULL,
  is_public INTEGER DEFAULT 1,  -- 0=private, 1=public
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
```

#### `configs`

```sql
CREATE TABLE configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships

- **One-to-Many**: `groups` → `sites` (cascade delete)
- **Indexes**: Automatic on primary keys, foreign keys

## 🔐 Authentication Flow

### Login Sequence

```
1. User submits credentials
   ↓
2. Edge Function receives request
   ↓
3. Check rate limit (5 per 15 min)
   ↓
4. Verify username matches env
   ↓
5. Compare password with bcrypt hash
   ↓
6. Generate JWT (7d or 30d expiry)
   ↓
7. Set HttpOnly cookie
   ↓
8. Return success response
```

### Request Authentication

```
1. Client sends request with cookie
   ↓
2. Edge Function extracts JWT
   ↓
3. Verify signature with HMAC-SHA256
   ↓
4. Check expiration timestamp
   ↓
5. Allow/deny request
```

### JWT Structure

```typescript
{
  username: string,
  iat: number,        // Issued at (Unix timestamp)
  exp: number         // Expires at (Unix timestamp)
}
```

Signed with: `HMAC-SHA256(secret, header.payload)`

## 🌐 API Design

### Endpoints

| Method | Endpoint                 | Auth    | Description            |
| ------ | ------------------------ | ------- | ---------------------- |
| POST   | `/api/login`             | No      | Authenticate user      |
| POST   | `/api/logout`            | No      | Clear session          |
| GET    | `/api/auth/status`       | No      | Check auth status      |
| GET    | `/api/groups`            | Guest\* | List groups            |
| POST   | `/api/groups`            | Yes     | Create group           |
| GET    | `/api/groups/:id`        | Guest\* | Get group              |
| PUT    | `/api/groups/:id`        | Yes     | Update group           |
| DELETE | `/api/groups/:id`        | Yes     | Delete group           |
| PUT    | `/api/group-orders`      | Yes     | Batch update orders    |
| GET    | `/api/sites`             | Guest\* | List sites             |
| POST   | `/api/sites`             | Yes     | Create site            |
| GET    | `/api/sites/:id`         | Guest\* | Get site               |
| PUT    | `/api/sites/:id`         | Yes     | Update site            |
| DELETE | `/api/sites/:id`         | Yes     | Delete site            |
| PUT    | `/api/site-orders`       | Yes     | Batch update orders    |
| GET    | `/api/groups-with-sites` | Guest\* | Get all with relations |
| GET    | `/api/configs`           | Guest\* | Get all configs        |
| GET    | `/api/configs/:key`      | Guest\* | Get config             |
| PUT    | `/api/configs/:key`      | Yes     | Update config          |
| GET    | `/api/export`            | Yes     | Export all data        |
| POST   | `/api/import`            | Yes     | Import data            |

\* Guest access allowed if `AUTH_REQUIRED_FOR_READ=false`, shows only `is_public=1` data.

### Response Format

```typescript
{
  success: boolean,
  data?: T,
  message?: string,
  error?: string
}
```

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.vue
├── Router View
    ├── HomeView.vue
    │   ├── GroupCard.vue (×N)
    │   ├── GroupDialog.vue
    │   └── SiteDialog.vue
    └── LoginView.vue
```

### State Management (Pinia)

#### Auth Store

```typescript
{
  isAuthenticated: boolean,
  initialized: boolean,
  loading: boolean,

  actions: {
    login(credentials),
    logout(),
    checkAuth()
  }
}
```

#### Navigation Store

```typescript
{
  groups: GroupWithSites[],
  configs: Record<string, string>,
  loading: boolean,
  error: string | null,

  actions: {
    loadGroups(),
    loadConfigs(),
    addGroup(),
    editGroup(),
    removeGroup(),
    reorderGroups(),
    addSite(),
    editSite(),
    removeSite(),
    reorderSites(),
    updateConfig()
  }
}
```

### Routing

| Route    | Component | Purpose         |
| -------- | --------- | --------------- |
| `/`      | HomeView  | Main navigation |
| `/login` | LoginView | Authentication  |

Router guards check auth status before each navigation.

## 🚀 Deployment Architecture

### Cloudflare Pages

```
GitHub Repo → Cloudflare Pages → Build (Vite) → Deploy
                                        ↓
                                  dist/ (SPA)
                                  functions/ (API)
                                        ↓
                              Cloudflare Edge Network
                                        ↓
                                    Turso DB
```

### Vercel

```
GitHub Repo → Vercel → Build (Vite) → Deploy
                              ↓
                        dist/ (SPA)
                        api/ (Serverless)
                              ↓
                        Vercel Edge Network
                              ↓
                          Turso DB
```

### CDN & Edge

- Static assets served from edge locations
- API requests handled by nearest edge function
- Database queries routed to closest Turso replica

## 🔒 Security Architecture

### Layers

1. **Transport**: HTTPS/TLS 1.3
2. **Authentication**: JWT + bcrypt
3. **Authorization**: Role-based (admin/guest)
4. **Data**: SQL injection prevention (Drizzle ORM)
5. **Rate Limiting**: Login attempts (5/15min)
6. **Input Validation**: All user inputs
7. **Output Encoding**: Vue automatic escaping

### Threat Mitigation

| Threat            | Mitigation                     |
| ----------------- | ------------------------------ |
| XSS               | HttpOnly cookies, Vue escaping |
| SQL Injection     | Drizzle parameterized queries  |
| CSRF              | SameSite cookies               |
| Brute Force       | Rate limiting                  |
| Session Hijacking | Secure cookies, short expiry   |
| Replay Attacks    | JWT expiration                 |

## 📊 Performance Considerations

- **Code Splitting**: Vue Router lazy loading
- **Tree Shaking**: Vite automatic optimization
- **Asset Optimization**: Vite minification
- **Edge Deployment**: Low latency worldwide
- **Database**: SQLite performance, Turso caching
- **Caching**: HTTP cache headers on static assets

## 🧪 Testing Strategy

### Current

- Manual testing in development
- TypeScript compile-time checks
- ESLint static analysis

### Planned

- Unit tests (Vitest)
- Component tests (Vue Test Utils)
- E2E tests (Playwright)
- API integration tests
- Load testing (k6)

## 📈 Scalability

- **Horizontal**: Edge functions auto-scale
- **Vertical**: Turso handles high concurrency
- **Database**: Turso replication across regions
- **Caching**: CDN caching for static assets
- **Rate Limiting**: Prevent abuse

## 🔮 Future Enhancements

- WebSocket support for real-time updates
- GraphQL API option
- Server-side rendering (SSR)
- Progressive Web App (PWA)
- Multi-tenancy support
- Advanced analytics
- Plugin system for extensions

---

For more details, see:

- [README.md](../README.md) - User documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guide

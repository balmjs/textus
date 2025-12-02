# 🛠️ Local Development Guide

This guide will help you set up and run Textus in your local development environment.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Configuration](#detailed-configuration)
- [Troubleshooting](#troubleshooting)
- [Development Commands](#development-commands)

## 🔧 Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **pnpm** - Package manager
   ```bash
   npm install -g pnpm
   ```
3. **Turso Account** - [Sign up](https://turso.tech) (free tier available)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Turso Database

#### Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm get.tur.so/install.ps1 | iex
```

#### Login to Turso

```bash
turso auth login
```

#### Create Database

```bash
# Create a new database
turso db create textus

# Get database URL
turso db show textus --url

# Generate auth token
turso db tokens create textus
```

Save the URL and Token for later use.

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Turso Database Configuration (Required)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# Authentication
AUTH_ENABLED=true
AUTH_USERNAME=admin
# Generate this password hash below
AUTH_PASSWORD=$2a$10$...
# JWT secret (minimum 32 characters)
AUTH_SECRET=your-jwt-secret-key-min-32-chars-here

# Guest Access (Optional)
# false = unauthenticated users can view public content
# true = login required to view any content
AUTH_REQUIRED_FOR_READ=false
```

### 4. Generate Password Hash

Generate a bcrypt hash for your admin password:

```bash
# Method 1: Using Node.js
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"

# Method 2: Using the provided script
node scripts/generate-password.js
```

Copy the generated hash (like `$2a$10$...`) to the `AUTH_PASSWORD` field in `.env`.

### 5. Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated secret to the `AUTH_SECRET` field in `.env`.

### 6. Run Database Migrations

```bash
# Generate migration files
pnpm db:generate

# Execute migrations
pnpm db:migrate
```

You should see:

```
Running migrations...
Migrations completed successfully!
```

### 7. Start Development Server

**Important: You need to start both frontend and backend servers!**

#### Option A: Start Both Servers Together (Recommended)

```bash
pnpm dev:all
```

This starts:

- 🔵 **Frontend** (Vue 3) at `http://localhost:5173`
- 🟢 **API Server** at `http://localhost:8787`

#### Option B: Start Separately (Two Terminal Windows)

**Terminal 1 - Start Frontend:**

```bash
pnpm dev
```

**Terminal 2 - Start API Server:**

```bash
pnpm dev:api
```

### 8. Access the Application

Open your browser and visit: **http://localhost:5173**

Login with the username and password you configured in `.env`.

## 📝 Detailed Configuration

### Environment Variables Explained

| Variable                 | Required | Description                   | Example                             |
| ------------------------ | -------- | ----------------------------- | ----------------------------------- |
| `TURSO_DATABASE_URL`     | ✅       | Turso database URL            | `libsql://my-db.turso.io`           |
| `TURSO_AUTH_TOKEN`       | ✅       | Turso auth token              | `eyJhbGc...`                        |
| `AUTH_ENABLED`           | ❌       | Enable/disable authentication | `true` or `false` (default: `true`) |
| `AUTH_USERNAME`          | ✅       | Admin username                | `admin`                             |
| `AUTH_PASSWORD`          | ✅       | bcrypt hash of password       | `$2a$10$...`                        |
| `AUTH_SECRET`            | ✅       | JWT signing secret            | Minimum 32 characters               |
| `AUTH_REQUIRED_FOR_READ` | ❌       | Require login to view         | `false` (allow guests) or `true`    |

### Complete .env Example

```env
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://textus-myusername.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

# Authentication
AUTH_ENABLED=true
AUTH_USERNAME=admin
AUTH_PASSWORD=$2a$10$YourHashedPasswordHere123456789012
AUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Guest Access
AUTH_REQUIRED_FOR_READ=false
```

## ❓ Troubleshooting

### 1. Frontend Shows but API Errors?

**Error Message:**

```
http://localhost:5173/api/auth/status 500 (Internal Server Error)
Auth check failed: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

**Cause:** You only started the frontend server, not the API server.

**Solution:**

```bash
# Stop current npm run dev
# Then start both frontend and backend
pnpm dev:all
```

Or in another terminal:

```bash
pnpm dev:api
```

### 2. Database Connection Failed

**Error Message:**

```
Error: TURSO_DATABASE_URL is required
```

**Solution:**

1. Ensure `.env` file exists and is configured correctly
2. Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set
3. Test database connection:
   ```bash
   turso db show textus
   ```

### 3. Login Failed

**Possible Causes:**

- Password hash generated incorrectly
- Wrong username or password
- `AUTH_SECRET` misconfigured

**Solution:**

1. Regenerate password hash:
   ```bash
   node scripts/generate-password.js
   ```
2. Ensure `AUTH_SECRET` is at least 32 characters
3. Check `.env` configuration

### 4. drizzle-kit Configuration Error

**Error Message:**

```
Invalid literal value, expected "d1-http"
code: "invalid_union"
```

**Cause:** `drizzle.config.ts` is using an outdated configuration format.

**Solution:**
Ensure `drizzle.config.ts` uses the correct configuration:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso', // ✅ Use 'turso' instead of 'sqlite'
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

**Do not use** the `driver: 'turso'` field - newer versions of drizzle-kit don't require it.

### 5. Database Migration Failed

**Error Message:**

```
Migration failed
```

**Solution:**

1. Verify database URL and Token are correct
2. Check network connection
3. Regenerate migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

### 6. Port Already in Use

**Error Message:**

```
Port 5173 is already in use
```

or

```
Port 8787 is already in use
```

**Solution:**

```bash
# Find and kill process using the port
# macOS/Linux
lsof -ti:5173 | xargs kill -9
lsof -ti:8787 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or modify port numbers in `vite.config.ts` and `server/dev.ts`.

### 7. pnpm Command Not Found

**Solution:**

```bash
# Install pnpm
npm install -g pnpm

# Or use npm instead
npm install
npm run dev:all
```

## 🔨 Development Commands

```bash
# Start both frontend and backend (recommended)
pnpm dev:all

# Start frontend only
pnpm dev

# Start API server only
pnpm dev:api

# Build for production
pnpm build

# Preview production build
pnpm preview

# TypeScript type checking
pnpm typecheck

# Lint and auto-fix code
pnpm lint

# Format code
pnpm format

# Generate database migrations
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

## 🎯 Development Workflow

1. **Start development servers**

   ```bash
   pnpm dev:all
   ```

2. **Edit code**
   - Frontend code in `src/` directory
   - API code in `server/` directory
   - Hot reload enabled

3. **View database**

   ```bash
   # Open Drizzle Studio
   pnpm db:studio

   # Or use Turso CLI
   turso db shell textus
   ```

4. **Add sample data**

   ```bash
   turso db shell $(grep TURSO_DATABASE_URL .env | cut -d '=' -f2) < scripts/seed-data.sql
   ```

5. **Test build**
   ```bash
   pnpm build
   pnpm preview
   ```

## 🔍 Debugging Tips

### View API Requests

Open browser DevTools (F12):

- **Network** tab: View API requests and responses
- **Console** tab: View frontend errors and logs

### View API Server Logs

The API server outputs detailed logs in the terminal:

```
Textus API Server
======================
✅ Server running on http://localhost:8787
📊 Database: libsql://textus.turso.io
🔐 Auth Enabled: true

🚀 Ready to handle API requests!
```

### Database Queries

```bash
# Connect to database using Turso CLI
turso db shell textus

# View all groups
SELECT * FROM groups;

# View all sites
SELECT * FROM sites;

# Exit
.quit
```

### Use Drizzle Studio

```bash
pnpm db:studio
```

This opens a web interface for visually browsing and editing the database.

## 📚 Related Documentation

- [README.md](../README.md) - Project introduction and quick start
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines

## 💡 Tips

1. **First time setup**: Follow all steps in order
2. **After changing database schema**: Regenerate and run migrations
3. **After changing environment variables**: Restart dev servers
4. **Use `pnpm dev:all`**: Avoid forgetting to start API server
5. **Keep dependencies updated**: `pnpm update`

## 🆘 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Check terminal error messages
3. Check browser console errors
4. Submit an [Issue](https://github.com/superwebmaker/textus/issues)

---

**Happy coding!** 🎉

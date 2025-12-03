# 🚀 Deployment Guide

This guide covers deploying Textus to Cloudflare Pages and Vercel.

## Prerequisites

1. A Turso database (create one at [turso.tech](https://turso.tech))
2. Node.js 18+ and pnpm installed
3. Project built locally: `pnpm build`

## 🟠 Cloudflare Pages Deployment

### Step 1: Install Wrangler

```bash
pnpm add -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

### Step 3: Create Pages Project

```bash
wrangler pages project create textus
```

### Step 4: Configure Environment Variables

Go to Cloudflare Dashboard:

1. Navigate to **Workers & Pages** → **textus** → **Settings** → **Environment variables**
2. Add the following variables:

**Production Environment:**

| Variable                 | Value                       | Description             |
| ------------------------ | --------------------------- | ----------------------- |
| `TURSO_DATABASE_URL`     | `libsql://your-db.turso.io` | Your Turso database URL |
| `TURSO_AUTH_TOKEN`       | `your-token`                | Your Turso auth token   |
| `AUTH_ENABLED`           | `true`                      | Enable authentication   |
| `AUTH_USERNAME`          | `admin`                     | Admin username          |
| `AUTH_PASSWORD`          | `$2a$10$...`                | bcrypt hash of password |
| `AUTH_SECRET`            | `your-secret-32-chars-min`  | JWT signing secret      |
| `AUTH_REQUIRED_FOR_READ` | `false`                     | Allow guest access      |

**Generate password hash:**

```bash
node scripts/generate-password.js
```

### Step 5: Deploy

```bash
pnpm deploy:cf
```

Or manually:

```bash
pnpm build
wrangler pages deploy dist
```

### Step 6: Set Up Custom Domain (Optional)

1. Go to **Custom domains** in Cloudflare Pages
2. Add your domain
3. Follow DNS setup instructions

## 🔺 Vercel Deployment

### Step 1: Install Vercel CLI

```bash
pnpm add -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Project

```bash
vercel link
```

### Step 4: Configure Environment Variables

Add environment variables via CLI:

```bash
vercel env add TURSO_DATABASE_URL
# Enter value: libsql://your-db.turso.io

vercel env add TURSO_AUTH_TOKEN
# Enter value: your-token

vercel env add AUTH_ENABLED
# Enter value: true

vercel env add AUTH_USERNAME
# Enter value: admin

vercel env add AUTH_PASSWORD
# Enter value: $2a$10$... (bcrypt hash)

vercel env add AUTH_SECRET
# Enter value: your-secret-32-chars-min

vercel env add AUTH_REQUIRED_FOR_READ
# Enter value: false
```

Or set them in the Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add all required variables

### Step 5: Deploy

```bash
pnpm deploy:vercel
```

Or:

```bash
vercel --prod
```

### Step 6: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS setup instructions

## 🗄️ Database Setup

### Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create textus

# Get database URL
turso db show textus --url

# Generate auth token
turso db tokens create textus
```

### Run Migrations

Locally (before first deployment):

```bash
# Generate migrations from schema
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Use a strong password (min 12 characters)
- [ ] Generate a secure JWT secret (min 32 random characters)
- [ ] Enable HTTPS (automatic on Cloudflare/Vercel)
- [ ] Set `AUTH_ENABLED=true`
- [ ] Keep `TURSO_AUTH_TOKEN` secret
- [ ] Enable Cloudflare Bot Fight Mode (if using Cloudflare)
- [ ] Set up monitoring/logging

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Build
pnpm build

# Deploy
pnpm deploy:cf  # or pnpm deploy:vercel
```

### Database Migrations

If schema changes:

```bash
# Generate new migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

### Backup Database

```bash
# Export Turso database
turso db shell textus .dump > backup.sql

# Restore from backup
turso db shell textus < backup.sql
```

## 🐛 Troubleshooting

### Build Fails

**Issue:** TypeScript errors during build

**Solution:**

```bash
pnpm typecheck
# Fix reported errors
```

### Database Connection Fails

**Issue:** "Failed to connect to Turso"

**Solution:**

- Verify `TURSO_DATABASE_URL` is correct
- Verify `TURSO_AUTH_TOKEN` is valid
- Check token hasn't expired: `turso db tokens list textus`
- Generate new token: `turso db tokens create textus`

### Authentication Not Working

**Issue:** Can't login after deployment

**Solution:**

- Verify `AUTH_PASSWORD` is a valid bcrypt hash
- Regenerate hash: `node scripts/generate-password.js`
- Check `AUTH_SECRET` is at least 32 characters
- Clear browser cookies and try again

### Pages Functions Not Working (Cloudflare)

**Issue:** API returns 404

**Solution:**

- Verify `functions/` directory is included in deployment
- Check Cloudflare Pages Functions logs
- Ensure `wrangler.toml` is configured correctly

### Vercel Serverless Functions Not Working

**Issue:** API endpoints return errors

**Solution:**

- Check Vercel Function logs
- Verify `vercel.json` rewrites are correct
- Ensure environment variables are set

## 📊 Monitoring

### Cloudflare Analytics

1. Go to **Workers & Pages** → **textus** → **Analytics**
2. Monitor requests, errors, and performance

### Vercel Analytics

1. Go to your project → **Analytics**
2. Monitor visitors, requests, and errors

### Turso Metrics

```bash
turso db show textus
```

View database size, locations, and connection count.

## 🎯 Performance Optimization

### Enable Caching

Add to your `functions/api/[[path]].ts`:

```typescript
// Cache static responses
const response = successResponse(request, data);
response.headers.set('Cache-Control', 'public, max-age=60');
return response;
```

### Optimize Images

Use CDN for site icons:

- [favicon.io](https://favicon.io)
- [Google Favicon Service](https://www.google.com/s2/favicons)
- [DuckDuckGo Icons](https://icons.duckduckgo.com)

### Database Indexing

Indexes are already created by default in `schema.ts`. Monitor query performance:

```bash
turso db shell textus
.explain ON
SELECT * FROM sites WHERE group_id = 1;
```

## 🌐 Custom Domain Setup

### Cloudflare Pages

1. Domain on Cloudflare:
   - Add A record: `@` → Cloudflare Pages IP
   - Add CNAME: `www` → `your-app.pages.dev`

2. External domain:
   - Add CNAME: `@` → `your-app.pages.dev`

### Vercel

1. Any domain:
   - Add A record: `@` → `76.76.19.61`
   - Add CNAME: `www` → `cname.vercel-dns.com`

SSL is automatically provisioned (Let's Encrypt).

## 📞 Support

- **Documentation**: [README.md](../README.md)
- **Issues**: Open an issue on GitHub
- **Turso Support**: [turso.tech/discord](https://turso.tech/discord)
- **Cloudflare Support**: [community.cloudflare.com](https://community.cloudflare.com)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

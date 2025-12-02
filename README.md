# Textus

A modern, elegant navigation management system built with **Vue 3**, **Material Design 3**, and **Turso**. Simple to configure, beautiful to use, and easy to deploy.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![Vuetify](https://img.shields.io/badge/Vuetify-3.7-1867C0?logo=vuetify&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-libSQL-00E699?logo=turso&logoColor=white)

## ✨ Features

- 🎨 **Material Design 3** - Modern, beautiful UI with Vuetify 3
- 🌓 **Dark Mode** - Automatic theme switching
- 🔐 **Secure Authentication** - JWT + bcrypt with HttpOnly cookies
- 👥 **Guest Access** - Public/private content visibility control
- 📱 **Responsive Design** - Works perfectly on all devices
- 🚀 **Edge Deployment** - Deploy to Cloudflare Pages or Vercel
- 💾 **Turso Database** - Fast, distributed SQLite with Drizzle ORM
- 🔍 **Type-Safe** - Full TypeScript support
- 📦 **Import/Export** - Easy data migration
- ⚡ **Lightning Fast** - Built with Vite 6

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- A [Turso](https://turso.tech) account (free tier available)

### 1. Clone and Install

```bash
cd textus
pnpm install
```

### 2. Set Up Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create a database
turso db create textus

# Get database URL and auth token
turso db show textus --url
turso db tokens create textus
```

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Authentication
AUTH_ENABLED=true
AUTH_USERNAME=admin
# Generate with: node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
AUTH_PASSWORD=$2a$10$...
AUTH_SECRET=your-jwt-secret-key-min-32-chars

# Guest Access (optional)
AUTH_REQUIRED_FOR_READ=false
```

### 4. Generate Password Hash

```bash
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
```

Copy the output to `AUTH_PASSWORD` in `.env`.

### 5. Run Database Migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Start Development Server

**Important: You need to start both frontend and backend servers!**

```bash
# Start both frontend and backend (recommended)
pnpm dev:all

# Or start separately
# Terminal 1:
pnpm dev

# Terminal 2:
pnpm dev:api
```

Visit http://localhost:5173 🎉

> 💡 **Having issues?** Check the detailed [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for complete setup steps and troubleshooting.

## 📦 Deployment

### Deploy to Cloudflare Pages

1. **Build the project:**

```bash
pnpm build
```

2. **Login to Cloudflare:**

```bash
wrangler login
```

3. **Create a new Pages project:**

```bash
wrangler pages create textus
```

4. **Set environment variables in Cloudflare Dashboard:**
   - Go to Workers & Pages → Your project → Settings → Environment variables
   - Add all variables from `.env`

5. **Deploy:**

```bash
pnpm deploy:cf
```

### Deploy to Vercel

1. **Install Vercel CLI:**

```bash
pnpm add -g vercel
```

2. **Login:**

```bash
vercel login
```

3. **Set environment variables:**

```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add AUTH_ENABLED
vercel env add AUTH_USERNAME
vercel env add AUTH_PASSWORD
vercel env add AUTH_SECRET
vercel env add AUTH_REQUIRED_FOR_READ
```

4. **Deploy:**

```bash
pnpm deploy:vercel
```

## 🔧 Configuration

### Authentication

- **AUTH_ENABLED**: Enable/disable authentication (`true`/`false`)
- **AUTH_USERNAME**: Admin username
- **AUTH_PASSWORD**: bcrypt hash of admin password
- **AUTH_SECRET**: JWT signing secret (min 32 characters)
- **AUTH_REQUIRED_FOR_READ**: Require auth for viewing content (`true`/`false`)

### Guest Access

When `AUTH_REQUIRED_FOR_READ=false`, unauthenticated users can view content marked as "public". Admins can toggle public/private visibility for each group and site.

## 📖 Usage

### Managing Groups

1. Click "Add Group" to create a navigation category
2. Toggle "Public" to make it visible to guests
3. Use "Edit Order" to rearrange groups by drag-and-drop
4. Click menu (⋮) on group card to edit or delete

### Managing Sites

1. Click the "+" button on a group card to add a site
2. Enter site name, URL, optional icon, and description
3. Toggle "Public" to control guest visibility
4. Click pencil icon to edit, trash icon to delete

### Import/Export

- **Export**: Click menu (⋮) → "Export Data" to download JSON
- **Import**: Click menu (⋮) → "Import Data" to upload JSON
- Import merges data intelligently (groups by name, sites by URL)

## 🛠️ Development

### Project Structure

```
textus/
├── src/                    # Vue 3 frontend
│   ├── components/         # Vue components
│   ├── views/              # Page views
│   ├── stores/             # Pinia stores
│   ├── utils/              # API client & utilities
│   ├── styles/             # SASS styles
│   ├── plugins/            # Vuetify plugin
│   ├── router/             # Vue Router
│   └── types/              # TypeScript types
├── server/                 # Backend service layer
│   ├── db/                 # Drizzle ORM schema
│   ├── api/                # API service
│   └── utils/              # Auth & validation
├── functions/              # Cloudflare Pages Functions
│   └── api/                # API routes
├── drizzle/                # Generated migrations
└── public/                 # Static assets
    ├── textus.svg          # Logo/Favicon
    ├── manifest.json       # PWA manifest
    ├── robots.txt          # Search engine directives
    ├── sitemap.xml         # Site map
    ├── _headers            # Security headers (Netlify/CF)
    └── .htaccess           # Apache configuration
```

### Available Scripts

```bash
pnpm dev           # Start dev server
pnpm build         # Build for production
pnpm preview       # Preview production build
pnpm typecheck     # TypeScript type checking
pnpm lint          # Lint code
pnpm format        # Format code with Prettier

pnpm db:generate   # Generate Drizzle migrations
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Drizzle Studio (DB GUI)

pnpm deploy:cf     # Deploy to Cloudflare Pages
pnpm deploy:vercel # Deploy to Vercel
```

## 🔒 Security

Textus implements comprehensive security measures:

- ✅ JWT authentication with Web Crypto API (HMAC-SHA256)
- ✅ bcrypt password hashing (10 rounds)
- ✅ HttpOnly cookies for token storage (XSS protection)
- ✅ SQL injection prevention (Drizzle ORM parameterized queries)
- ✅ CORS with origin whitelist
- ✅ Login rate limiting (5 attempts per 15 minutes)
- ✅ Request body size limits (1MB max)
- ✅ Input validation and sanitization
- ✅ TypeScript strict mode

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Vue 3](https://vuejs.org/)
- UI powered by [Vuetify 3](https://vuetifyjs.com/) (Material Design 3)
- Database by [Turso](https://turso.tech/)
- ORM by [Drizzle](https://orm.drizzle.team/)
- Icons from [Material Design Icons](https://materialdesignicons.com/)

---

**Made with ❤️ and ☕ by the Textus community**

_Need help? Found a bug? [Open an issue](https://github.com/superwebmaker/textus/issues)_

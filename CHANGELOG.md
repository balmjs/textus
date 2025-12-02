# Changelog

All notable changes to Textus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-27

### 🎉 Initial Release

Complete rewrite of the navigation management system with modern technologies.

### Added

#### Frontend

- Vue 3 with Composition API and `<script setup>` syntax
- Vuetify 3 for Material Design 3 UI components
- TypeScript for type safety
- Pinia for state management
- Vue Router for navigation
- SASS for styling with custom variables
- Dark/light theme toggle
- Responsive design for all devices

#### Backend

- Turso (libSQL) database for data persistence
- Drizzle ORM for type-safe database queries
- JWT authentication with Web Crypto API
- bcrypt password hashing
- HttpOnly cookie-based sessions
- Login rate limiting (5 attempts per 15 minutes)

#### Features

- 🔐 Secure authentication with JWT + bcrypt
- 👥 Guest access mode (public/private content)
- 📱 Fully responsive Material Design 3 UI
- 🌓 Dark/light theme support
- 📦 Import/Export functionality
- 🎨 Customizable groups and sites
- 🔍 Clean, intuitive interface
- ⚡ Fast, edge-deployed

#### Deployment

- Cloudflare Pages Functions support
- Vercel Serverless Functions support
- Comprehensive deployment documentation
- Environment variable configuration
- Database migration system

#### Documentation

- Complete README.md with quick start guide
- Detailed DEPLOYMENT.md for both platforms
- CONTRIBUTING.md for contributors
- Code examples and API documentation
- Security best practices guide

#### Developer Experience

- TypeScript strict mode
- ESLint + Prettier configuration
- Hot module replacement (HMR)
- Vite 6 for fast builds
- Password hash generator script
- Seed data for testing

### Security

- JWT tokens signed with HMAC-SHA256
- bcrypt password hashing (10 rounds)
- HttpOnly cookies prevent XSS attacks
- SQL injection protection via Drizzle ORM
- CORS with origin whitelist
- Request body size limits (1MB)
- Input validation and sanitization
- Login rate limiting

### Changed

- Migrated from React to Vue 3
- Replaced Material UI with Vuetify 3
- Changed from Cloudflare D1 to Turso
- Switched from direct SQL to Drizzle ORM
- Updated from Tailwind CSS to SASS
- Modernized authentication flow
- Improved error handling and logging

### Technical Stack

**Frontend:**

- Vue 3.5
- Vuetify 3.7 (Material Design 3)
- TypeScript 5.7
- Vite 6
- Pinia 2.2
- Vue Router 4.4

**Backend:**

- Turso (libSQL)
- Drizzle ORM 0.36
- bcryptjs 2.4
- TypeScript 5.7

**Deployment:**

- Cloudflare Pages
- Vercel
- Edge Functions

## [Unreleased]

### Planned

- [ ] Drag-and-drop reordering with vuedraggable
- [ ] Search functionality across groups and sites
- [ ] Bulk operations (multi-select)
- [ ] Site health monitoring (check if URLs are alive)
- [ ] Categories/tags for sites
- [ ] User preferences (default theme, compact mode)
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements (ARIA labels, screen reader support)
- [ ] PWA support (offline mode, install prompt)
- [ ] i18n (internationalization)
- [ ] Analytics dashboard
- [ ] API rate limiting per user
- [ ] Webhook integrations
- [ ] Chrome/Firefox bookmark import
- [ ] Export to HTML

### Ideas for Future Versions

- User roles and permissions (multi-user support)
- Sharing groups with specific users
- Activity logs and audit trail
- Backup scheduling
- CLI tool for management
- Mobile app (React Native/Flutter)
- Browser extensions
- Integration with password managers
- Link preview generation
- Automatic favicon fetching
- Custom themes/skins

---

## Version Numbering

- **Major** (X.0.0): Breaking changes, major features
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, small improvements

## How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this changelog and the project.

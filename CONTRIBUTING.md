# 🤝 Contributing to Textus

Thank you for your interest in contributing to Textus! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain a professional and friendly atmosphere

## 🚀 Getting Started

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/superwebmaker/textus.git
cd textus
```

### Install Dependencies

```bash
pnpm install
```

### Set Up Development Environment

1. Copy `.env.example` to `.env`
2. Set up a Turso database (see [DEPLOYMENT.md](docs/DEPLOYMENT.md))
3. Run migrations: `pnpm db:migrate`
4. Start dev server: `pnpm dev`

## 🔄 Development Workflow

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### Test Your Changes

```bash
# Type check
pnpm typecheck

# Lint code
pnpm lint

# Format code
pnpm format

# Build to verify
pnpm build
```

### Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

## 🎨 Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and return values
- Avoid `any` type (use `unknown` if necessary)
- Use interfaces for object shapes

### Vue Components

- Use `<script setup>` syntax
- Define props and emits with TypeScript
- Use composition API (not options API)
- Keep components small and focused

```vue
<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title: string;
  count?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [value: number];
}>();
</script>
```

### SASS/SCSS

- Use variables from `variables.scss`
- Follow BEM naming convention for custom classes
- Prefer Vuetify utilities over custom CSS
- Use scoped styles in components

```vue
<style scoped lang="scss">
@use '@/styles/variables' as *;

.my-component {
  padding: $spacing-md;
  border-radius: $radius-md;

  &__title {
    color: rgb(var(--v-theme-primary));
  }
}
</style>
```

### File Naming

- Components: `PascalCase.vue` (e.g., `GroupCard.vue`)
- Utilities: `camelCase.ts` (e.g., `apiClient.ts`)
- Stores: `camelCase.ts` (e.g., `navigation.ts`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `API_BASE_URL`)

### Code Organization

```
src/
├── components/     # Reusable UI components
├── views/          # Page-level components
├── stores/         # Pinia stores
├── utils/          # Helper functions
├── types/          # TypeScript type definitions
├── composables/    # Vue composables
├── plugins/        # Vue plugins (Vuetify, etc.)
└── styles/         # Global styles
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Examples

```bash
feat(auth): add remember me checkbox
fix(api): correct group ordering endpoint
docs(readme): update deployment instructions
style(components): format with prettier
refactor(stores): simplify navigation store logic
perf(api): optimize database queries
```

### Scope (Optional)

- `auth` - Authentication related
- `api` - API/backend changes
- `ui` - UI/frontend changes
- `db` - Database schema/migrations
- `docs` - Documentation

## 🔀 Pull Request Process

### Before Submitting

1. **Update your branch:**

   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run checks:**

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

3. **Test manually:**
   - Start dev server: `pnpm dev`
   - Test your changes in browser
   - Verify on mobile if UI changes

### Submitting PR

1. Push to your fork:

   ```bash
   git push origin your-branch
   ```

2. Open PR on GitHub

3. Fill in PR template:
   - **Title:** Clear, descriptive summary
   - **Description:** What changes and why
   - **Testing:** How you tested changes
   - **Screenshots:** If UI changes
   - **Breaking changes:** If any

### PR Template Example

```markdown
## Description

Added remember me functionality to login form.

## Changes

- Added `rememberMe` checkbox to LoginView
- Updated JWT expiry logic (7d vs 30d)
- Added tests for token expiry

## Testing

- [ ] Tested login with remember me checked
- [ ] Tested login without remember me
- [ ] Verified token expiry times
- [ ] Tested on mobile viewport

## Screenshots

[Add screenshots here]

## Breaking Changes

None
```

### Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, PR will be merged

## 🧪 Testing

### Manual Testing

```bash
pnpm dev
```

Test these scenarios:

- Login/logout
- Create/edit/delete groups
- Create/edit/delete sites
- Drag-and-drop ordering
- Import/export
- Guest access mode
- Dark/light theme
- Mobile responsiveness

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Future: Automated Tests

We plan to add:

- Unit tests (Vitest)
- Component tests (Vue Test Utils)
- E2E tests (Playwright)

## 🐛 Reporting Bugs

### Before Reporting

1. Search existing issues
2. Try latest version
3. Check if it's already fixed

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

## Screenshots

[Add screenshots]

## Additional Context

Any other relevant information
```

## 💡 Feature Requests

### Before Requesting

1. Search existing feature requests
2. Consider if it fits project scope
3. Think about implementation

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Use Case

Why is this feature needed?

## Proposed Solution

How would you implement it?

## Alternatives Considered

Other approaches you've thought about

## Additional Context

Any other relevant information
```

## 📚 Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vuetify 3 Documentation](https://vuetifyjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Turso Documentation](https://docs.turso.tech/)

## 🎓 Learning Resources

New to Vue or TypeScript?

- [Vue Mastery](https://www.vuemastery.com/)
- [Vue School](https://vueschool.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Material Design 3](https://m3.material.io/)

## 📞 Questions?

- Open a discussion on GitHub
- Join our community (Discord/Slack link)
- Read existing issues and PRs

## 🙏 Thank You!

Your contributions make Textus better for everyone. We appreciate your time and effort! 🎉

# Contributing to Idoneo

Thank you for your interest in contributing to Idoneo! This guide covers code style, conventions, and workflows for development.

---

## Table of Contents

- [Code Style](#code-style)
- [Naming Conventions](#naming-conventions)
- [Commit Guidelines](#commit-guidelines)
- [Adding a New Feature](#adding-a-new-feature)
- [Adding a New Page](#adding-a-new-page)
- [Adding a New Service Function](#adding-a-new-service-function)
- [Adding a New Component](#adding-a-new-component)
- [Testing](#testing)

---

## Code Style

### TypeScript

- **Strict mode enabled**: All code must pass TypeScript strict checks
- **Explicit return types**: All exported functions should have explicit return types
- **No `any`**: Avoid `any` type; use `unknown` or proper typing
- **Interface over type**: Prefer `interface` for object shapes, `type` for unions/primitives

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  nickname: string | null;
}

export function getProfile(userId: string): Promise<UserProfile | null> {
  // ...
}

// ❌ Bad
export function getProfile(userId: any) {
  // ...
}
```

### React

- **Functional components only**: No class components
- **Hooks at top level**: Always call hooks at the top of the component
- **Named exports**: Use named exports for components

```tsx
// ✅ Good
export function ProfileCard({ user }: ProfileCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  return <div>...</div>;
}

// ❌ Bad
export default class ProfileCard extends React.Component {
  // ...
}
```

### CSS / Tailwind

- **Tailwind first**: Use Tailwind utilities for styling
- **CSS variables for theming**: Use `var(--color-name)` for dynamic theme values
- **No inline styles**: Avoid `style={{}}` except for truly dynamic values

```tsx
// ✅ Good
<div className="bg-canvas-light text-text-primary p-4 rounded-card">

// ❌ Bad
<div style={{ backgroundColor: '#F3F5F7', padding: 16 }}>
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProfileCard.tsx` |
| Pages | `page.tsx` in folder | `src/app/profile/page.tsx` |
| Hooks | camelCase with `use` prefix | `useRoleHubData.ts` |
| Services | camelCase with `Service` suffix | `leaderboardService.ts` |
| Types | camelCase | `database.ts` |
| Utilities | camelCase | `utils.ts` |

### Variables & Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_ATTEMPTS`, `API_URL` |
| Functions | camelCase | `fetchUserProfile()` |
| React Components | PascalCase | `ProfileCard` |
| Event Handlers | `handle` prefix | `handleSubmit`, `handleClick` |
| Boolean variables | `is/has/should` prefix | `isActive`, `hasError` |

### Database

| Type | Convention | Example |
|------|------------|---------|
| Tables | snake_case, plural | `quiz_attempts` |
| Columns | snake_case | `created_at`, `user_id` |
| Junction tables | `table1_table2` | `user_badges` |

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance, dependencies |

### Examples

```bash
feat(quiz): add timer pause functionality

fix(leaderboard): correct XP calculation for bonus points

docs(readme): add deployment instructions

refactor(auth): extract session management to hook
```

---

## Adding a New Feature

### End-to-End Checklist

1. **Database** (if needed)
   - [ ] Create migration in `supabase/migrations/`
   - [ ] Update `src/types/database.ts` with new types
   - [ ] Add RLS policies for security

2. **Service Layer**
   - [ ] Add functions to existing service or create new one in `src/lib/`
   - [ ] Add TSDoc comments for all public functions
   - [ ] Handle errors appropriately

3. **UI Components**
   - [ ] Create components in relevant `src/components/` subdirectory
   - [ ] Add file header comment
   - [ ] Export from directory if it's a shared component

4. **Page Integration**
   - [ ] Add/modify page in `src/app/`
   - [ ] Add route in `src/App.tsx` if new page
   - [ ] Connect to service layer

5. **Testing**
   - [ ] Add unit tests for service functions
   - [ ] Manual testing on web and iOS

---

## Adding a New Page

### Step 1: Create Page Component

Create a new folder and `page.tsx` in `src/app/`:

```tsx
// src/app/my-feature/page.tsx

/**
 * @file MyFeaturePage
 * @description Description of what this page does
 * 
 * @route /my-feature
 */

import { useState, useEffect } from 'react';

export default function MyFeaturePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">My Feature</h1>
      {/* Page content */}
    </div>
  );
}
```

### Step 2: Add Route

Add the route in `src/App.tsx`:

```tsx
const MyFeaturePage = React.lazy(() => import('./app/my-feature/page'));

// In Routes
<Route path="/my-feature" element={
  <MainLayout>
    <MyFeaturePage />
  </MainLayout>
} />
```

### Step 3: Add Navigation

Add links to the sidebar or navigation as needed.

---

## Adding a New Service Function

### Step 1: Add to Service File

```typescript
// src/lib/myService.ts

/**
 * Does something useful for the feature.
 * 
 * @param userId - The user's unique identifier
 * @param options - Configuration options
 * @returns The result of the operation
 * @throws {Error} If the user doesn't exist
 * 
 * @example
 * ```ts
 * const result = await myService.doSomething('user-123', { limit: 10 });
 * ```
 */
async function doSomething(
  userId: string, 
  options: DoSomethingOptions
): Promise<DoSomethingResult> {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}

export const myService = {
  doSomething,
};
```

### Step 2: Export from Service

Make sure the service is properly exported and documented.

---

## Adding a New Component

### Step 1: Create Component File

```tsx
// src/components/feature/MyComponent.tsx

/**
 * @file MyComponent
 * @description Brief description of what this component does
 * 
 * @example
 * ```tsx
 * <MyComponent 
 *   title="Hello" 
 *   onAction={handleAction} 
 * />
 * ```
 */

import { useState } from 'react';

interface MyComponentProps {
  /** The title to display */
  title: string;
  /** Callback when action is triggered */
  onAction?: () => void;
  /** Optional CSS class override */
  className?: string;
}

export function MyComponent({ 
  title, 
  onAction, 
  className = '' 
}: MyComponentProps) {
  return (
    <div className={`p-4 rounded-card ${className}`}>
      <h2>{title}</h2>
      <button onClick={onAction}>
        Action
      </button>
    </div>
  );
}
```

### Step 2: Component Guidelines

- **Props interface**: Define above component with JSDoc for each prop
- **Default values**: Use destructuring defaults, not defaultProps
- **Composability**: Accept `className` prop for styling overrides
- **Accessibility**: Include proper ARIA attributes where needed

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run specific file
npm run test -- src/lib/leaderboardService.test.ts
```

### Test Structure

```typescript
// src/lib/myService.test.ts

import { describe, it, expect, vi } from 'vitest';
import { myService } from './myService';

describe('myService', () => {
  describe('doSomething', () => {
    it('should return data for valid user', async () => {
      const result = await myService.doSomething('user-123');
      expect(result).toBeDefined();
    });

    it('should throw for invalid user', async () => {
      await expect(myService.doSomething('invalid'))
        .rejects.toThrow();
    });
  });
});
```

### What to Test

| Priority | What |
|----------|------|
| **High** | Service functions, business logic |
| **Medium** | Custom hooks, utilities |
| **Low** | UI components (covered by manual testing) |

---

## Questions?

Open an issue or reach out to the maintainers.

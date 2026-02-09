# Vue Framework Patterns

Security and quality patterns specific to Vue.js applications.

---

## Security Patterns

### XSS Prevention

| Pattern | Risk | Detection |
|---------|------|-----------|
| `v-html` directive | High | `v-html="userInput"` |
| Dynamic component rendering | Medium | `:is="userComponent"` |
| Template compilation | Critical | `Vue.compile(userTemplate)` |

**Safe Pattern:**
```vue
<!-- BAD -->
<div v-html="userComment"></div>

<!-- GOOD - Vue escapes by default -->
<div>{{ userComment }}</div>

<!-- If HTML needed, sanitize first -->
<script setup>
import DOMPurify from 'dompurify';

const sanitizedHtml = computed(() =>
  DOMPurify.sanitize(props.htmlContent)
);
</script>

<template>
  <div v-html="sanitizedHtml"></div>
</template>
```

### URL Safety

```vue
<!-- BAD -->
<a :href="userUrl">Link</a>

<!-- GOOD -->
<script setup>
const safeUrl = computed(() => {
  try {
    const url = new URL(props.userUrl);
    if (['http:', 'https:'].includes(url.protocol)) {
      return props.userUrl;
    }
  } catch {}
  return '#';
});
</script>

<template>
  <a :href="safeUrl">Link</a>
</template>
```

### Dynamic Components

```vue
<!-- BAD - User can inject any component -->
<component :is="userSelectedComponent" />

<!-- GOOD - Allowlist of components -->
<script setup>
const allowedComponents = {
  'profile': ProfileComponent,
  'settings': SettingsComponent
};

const safeComponent = computed(() =>
  allowedComponents[props.componentName] || DefaultComponent
);
</script>

<template>
  <component :is="safeComponent" />
</template>
```

---

## Type Safety Patterns

### Props Typing (Vue 3 + TypeScript)

```vue
<!-- BAD -->
<script setup>
const props = defineProps(['title', 'count']);
</script>

<!-- GOOD -->
<script setup lang="ts">
interface Props {
  title: string;
  count: number;
  optional?: string;
}

const props = defineProps<Props>();
</script>
```

### Emits Typing

```vue
<!-- BAD -->
<script setup>
const emit = defineEmits(['update', 'delete']);
</script>

<!-- GOOD -->
<script setup lang="ts">
interface Emits {
  (e: 'update', value: string): void;
  (e: 'delete', id: number): void;
}

const emit = defineEmits<Emits>();
</script>
```

### Ref Typing

```typescript
// BAD
const count = ref(0);  // Ref<number> inferred but not explicit
const user = ref(null);  // Ref<null>

// GOOD
const count = ref<number>(0);
const user = ref<User | null>(null);
```

### Composable Return Types

```typescript
// BAD
function useUser() {
  const user = ref(null);
  return { user };
}

// GOOD
interface UseUserReturn {
  user: Ref<User | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchUser: (id: string) => Promise<void>;
}

function useUser(): UseUserReturn {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchUser(id: string) {
    // ...
  }

  return { user, loading, error, fetchUser };
}
```

---

## Linting Patterns

### Component Size

| Metric | Threshold | Action |
|--------|-----------|--------|
| Template lines | >100 | Extract child components |
| Script lines | >200 | Extract composables |
| Props count | >7 | Consider refactoring |

### Reactivity

```typescript
// BAD - Reactivity lost
const { user } = toRefs(props);
const name = user.value.name;  // Not reactive

// GOOD
const { user } = toRefs(props);
const name = computed(() => user.value.name);
```

### Memory Management

```vue
<script setup>
import { onUnmounted } from 'vue';

// Clean up subscriptions
const unsubscribe = store.subscribe((mutation) => {});
onUnmounted(() => unsubscribe());

// Clean up intervals/timeouts
const interval = setInterval(() => {}, 1000);
onUnmounted(() => clearInterval(interval));
</script>
```

---

## Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component | PascalCase | `UserProfile.vue` |
| Composable | camelCase with `use` prefix | `useUserProfile` |
| Props | camelCase | `userName` |
| Events | kebab-case | `@update-user` |

### File Organization

```
components/
  UserProfile/
    UserProfile.vue
    UserProfileHeader.vue
    UserProfileStats.vue
composables/
  useUser.ts
  useAuth.ts
```

---

## What to Skip

- Vite/Vue CLI configuration
- Pinia/Vuex store boilerplate
- Router configuration
- Test utility setup

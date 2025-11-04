# Migration Guide - Adopting SyncSpace Types

This guide helps you migrate existing code to use the new comprehensive type system.

## Quick Start Checklist

- [ ] Replace inline type definitions with imports from `@/types`
- [ ] Add types to API client functions
- [ ] Type component props and state
- [ ] Add types to data fetching hooks
- [ ] Use type guards for error handling
- [ ] Remove duplicate type definitions

## Step-by-Step Migration

### 1. Replace Inline Type Definitions

**Before:**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ user }: { user: User }) {
  // ...
}
```

**After:**
```typescript
import type { User } from '@/types';

function UserProfile({ user }: { user: User }) {
  // ...
}
```

### 2. Type API Calls

**Before:**
```typescript
async function fetchPosts() {
  const response = await fetch('/api/v1/posts');
  const data = await response.json();
  return data.posts;
}
```

**After:**
```typescript
import type { PostsResponse, Post } from '@/types';

async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('/api/v1/posts');
  const data: PostsResponse = await response.json();
  return data.posts;
}
```

### 3. Type Component Props

**Before:**
```typescript
export default function PostCard({ post, user }) {
  // ...
}
```

**After:**
```typescript
import type { Post, User } from '@/types';

interface PostCardProps {
  post: Post;
  user?: User;
  onLike?: (postId: number) => void;
}

export default function PostCard({ post, user, onLike }: PostCardProps) {
  // ...
}
```

### 4. Type useState Hooks

**Before:**
```typescript
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**After:**
```typescript
import type { Post, RequestState } from '@/types';

// Option 1: Individual state
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<ErrorResponse | null>(null);

// Option 2: Combined state (recommended)
const [state, setState] = useState<RequestState<Post[]>>({
  data: null,
  loading: true,
  error: null
});
```

### 5. Type Form Data

**Before:**
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = {
    title: titleRef.current.value,
    description: descriptionRef.current.value
  };
  // ...
}
```

**After:**
```typescript
import type { CreatePostData } from '@/types';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData: CreatePostData = {
    post: {
      title: titleRef.current?.value || '',
      description: descriptionRef.current?.value || ''
    }
  };
  // ...
}
```

### 6. Use Type Guards for Errors

**Before:**
```typescript
try {
  // ...
} catch (error) {
  if (error.error) {
    console.error(error.error);
  } else if (error.errors) {
    console.error(error.errors.join(', '));
  }
}
```

**After:**
```typescript
import type { ErrorResponse } from '@/types';
import { hasSingleError, hasMultipleErrors } from '@/types';

try {
  // ...
} catch (err) {
  const error = err as ErrorResponse;

  if (hasSingleError(error)) {
    console.error(error.error);
  } else if (hasMultipleErrors(error)) {
    console.error(error.errors.join(', '));
  }
}
```

### 7. Type Custom Hooks

**Before:**
```typescript
export function usePosts() {
  const [posts, setPosts] = useState([]);
  // ...
  return { posts };
}
```

**After:**
```typescript
import type { Post, RequestState } from '@/types';

export function usePosts(): RequestState<Post[]> & {
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<RequestState<Post[]>>({
    data: null,
    loading: true,
    error: null
  });

  const refetch = async () => {
    // ...
  };

  return { ...state, refetch };
}
```

### 8. Type Context Providers

**Before:**
```typescript
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ...
}
```

**After:**
```typescript
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // ...
}
```

### 9. Type WebSocket Handlers

**Before:**
```typescript
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.action === 'new_post') {
    // ...
  }
}
```

**After:**
```typescript
import type { PostWebSocketMessage } from '@/types';

socket.onmessage = (event: MessageEvent) => {
  const message: PostWebSocketMessage = JSON.parse(event.data);

  switch (message.action) {
    case 'new_post':
      if (message.post) {
        handleNewPost(message.post);
      }
      break;
    // ...
  }
}
```

### 10. Type Server Components (Next.js)

**Before:**
```typescript
export default async function PostPage({ params }) {
  const response = await fetch(`/api/v1/posts/${params.id}`);
  const data = await response.json();

  return <PostDetail post={data.post} />;
}
```

**After:**
```typescript
import type { PostResponse } from '@/types';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PostPage({ params }: PageProps) {
  const response = await fetch(`/api/v1/posts/${params.id}`);
  const data: PostResponse = await response.json();

  return <PostDetail post={data.post} />;
}
```

## Common Patterns

### Pattern 1: Async State Management
```typescript
import type { Post, RequestState, ErrorResponse } from '@/types';

const [state, setState] = useState<RequestState<Post[]>>({
  data: null,
  loading: true,
  error: null
});

const fetchData = async () => {
  setState(prev => ({ ...prev, loading: true }));

  try {
    const response = await fetch('/api/v1/posts');
    const data: PostsResponse = await response.json();

    setState({
      data: data.posts,
      loading: false,
      error: null
    });
  } catch (err) {
    setState({
      data: null,
      loading: false,
      error: err as ErrorResponse
    });
  }
};
```

### Pattern 2: Form with Validation
```typescript
import type { CreatePostData, FormState } from '@/types';

const [formState, setFormState] = useState<FormState<CreatePostData['post']>>({
  values: {
    title: '',
    description: '',
    picture: ''
  },
  errors: {},
  touched: {},
  isSubmitting: false,
  isValid: false
});
```

### Pattern 3: Optimistic Updates
```typescript
import type { Post, OptimisticUpdate } from '@/types';

const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate<Post>[]>([]);

const addOptimisticPost = (post: Post) => {
  const update: OptimisticUpdate<Post> = {
    id: crypto.randomUUID(),
    type: 'create',
    data: post,
    timestamp: Date.now()
  };

  setOptimisticUpdates(prev => [...prev, update]);
};
```

## Finding Code to Update

Use these commands to find code that needs migration:

```bash
# Find inline User type definitions
grep -r "interface User" components/

# Find untyped useState calls
grep -r "useState()" components/

# Find untyped API calls
grep -r "fetch('/api" components/

# Find untyped async functions
grep -r "async function.*{$" components/
```

## Testing Your Changes

After migration:

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run tests
npm test

# Check specific file
npx tsc --noEmit path/to/file.tsx
```

## Troubleshooting

### Issue: "Cannot find module '@/types'"

**Solution:** Use relative imports if path alias doesn't work:
```typescript
import type { User } from '../../types';
```

### Issue: Type mismatch with API response

**Solution:** Check the actual API response and update types if needed:
```typescript
// Add console.log to inspect actual structure
const data = await response.json();
console.log('API Response:', data);
```

### Issue: "Property does not exist on type"

**Solution:** Use optional chaining or type narrowing:
```typescript
// Before
const userName = user.name;

// After
const userName = user?.name ?? 'Unknown';
```

## Best Practices

1. **Always use `import type`** for type-only imports
2. **Start with core data types** (User, Post, Comment)
3. **Use RequestState** for consistent async handling
4. **Leverage type guards** for runtime type checking
5. **Keep types DRY** - don't duplicate type definitions
6. **Document complex types** with JSDoc comments

## Need Help?

- See `types/README.md` for full documentation
- See `types/QUICK_REFERENCE.md` for common patterns
- See `types/examples.ts` for working examples
- Check `types/index.ts` for all available types

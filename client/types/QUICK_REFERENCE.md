# Quick Reference - SyncSpace Types

## Most Commonly Used Types

### Authentication
```typescript
import type { LoginCredentials, RegisterData, AuthResponse } from '@/types';

const login: LoginCredentials = {
  email: string,
  password: string
};

const register: RegisterData = {
  user: {
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    bio?: string,
    profile_picture?: string
  }
};
```

### Posts
```typescript
import type { Post, CreatePostData, PostsResponse } from '@/types';

const newPost: CreatePostData = {
  post: {
    title: string,
    description: string,
    picture?: string
  },
  tags?: string[]
};

// API response
const response: PostsResponse = {
  posts: Post[],
  meta: PaginationMeta
};
```

### Comments
```typescript
import type { Comment, CreateCommentData } from '@/types';

const newComment: CreateCommentData = {
  comment: {
    description: string
  }
};
```

### Reactions
```typescript
import type { ReactionType, ToggleReactionData } from '@/types';

const reactionTypes: ReactionType = 'like' | 'love' | 'dislike';

const reaction: ToggleReactionData = {
  reaction_type: ReactionType
};
```

### User Management
```typescript
import type { User, UserProfile, UpdateUserData } from '@/types';

const update: UpdateUserData = {
  user: {
    name?: string,
    profile_picture?: string,
    bio?: string
  }
};
```

### Error Handling
```typescript
import type { ErrorResponse } from '@/types';
import { hasSingleError, hasMultipleErrors } from '@/types';

const error: ErrorResponse = {
  error?: string,
  errors?: string[]
};

// Type guards
if (hasSingleError(error)) {
  console.error(error.error);
}
if (hasMultipleErrors(error)) {
  console.error(error.errors);
}
```

### Request State
```typescript
import type { RequestState } from '@/types';

const state: RequestState<Post[]> = {
  data: Post[] | null,
  loading: boolean,
  error: ErrorResponse | null
};
```

### Pagination
```typescript
import type { PaginationParams, PaginationMeta } from '@/types';

const params: PaginationParams = {
  page?: number,
  per_page?: number
};

const meta: PaginationMeta = {
  current_page: number,
  per_page: number,
  total_count: number,
  total_pages: number
};
```

## Import Patterns

### Type-only imports (recommended)
```typescript
import type { User, Post } from '@/types';
```

### Multiple types
```typescript
import type {
  User,
  Post,
  Comment,
  Reaction,
  Tag
} from '@/types';
```

### Type guards (runtime)
```typescript
import {
  isCommentNotifiable,
  isReactionNotifiable,
  hasSingleError,
  hasMultipleErrors
} from '@/types';
```

## Common Patterns

### Fetch with types
```typescript
import type { PostsResponse } from '@/types';

const response = await fetch('/api/v1/posts');
const data: PostsResponse = await response.json();
```

### Component props
```typescript
import type { Post, User } from '@/types';

interface PostCardProps {
  post: Post;
  currentUser?: User;
}
```

### State management
```typescript
import { useState } from 'react';
import type { Post, RequestState } from '@/types';

const [posts, setPosts] = useState<RequestState<Post[]>>({
  data: null,
  loading: true,
  error: null
});
```

### Form handling
```typescript
import type { CreatePostData } from '@/types';

const handleSubmit = async (data: CreatePostData) => {
  const response = await fetch('/api/v1/posts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

## Full Documentation

For complete documentation with examples, see:
- **types/README.md** - Full documentation
- **types/examples.ts** - Working code examples
- **types/index.ts** - All type definitions

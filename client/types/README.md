# SyncSpace Type Definitions

Comprehensive TypeScript type definitions for the SyncSpace frontend application, matching the Rails backend API structure.

## Overview

This file contains **68 type definitions** organized into logical sections:

- **Core Domain Models**: User, Post, Comment, Reaction, Tag, Notification
- **API Response Types**: Structured responses from all API endpoints
- **Form Data Types**: Input types for creating/updating resources
- **WebSocket Types**: Real-time update message structures
- **Utility Types**: Helper types for forms, requests, and UI state
- **Type Guards**: Runtime type checking functions

## Usage

### Importing Types

```typescript
// Import specific types
import type { User, Post, Comment } from '@/types';

// Import with alias
import type { User as UserType } from '@/types';

// Import type guards
import { isCommentNotifiable, hasSingleError } from '@/types';
```

### Example: Fetching Posts

```typescript
import type { PostsResponse, Post } from '@/types';

async function fetchPosts(page: number = 1): Promise<Post[]> {
  const response = await fetch(`/api/v1/posts?page=${page}`);
  const data: PostsResponse = await response.json();
  return data.posts;
}
```

### Example: Creating a Post

```typescript
import type { CreatePostData, PostMutationResponse } from '@/types';

async function createPost(data: CreatePostData): Promise<PostMutationResponse> {
  const response = await fetch('/api/v1/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Usage
const postData: CreatePostData = {
  post: {
    title: 'My New Post',
    description: 'This is a great post about TypeScript!',
    picture: 'https://example.com/image.jpg',
  },
  tags: ['typescript', 'nextjs', 'react'],
};

const result = await createPost(postData);
console.log(result.post.id); // Type-safe access
```

### Example: Handling Errors

```typescript
import type { ErrorResponse } from '@/types';
import { hasSingleError, hasMultipleErrors } from '@/types';

async function handleApiCall() {
  try {
    const response = await fetch('/api/v1/posts');
    if (!response.ok) {
      const error: ErrorResponse = await response.json();

      if (hasSingleError(error)) {
        console.error('Error:', error.error);
      } else if (hasMultipleErrors(error)) {
        console.error('Errors:', error.errors.join(', '));
      }
    }
  } catch (err) {
    console.error('Network error:', err);
  }
}
```

### Example: React Component with Types

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { Post, PostsResponse, RequestState } from '@/types';

export default function PostsList() {
  const [state, setState] = useState<RequestState<Post[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadPosts() {
      try {
        const response = await fetch('/api/v1/posts');
        const json: PostsResponse = await response.json();

        setState({
          data: json.posts,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: { message: 'Failed to load posts' },
        });
      }
    }

    loadPosts();
  }, []);

  if (state.loading) return <div>Loading...</div>;
  if (state.error) return <div>Error: {state.error.message}</div>;
  if (!state.data) return <div>No posts found</div>;

  return (
    <div>
      {state.data.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.description}</p>
          <div>
            <span>{post.reactions_count} reactions</span>
            <span>{post.comments_count} comments</span>
          </div>
        </article>
      ))}
    </div>
  );
}
```

### Example: Form with Validation

```typescript
import { useState } from 'react';
import type { FormState, CreatePostData } from '@/types';

export default function CreatePostForm() {
  const [formState, setFormState] = useState<FormState<CreatePostData['post']>>({
    values: {
      title: '',
      description: '',
      picture: '',
    },
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: formState.values }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Example: WebSocket Integration

```typescript
import { useEffect } from 'react';
import type { PostWebSocketMessage, Post } from '@/types';

export function usePostUpdates(onUpdate: (post: Post) => void) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/cable');

    ws.onmessage = (event) => {
      const message: PostWebSocketMessage = JSON.parse(event.data);

      switch (message.action) {
        case 'new_post':
        case 'update_post':
          if (message.post) {
            onUpdate(message.post);
          }
          break;
        case 'delete_post':
          // Handle deletion
          break;
      }
    };

    return () => ws.close();
  }, [onUpdate]);
}
```

## Type Categories

### Core Models
- `User`, `UserProfile`, `UserBasic`, `UserStats`
- `Post`, `PostSummary`
- `Comment`, `CommentBasic`
- `Reaction`, `ReactionCounts`, `ReactionSummary`
- `Tag`
- `Notification`, `NotifiableData`

### API Responses
- `PostsResponse`, `PostResponse`
- `CommentsResponse`
- `NotificationsResponse`
- `AuthResponse`
- `ErrorResponse`
- `SuccessResponse`

### Form Data
- `RegisterData`, `LoginCredentials`
- `CreatePostData`, `UpdatePostData`
- `CreateCommentData`, `UpdateCommentData`
- `ToggleReactionData`
- `ForgotPasswordData`, `ResetPasswordData`

### Utility Types
- `PaginationMeta`, `PaginatedResponse<T>`
- `RequestState<T>`
- `FormState<T>`
- `OptimisticUpdate<T>`

### Type Guards
- `isCommentNotifiable()`
- `isReactionNotifiable()`
- `hasSingleError()`
- `hasMultipleErrors()`

## Best Practices

1. **Always use `import type`** for type-only imports to ensure they're erased at runtime:
   ```typescript
   import type { User } from '@/types';  // ✓ Correct
   import { User } from '@/types';       // ✗ Avoid
   ```

2. **Use type guards** for narrowing union types:
   ```typescript
   if (isCommentNotifiable(notification.notifiable)) {
     // TypeScript knows this is CommentNotifiable
     console.log(notification.notifiable.post_id);
   }
   ```

3. **Leverage utility types** for partial updates:
   ```typescript
   import type { PartialBy } from '@/types';

   type OptionalPicture = PartialBy<Post, 'picture'>;
   ```

4. **Use RequestState** for consistent async handling:
   ```typescript
   const [posts, setPosts] = useState<RequestState<Post[]>>({
     data: null,
     loading: true,
     error: null,
   });
   ```

## Maintenance

This file is synchronized with the Rails backend API. When the backend changes:

1. Update model types to match new fields
2. Update response types to match controller responses
3. Add new form data types for new endpoints
4. Update WebSocket types for new channels
5. Run `npx tsc --noEmit` to verify no type errors

## Contributing

When adding new types:
- Follow existing naming conventions
- Add JSDoc comments for complex types
- Group related types together
- Export all public types
- Add type guards for union types when needed

/**
 * Type Definition Examples
 *
 * This file demonstrates correct usage of SyncSpace types.
 * It serves as both documentation and a compilation test.
 *
 * NOTE: This file is for reference only and should not be imported in production code.
 */

import type {
  // Core Models
  User,
  UserProfile,
  Post,
  Comment,
  Reaction,
  Tag,
  Notification,
  // API Responses
  PostsResponse,
  AuthResponse,
  ErrorResponse,
  // Form Data
  CreatePostData,
  LoginCredentials,
  RegisterData,
  // Utility Types
  RequestState,
  FormState,
  PaginationParams,
  // Type Guards
  ReactionType,
  NotificationType,
} from './index';

import {
  isCommentNotifiable,
  isReactionNotifiable,
  hasSingleError,
  hasMultipleErrors,
} from './index';

// ============================================================================
// EXAMPLE 1: User Authentication
// ============================================================================

const loginCredentials: LoginCredentials = {
  email: 'user@example.com',
  password: 'securePassword123',
};

const registrationData: RegisterData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    password_confirmation: 'password123',
    bio: 'Software developer passionate about TypeScript',
    profile_picture: 'https://example.com/avatar.jpg',
  },
};

const authResponse: AuthResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  user: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    profile_picture: 'https://example.com/avatar.jpg',
    bio: 'Software developer',
    confirmed: true,
    created_at: '2024-01-01T00:00:00Z',
  },
};

// ============================================================================
// EXAMPLE 2: Working with Posts
// ============================================================================

const createPostData: CreatePostData = {
  title: 'Introduction to TypeScript',
  description: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
  picture: 'https://example.com/typescript.jpg',
  tag_ids: [1, 2, 3], // Tag IDs
};

const post: Post = {
  id: 1,
  title: 'Introduction to TypeScript',
  description: 'TypeScript is a typed superset of JavaScript...',
  picture: 'https://example.com/typescript.jpg',
  user: {
    id: 1,
    name: 'John Doe',
    profile_picture: 'https://example.com/avatar.jpg',
    email: 'john@example.com',
  },
  tags: [
    { id: 1, name: 'typescript', color: '#3178c6' },
    { id: 2, name: 'javascript', color: '#f7df1e' },
  ],
  reactions_count: 42,
  comments_count: 15,
  last_three_comments: [
    {
      id: 1,
      description: 'Great post!',
      user: {
        id: 2,
        name: 'Jane Smith',
        profile_picture: 'https://example.com/jane.jpg',
      },
      created_at: '2024-01-02T10:00:00Z',
    },
  ],
  created_at: '2024-01-01T12:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
};

const postsResponse: PostsResponse = {
  posts: [post],
  meta: {
    current_page: 1,
    per_page: 10,
    total_count: 1,
    total_pages: 1,
  },
};

// ============================================================================
// EXAMPLE 3: Comments and Reactions
// ============================================================================

const comment: Comment = {
  id: 1,
  description: 'This is a very helpful explanation of TypeScript benefits!',
  commentable_type: 'Post',
  commentable_id: 1,
  user: {
    id: 2,
    name: 'Jane Smith',
    profile_picture: 'https://example.com/jane.jpg',
    email: 'jane@example.com',
  },
  reactions_count: 5,
  replies_count: 2,
  replies: [
    {
      id: 2,
      description: 'I agree! TypeScript is amazing.',
      commentable_type: 'Comment',
      commentable_id: 1,
      user: {
        id: 3,
        name: 'Bob Johnson',
        profile_picture: 'https://example.com/bob.jpg',
        email: 'bob@example.com',
      },
      reactions_count: 1,
      replies_count: 0,
      created_at: '2024-01-02T11:00:00Z',
      updated_at: '2024-01-02T11:00:00Z',
    },
  ],
  created_at: '2024-01-02T10:00:00Z',
  updated_at: '2024-01-02T10:00:00Z',
};

const reaction: Reaction = {
  id: 1,
  reaction_type: 'love',
  user: {
    id: 1,
    name: 'John Doe',
    profile_picture: 'https://example.com/avatar.jpg',
    email: 'john@example.com',
  },
  reactionable_type: 'Post',
  reactionable_id: 1,
  created_at: '2024-01-01T13:00:00Z',
};

// ============================================================================
// EXAMPLE 4: Notifications
// ============================================================================

const notification: Notification = {
  id: 1,
  notification_type: 'comment_on_post',
  read: false,
  actor: {
    id: 2,
    name: 'Jane Smith',
    profile_picture: 'https://example.com/jane.jpg',
  },
  notifiable: {
    type: 'Comment',
    id: 1,
    description: 'This is a very helpful explanation...',
    post_id: 1,
  },
  created_at: '2024-01-02T10:00:00Z',
};

// Using type guards with notifications
if (isCommentNotifiable(notification.notifiable)) {
  // Comment on post: notification.notifiable.post_id
}

if (isReactionNotifiable(notification.notifiable)) {
  // Reaction type: notification.notifiable.reaction_type
}

// ============================================================================
// EXAMPLE 5: Error Handling
// ============================================================================

const singleError: ErrorResponse = {
  error: 'Invalid email or password',
};

const multipleErrors: ErrorResponse = {
  errors: [
    'Name is too short (minimum is 2 characters)',
    'Email has already been taken',
    'Password is too short (minimum is 6 characters)',
  ],
};

// Using type guards for error handling
function handleError(error: ErrorResponse): string {
  if (hasSingleError(error)) {
    return error.error;
  } else if (hasMultipleErrors(error)) {
    return error.errors.join(', ');
  }
  return 'An unknown error occurred';
}

// ============================================================================
// EXAMPLE 6: Request State Management
// ============================================================================

const loadingState: RequestState<Post[]> = {
  data: null,
  loading: true,
  error: null,
};

const successState: RequestState<Post[]> = {
  data: [post],
  loading: false,
  error: null,
};

const errorState: RequestState<Post[]> = {
  data: null,
  loading: false,
  error: {
    error: 'Failed to fetch posts',
  },
};

// ============================================================================
// EXAMPLE 7: Form State Management
// ============================================================================

const postFormState: FormState<CreatePostData> = {
  values: {
    title: 'My New Post',
    description: 'This is the content of my post',
    picture: 'https://example.com/image.jpg',
  },
  errors: {
    title: undefined,
    description: undefined,
    picture: undefined,
    tag_ids: undefined,
  },
  touched: {
    title: true,
    description: true,
    picture: false,
    tag_ids: false,
  },
  isSubmitting: false,
  isValid: true,
};

// ============================================================================
// EXAMPLE 8: Pagination
// ============================================================================

const paginationParams: PaginationParams = {
  page: 2,
  per_page: 20,
};

// ============================================================================
// EXAMPLE 9: Type Constraints
// ============================================================================

// Reaction types are constrained to specific values
const validReactionTypes: ReactionType[] = ['like', 'love', 'dislike'];

// Notification types are constrained
const validNotificationTypes: NotificationType[] = [
  'comment_on_post',
  'reply_to_comment',
  'mention',
  'reaction_on_post',
  'reaction_on_comment',
];

// ============================================================================
// EXAMPLE 10: User Profiles
// ============================================================================

const userProfile: UserProfile = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  profile_picture: 'https://example.com/avatar.jpg',
  bio: 'Software developer passionate about TypeScript',
  confirmed: true,
  created_at: '2024-01-01T00:00:00Z',
  stats: {
    total_posts: 42,
    total_reactions: 156,
    total_comments: 89,
  },
};

// ============================================================================
// EXAMPLE 11: Tags
// ============================================================================

const tag: Tag = {
  id: 1,
  name: 'typescript',
  color: '#3178c6',
  posts_count: 25,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ============================================================================
// NOTES
// ============================================================================

/*
 * All examples above demonstrate:
 * 1. Correct type usage
 * 2. Required vs optional fields
 * 3. Nested object structures
 * 4. Type guard usage
 * 5. Union type handling
 * 6. Array types
 * 7. Enum-like string literal types
 *
 * These examples serve as a reference for developers working with the API.
 */

export {};

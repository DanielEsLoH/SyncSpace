/**
 * SyncSpace Frontend Type Definitions
 *
 * Comprehensive TypeScript types matching the Rails backend API structure.
 * All types are based on the API responses from /server/app/controllers/api/v1/
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Supported reaction types for posts and comments
 */
export type ReactionType = 'like' | 'love' | 'dislike';

/**
 * Types of entities that can receive reactions
 */
export type ReactionableType = 'Post' | 'Comment';

/**
 * Types of entities that can receive comments
 */
export type CommentableType = 'Post' | 'Comment';

/**
 * Types of entities that can trigger notifications
 */
export type NotifiableType = 'Comment' | 'Reaction' | 'Post';

/**
 * Notification types matching backend NOTIFICATION_TYPES constant
 */
export type NotificationType =
  | 'comment_on_post'
  | 'reply_to_comment'
  | 'mention'
  | 'reaction_on_post'
  | 'reaction_on_comment';

/**
 * User theme preferences
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Supported languages
 */
export type Language = 'en' | 'es' | 'fr' | 'de';

// ============================================================================
// CORE DOMAIN MODELS
// ============================================================================

/**
 * User model - represents a registered user in the system
 * Based on /server/app/models/user.rb
 */
export interface User {
  id: number;
  name: string;
  email: string;
  profile_picture: string;
  bio?: string | null;
  confirmed?: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Extended user profile with statistics
 * Used in profile pages and detailed user views
 */
export interface UserProfile extends User {
  stats: UserStats;
}

/**
 * User statistics for profile display
 */
export interface UserStats {
  total_posts: number;
  total_reactions: number;
  total_comments: number;
}

/**
 * Minimal user representation for nested objects
 * Used within posts, comments, and reactions to avoid deep nesting
 */
export interface UserBasic {
  id: number;
  name: string;
  profile_picture: string;
  email?: string;
}

/**
 * Tag model - categorical labels for posts
 * Based on /server/app/models/tag.rb
 */
export interface Tag {
  id: number;
  name: string;
  color: string; // Hex color format: #RRGGBB
  posts_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Post model - main content entity
 * Based on /server/app/models/post.rb and posts_controller response
 */
export interface Post {
  id: number;
  title: string;
  description: string;
  picture?: string | null;
  user?: UserBasic | null; // Made optional for defensive coding
  tags: Tag[];
  reactions_count: number;
  comments_count: number;
  last_three_comments: CommentBasic[];
  user_reaction?: Reaction | null;
  created_at: string;
  updated_at: string;
}

/**
 * Post summary - abbreviated post for list views
 * Used in user profile post lists
 */
export interface PostSummary {
  id: number;
  title: string;
  description: string; // Truncated to 150 chars
  picture?: string | null;
  tags: Tag[];
  reactions_count: number;
  comments_count: number;
  created_at: string;
}

/**
 * Comment model - user feedback on posts or other comments
 * Based on /server/app/models/comment.rb and comments_controller response
 */
export interface Comment {
  id: number;
  description: string;
  commentable_type: CommentableType;
  commentable_id: number;
  user: UserBasic;
  reactions_count: number;
  replies_count: number;
  replies?: Comment[]; // Nested replies for threaded comments
  user_reaction?: Reaction | null;
  created_at: string;
  updated_at: string;
}

/**
 * Minimal comment representation for post previews
 */
export interface CommentBasic {
  id: number;
  description: string;
  user: Pick<UserBasic, 'id' | 'name' | 'profile_picture'>;
  created_at: string;
}

/**
 * Reaction model - user sentiment on posts or comments
 * Based on /server/app/models/reaction.rb
 */
export interface Reaction {
  id: number;
  reaction_type: ReactionType;
  user: UserBasic;
  reactionable_type: ReactionableType;
  reactionable_id: number;
  created_at: string;
}

/**
 * Aggregated reaction counts for an entity
 * Used in reaction summaries
 */
export interface ReactionCounts {
  like: number;
  love: number;
  dislike: number;
}

/**
 * Reaction summary including user's own reactions
 */
export interface ReactionSummary {
  reactions: ReactionCounts;
  user_reactions: ReactionType[];
}

/**
 * Notification model - system alerts for user activity
 * Based on /server/app/models/notification.rb and notifications_controller response
 */
export interface Notification {
  id: number;
  notification_type: NotificationType;
  read: boolean;
  actor: Pick<UserBasic, 'id' | 'name' | 'profile_picture'>;
  notifiable: NotifiableData | null; // Can be null if the associated content was deleted
  created_at: string;
}

/**
 * Polymorphic notifiable data
 */
export type NotifiableData = CommentNotifiable | ReactionNotifiable | PostNotifiable;

/**
 * Comment notifiable payload
 */
export interface CommentNotifiable {
  type: 'Comment';
  id: number;
  description: string; // Truncated to 100 chars
  post_id: number;
}

/**
 * Reaction notifiable payload
 */
export interface ReactionNotifiable {
  type: 'Reaction';
  id: number;
  reaction_type: ReactionType;
  reactionable_type: ReactionableType;
  reactionable_id: number;
}

/**
 * Post notifiable payload (for mentions in posts)
 */
export interface PostNotifiable {
  type: 'Post';
  id: number;
  title: string;
  description: string; // Truncated to 100 chars
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard pagination metadata returned by all paginated endpoints
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Posts index response
 */
export interface PostsResponse {
  posts: Post[];
  meta: PaginationMeta;
}

/**
 * Single post response
 */
export interface PostResponse {
  post: Post;
}

/**
 * Comments list response
 */
export interface CommentsResponse {
  comments: Comment[];
}

/**
 * Notifications list response
 */
export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  meta: PaginationMeta;
}

/**
 * User profile response
 */
export interface UserResponse {
  user: UserProfile;
}

/**
 * User posts list response
 */
export interface UserPostsResponse {
  posts: PostSummary[];
  meta: PaginationMeta;
}

/**
 * Authentication response (login, register, confirm email)
 */
export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

/**
 * Generic success message response
 */
export interface SuccessResponse {
  message: string;
}

/**
 * Post creation/update success response
 */
export interface PostMutationResponse {
  message: string;
  post: Post;
}

/**
 * Comment creation/update success response
 */
export interface CommentMutationResponse {
  message: string;
  comment: Comment;
}

/**
 * Reaction toggle response
 */
export interface ReactionToggleResponse {
  action: 'added' | 'removed' | 'changed';
  message: string;
  reactions_count: number;
  user_reaction: Reaction | null;
}

/**
 * Notification mark as read response
 */
export interface NotificationReadResponse {
  message: string;
  notification: Notification;
}

/**
 * API error response structure
 */
export interface ErrorResponse {
  error?: string;
  errors?: string[];
  message?: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * User registration form data
 */
export interface RegisterData {
  user: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    profile_picture?: string;
    bio?: string;
  };
}

/**
 * User login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User profile update data
 */
export interface UpdateUserData {
  user: {
    name?: string;
    profile_picture?: string;
    bio?: string;
  };
}

/**
 * Post creation form data
 */
export interface CreatePostData {
  title: string;
  description: string;
  picture?: File | string;
  tags?: string[]; // Array of tag names
}

/**
 * Post update form data
 */
export interface UpdatePostData {
  title?: string;
  description?: string;
  picture?: File | string;
  tags?: string[]; // Array of tag names
}

/**
 * Comment creation form data
 */
export interface CreateCommentData {
  comment: {
    description: string;
  };
}

/**
 * Comment update form data
 */
export interface UpdateCommentData {
  comment: {
    description: string;
  };
}

/**
 * Reaction toggle request data
 */
export interface ToggleReactionData {
  reaction_type: ReactionType;
}

/**
 * Forgot password request data
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Reset password request data
 */
export interface ResetPasswordData {
  token: string;
  password: string;
  password_confirmation: string;
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

/**
 * WebSocket message base structure
 */
export interface WebSocketMessage<T = unknown> {
  action: string;
  data?: T;
}

/**
 * Post channel WebSocket message types
 */
export type PostChannelAction = 'new_post' | 'update_post' | 'delete_post';

export interface PostWebSocketMessage {
  action: PostChannelAction;
  post?: Post;
  post_id?: number; // For delete action
}

/**
 * Comment channel WebSocket message types
 */
export type CommentChannelAction = 'new_comment' | 'update_comment' | 'delete_comment';

export interface CommentWebSocketMessage {
  action: CommentChannelAction;
  comment?: Comment;
  comment_id?: number; // For delete action
}

/**
 * Notification channel WebSocket message
 */
export interface NotificationWebSocketMessage {
  action: 'new_notification';
  notification: Notification;
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

/**
 * Posts filter parameters
 */
export interface PostsFilterParams extends PaginationParams {
  user_id?: number;
}

/**
 * Notifications filter parameters
 */
export interface NotificationsFilterParams extends PaginationParams {
  unread?: boolean;
  read?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API request state for UI management
 */
export interface RequestState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
}

/**
 * Optimistic update state for real-time features
 */
export interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
}

/**
 * Form field error type
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Form validation state
 */
export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string | undefined>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Sort direction for lists
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort options for posts
 */
export type PostSortBy = 'created_at' | 'reactions_count' | 'comments_count';

/**
 * Filter options for posts
 */
export interface PostFilters {
  user_id?: number;
  tag_ids?: number[];
  search?: string;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Search result types
 */
export type SearchResultType = 'all' | 'posts' | 'users' | 'tags';

/**
 * Search sort options
 */
export type SearchSortBy = 'relevance' | 'date' | 'popularity';

/**
 * Date range filter for search
 */
export interface DateRangeFilter {
  from?: string; // ISO date string
  to?: string; // ISO date string
}

/**
 * Advanced search filters
 */
export interface SearchFilters {
  query: string;
  type: SearchResultType;
  sortBy: SearchSortBy;
  dateRange?: DateRangeFilter;
  tags?: number[]; // Tag IDs to filter by
  page?: number;
  per_page?: number;
}

/**
 * Search result for posts
 */
export interface PostSearchResult extends Post {
  relevance_score?: number;
  matched_fields?: string[]; // Fields that matched the search
}

/**
 * Search result for users
 */
export interface UserSearchResult extends User {
  relevance_score?: number;
  posts_count?: number;
}

/**
 * Search result for tags
 */
export interface TagSearchResult extends Tag {
  relevance_score?: number;
}

/**
 * Aggregated search results
 */
export interface SearchResults {
  posts: PostSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  counts: {
    posts: number;
    users: number;
    tags: number;
    total: number;
  };
  meta?: PaginationMeta;
}

/**
 * Search response from API
 */
export interface SearchResponse {
  results: SearchResults;
  query: string;
  filters: SearchFilters;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if notifiable is a Comment
 */
export function isCommentNotifiable(
  notifiable: NotifiableData | null
): notifiable is CommentNotifiable {
  return notifiable !== null && notifiable.type === 'Comment';
}

/**
 * Type guard to check if notifiable is a Reaction
 */
export function isReactionNotifiable(
  notifiable: NotifiableData | null
): notifiable is ReactionNotifiable {
  return notifiable !== null && notifiable.type === 'Reaction';
}

/**
 * Type guard for PostNotifiable
 */
export function isPostNotifiable(
  notifiable: NotifiableData | null
): notifiable is PostNotifiable {
  return notifiable !== null && notifiable.type === 'Post';
}

/**
 * Type guard to check if an error response has a single error
 */
export function hasSingleError(error: ErrorResponse): error is { error: string } {
  return 'error' in error && typeof error.error === 'string';
}

/**
 * Type guard to check if an error response has multiple errors
 */
export function hasMultipleErrors(error: ErrorResponse): error is { errors: string[] } {
  return 'errors' in error && Array.isArray(error.errors);
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract the data type from a paginated response
 */
export type UnwrapPaginated<T> = T extends PaginatedResponse<infer U> ? U : never;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract the success data from an API response
 */
export type ApiData<T> = T extends { data: infer U } ? U : T;

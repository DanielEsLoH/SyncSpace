/**
 * Application constants
 * Centralized configuration values to avoid magic numbers throughout the codebase
 */

// ============================================================================
// FILE UPLOAD LIMITS
// ============================================================================

export const FILE_LIMITS = {
  /** Maximum file size for post images (10MB) */
  MAX_POST_IMAGE_SIZE: 10 * 1024 * 1024,
  /** Maximum file size for profile pictures (5MB) */
  MAX_PROFILE_IMAGE_SIZE: 5 * 1024 * 1024,
  /** Allowed image MIME types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PER_PAGE: 10,
  /** Number of notifications per page */
  NOTIFICATIONS_PER_PAGE: 20,
  /** Number of comments per page */
  COMMENTS_PER_PAGE: 10,
} as const;

// ============================================================================
// OPTIMISTIC UI
// ============================================================================

export const OPTIMISTIC = {
  /**
   * Threshold to identify optimistic IDs
   * IDs greater than this are considered optimistic (temporary)
   */
  ID_THRESHOLD: 1_000_000_000,
} as const;

// ============================================================================
// TIMING
// ============================================================================

export const TIMING = {
  /** Debounce delay for search inputs (ms) */
  DEBOUNCE_DELAY: 300,
  /** API request timeout (ms) */
  API_TIMEOUT: 30000,
  /** Toast notification duration (ms) */
  TOAST_DURATION: 5000,
  /** Animation stagger delay (ms) */
  STAGGER_DELAY: 75,
} as const;

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

export const VALIDATION = {
  /** Minimum characters for name */
  NAME_MIN_LENGTH: 2,
  /** Maximum characters for name */
  NAME_MAX_LENGTH: 50,
  /** Maximum characters for bio */
  BIO_MAX_LENGTH: 500,
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 8,
  /** Maximum post title length */
  POST_TITLE_MAX_LENGTH: 100,
  /** Maximum post description length */
  POST_DESCRIPTION_MAX_LENGTH: 2000,
  /** Minimum search query length for tag search */
  TAG_SEARCH_MIN_LENGTH: 2,
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'syncspace_token',
  AUTH_USER: 'syncspace_user',
} as const;

// ============================================================================
// API ENDPOINTS (for reference)
// ============================================================================

export const API_ENDPOINTS = {
  POSTS: '/posts',
  USERS: '/users',
  TAGS: '/tags',
  NOTIFICATIONS: '/notifications',
  COMMENTS: '/comments',
} as const;

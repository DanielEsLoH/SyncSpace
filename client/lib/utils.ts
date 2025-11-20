import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// USER UTILITIES
// ============================================================================

/**
 * Get initials from a user's name
 * @param name - The user's full name
 * @returns Two-letter initials (e.g., "JD" for "John Doe")
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Standardized API error interface
 */
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      errors?: string[];
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract error message from API error response
 * @param error - The caught error object
 * @param defaultMessage - Fallback message if no error message found
 * @returns The error message string
 */
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  const apiError = error as ApiError;
  return (
    apiError?.response?.data?.error ||
    apiError?.response?.data?.message ||
    apiError?.response?.data?.errors?.[0] ||
    apiError?.message ||
    defaultMessage
  );
}

// Format date to relative time (e.g., "2 hours ago")
export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// Format full date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

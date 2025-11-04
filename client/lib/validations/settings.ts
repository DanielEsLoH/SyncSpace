import * as z from 'zod';

/**
 * Settings Form Validation Schemas
 *
 * Comprehensive Zod schemas for all settings-related forms.
 * These ensure type safety and runtime validation with user-friendly error messages.
 */

// ============================================================================
// PROFILE SETTINGS SCHEMA
// ============================================================================

/**
 * Profile update validation schema
 *
 * Validates:
 * - Name: Required, 2-50 characters
 * - Bio: Optional, max 500 characters
 * - Profile Picture: Valid URL or empty string
 */
export const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  profile_picture: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ============================================================================
// PASSWORD CHANGE SCHEMA
// ============================================================================

/**
 * Password change validation schema
 *
 * Validates:
 * - Current password: Min 8 characters
 * - New password: Min 8 chars, must contain uppercase, lowercase, and number
 * - Confirmation: Must match new password
 *
 * Password strength requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter (A-Z)
 * - Contains at least one lowercase letter (a-z)
 * - Contains at least one number (0-9)
 */
export const passwordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'Current password is required')
      .min(8, 'Current password must be at least 8 characters'),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    password_confirmation: z
      .string()
      .min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

// ============================================================================
// PASSWORD STRENGTH CALCULATION
// ============================================================================

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Calculate password strength
 *
 * Analyzes password based on:
 * - Length (8+ chars)
 * - Character variety (uppercase, lowercase, numbers, special chars)
 * - Complexity (mix of different character types)
 *
 * @param password - Password to analyze
 * @returns Strength level and score (0-4)
 */
export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
} {
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Determine strength level
  let strength: PasswordStrength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'good';
  else if (score >= 2) strength = 'fair';

  return { strength, score };
}

/**
 * Get password strength color for UI display
 *
 * @param strength - Password strength level
 * @returns Tailwind color class
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  const colors = {
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500',
  };
  return colors[strength];
}

/**
 * Get password strength text for UI display
 *
 * @param strength - Password strength level
 * @returns Human-readable strength text
 */
export function getPasswordStrengthText(strength: PasswordStrength): string {
  const texts = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };
  return texts[strength];
}

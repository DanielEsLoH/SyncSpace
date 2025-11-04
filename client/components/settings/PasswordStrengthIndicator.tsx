'use client';

import { useMemo } from 'react';
import {
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  type PasswordStrength,
} from '@/lib/validations/settings';

interface PasswordStrengthIndicatorProps {
  password: string;
  showText?: boolean;
}

/**
 * PasswordStrengthIndicator Component
 *
 * Visual indicator showing password strength with:
 * - Color-coded strength bar
 * - Strength level text (Weak, Fair, Good, Strong)
 * - Animated progress bar
 * - Accessibility labels
 */
export function PasswordStrengthIndicator({
  password,
  showText = true,
}: PasswordStrengthIndicatorProps) {
  const { strength, score } = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  // Don't show indicator if password is empty
  if (!password) {
    return null;
  }

  const colorClass = getPasswordStrengthColor(strength);
  const strengthText = getPasswordStrengthText(strength);
  const percentage = (score / 5) * 100;

  const textColorClass = {
    weak: 'text-red-600',
    fair: 'text-yellow-600',
    good: 'text-blue-600',
    strong: 'text-green-600',
  }[strength];

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-label={`Password strength: ${strengthText}`}
        />
      </div>

      {/* Strength Text and Requirements */}
      {showText && (
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${textColorClass}`}>
            {strengthText} password
          </span>
          <span className="text-xs text-muted-foreground">
            {score}/5 requirements
          </span>
        </div>
      )}

      {/* Password Requirements Checklist */}
      {password && (
        <div className="space-y-1 pt-1">
          <PasswordRequirement
            met={password.length >= 8}
            text="At least 8 characters"
          />
          <PasswordRequirement
            met={/[A-Z]/.test(password)}
            text="One uppercase letter"
          />
          <PasswordRequirement
            met={/[a-z]/.test(password)}
            text="One lowercase letter"
          />
          <PasswordRequirement
            met={/[0-9]/.test(password)}
            text="One number"
          />
          <PasswordRequirement
            met={/[^A-Za-z0-9]/.test(password)}
            text="One special character (optional)"
          />
        </div>
      )}
    </div>
  );
}

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-1.5 w-1.5 rounded-full transition-colors ${
          met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />
      <span
        className={`text-xs transition-colors ${
          met
            ? 'text-green-600 dark:text-green-500'
            : 'text-muted-foreground'
        }`}
      >
        {text}
      </span>
    </div>
  );
}

/**
 * Internationalization configuration constants
 * Shared between server, client, and middleware
 */

export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

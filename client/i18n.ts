import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { defaultLocale } from './lib/i18n-config';

// Re-export for backward compatibility
export { locales, defaultLocale, type Locale, LOCALE_COOKIE_NAME } from './lib/i18n-config';

/**
 * next-intl configuration for App Router
 *
 * This function is called for each request to load the appropriate
 * translation messages for the given locale.
 *
 * The locale is read from the x-locale header set by middleware.
 */
export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

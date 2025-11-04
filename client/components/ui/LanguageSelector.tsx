'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALE_COOKIE_NAME } from '@/lib/i18n-config';

/**
 * LanguageSelector Component
 *
 * Provides a dropdown menu to switch between supported languages (English/Spanish).
 * Uses cookie-based locale switching (no URL changes).
 */
export function LanguageSelector() {
  const router = useRouter();
  const currentLocale = useLocale();

  const switchLocale = (locale: string) => {
    // Set the locale cookie
    Cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      sameSite: 'lax',
      expires: 365, // 1 year
    });

    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLocale('en')}
          className={currentLocale === 'en' ? 'bg-accent' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale('es')}
          className={currentLocale === 'es' ? 'bg-accent' : ''}
        >
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

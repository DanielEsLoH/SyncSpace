import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncSpace - Share Ideas, Connect, React",
  description: "A modern social platform for sharing ideas, discussing topics, and reacting in real-time.",
};

/**
 * Root Layout
 *
 * This is the outermost layout that provides the HTML structure
 * and global providers (theme, auth, i18n, etc.)
 *
 * IMPORTANT: Internationalization is now handled at the root level
 * using cookies instead of URL segments. No [locale] folder needed.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load messages for the current locale (detected from cookies)
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Suppress React performance measurement errors in development
                if (typeof window !== 'undefined') {
                  const originalMeasure = window.performance.measure.bind(window.performance);
                  window.performance.measure = function(...args) {
                    try {
                      return originalMeasure(...args);
                    } catch (error) {
                      if (error.message && error.message.includes('negative time stamp')) {
                        // Silently suppress this error
                        return;
                      }
                      throw error;
                    }
                  };
                }
              `,
            }}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

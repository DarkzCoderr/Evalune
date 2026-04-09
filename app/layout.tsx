/**
 * Global Neutralization: Fixes broken localStorage in some Node environments.
 * This ensures that server-side code (and libraries) correctly identify that
 * they are NOT in a browser environment.
 */
const globalWithMaybeLocalStorage = globalThis as unknown as {
  localStorage?: Storage;
};
if (
  typeof globalThis !== 'undefined' &&
  globalWithMaybeLocalStorage.localStorage &&
  typeof globalWithMaybeLocalStorage.localStorage.getItem !== 'function'
) {
  delete globalWithMaybeLocalStorage.localStorage;
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ClerkThemeProvider from '@/components/ClerkThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/contexts/ThemeContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Evalune - Virtual Interviewer',
  description:
    'AI-powered virtual interviewer app with intelligent insights, smart analysis, and personalized interview recommendations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const hasLS = typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function';
                  const savedTheme = hasLS ? localStorage.getItem('theme') : null;
                  const theme = savedTheme || 
                    (window.matchMedia && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.error('Theme detection failed:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300`}
      >
        <ThemeProvider>
          <ClerkThemeProvider>
            <Navbar />
            {children}
            <Footer />
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

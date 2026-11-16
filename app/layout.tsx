import type { Metadata, Viewport } from 'next';
// Self-hosted fonts (design language §4): no Google Fonts calls at runtime.
import '@fontsource-variable/mona-sans/standard.css';
import '@fontsource/open-runde/latin-400.css';
import '@fontsource/open-runde/latin-500.css';
import '@fontsource/open-runde/latin-600.css';
import '@fontsource/open-runde/latin-700.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './globals.css';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'SDE Tracker · Striver 180 in Java',
  description: "Local-first practice tracker for Striver's 180 DSA patterns: 25-minute solo attempts, gated hints, and a from-scratch re-solve two days later.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EEE8DA' },
    { media: '(prefers-color-scheme: dark)', color: '#121110' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint, so there's no flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

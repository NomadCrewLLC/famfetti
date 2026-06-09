import type { Metadata } from 'next';

import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';

import '@/global.css';

export const metadata: Metadata = {
  title: 'Famfetti',
  description: 'Family events and reminders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-display">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

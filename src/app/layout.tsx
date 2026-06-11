import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Metadata } from 'next';

import { AuthProvider } from '@/components/auth-provider';
import { theme } from '@/theme';

// Mantine's stylesheets have to land before global.css — that ordering is what
// lets our variable overrides win.
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@/global.css';

export const metadata: Metadata = {
  title: 'Famfetti',
  description: 'Family events and reminders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          <AuthProvider>{children}</AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}

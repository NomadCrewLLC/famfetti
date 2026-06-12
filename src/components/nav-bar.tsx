'use client';

import { Anchor, Group } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/notifications', label: 'Alerts' },
  { href: '/settings', label: 'Settings' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <Group
      component="nav"
      justify="center"
      gap="lg"
      px="lg"
      py="md"
      style={{ borderBottom: '1px solid var(--color-background-selected)' }}
    >
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Anchor
            key={link.href}
            component={Link}
            href={link.href}
            underline="never"
            fw={active ? 600 : 400}
            c={active ? undefined : 'dimmed'}
          >
            {link.label}
          </Anchor>
        );
      })}
    </Group>
  );
}

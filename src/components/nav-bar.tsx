'use client';

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
    <nav className="flex items-center justify-center gap-four border-b border-background-selected bg-background px-four py-three">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? 'font-semibold text-text' : 'text-text-secondary'}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

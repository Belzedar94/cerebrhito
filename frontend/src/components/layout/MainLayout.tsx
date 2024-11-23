import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div>
      <header>
        <ThemeToggle />
      </header>
      <main>{children}</main>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthContext';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/activities', label: 'Activities' },
    { href: '/ai-assistant', label: 'AI Assistant' },
    { href: '/development', label: 'Development' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-card text-card-foreground">
        <div className="p-4">
          <h1 className="text-2xl font-bold">CerebrHito</h1>
        </div>
        <nav className="mt-8">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 hover:bg-accent hover:text-accent-foreground ${
                router.pathname === item.href
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold">
              {getPageTitle(router.pathname)}
            </h2>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user && (
                <>
                  <span>{user.email}</span>
                  <Button variant="outline" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/activities':
      return 'Activities';
    case '/ai-assistant':
      return 'AI Assistant';
    case '/development':
      return 'Development';
    default:
      return 'CerebrHito';
  }
}

export default MainLayout;

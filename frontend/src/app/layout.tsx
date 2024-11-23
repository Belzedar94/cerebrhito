import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StoreProvider } from '@/providers/StoreProvider';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CerebrHito - AI-Powered Child Development Assistant',
  description: 'Track and support child development with AI-powered insights and personalized guidance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full bg-gray-50">
      <body className={`h-full ${inter.className}`}>
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}


import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/AuthContext';
import '@/styles/globals.css';

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
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Geist, Noto_Sans_Tamil } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import InputBehavior from '@/components/InputBehavior';

const geist = Geist({ subsets: ['latin'] });
const notoSansTamil = Noto_Sans_Tamil({ 
  subsets: ['tamil'], 
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-tamil'
});

export const metadata: Metadata = {
  title: 'Kaikari Kadai - Vegetable Billing',
  description: 'Vegetable vendor billing and customer management',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} ${notoSansTamil.variable} bg-gray-50 min-h-screen`}>
        <Navigation />
        <InputBehavior />
        <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}

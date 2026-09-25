import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/mona-sans/standard.css';
import '@fontsource-variable/mona-sans/standard-italic.css';
import { site } from '@/content/site';
import './globals.css';

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#120d09',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

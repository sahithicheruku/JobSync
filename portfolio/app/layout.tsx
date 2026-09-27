import type { Metadata } from 'next';
import './globals.css';
import { profile } from '@/data/content';
const title = `${profile.name} | Software Engineer · Full Stack · AI`;
const description = 'Software engineering portfolio featuring full-stack applications, backend systems, applied AI, and cloud deployment. Explore the JobSync engineering case study and technical skills.';
export const metadata: Metadata = {
  metadataBase: profile.siteUrl ? new URL(profile.siteUrl) : undefined,
  title, description,
  openGraph: { title, description, type: 'website', ...(profile.siteUrl ? { url: '/', images: [{ url: '/jobsync-dashboard.png', alt: 'Featured project: JobSync application dashboard' }] } : {}) },
  twitter: { card: 'summary', title, description },
  robots: { index: profile.readyToPublish, follow: profile.readyToPublish },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

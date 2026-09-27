import type { Metadata } from 'next';
import { profile } from '@/data/content';
import { About, Contact, Footer, Hero, Navbar, Projects, Skills } from '@/components/Portfolio';
export const metadata: Metadata = { alternates: profile.siteUrl ? { canonical: '/' } : undefined };
export default function Home() {
  return <><a className="skip-link" href="#main">Skip to content</a><Navbar /><main id="main" tabIndex={-1}><Hero /><About /><Projects /><Skills /><Contact /></main><Footer /></>;
}

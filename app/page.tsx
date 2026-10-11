'use client';

import dynamic from 'next/dynamic';
import { CursorAppSkeleton } from '@/components/AppShell';

// Dynamic import with ssr: false guarantees zero hydration mismatch for browser-only IndexedDB/Dexie state
const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => <CursorAppSkeleton />
});

export default function Home() {
  return <AppShell />;
}

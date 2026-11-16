'use client';

import dynamic from 'next/dynamic';
import { AppSkeleton } from '@/components/AppSkeleton';

// IndexedDB only exists in the browser, so the app renders client-side only.
const AppShell = dynamic(() => import('@/components/AppShell'), { ssr: false, loading: () => <AppSkeleton /> });

export default function Home() {
  return <AppShell />;
}

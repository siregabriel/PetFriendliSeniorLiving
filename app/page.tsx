// app/page.tsx — Server Component
import { Suspense } from 'react';
import ContenidoPrincipal from './ContenidoPrincipal';
import HomepageTeaser from '@/components/HomepageTeaser';

export default function Home() {
  return (
    <>
      <Suspense>
        <ContenidoPrincipal />
      </Suspense>
      <HomepageTeaser />
    </>
  );
}

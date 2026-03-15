// app/page.tsx — Server Component
import ContenidoPrincipal from './ContenidoPrincipal';
import HomepageTeaser from '@/components/HomepageTeaser';

export default function Home() {
  return (
    <>
      <ContenidoPrincipal />
      <HomepageTeaser />
    </>
  );
}

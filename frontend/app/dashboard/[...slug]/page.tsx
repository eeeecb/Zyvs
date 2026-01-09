import { notFound } from 'next/navigation';

/**
 * Rota catch-all para capturar todas as rotas inexistentes
 * dentro de /dashboard/* e acionar o not-found.tsx personalizado
 */
export default function CatchAllPage() {
  notFound();
}

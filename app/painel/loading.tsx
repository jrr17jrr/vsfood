import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mostrado só na área de conteúdo (sidebar/topbar/StoreStatusBar continuam
 * montados — layout persiste entre navegações no App Router) enquanto a
 * page.tsx da rota busca dados. Também é o que o Next.js usa como limite de
 * prefetch: com isso, o clique num link da sidebar já mostra algo na hora em
 * vez de tela parada.
 */
export default function PainelLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

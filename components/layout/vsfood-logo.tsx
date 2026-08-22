import { cn } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";

export function VsfoodLogo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white shadow-sm">
        <UtensilsCrossed className="size-4" strokeWidth={2.5} />
      </span>
      {!iconOnly && (
        <span className="text-lg">
          VS<span className="text-primary">Food</span>
        </span>
      )}
    </span>
  );
}

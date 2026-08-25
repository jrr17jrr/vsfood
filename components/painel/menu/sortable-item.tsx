"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wrapper de um item dentro de <SortableList>. O handle (GripVertical) é o
 * ÚNICO elemento com os listeners de drag — clicar em qualquer outro botão
 * do item (editar, excluir, switches) nunca inicia um arraste.
 */
export function SortableItem({
  id,
  children,
  className,
  handleClassName,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  handleClassName?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-start gap-1", isDragging && "z-10 opacity-70", className)}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          "mt-2 shrink-0 touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing",
          handleClassName,
        )}
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

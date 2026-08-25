"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

/**
 * Lista reordenável genérica (categorias, produtos, grupos ou opções) — um
 * DndContext independente por lista, sem cruzar itens entre listas
 * diferentes. Mantém uma cópia local da ordem pra já refletir o drop
 * imediatamente na tela, sem esperar o revalidatePath() do server action;
 * volta a sincronizar com `items` sempre que os dados "de verdade" mudam
 * (troca de props vindas do server).
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  children,
  className,
}: {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  children: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  // "Adjust state when a prop changes" sem useEffect (evita o
  // setState-dentro-de-effect que causa um render em cascata extra) — ver
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  // `items` só muda de referência quando o server manda dados novos
  // (revalidatePath), nunca por causa de um re-render local.
  const [prevItems, setPrevItems] = useState(items);
  const [localItems, setLocalItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setLocalItems(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localItems.findIndex((i) => i.id === active.id);
    const newIndex = localItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(next);
    onReorder(next.map((i) => i.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>{localItems.map((item, index) => children(item, index))}</div>
      </SortableContext>
    </DndContext>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOptionGroupAction } from "@/lib/actions/painel/menu";
import type { OptionGroupInput } from "@/lib/validations/menu";
import type { MenuOptionGroup } from "@/lib/data/menu";
import { OptionGroupCard, NEW_GROUP_NAME } from "./option-group-card";

const DEFAULT_GROUP_INPUT: OptionGroupInput = {
  name: NEW_GROUP_NAME,
  required: false,
  minSelect: 0,
  maxSelect: 1,
  pricingMode: "per_option",
  freeQuantity: 0,
  fixedPrice: 0,
};

export function OptionGroupsEditor({ productId, groups }: { productId: string; groups: MenuOptionGroup[] }) {
  const router = useRouter();

  async function handleCreateGroup() {
    const result = await createOptionGroupAction(productId, DEFAULT_GROUP_INPUT);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Grupos de adicionais</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Organize os complementos que o cliente pode escolher neste produto — ponto da carne, molhos, adicionais...
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Nenhum grupo de adicionais ainda.
        </p>
      ) : (
        <div className="space-y-2.5">
          {groups.map((group) => (
            <OptionGroupCard key={group.id} group={group} onChange={() => router.refresh()} />
          ))}
        </div>
      )}

      <Button type="button" variant="outline" className="w-full" onClick={handleCreateGroup}>
        <Plus className="size-4" />
        Novo grupo de adicionais
      </Button>
    </div>
  );
}

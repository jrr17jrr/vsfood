"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { RestaurantCard } from "./restaurant-card";
import type { MarketplaceRestaurant } from "@/lib/data/marketplace";

export function MarketplaceGrid({ restaurants }: { restaurants: MarketplaceRestaurant[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of restaurants) if (r.cuisine_type) set.add(r.cuisine_type);
    return Array.from(set).sort();
  }, [restaurants]);

  const filtered = restaurants.filter((r) => {
    const matchesQuery =
      query.trim().length === 0 ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.cuisine_type?.toLowerCase().includes(query.toLowerCase()) ?? false);
    const matchesCategory = !category || r.cuisine_type === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <div>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar restaurante ou tipo de comida..."
          className="pl-9"
        />
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              category === null ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                category === c ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="font-medium text-foreground">Nenhum restaurante encontrado</p>
          <p className="mt-1 text-sm">Tente buscar por outro nome ou categoria.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}

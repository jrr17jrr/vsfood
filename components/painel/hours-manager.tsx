"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAY_LABELS } from "@/lib/opening-hours";
import { saveOpeningHoursAction } from "@/lib/actions/painel/hours";
import type { OpeningHour } from "@/types/database";

type Period = { opensAt: string; closesAt: string };

export function HoursManager({ openingHours }: { openingHours: OpeningHour[] }) {
  const [byDay, setByDay] = useState<Period[][]>(() =>
    WEEKDAY_LABELS.map((_, weekday) =>
      openingHours
        .filter((h) => h.weekday === weekday)
        .sort((a, b) => a.opens_at.localeCompare(b.opens_at))
        .map((h) => ({ opensAt: h.opens_at.slice(0, 5), closesAt: h.closes_at.slice(0, 5) })),
    ),
  );
  const [saving, setSaving] = useState(false);

  function addPeriod(weekday: number) {
    setByDay((prev) => prev.map((periods, i) => (i === weekday ? [...periods, { opensAt: "18:00", closesAt: "23:00" }] : periods)));
  }

  function removePeriod(weekday: number, index: number) {
    setByDay((prev) => prev.map((periods, i) => (i === weekday ? periods.filter((_, pi) => pi !== index) : periods)));
  }

  function updatePeriod(weekday: number, index: number, patch: Partial<Period>) {
    setByDay((prev) =>
      prev.map((periods, i) => (i === weekday ? periods.map((p, pi) => (pi === index ? { ...p, ...patch } : p)) : periods)),
    );
  }

  async function handleSave() {
    setSaving(true);
    const payload = byDay.flatMap((periods, weekday) => periods.map((p) => ({ weekday, opensAt: p.opensAt, closesAt: p.closesAt })));
    const result = await saveOpeningHoursAction(payload);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Horários salvos.");
  }

  return (
    <div className="space-y-3">
      {WEEKDAY_LABELS.map((label, weekday) => (
        <div key={label} className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{label}</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => addPeriod(weekday)}>
              <Plus className="size-4" />
              Período
            </Button>
          </div>

          {byDay[weekday].length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Fechado</p>
          ) : (
            <div className="mt-2 space-y-2">
              {byDay[weekday].map((period, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={period.opensAt}
                    onChange={(e) => updatePeriod(weekday, index, { opensAt: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">às</span>
                  <Input
                    type="time"
                    value={period.closesAt}
                    onChange={(e) => updatePeriod(weekday, index, { closesAt: e.target.value })}
                    className="w-32"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removePeriod(weekday, index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar horários"}
      </Button>
    </div>
  );
}

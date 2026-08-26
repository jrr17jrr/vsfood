"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updatePrintSettingsAction } from "@/lib/actions/painel/print";
import type { PrintFormat, Restaurant } from "@/types/database";

const FORMAT_LABELS: Record<PrintFormat, string> = { a4: "A4", "80mm": "80mm", "58mm": "58mm" };

export function PrintSettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [printFormat, setPrintFormat] = useState<PrintFormat>(restaurant.print_format);
  const [printCopies, setPrintCopies] = useState(String(restaurant.print_copies));
  const [showPrices, setShowPrices] = useState(restaurant.print_show_prices);
  const [showAddress, setShowAddress] = useState(restaurant.print_show_address);
  const [showPhone, setShowPhone] = useState(restaurant.print_show_phone);
  const [showNotes, setShowNotes] = useState(restaurant.print_show_notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updatePrintSettingsAction({
      printFormat,
      printCopies: Math.min(5, Math.max(1, Math.trunc(Number(printCopies)) || 1)),
      printShowPrices: showPrices,
      printShowAddress: showAddress,
      printShowPhone: showPhone,
      printShowNotes: showNotes,
    });
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Configurações de impressão salvas.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Formato preferido</p>
        <RadioGroup value={printFormat} onValueChange={(v) => setPrintFormat(v as PrintFormat)} className="grid grid-cols-3 gap-2">
          {(Object.keys(FORMAT_LABELS) as PrintFormat[]).map((f) => (
            <Label key={f} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm has-[[data-state=checked]]:border-primary">
              <RadioGroupItem value={f} />
              {FORMAT_LABELS[f]}
            </Label>
          ))}
        </RadioGroup>
        <div className="max-w-40 space-y-1.5">
          <Label htmlFor="print-copies">Número de vias</Label>
          <Input id="print-copies" type="number" min={1} max={5} value={printCopies} onChange={(e) => setPrintCopies(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">O que mostrar na comanda</p>
        <label className="flex items-center justify-between text-sm">
          Mostrar valores
          <Switch checked={showPrices} onCheckedChange={setShowPrices} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Mostrar endereço
          <Switch checked={showAddress} onCheckedChange={setShowAddress} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Mostrar telefone da loja
          <Switch checked={showPhone} onCheckedChange={setShowPhone} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Mostrar observações
          <Switch checked={showNotes} onCheckedChange={setShowNotes} />
        </label>
      </div>

      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}

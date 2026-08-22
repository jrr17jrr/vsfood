import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, orderTimeline } from "@/lib/orders/status";
import type { DeliveryType, OrderStatus } from "@/types/database";

export function OrderTimeline({ status, deliveryType }: { status: OrderStatus; deliveryType: DeliveryType }) {
  if (status === "rejected" || status === "cancelled") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center font-medium text-destructive">
        Pedido {ORDER_STATUS_LABEL[status].toLowerCase()}
      </div>
    );
  }

  const steps = orderTimeline(deliveryType);
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              {!isLast && <div className={cn("w-0.5 flex-1", done ? "bg-primary" : "bg-border")} style={{ minHeight: 28 }} />}
            </div>
            <p className={cn("pb-7 text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
              {ORDER_STATUS_LABEL[step]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

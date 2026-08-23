import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { accessDescriptorLabel, type AccessDescriptor } from "@/lib/restaurant-status";

function variantFor(descriptor: AccessDescriptor): "default" | "secondary" | "destructive" {
  if (descriptor.kind === "demo") return "secondary";
  if (descriptor.kind === "trial") return descriptor.expired ? "destructive" : "secondary";
  if (descriptor.status === "active") return "default";
  return "destructive";
}

export function RestaurantStatusBadge({ descriptor, className }: { descriptor: AccessDescriptor; className?: string }) {
  const variant = variantFor(descriptor);
  return (
    <Badge variant={variant} className={cn(variant === "default" && "bg-primary", className)}>
      {accessDescriptorLabel(descriptor)}
    </Badge>
  );
}

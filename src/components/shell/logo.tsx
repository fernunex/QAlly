import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <CheckIcon className="size-4" strokeWidth={3} aria-hidden />
      </span>
      {compacto ? <span className="sr-only">QAlly</span> : <span className="text-lg">QAlly</span>}
    </span>
  );
}

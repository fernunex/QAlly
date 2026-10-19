import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { iniciales } from "@/lib/format";

/** Avatar con iniciales y nombre del responsable; el nombre siempre acompaña al avatar. */
export function Responsable({ nombre }: { nombre: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm">
      <Avatar size="sm" aria-hidden>
        <AvatarFallback className="bg-primary/15 text-[0.65rem] font-semibold text-primary">
          {iniciales(nombre)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{nombre}</span>
    </span>
  );
}

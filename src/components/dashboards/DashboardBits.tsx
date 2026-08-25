import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarTaxa, taxa, type Contagem } from "@/hooks/useCrmMetrics";
import type { Temperatura } from "@/components/leads/constants";

type Tone = "default" | "positivo" | Temperatura;

const TONE_CLASSES: Record<Tone, string> = {
  default: "text-foreground",
  positivo: "text-emerald-600 dark:text-emerald-400",
  quente: "text-destructive",
  morno: "text-amber-600 dark:text-amber-400",
  frio: "text-sky-600 dark:text-sky-400",
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-semibold tabular-nums ${TONE_CLASSES[tone]}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function BarList({
  title,
  items,
  emptyMessage,
  mostrarConversao = false,
  limite = 8,
}: {
  title: string;
  items: Contagem[];
  emptyMessage: string;
  mostrarConversao?: boolean;
  limite?: number;
}) {
  const visiveis = items.slice(0, limite);
  const maior = visiveis[0]?.total ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {visiveis.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {visiveis.map((item) => (
              <li key={item.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {item.total}
                    {mostrarConversao && <> · {formatarTaxa(taxa(item.convertidos, item.total))} conv.</>}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${maior ? (item.total / maior) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function FiltroSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

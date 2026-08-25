import { supabase } from "@/integrations/supabase/client";

/** Prazo padrao, em dias, para considerar um paciente sem retorno. */
export const DIAS_SEM_RETORNO_PADRAO = 30;

/**
 * Le o prazo de "paciente sem retorno" configurado em Configuracoes -> Geral.
 * Volta ao padrao quando nao houver valor gravado ou o valor for invalido.
 */
export async function getDiasSemRetorno(orgId: string): Promise<number> {
  const { data } = await (supabase as any)
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .maybeSingle();

  const bruto = (data?.settings as Record<string, unknown> | null)?.dias_sem_retorno;
  const dias = Number(bruto);
  if (!Number.isFinite(dias) || dias < 1) return DIAS_SEM_RETORNO_PADRAO;
  return Math.min(365, Math.floor(dias));
}

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PIPELINE_NAME, STAGE_NAMES } from "@/components/leads/constants";

const TEMPERATURA_TAGS = [
  { name: "Quente", color: "#ef4444" },
  { name: "Morno", color: "#f97316" },
  { name: "Frio", color: "#3b82f6" },
];

const OBJECOES_INICIAIS = [
  "Preço",
  "Vai pensar",
  "Falta de tempo",
  "Distância",
  "Quer plano de saúde",
  "Consultou o cônjuge",
  "Sumiu / não respondeu",
];

const STAGE_PROBABILITIES = [10, 30, 60, 100, 0];

/**
 * Garante a configuração inicial do CRM de leads (idempotente):
 * pipeline "Comercial" com 5 etapas, tags de temperatura e objeções padrão.
 * Retorna o id do pipeline comercial.
 */
export async function seedLeadsConfig(orgId: string): Promise<string | null> {
  if (!orgId) return null;

  // 1. Pipeline
  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("name", DEFAULT_PIPELINE_NAME)
    .limit(1);

  let pipelineId = pipelines?.[0]?.id ?? null;

  if (!pipelineId) {
    const { data: created, error } = await supabase
      .from("pipelines")
      .insert({ org_id: orgId, name: DEFAULT_PIPELINE_NAME, currency: "BRL", is_default: true })
      .select("id")
      .single();
    if (error) throw error;
    pipelineId = created.id;
  }

  // 2. Etapas
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("pipeline_id", pipelineId);

  const existingStages = new Set((stages ?? []).map((s) => s.name));
  const missingStages = STAGE_NAMES.map((name, i) => ({ name, i })).filter((s) => !existingStages.has(s.name));

  if (missingStages.length) {
    const { error } = await supabase.from("pipeline_stages").insert(
      missingStages.map(({ name, i }) => ({
        pipeline_id: pipelineId!,
        name,
        position: i + 1,
        probability: STAGE_PROBABILITIES[i],
      })),
    );
    if (error) throw error;
  }

  // 3. Tags de temperatura
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name")
    .eq("org_id", orgId)
    .eq("categoria", "temperatura");

  const existingTags = new Set((tags ?? []).map((t) => t.name));
  const missingTags = TEMPERATURA_TAGS.filter((t) => !existingTags.has(t.name));
  if (missingTags.length) {
    await supabase
      .from("tags")
      .insert(missingTags.map((t) => ({ org_id: orgId, name: t.name, color: t.color, categoria: "temperatura" })));
  }

  // 4. Objeções
  const { data: objecoes } = await supabase.from("objecoes").select("label").eq("org_id", orgId);
  const existingObj = new Set((objecoes ?? []).map((o) => o.label));
  const missingObj = OBJECOES_INICIAIS.filter((label) => !existingObj.has(label));
  if (missingObj.length) {
    await supabase.from("objecoes").insert(missingObj.map((label) => ({ org_id: orgId, label })));
  }

  return pipelineId;
}

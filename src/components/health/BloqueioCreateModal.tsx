import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const MOTIVOS = ["Reunião", "Almoço", "Folga", "Congresso", "Bloqueio pessoal", "Outro"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  professionals: { id: string; name: string }[];
  /** Horario clicado na grade, se houver. */
  quandoInicial?: Date | null;
  onCreated?: () => void;
}

function paraInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function BloqueioCreateModal({
  open, onOpenChange, professionals, quandoInicial, onCreated,
}: Props) {
  const { orgId } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();

  const [titulo, setTitulo] = useState(MOTIVOS[0]);
  const [tituloLivre, setTituloLivre] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [professionalId, setProfessionalId] = useState("todos");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = quandoInicial ?? new Date();
    const depois = new Date(base.getTime() + 60 * 60000);
    setInicio(paraInput(base));
    setFim(paraInput(depois));
    setTitulo(MOTIVOS[0]);
    setTituloLivre("");
    setObservacao("");
    setProfessionalId("todos");
  }, [open, quandoInicial]);

  const nomeFinal = titulo === "Outro" ? tituloLivre.trim() : titulo;
  const podeSalvar = !!nomeFinal && !!inicio && !!fim && new Date(fim) > new Date(inicio);

  const salvar = async () => {
    if (!orgId || !podeSalvar) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("agenda_bloqueios").insert({
        org_id: orgId,
        titulo: nomeFinal,
        inicio: new Date(inicio).toISOString(),
        fim: new Date(fim).toISOString(),
        observacao: observacao.trim() || null,
        professional_id: professionalId === "todos" ? null : professionalId,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      toast({ title: "Horário bloqueado", description: nomeFinal });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast({ title: "Erro ao bloquear", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Bloquear horário</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={titulo} onValueChange={setTitulo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {titulo === "Outro" && (
            <div className="space-y-1.5">
              <Label>Qual motivo?</Label>
              <Input value={tituloLivre} onChange={(e) => setTituloLivre(e.target.value)} placeholder="Ex.: Visita técnica" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim</Label>
              <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Médico</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Toda a clínica</SelectItem>
                {professionals.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={salvar} disabled={!podeSalvar || saving}>{saving ? "Salvando…" : "Bloquear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

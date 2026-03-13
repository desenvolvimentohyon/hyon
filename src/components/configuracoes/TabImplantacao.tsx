import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Car, CalendarDays, Calculator } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Region {
  id: string;
  name: string;
  base_value: number;
  additional_fee: number;
  active: boolean;
}

export default function TabImplantacao() {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  // Company profile fields
  const [costPerKm, setCostPerKm] = useState(0);
  const [dailyRate, setDailyRate] = useState(0);
  const [defaultDays, setDefaultDays] = useState(1);
  const [saving, setSaving] = useState(false);

  // Regions
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionModal, setRegionModal] = useState<{ editing: string | null } | null>(null);
  const [fRegion, setFRegion] = useState({ name: "", base_value: 0, additional_fee: 0, active: true });

  // Calculator
  const [calcKm, setCalcKm] = useState(0);
  const [calcRegionId, setCalcRegionId] = useState("");
  const [calcDays, setCalcDays] = useState(1);

  useEffect(() => {
    if (!orgId) return;
    loadCompanyProfile();
    loadRegions();
  }, [orgId]);

  const loadCompanyProfile = async () => {
    const { data } = await supabase
      .from("company_profile")
      .select("impl_cost_per_km, impl_daily_rate, impl_default_days")
      .eq("org_id", orgId!)
      .maybeSingle();
    if (data) {
      setCostPerKm(Number(data.impl_cost_per_km) || 0);
      setDailyRate(Number(data.impl_daily_rate) || 0);
      setDefaultDays(Number(data.impl_default_days) || 1);
      setCalcDays(Number(data.impl_default_days) || 1);
    }
  };

  const loadRegions = async () => {
    const { data } = await supabase
      .from("deployment_regions")
      .select("*")
      .eq("org_id", orgId!)
      .order("name");
    if (data) setRegions(data);
  };

  const saveCompanyFields = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("company_profile")
      .update({
        impl_cost_per_km: costPerKm,
        impl_daily_rate: dailyRate,
        impl_default_days: defaultDays,
      })
      .eq("org_id", orgId!);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Parâmetros de implantação salvos!");
  };

  const openNewRegion = () => {
    setFRegion({ name: "", base_value: 0, additional_fee: 0, active: true });
    setRegionModal({ editing: null });
  };

  const openEditRegion = (r: Region) => {
    setFRegion({ name: r.name, base_value: r.base_value, additional_fee: r.additional_fee, active: r.active });
    setRegionModal({ editing: r.id });
  };

  const saveRegion = async () => {
    if (!fRegion.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (regionModal?.editing) {
      await supabase.from("deployment_regions").update(fRegion).eq("id", regionModal.editing);
    } else {
      await supabase.from("deployment_regions").insert({ ...fRegion, org_id: orgId! });
    }
    setRegionModal(null);
    loadRegions();
    toast.success("Região salva!");
  };

  const deleteRegion = async (id: string) => {
    await supabase.from("deployment_regions").delete().eq("id", id);
    loadRegions();
    toast.success("Região removida!");
  };

  const activeRegions = regions.filter(r => r.active);
  const selectedRegion = activeRegions.find(r => r.id === calcRegionId);

  const calcResult = useMemo(() => {
    const kmCost = calcKm * costPerKm;
    const regionBase = selectedRegion?.base_value || 0;
    const regionFee = selectedRegion?.additional_fee || 0;
    const dailyCost = calcDays * dailyRate;
    return { kmCost, regionBase, regionFee, dailyCost, total: kmCost + regionBase + regionFee + dailyCost };
  }, [calcKm, costPerKm, selectedRegion, calcDays, dailyRate]);

  return (
    <div className="space-y-6">
      {/* Custo por KM + Diária */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Car className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle className="text-base">Custo por KM</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Valor por quilômetro rodado (R$/km)</Label>
              <CurrencyInput value={costPerKm} onValueChange={setCostPerKm} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <CalendarDays className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle className="text-base">Custo por Diária</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Valor da diária (R$)</Label>
              <CurrencyInput value={dailyRate} onValueChange={setDailyRate} />
            </div>
            <div>
              <Label className="text-xs">Dias estimados padrão</Label>
              <Input type="number" min={1} value={defaultDays} onChange={e => setDefaultDays(Number(e.target.value))} className="h-9" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={saveCompanyFields} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Parâmetros"}
        </Button>
      </div>

      {/* Regiões */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <MapPin className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle className="text-base">Regiões de Implantação</CardTitle>
            </div>
            <Button size="sm" onClick={openNewRegion} className="gap-1.5">
              <Plus className="h-4 w-4" />Nova Região
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Região</TableHead>
                <TableHead className="text-right">Valor Base</TableHead>
                <TableHead className="text-right">Taxa Adicional</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(r.base_value)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(r.additional_fee)}</TableCell>
                  <TableCell>
                    {r.active
                      ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Ativo</Badge>
                      : <Badge variant="secondary">Inativo</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRegion(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRegion(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {regions.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma região cadastrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Calculadora */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Calculator className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-base">Simulador de Implantação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-xs">Distância (km)</Label>
              <Input type="number" min={0} value={calcKm} onChange={e => setCalcKm(Number(e.target.value))} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Região</Label>
              <Select value={calcRegionId} onValueChange={setCalcRegionId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {activeRegions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Dias de implantação</Label>
              <Input type="number" min={1} value={calcDays} onChange={e => setCalcDays(Number(e.target.value))} className="h-9" />
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deslocamento ({calcKm} km × {fmt(costPerKm)}/km)</span>
              <span className="font-medium">{fmt(calcResult.kmCost)}</span>
            </div>
            {selectedRegion && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Região: {selectedRegion.name} (base)</span>
                  <span className="font-medium">{fmt(calcResult.regionBase)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa adicional da região</span>
                  <span className="font-medium">{fmt(calcResult.regionFee)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diárias ({calcDays} × {fmt(dailyRate)})</span>
              <span className="font-medium">{fmt(calcResult.dailyCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Valor da Implantação</span>
              <span className="text-primary">{fmt(calcResult.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region Modal */}
      <Dialog open={!!regionModal} onOpenChange={() => setRegionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{regionModal?.editing ? "Editar Região" : "Nova Região"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={fRegion.name} onChange={e => setFRegion(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Base</Label>
                <CurrencyInput value={fRegion.base_value} onValueChange={v => setFRegion(p => ({ ...p, base_value: v }))} />
              </div>
              <div>
                <Label>Taxa Adicional</Label>
                <CurrencyInput value={fRegion.additional_fee} onValueChange={v => setFRegion(p => ({ ...p, additional_fee: v }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={fRegion.active} onCheckedChange={v => setFRegion(p => ({ ...p, active: v }))} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegionModal(null)}>Cancelar</Button>
            <Button onClick={saveRegion}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

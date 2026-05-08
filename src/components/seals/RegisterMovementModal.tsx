import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  listOrgDepartments,
  listOrgMembers,
  registerMovement,
} from "@/lib/api/seals";

interface Props {
  sealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterMovementModal({ sealId, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [toUserId, setToUserId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [customDept, setCustomDept] = useState<string>("");
  const [usingCustom, setUsingCustom] = useState(false);
  const [notes, setNotes] = useState("");
  const [scannedQr, setScannedQr] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: members = [] } = useQuery({
    queryKey: ["org-members"],
    enabled: open,
    queryFn: listOrgMembers,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["org-departments"],
    enabled: open,
    queryFn: listOrgDepartments,
  });

  useEffect(() => {
    if (!open) {
      setToUserId("");
      setDepartment("");
      setCustomDept("");
      setUsingCustom(false);
      setNotes("");
      setScannedQr(false);
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: registerMovement,
    onSuccess: () => {
      toast.success("Movimento registado com sucesso.");
      qc.invalidateQueries({ queryKey: ["seal-movements", sealId] });
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Não foi possível registar o movimento. Tente novamente.");
    },
  });

  const finalDept = usingCustom ? customDept.trim() : department;
  const selectedMember = members.find((m) => m.user_id === toUserId);

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!toUserId) next.user = "Seleccione o destinatário.";
    if (!finalDept) next.dept = "Indique o departamento de destino.";
    if (notes.length > 2000) next.notes = "Máximo 2000 caracteres.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    mutation.mutate({
      seal_id: sealId,
      to_user_id: toUserId,
      to_department: finalDept,
      notes: notes.trim() || null,
      scanned_qr: scannedQr,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registar movimento</DialogTitle>
          <DialogDescription>
            Adicione um novo passo à cadeia de custódia deste selo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Utilizador destino */}
          <div className="space-y-1.5">
            <Label>Destinatário</Label>
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between font-normal",
                    !toUserId && "text-muted-foreground",
                    errors.user && "border-destructive",
                  )}
                >
                  {selectedMember ? selectedMember.full_name : "Seleccionar utilizador..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar por nome..." />
                  <CommandList>
                    <CommandEmpty>Nenhum utilizador encontrado.</CommandEmpty>
                    <CommandGroup>
                      {members.map((m) => (
                        <CommandItem
                          key={m.user_id}
                          value={`${m.full_name} ${m.email ?? ""}`}
                          onSelect={() => {
                            setToUserId(m.user_id);
                            setUserOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              toUserId === m.user_id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{m.full_name}</span>
                            {m.email && (
                              <span className="text-xs text-muted-foreground">{m.email}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.user && <p className="text-xs text-destructive">{errors.user}</p>}
          </div>

          {/* Departamento */}
          <div className="space-y-1.5">
            <Label>Departamento de destino</Label>
            {usingCustom ? (
              <div className="flex gap-2">
                <Input
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="Nome do departamento"
                  maxLength={200}
                  className={errors.dept ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setUsingCustom(false);
                    setCustomDept("");
                  }}
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !department && "text-muted-foreground",
                      errors.dept && "border-destructive",
                    )}
                  >
                    {department || "Seleccionar departamento..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar departamento..." />
                    <CommandList>
                      <CommandEmpty>Nenhum departamento conhecido.</CommandEmpty>
                      <CommandGroup>
                        {departments.map((d) => (
                          <CommandItem
                            key={d}
                            value={d}
                            onSelect={() => {
                              setDepartment(d);
                              setDeptOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                department === d ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {d}
                          </CommandItem>
                        ))}
                        <CommandItem
                          value="__other__"
                          onSelect={() => {
                            setUsingCustom(true);
                            setDepartment("");
                            setDeptOpen(false);
                          }}
                          className="border-t mt-1 pt-2 text-primary"
                        >
                          + Outro departamento…
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {errors.dept && <p className="text-xs text-destructive">{errors.dept}</p>}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Observações sobre este movimento"
              className={errors.notes ? "border-destructive" : ""}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.notes && <span className="text-destructive">{errors.notes}</span>}
              <span className="ml-auto">{notes.length}/2000</span>
            </div>
          </div>

          {/* Scanned QR */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="cursor-pointer">Foi por leitura de QR?</Label>
              <p className="text-xs text-muted-foreground">
                Marcar se o movimento foi registado a partir da digitalização do código.
              </p>
            </div>
            <Switch checked={scannedQr} onCheckedChange={setScannedQr} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

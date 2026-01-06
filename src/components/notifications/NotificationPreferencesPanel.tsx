import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Volume2,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle,
  RotateCcw,
  Archive,
  Save,
  Loader2,
} from "lucide-react";
import {
  useNotificationPreferences,
  useSaveNotificationPreferences,
  NotificationPreferences,
} from "@/hooks/useNotificationPreferences";

const movementTypes = [
  {
    key: 'movement_despacho',
    label: 'Despachos',
    description: 'Quando receber um despacho de documento',
    icon: ArrowRight,
    color: 'text-primary',
  },
  {
    key: 'movement_encaminhamento',
    label: 'Encaminhamentos',
    description: 'Quando um documento for encaminhado para si',
    icon: ArrowLeftRight,
    color: 'text-secondary-foreground',
  },
  {
    key: 'movement_recebimento',
    label: 'Recebimentos',
    description: 'Confirmações de recebimento de documentos',
    icon: CheckCircle,
    color: 'text-success',
  },
  {
    key: 'movement_devolucao',
    label: 'Devoluções',
    description: 'Quando um documento for devolvido',
    icon: RotateCcw,
    color: 'text-warning',
  },
  {
    key: 'movement_arquivamento',
    label: 'Arquivamentos',
    description: 'Quando um documento for arquivado',
    icon: Archive,
    color: 'text-muted-foreground',
  },
] as const;

export function NotificationPreferencesPanel() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const savePreferences = useSaveNotificationPreferences();
  
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        movement_despacho: preferences.movement_despacho,
        movement_encaminhamento: preferences.movement_encaminhamento,
        movement_recebimento: preferences.movement_recebimento,
        movement_devolucao: preferences.movement_devolucao,
        movement_arquivamento: preferences.movement_arquivamento,
        show_toast: preferences.show_toast,
        play_sound: preferences.play_sound,
      });
    }
  }, [preferences]);

  const handleChange = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    savePreferences.mutate(localPrefs, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPrefs({
        movement_despacho: preferences.movement_despacho,
        movement_encaminhamento: preferences.movement_encaminhamento,
        movement_recebimento: preferences.movement_recebimento,
        movement_devolucao: preferences.movement_devolucao,
        movement_arquivamento: preferences.movement_arquivamento,
        show_toast: preferences.show_toast,
        play_sound: preferences.play_sound,
      });
      setHasChanges(false);
    }
  };

  const enabledCount = movementTypes.filter(
    t => localPrefs[t.key as keyof NotificationPreferences]
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha quais tipos de notificações deseja receber
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            {enabledCount} de {movementTypes.length} activas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Movement Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Tipos de Movimentação
          </h4>
          
          {movementTypes.map((type) => {
            const Icon = type.icon;
            const isEnabled = localPrefs[type.key as keyof NotificationPreferences] ?? true;
            
            return (
              <div 
                key={type.key}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center ${type.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <Label htmlFor={type.key} className="text-sm font-medium cursor-pointer">
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleChange(type.key as keyof NotificationPreferences, checked)}
                />
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Delivery Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Configurações de Entrega
          </h4>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-info">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="show_toast" className="text-sm font-medium cursor-pointer">
                  Notificações Toast
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mostrar notificações popup no ecrã
                </p>
              </div>
            </div>
            <Switch
              id="show_toast"
              checked={localPrefs.show_toast ?? true}
              onCheckedChange={(checked) => handleChange('show_toast', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-warning">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="play_sound" className="text-sm font-medium cursor-pointer">
                  Som de Notificação
                </Label>
                <p className="text-xs text-muted-foreground">
                  Reproduzir som ao receber notificações
                </p>
              </div>
            </div>
            <Switch
              id="play_sound"
              checked={Boolean(localPrefs.play_sound)}
              onCheckedChange={(checked) => handleChange('play_sound', checked)}
            />
          </div>
        </div>

        {/* Actions */}
        {hasChanges && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={savePreferences.isPending}>
              {savePreferences.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Alterações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

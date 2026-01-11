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
  Mail,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        email_retention_alerts: preferences.email_retention_alerts,
        email_retention_urgent_only: preferences.email_retention_urgent_only,
        email_digest_frequency: preferences.email_digest_frequency,
      });
    }
  }, [preferences]);

  const handleChange = (key: keyof NotificationPreferences, value: boolean | string) => {
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
        email_retention_alerts: preferences.email_retention_alerts,
        email_retention_urgent_only: preferences.email_retention_urgent_only,
        email_digest_frequency: preferences.email_digest_frequency,
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
            const isEnabled = Boolean(localPrefs[type.key as keyof NotificationPreferences] ?? true);
            
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

        {/* Email Retention Alerts */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Alertas de Retenção por Email
          </h4>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="email_retention_alerts" className="text-sm font-medium cursor-pointer">
                  Alertas de Eliminação
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receber emails sobre documentos próximos da eliminação
                </p>
              </div>
            </div>
            <Switch
              id="email_retention_alerts"
              checked={localPrefs.email_retention_alerts ?? true}
              onCheckedChange={(checked) => handleChange('email_retention_alerts', checked)}
            />
          </div>

          {localPrefs.email_retention_alerts && (
            <>
              <div className="flex items-center justify-between py-2 pl-11">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <Label htmlFor="email_retention_urgent_only" className="text-sm font-medium cursor-pointer">
                      Apenas Urgentes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Só receber alertas para eliminações em menos de 7 dias
                    </p>
                  </div>
                </div>
                <Switch
                  id="email_retention_urgent_only"
                  checked={Boolean(localPrefs.email_retention_urgent_only)}
                  onCheckedChange={(checked) => handleChange('email_retention_urgent_only', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2 pl-11">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-secondary-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <Label htmlFor="email_digest_frequency" className="text-sm font-medium cursor-pointer">
                      Frequência de Envio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Com que frequência receber o resumo de alertas
                    </p>
                  </div>
                </div>
                <Select
                  value={localPrefs.email_digest_frequency || 'daily'}
                  onValueChange={(value) => handleChange('email_digest_frequency', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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

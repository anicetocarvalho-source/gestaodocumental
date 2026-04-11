import { useEffect, useState as useLocalState } from "react";
import { Lock, Unlock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutStatus, useCheckOut, useCheckIn, useForceCheckIn, useExtendCheckout } from "@/hooks/useDocumentCheckout";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface DocumentCheckoutBannerProps {
  documentId: string;
  onCheckoutChange?: (isLockedByOther: boolean) => void;
}

export function DocumentCheckoutBanner({ documentId, onCheckoutChange }: DocumentCheckoutBannerProps) {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { data: checkout, isLoading } = useCheckoutStatus(documentId);
  const checkOut = useCheckOut();
  const checkIn = useCheckIn();
  const forceCheckIn = useForceCheckIn();
  const extendCheckout = useExtendCheckout();

  const isMyCheckout = checkout?.checked_out_by === user?.id;
  const isLockedByOther = !!checkout && !isMyCheckout;

  // Fetch profile name for the user who checked out
  const { data: lockerProfile } = useQuery({
    queryKey: ['profile-name', checkout?.checked_out_by],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', checkout!.checked_out_by)
        .maybeSingle();
      return data;
    },
    enabled: !!checkout && !isMyCheckout,
  });

  // Notify parent about lock state
  useEffect(() => {
    if (onCheckoutChange) {
      onCheckoutChange(isLockedByOther);
    }
  }, [isLockedByOther, onCheckoutChange]);

  if (isLoading) return null;

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync({ documentId });
      toast.success("Documento em edição. Bloqueado para outros utilizadores.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao fazer check-out";
      toast.error(msg);
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync(documentId);
      toast.success("Documento desbloqueado.");
    } catch {
      toast.error("Erro ao devolver documento.");
    }
  };

  const handleForceCheckIn = async () => {
    try {
      await forceCheckIn.mutateAsync(documentId);
      toast.success("Documento desbloqueado forçosamente.");
    } catch {
      toast.error("Erro ao forçar desbloqueio.");
    }
  };

  const handleExtend = async () => {
    try {
      await extendCheckout.mutateAsync(documentId);
      toast.success("Tempo de edição prolongado por mais 2 horas.");
    } catch {
      toast.error("Erro ao prolongar tempo.");
    }
  };

  // No checkout — show check-out button
  if (!checkout) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Unlock className="h-4 w-4" />
          <span>Documento disponível para edição</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleCheckOut} disabled={checkOut.isPending}>
          <Lock className="h-4 w-4 mr-2" />
          Check-out para Edição
        </Button>
      </div>
    );
  }

  // My checkout
  if (isMyCheckout) {
    const expiresIn = formatDistanceToNow(new Date(checkout.expires_at), { locale: pt, addSuffix: true });

    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-warning" />
          <span>
            <strong>Documento em edição por si.</strong>{" "}
            <span className="text-muted-foreground">Expira {expiresIn}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExtend} disabled={extendCheckout.isPending}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Prolongar
          </Button>
          <Button variant="outline" size="sm" onClick={handleCheckIn} disabled={checkIn.isPending}>
            <Unlock className="h-4 w-4 mr-1" />
            Devolver
          </Button>
        </div>
      </div>
    );
  }

  // Locked by another user
  const lockedBy = lockerProfile?.full_name || "outro utilizador";
  const lockedSince = formatDistanceToNow(new Date(checkout.checked_out_at), { locale: pt, addSuffix: true });

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span>
          <strong>Documento bloqueado por {lockedBy}</strong>{" "}
          <span className="text-muted-foreground">desde {lockedSince}</span>
        </span>
      </div>
      {isAdmin && (
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleForceCheckIn} 
          disabled={forceCheckIn.isPending}
        >
          <Unlock className="h-4 w-4 mr-1" />
          Forçar Desbloqueio
        </Button>
      )}
    </div>
  );
}

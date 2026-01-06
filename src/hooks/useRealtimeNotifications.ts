import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { actionTypeLabels } from '@/hooks/useMovements';

interface MovementPayload {
  id: string;
  document_id: string;
  action_type: string;
  to_unit_id: string;
  to_user_id: string | null;
  from_unit_id: string | null;
  dispatch_text: string | null;
  created_at: string;
}

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { user } = useDemoAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchDocumentDetails = useCallback(async (documentId: string) => {
    const { data } = await supabase
      .from('documents')
      .select('entry_number, title')
      .eq('id', documentId)
      .single();
    return data;
  }, []);

  const fetchUnitDetails = useCallback(async (unitId: string) => {
    const { data } = await supabase
      .from('organizational_units')
      .select('name, code')
      .eq('id', unitId)
      .single();
    return data;
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log('[Realtime] Setting up notifications channel...');

    channelRef.current = supabase
      .channel('document-movements-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_movements',
        },
        async (payload) => {
          console.log('[Realtime] New movement received:', payload);
          
          const movement = payload.new as MovementPayload;
          
          // Check if this movement is relevant to the current user's unit
          // In a real app, you'd check against the user's actual unit_id
          // For demo purposes, we'll show all notifications
          
          try {
            const [document, toUnit] = await Promise.all([
              fetchDocumentDetails(movement.document_id),
              fetchUnitDetails(movement.to_unit_id),
            ]);

            const actionLabel = actionTypeLabels[movement.action_type] || movement.action_type;
            
            toast({
              title: `📄 ${actionLabel}`,
              description: `${document?.entry_number || 'Documento'} - ${document?.title || ''}\nDestino: ${toUnit?.name || 'Unidade'}`,
              duration: 5000,
            });
          } catch (error) {
            console.error('[Realtime] Error fetching notification details:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Cleaning up notifications channel...');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, toast, fetchDocumentDetails, fetchUnitDetails]);
}

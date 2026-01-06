import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  movement_despacho: boolean;
  movement_encaminhamento: boolean;
  movement_recebimento: boolean;
  movement_devolucao: boolean;
  movement_arquivamento: boolean;
  show_toast: boolean;
  play_sound: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  movement_despacho: true,
  movement_encaminhamento: true,
  movement_recebimento: true,
  movement_devolucao: true,
  movement_arquivamento: true,
  show_toast: true,
  play_sound: false,
};

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async (): Promise<NotificationPreferences | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Return data with defaults if no preferences exist
      if (!data) {
        return {
          ...defaultPreferences,
          id: '',
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
  });
}

export function useSaveNotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences,
            ...preferences,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: "Preferências guardadas",
        description: "As suas preferências de notificação foram actualizadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao guardar",
        description: "Não foi possível guardar as preferências.",
        variant: "destructive",
      });
      console.error('Error saving preferences:', error);
    },
  });
}

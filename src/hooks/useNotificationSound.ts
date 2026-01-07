import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create a notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for a pleasant notification chime
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant notification tone
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
    oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6
    
    oscillator.type = 'sine';
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export function useNotificationSound() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const preferencesRef = useRef<{ play_sound: boolean; show_toast: boolean } | null>(null);

  // Fetch user preferences
  useEffect(() => {
    if (!user?.id) return;

    const fetchPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('play_sound, show_toast')
        .eq('user_id', user.id)
        .single();
      
      // Default to true if no preferences set
      preferencesRef.current = data || { play_sound: true, show_toast: true };
    };

    fetchPreferences();
  }, [user?.id]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-sound')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          // Invalidate queries to update notification count
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          
          const prefs = preferencesRef.current || { play_sound: true, show_toast: true };
          
          // Play sound if enabled
          if (prefs.play_sound) {
            playNotificationSound();
          }
          
          // Show toast if enabled
          if (prefs.show_toast && payload.new) {
            const notification = payload.new as { title: string; message: string; type: string };
            toast(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

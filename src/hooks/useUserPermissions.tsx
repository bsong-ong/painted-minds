import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermissions {
  gratitude_journaling_enabled: boolean;
  talk_buddy_enabled: boolean;
  thought_buddy_enabled: boolean;
}

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    gratitude_journaling_enabled: true,
    talk_buddy_enabled: true,
    thought_buddy_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_permissions')
          .select('gratitude_journaling_enabled, talk_buddy_enabled, thought_buddy_enabled')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user permissions:', error);
          // If no permissions record exists, default to all enabled
          setPermissions({
            gratitude_journaling_enabled: true,
            talk_buddy_enabled: true,
            thought_buddy_enabled: true,
          });
        } else if (data) {
          setPermissions({
            gratitude_journaling_enabled: data.gratitude_journaling_enabled,
            talk_buddy_enabled: data.talk_buddy_enabled,
            thought_buddy_enabled: data.thought_buddy_enabled,
          });
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  return { permissions, loading };
};
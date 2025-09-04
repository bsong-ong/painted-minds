import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettings {
  art_sharing_enabled: boolean;
  story_creation_enabled: boolean;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    art_sharing_enabled: true,
    story_creation_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('art_sharing_enabled, story_creation_enabled')
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            art_sharing_enabled: data.art_sharing_enabled,
            story_creation_enabled: data.story_creation_enabled,
          });
        }
      } catch (error) {
        console.error('Error fetching admin settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
};
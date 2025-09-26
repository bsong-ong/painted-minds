import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettings {
  art_sharing_enabled: boolean;
  story_creation_enabled: boolean;
  use_openrouter_for_images: boolean;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    art_sharing_enabled: true,
    story_creation_enabled: true,
    use_openrouter_for_images: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('art_sharing_enabled, story_creation_enabled, use_openrouter_for_images')
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            art_sharing_enabled: data.art_sharing_enabled,
            story_creation_enabled: data.story_creation_enabled,
            use_openrouter_for_images: data.use_openrouter_for_images || false,
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
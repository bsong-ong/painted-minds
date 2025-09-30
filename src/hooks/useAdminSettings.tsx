import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettings {
  art_sharing_enabled: boolean;
  story_creation_enabled: boolean;
  use_openrouter_for_images: boolean;
  enable_username_login: boolean;
  talk_buddy_visible: boolean;
  language_switcher_enabled: boolean;
  default_language: string;
  gratitude_drawing_visible: boolean;
  cbt_assistant_visible: boolean;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    art_sharing_enabled: true,
    story_creation_enabled: true,
    use_openrouter_for_images: false,
    enable_username_login: false,
    talk_buddy_visible: true,
    language_switcher_enabled: true,
    default_language: 'en',
    gratitude_drawing_visible: true,
    cbt_assistant_visible: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('art_sharing_enabled, story_creation_enabled, use_openrouter_for_images, enable_username_login, talk_buddy_visible, language_switcher_enabled, default_language, gratitude_drawing_visible, cbt_assistant_visible')
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            art_sharing_enabled: data.art_sharing_enabled,
            story_creation_enabled: data.story_creation_enabled,
            use_openrouter_for_images: data.use_openrouter_for_images || false,
            enable_username_login: data.enable_username_login || false,
            talk_buddy_visible: data.talk_buddy_visible !== undefined ? data.talk_buddy_visible : true,
            language_switcher_enabled: data.language_switcher_enabled !== undefined ? data.language_switcher_enabled : true,
            default_language: data.default_language || 'en',
            gratitude_drawing_visible: data.gratitude_drawing_visible !== undefined ? data.gratitude_drawing_visible : true,
            cbt_assistant_visible: data.cbt_assistant_visible !== undefined ? data.cbt_assistant_visible : true,
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
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  const handleLanguageChange = async (newLang: 'en' | 'th') => {
    // Update UI immediately
    setLanguage(newLang);
    
    // Update database if user is logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ language: newLang })
          .eq('id', user.id);

        if (error) throw error;
        
        console.log('Language updated in database:', newLang);
      } catch (error) {
        console.error('Failed to update language in database:', error);
        toast.error('Failed to save language preference');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          {t('language')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          {t('english')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('th')}
          className={language === 'th' ? 'bg-accent' : ''}
        >
          {t('thai')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
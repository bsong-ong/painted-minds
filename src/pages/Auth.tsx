import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { getRedirectPath } from '@/utils/userRedirect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain } from 'lucide-react';
import paintedMindsHero from '@/assets/painted-smiles-hero.jpg';

const Auth = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useAdminSettings();
  const { permissions } = useUserPermissions();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && permissions) {
      const redirectPath = getRedirectPath(permissions, isAdmin);
      navigate(redirectPath);
    }
  }, [user, permissions, isAdmin, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let emailToUse = emailOrUsername;
    
    if (settings.enable_username_login && !emailOrUsername.includes('@')) {
      try {
        const { data, error } = await supabase.rpc('get_email_by_username', {
          lookup_username: emailOrUsername.trim()
        });
        
        if (error || !data) {
          toast.error('Username not found');
          setLoading(false);
          return;
        }
        
        emailToUse = data as string;
      } catch (error) {
        toast.error('Error looking up username');
        setLoading(false);
        return;
      }
    }
    
    const { error } = await signIn(emailToUse, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('successfullySignedIn'));
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // For sign up, always use email format
    if (!emailOrUsername.includes('@')) {
      toast.error('Please use a valid email address for registration');
      setLoading(false);
      return;
    }
    
    const { error } = await signUp(emailOrUsername, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('checkEmailConfirmation'));
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-gratitude-warm/10 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center">
        {/* Hero Image Section */}
        <div className="w-full">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={paintedMindsHero}
              alt="Painted Minds - Creative mental wellness through art"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <Brain className="h-12 w-12 mb-4 text-amber-300" />
              <h2 className="text-3xl font-bold mb-2">Painted Minds</h2>
              <p className="text-lg text-white/90">Express, Reflect, Grow</p>
            </div>
          </div>
        </div>

        {/* Auth Card Section */}
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-end mb-4">
              <LanguageSwitcher />
            </div>
            <CardTitle className="text-2xl font-bold">{t('drawingApp')}</CardTitle>
            <CardDescription>
              {t('signInToSave')}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">
                    {settings.enable_username_login ? t('emailOrUsername') : t('email')}
                  </Label>
                  <Input
                    id="signin-email"
                    type={settings.enable_username_login ? "text" : "email"}
                    placeholder={settings.enable_username_login ? t('emailOrUsernamePlaceholder') : t('emailPlaceholder')}
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('signingIn') : t('signIn')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('email')}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('password')}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={t('createPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('creatingAccount') : t('signUp')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
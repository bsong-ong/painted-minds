import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Settings, Users, Share2, BookOpen, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    art_sharing_enabled: true,
    story_creation_enabled: true,
    chatbot_enabled: true,
    language_switcher_enabled: true,
    admin_only_registration: false,
    enable_cgm_functionality: true,
    enable_ai_insights: true,
    use_openrouter_for_images: false,
    enable_username_login: false,
  });
  const [loading, setLoading] = useState(true);
  
  // User creation state
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    username: '',
    display_name: '',
    gratitude_journaling_enabled: true,
    talk_buddy_enabled: true,
    thought_buddy_enabled: true
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          art_sharing_enabled: data.art_sharing_enabled,
          story_creation_enabled: data.story_creation_enabled,
          chatbot_enabled: data.chatbot_enabled || true,
          language_switcher_enabled: data.language_switcher_enabled || true,
          admin_only_registration: data.admin_only_registration || false,
          enable_cgm_functionality: data.enable_cgm_functionality,
          enable_ai_insights: data.enable_ai_insights,
          use_openrouter_for_images: data.use_openrouter_for_images || false,
          enable_username_login: data.enable_username_login || false,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: t('error'),
        description: 'Failed to load admin settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ [key]: value })
        .eq('id', (await supabase.from('admin_settings').select('id').single()).data?.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: 'Success',
        description: `Setting updated successfully`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: t('error'),
        description: 'Failed to update setting',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const response = await fetch('https://jmhabxgjckihgptoyupm.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(newUserData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast({
        title: 'Success',
        description: `User ${newUserData.email} created successfully`,
      });

      // Reset form and close dialog
      setNewUserData({
        email: '',
        password: '',
        username: '',
        display_name: '',
        gratitude_journaling_enabled: true,
        talk_buddy_enabled: true,
        thought_buddy_enabled: true
      });
      setCreateUserDialog(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Feature Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Feature Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Art Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to share their art publicly in the gallery
                  </p>
                </div>
                <Switch
                  checked={settings.art_sharing_enabled}
                  onCheckedChange={(checked) => updateSetting('art_sharing_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Story Creation</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to generate stories from their artwork
                  </p>
                </div>
                <Switch
                  checked={settings.story_creation_enabled}
                  onCheckedChange={(checked) => updateSetting('story_creation_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Chatbot</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI chatbot functionality
                  </p>
                </div>
                <Switch
                  checked={settings.chatbot_enabled}
                  onCheckedChange={(checked) => updateSetting('chatbot_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Language Switcher</Label>
                  <p className="text-sm text-muted-foreground">
                    Show language switcher in the interface
                  </p>
                </div>
                <Switch
                  checked={settings.language_switcher_enabled}
                  onCheckedChange={(checked) => updateSetting('language_switcher_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">CGM Functionality</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable continuous glucose monitoring features
                  </p>
                </div>
                <Switch
                  checked={settings.enable_cgm_functionality}
                  onCheckedChange={(checked) => updateSetting('enable_cgm_functionality', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">AI Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered insights and recommendations
                  </p>
                </div>
                 <Switch
                   checked={settings.enable_ai_insights}
                   onCheckedChange={(checked) => updateSetting('enable_ai_insights', checked)}
                 />
               </div>

               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <Label className="text-base font-medium">Use OpenRouter for Image Generation</Label>
                   <p className="text-sm text-muted-foreground">
                     Use OpenRouter/Gemini Flash instead of Replicate for AI image enhancement
                   </p>
                 </div>
                  <Switch
                    checked={settings.use_openrouter_for_images}
                    onCheckedChange={(checked) => updateSetting('use_openrouter_for_images', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Username/Email Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to sign in using either username or email address
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_username_login}
                    onCheckedChange={(checked) => updateSetting('enable_username_login', checked)}
                  />
                </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Create New User</Label>
                  <p className="text-sm text-muted-foreground">
                    Create new user accounts with admin privileges
                  </p>
                </div>
                <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateUser}>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account. The user will be automatically confirmed.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            minLength={6}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <Label className="text-base font-medium">Feature Access Permissions</Label>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="gratitude_journaling">Gratitude Journaling</Label>
                            <Switch
                              id="gratitude_journaling"
                              checked={newUserData.gratitude_journaling_enabled}
                              onCheckedChange={(checked) => setNewUserData(prev => ({ ...prev, gratitude_journaling_enabled: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="talk_buddy">{t('talkBuddy')}</Label>
                            <Switch
                              id="talk_buddy"
                              checked={newUserData.talk_buddy_enabled}
                              onCheckedChange={(checked) => setNewUserData(prev => ({ ...prev, talk_buddy_enabled: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="thought_buddy">{t('thoughtBuddy')} (CBT Assistant)</Label>
                            <Switch
                              id="thought_buddy"
                              checked={newUserData.thought_buddy_enabled}
                              onCheckedChange={(checked) => setNewUserData(prev => ({ ...prev, thought_buddy_enabled: checked }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            type="text"
                            placeholder="username (optional)"
                            value={newUserData.username}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="display_name">Display Name</Label>
                          <Input
                            id="display_name"
                            type="text"
                            placeholder="Display name (optional)"
                            value={newUserData.display_name}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, display_name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCreateUserDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={creatingUser}>
                          {creatingUser ? 'Creating...' : 'Create User'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Admin-Only Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict new user registration to administrators only
                  </p>
                </div>
                <Switch
                  checked={settings.admin_only_registration}
                  onCheckedChange={(checked) => updateSetting('admin_only_registration', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
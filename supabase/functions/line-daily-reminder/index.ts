import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getMessage, type Language } from "../_shared/line-messages.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily gratitude reminder...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lineAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!;
    const liffId = Deno.env.get('VITE_LIFF_ID')!;

    if (!lineAccessToken || !liffId) {
      throw new Error('LINE configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all linked LINE accounts
    const { data: lineAccounts, error: fetchError } = await supabase
      .from('line_accounts')
      .select('line_user_id, display_name, user_id');

    if (fetchError) {
      console.error('Error fetching LINE accounts:', fetchError);
      throw fetchError;
    }

    if (!lineAccounts || lineAccounts.length === 0) {
      console.log('No LINE accounts found to send reminders to');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending reminders to ${lineAccounts.length} users`);

    // Get all user profiles for language preferences
    const userIds = lineAccounts.map((acc: any) => acc.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, language')
      .in('id', userIds);

    // Create a map of user_id to language
    const languageMap = new Map(
      profiles?.map((p: any) => [p.id, p.language || 'en']) || []
    );

    // Generate AI quotes for both languages
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const generateQuote = async (language: string) => {
      const prompt = language === 'th' 
        ? 'สร้างคำคมสั้นๆ ที่สร้างแรงบันดาลใจเกี่ยวกับความกตัญญูหรือความสุข ไม่เกิน 2 ประโยค ตอบเป็นภาษาไทย'
        : 'Generate a short, inspiring quote about gratitude or happiness. Maximum 2 sentences. Respond in English.';

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a mindful assistant that creates inspiring quotes.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI quote generation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    };

    const [quoteEn, quoteTh] = await Promise.all([
      generateQuote('en'),
      generateQuote('th')
    ]);

    console.log('Generated quotes:', { en: quoteEn, th: quoteTh });

    // Send reminder to each user
    const sendPromises = lineAccounts.map(async (account: any) => {
      try {
        // Get user's language preference (default to 'en' if not set)
        const userLanguage: Language = languageMap.get(account.user_id) || 'en';
        const quote = userLanguage === 'th' ? quoteTh : quoteEn;
        
        const message = {
          to: account.line_user_id,
          messages: [
            {
              type: 'text',
              text: getMessage(userLanguage, 'dailyReminder.title') + '\n\n' + 
                    getMessage(userLanguage, 'dailyReminder.text') + '\n\n' +
                    `✨ ${quote}`
            }
          ]
        };

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineAccessToken}`
          },
          body: JSON.stringify(message)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send to ${account.line_user_id}:`, errorText);
          return { success: false, userId: account.line_user_id };
        }

        console.log(`Reminder sent to ${account.display_name || account.line_user_id}`);
        return { success: true, userId: account.line_user_id };
      } catch (error) {
        console.error(`Error sending to ${account.line_user_id}:`, error);
        return { success: false, userId: account.line_user_id };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Reminders sent: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: lineAccounts.length,
        sent: successCount,
        failed: failCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in line-daily-reminder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

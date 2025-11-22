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

    // Get all linked LINE accounts with user language preferences
    const { data: lineAccounts, error: fetchError } = await supabase
      .from('line_accounts')
      .select(`
        line_user_id,
        display_name,
        user_id,
        profiles!inner(language)
      `);

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

    // Send reminder to each user
    const sendPromises = lineAccounts.map(async (account: any) => {
      try {
        // Get user's language preference (default to 'en' if not set)
        const userLanguage: Language = account.profiles?.language || 'en';
        
        const message = {
          to: account.line_user_id,
          messages: [
            {
              type: 'text',
              text: getMessage(userLanguage, 'dailyReminder.title') + '\n\n' + getMessage(userLanguage, 'dailyReminder.text')
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

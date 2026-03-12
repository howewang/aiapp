// Edge Function: get-daily-matches
// GET → returns today's match list for the current user
// Uses admin client for DB reads to avoid RLS auth context issues in edge functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getSessionDate } from '../_shared/session.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client — bypasses RLS, we enforce user isolation manually via user_id filter
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('get-daily-matches auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionDate = getSessionDate();
    console.log(`get-daily-matches: user=${user.id} date=${sessionDate}`);

    const { data: matches, error } = await supabaseAdmin
      .from('daily_matches')
      .select(`
        id,
        matched_user_id,
        user_personality,
        matched_personality,
        matched_nickname,
        matched_avatar,
        last_message,
        last_message_at,
        created_at,
        session_date
      `)
      .eq('user_id', user.id)
      .eq('session_date', sessionDate)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('get-daily-matches query error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`get-daily-matches: returning ${matches?.length ?? 0} matches`);

    return new Response(JSON.stringify({ matches: matches ?? [], sessionDate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('get-daily-matches error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

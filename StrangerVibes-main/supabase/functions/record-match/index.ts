// Edge Function: record-match
// POST → records a new match into daily_matches (Part B)
//        also updates last_message / last_message_at
// Uses admin client for all DB operations to bypass RLS issues in edge functions

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

    // Admin client for all DB operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('record-match auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      matched_user_id,
      user_personality,
      matched_personality,
      matched_nickname,
      matched_avatar,
      last_message,
    } = body;

    if (!matched_user_id || !user_personality || !matched_personality) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionDate = getSessionDate();
    const now = new Date().toISOString();

    console.log(`record-match: user=${user.id} matched=${matched_user_id} date=${sessionDate}`);

    // Check if match already exists today
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from('daily_matches')
      .select('id')
      .eq('user_id', user.id)
      .eq('matched_user_id', matched_user_id)
      .eq('session_date', sessionDate)
      .maybeSingle();

    if (checkErr) {
      console.error('record-match check error:', checkErr);
    }

    if (existing) {
      // Update last_message if provided
      if (last_message !== undefined) {
        await supabaseAdmin
          .from('daily_matches')
          .update({ last_message, last_message_at: now })
          .eq('id', existing.id);
      }
      return new Response(JSON.stringify({ success: true, matchId: existing.id, isNew: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert new match record using admin client
    const { data: newMatch, error: insertError } = await supabaseAdmin
      .from('daily_matches')
      .insert({
        user_id: user.id,
        matched_user_id,
        user_personality,
        matched_personality,
        matched_nickname: matched_nickname ?? '神秘旅人',
        matched_avatar: matched_avatar ?? '',
        session_date: sessionDate,
        last_message: last_message ?? '',
        last_message_at: now,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('record-match insert error:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`record-match: inserted new match id=${newMatch?.id}`);

    return new Response(JSON.stringify({ success: true, matchId: newMatch?.id, isNew: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('record-match error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

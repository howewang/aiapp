// Edge Function: select-personality
// POST  → select today's personality (idempotent, once per session_date)
// GET   → check today's session status

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

    // Admin client for all DB operations (bypasses RLS issues in edge functions)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user token via admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sessionDate = getSessionDate();

    // ── GET: return current session status ──────────────────────────
    if (req.method === 'GET') {
      const { data: session } = await supabaseAdmin
        .from('daily_sessions')
        .select('personality_type, session_date, created_at')
        .eq('user_id', user.id)
        .eq('session_date', sessionDate)
        .maybeSingle();

      // Fetch personality stats for this user
      const { data: stats } = await supabaseAdmin
        .from('personality_stats')
        .select('personality_type, usage_count, total_rating, rating_count, last_used_at')
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        sessionDate,
        hasSelectedToday: !!session,
        todayPersonality: session?.personality_type ?? null,
        stats: stats ?? [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── POST: select personality for today ──────────────────────────
    if (req.method === 'POST') {
      const body = await req.json();
      const { personality_type } = body;
      if (!personality_type) {
        return new Response(JSON.stringify({ error: 'personality_type required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already selected today
      const { data: existing } = await supabaseAdmin
        .from('daily_sessions')
        .select('id, personality_type')
        .eq('user_id', user.id)
        .eq('session_date', sessionDate)
        .maybeSingle();

      if (existing) {
        // Fetch latest stats and return (idempotent)
        const { data: stats } = await supabaseAdmin
          .from('personality_stats')
          .select('personality_type, usage_count, total_rating, rating_count, last_used_at')
          .eq('user_id', user.id);

        return new Response(JSON.stringify({
          success: true,
          alreadySelected: true,
          personality_type: existing.personality_type,
          sessionDate,
          stats: stats ?? [],
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Insert daily session record via admin client
      const { error: sessionError } = await supabaseAdmin
        .from('daily_sessions')
        .insert({ user_id: user.id, personality_type, session_date: sessionDate });

      if (sessionError) {
        console.error('Session insert error:', sessionError);
        return new Response(JSON.stringify({ error: sessionError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ── Upsert personality_stats via ADMIN client (bypasses RLS) ──
      const { data: existing_stat } = await supabaseAdmin
        .from('personality_stats')
        .select('id, usage_count')
        .eq('user_id', user.id)
        .eq('personality_type', personality_type)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing_stat) {
        const { error: updateErr } = await supabaseAdmin
          .from('personality_stats')
          .update({
            usage_count: existing_stat.usage_count + 1,
            last_used_at: now,
          })
          .eq('id', existing_stat.id);
        if (updateErr) console.error('personality_stats update error:', updateErr);
      } else {
        const { error: insertErr } = await supabaseAdmin
          .from('personality_stats')
          .insert({
            user_id: user.id,
            personality_type,
            usage_count: 1,
            total_rating: 0,
            rating_count: 0,
            first_used_at: now,
            last_used_at: now,
          });
        if (insertErr) console.error('personality_stats insert error:', insertErr);
      }

      // Return updated stats via admin read
      const { data: stats } = await supabaseAdmin
        .from('personality_stats')
        .select('personality_type, usage_count, total_rating, rating_count, last_used_at')
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        success: true,
        alreadySelected: false,
        personality_type,
        sessionDate,
        stats: stats ?? [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('select-personality error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

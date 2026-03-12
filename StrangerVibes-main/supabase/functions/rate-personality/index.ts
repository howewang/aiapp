// Edge Function: rate-personality
// POST → add a rating for a user's personality (Part A, permanent)
// Uses admin client for all DB operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    // Admin client for all operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify token via admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('rate-personality auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { target_user_id, personality_type, rating } = await req.json();
    if (!target_user_id || !personality_type || rating == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`rate-personality: rater=${user.id} target=${target_user_id} type=${personality_type} rating=${rating}`);

    // Upsert target user's personality stats
    const { data: stat } = await supabaseAdmin
      .from('personality_stats')
      .select('id, total_rating, rating_count')
      .eq('user_id', target_user_id)
      .eq('personality_type', personality_type)
      .maybeSingle();

    if (stat) {
      await supabaseAdmin
        .from('personality_stats')
        .update({
          total_rating: Number(stat.total_rating) + rating,
          rating_count: stat.rating_count + 1,
        })
        .eq('id', stat.id);
    } else {
      await supabaseAdmin
        .from('personality_stats')
        .insert({
          user_id: target_user_id,
          personality_type,
          usage_count: 0,
          total_rating: rating,
          rating_count: 1,
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('rate-personality error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

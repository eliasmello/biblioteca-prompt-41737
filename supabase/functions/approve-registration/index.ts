import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { registrationId } = await req.json()

    // Get registration details
    const { data: registration, error: regError } = await supabaseAdmin
      .from('user_registrations')
      .select('*')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      throw new Error('Registration not found')
    }

    // Create user account
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: registration.email,
      password: Math.random().toString(36).slice(-8), // Temporary password
      email_confirm: true,
      user_metadata: {
        name: registration.name,
        role: 'user'
      }
    })

    if (signUpError) throw signUpError

    // Update registration status
    const { error: updateError } = await supabaseAdmin
      .from('user_registrations')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', registrationId)

    if (updateError) throw updateError

    // Update user profile with role
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', userData.user.id)

      if (profileError) throw profileError
    }

    return new Response(
      JSON.stringify({ success: true, user: userData.user }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error approving registration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
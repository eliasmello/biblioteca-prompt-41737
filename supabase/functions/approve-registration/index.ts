import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

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

    // Generate password reset link
    const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: registration.email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/auth`
      }
    })

    // Send approval email
    try {
      const frontendUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}`
      
      await resend.emails.send({
        from: "PromptForge <onboarding@resend.dev>",
        to: [registration.email],
        subject: "Sua solicitação foi aprovada! - PromptForge",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 20px;">Parabéns, ${registration.name}!</h1>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Sua solicitação para acessar o <strong>PromptForge</strong> foi aprovada! 
              Agora você pode acessar nossa plataforma de prompts e começar a explorar.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Para começar:</h3>
              <ol style="color: #666; line-height: 1.6;">
                <li>Clique no link abaixo para definir sua senha</li>
                <li>Faça login com seu email: <strong>${registration.email}</strong></li>
                <li>Explore nossa biblioteca de prompts</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetData?.properties?.action_link || `${frontendUrl}/auth`}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block; 
                        font-weight: bold;">
                Definir Minha Senha
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 14px;">
              Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:
            </p>
            
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; 
                      border-radius: 4px; font-size: 12px;">
              ${resetData?.properties?.action_link || `${frontendUrl}/auth`}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Bem-vindo ao PromptForge! Se tiver dúvidas, entre em contato conosco.
            </p>
          </div>
        `,
      })
      
      console.log(`Approval email sent successfully to ${registration.email}`)
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Don't throw here - approval should succeed even if email fails
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
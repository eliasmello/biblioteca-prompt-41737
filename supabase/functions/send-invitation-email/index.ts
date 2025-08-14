import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) {
  console.error("RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  name: string;
  inviteToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, inviteToken }: InvitationEmailRequest = await req.json();

    const frontendUrl = "https://aylzgwnxwyrtyyvrifjb.lovableproject.com";
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    const emailResponse = await resend.emails.send({
      from: "Prompts Platform <onboarding@resend.dev>",
      to: [email],
      subject: "Convite para acessar a Plataforma de Prompts",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">Olá, ${name}!</h1>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Você foi convidado(a) para fazer parte da nossa Plataforma de Prompts. 
            Para acessar e criar sua senha, clique no botão abaixo:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; 
                      font-weight: bold;">
              Criar Minha Senha
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 14px;">
            Este convite expira em 7 dias. Se você não conseguir clicar no botão, 
            copie e cole o link abaixo no seu navegador:
          </p>
          
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; 
                    border-radius: 4px; font-size: 12px;">
            ${inviteUrl}
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Se você não esperava este convite, pode ignorar este email com segurança.
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
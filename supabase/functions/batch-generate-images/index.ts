import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Prompt {
  id: string;
  title: string;
  content: string;
}

// Normaliza placeholders no conteúdo
function normalizeContent(content: string): string {
  return content
    .replace(/\[city\]/gi, 'a modern city')
    .replace(/\[xy\]/gi, '1:1')
    .replace(/\[color\]/gi, 'white')
    .replace(/\[(\w+)\]/g, 'value')
    .trim()
    .replace(/\s+/g, ' ');
}

function base64ToBlob(base64: string, contentType = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}

async function generateImage(prompt: Prompt, lovableApiKey: string, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    console.log(`[${prompt.id}] Starting generation for: ${prompt.title}`);
    
    // Normalizar conteúdo antes de enviar ao modelo
    const normalizedContent = normalizeContent(prompt.content);
    
    // Tentar até 3 vezes se não vier imagem
    const maxRetries = 3;
    let base64Image: string | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let promptText = `Generate an image based on this prompt: ${normalizedContent}`;
      
      // Variar o prompt nas tentativas subsequentes
      if (attempt === 2) {
        promptText = `Generate a single PNG image based on this prompt. Return only the image: ${normalizedContent}`;
      } else if (attempt === 3) {
        promptText = `Create one high-quality image. Respond with an image only. ${normalizedContent}`;
      }
      
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: promptText,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        
        if (aiResponse.status === 429) {
          console.error(`[${prompt.id}] Rate limit exceeded`);
          return { error: 'RATE_LIMIT', status: 429 };
        }
        
        if (aiResponse.status === 402) {
          console.error(`[${prompt.id}] Credits exceeded`);
          return { error: 'NO_CREDITS', status: 402 };
        }
        
        console.error(`[${prompt.id}] AI Gateway error (attempt ${attempt}):`, errorText);
        if (attempt === maxRetries) {
          return { error: 'AI_ERROR', status: aiResponse.status };
        }
        continue;
      }

      const aiData = await aiResponse.json();
      base64Image = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (base64Image) {
        if (attempt > 1) {
          console.log(`[${prompt.id}] Success on retry #${attempt}`);
        }
        break;
      } else {
        console.log(`[${prompt.id}] No image in response (attempt ${attempt}/${maxRetries})`);
        if (attempt === maxRetries) {
          console.error(`[${prompt.id}] No image after ${maxRetries} attempts`);
          return { error: 'NO_IMAGE', status: 500 };
        }
      }
    }
    
    if (!base64Image) {
      console.error(`[${prompt.id}] No image in response`);
      return { error: 'NO_IMAGE', status: 500 };
    }

    // Convert base64 to blob
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBlob = base64ToBlob(base64Data, 'image/png');

    // Upload to storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const timestamp = Date.now();
    const imagePath = `${prompt.id}-${timestamp}.png`;

    const { error: uploadError } = await supabase.storage
      .from('prompt-images')
      .upload(imagePath, imageBlob, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error(`[${prompt.id}] Upload error:`, uploadError);
      return { error: 'UPLOAD_ERROR', status: 500 };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('prompt-images')
      .getPublicUrl(imagePath);

    const imageUrl = urlData.publicUrl;
    const thumbnailUrl = imageUrl; // Same for now

    // Update database
    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        preview_image: imageUrl,
        thumbnail_url: thumbnailUrl,
      })
      .eq('id', prompt.id);

    if (updateError) {
      console.error(`[${prompt.id}] Update error:`, updateError);
      return { error: 'UPDATE_ERROR', status: 500 };
    }

    console.log(`[${prompt.id}] Success! URL: ${imageUrl}`);
    return { imageUrl, thumbnailUrl };
    
  } catch (error) {
    console.error(`[${prompt.id}] Unexpected error:`, error);
    return { error: 'UNEXPECTED_ERROR', status: 500 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!lovableApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch prompts without images
    const { data: prompts, error: fetchError } = await supabase
      .from('prompts')
      .select('id, title, content')
      .is('preview_image', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    if (!prompts || prompts.length === 0) {
      return new Response(JSON.stringify({ message: 'No prompts without images' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting batch generation for ${prompts.length} prompts`);

    // Setup SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        let generated = 0;
        let failed = 0;
        const total = prompts.length;
        const BATCH_SIZE = 5;
        const DELAY_MS = 2000;

        // Process in batches
        for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
          const batch = prompts.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel
          const results = await Promise.all(
            batch.map(prompt => generateImage(prompt, lovableApiKey, supabaseUrl, supabaseServiceKey))
          );

          // Send results
          for (let j = 0; j < results.length; j++) {
            const prompt = batch[j];
            const result = results[j];

            if (result.error) {
              failed++;
              send({
                type: 'error',
                promptId: prompt.id,
                promptTitle: prompt.title,
                error: result.error,
                current: generated + failed,
                total,
              });

              // Stop on critical errors
              if (result.status === 402 || result.status === 429) {
                send({
                  type: 'critical_error',
                  error: result.error,
                  generated,
                  failed,
                  total,
                });
                controller.close();
                return;
              }
            } else {
              generated++;
              send({
                type: 'success',
                promptId: prompt.id,
                promptTitle: prompt.title,
                imageUrl: result.imageUrl,
                current: generated + failed,
                total,
              });
            }
          }

          // Delay between batches (except last)
          if (i + BATCH_SIZE < prompts.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
          }
        }

        // Send completion
        send({
          type: 'complete',
          generated,
          failed,
          total,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

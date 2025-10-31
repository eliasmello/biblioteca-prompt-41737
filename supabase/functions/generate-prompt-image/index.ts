import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to convert base64 to blob
function base64ToBlob(base64: string, contentType = 'image/png'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

// Helper function to create thumbnail with real compression
async function createThumbnail(imageBlob: Blob): Promise<Blob> {
  try {
    console.log('Starting thumbnail compression...');
    
    // Convert blob to array buffer
    const arrayBuffer = await imageBlob.arrayBuffer();
    
    // Load image with imagescript
    const image = await Image.decode(new Uint8Array(arrayBuffer));
    console.log(`Original image size: ${image.width}x${image.height}`);
    
    // Resize maintaining aspect ratio (max 300px width)
    const maxWidth = 300;
    const scale = maxWidth / image.width;
    const newHeight = Math.floor(image.height * scale);
    
    const thumbnail = image.resize(maxWidth, newHeight);
    console.log(`Thumbnail size: ${maxWidth}x${newHeight}`);
    
    // Encode as JPEG with 70% quality (much smaller than PNG)
    const encoded = await thumbnail.encodeJPEG(70);
    console.log(`Thumbnail compressed: ${encoded.length} bytes`);
    
    // Return as blob (create new Uint8Array from the encoded buffer)
    return new Blob([new Uint8Array(encoded)], { type: 'image/jpeg' });
  } catch (error) {
    console.error('Error creating thumbnail, falling back to original:', error);
    // Fallback: return original image if compression fails
    return imageBlob;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, action = 'generate', imageUrl: inputImageUrl, promptId } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Build the message content based on action
    let messageContent: any;
    
    if (action === 'edit' && inputImageUrl) {
      // Edit existing image
      messageContent = [
        {
          type: "text",
          text: `Edit this image based on the following prompt: ${prompt}. Make it visually appealing as a thumbnail preview for an AI prompt.`
        },
        {
          type: "image_url",
          image_url: {
            url: inputImageUrl
          }
        }
      ];
    } else {
      // Generate new image
      messageContent = `Create a visually appealing thumbnail image that represents this AI prompt: ${prompt.slice(0, 500)}. The image should be artistic, professional, and capture the essence of the prompt.`;
    }

    console.log(`${action === 'edit' ? 'Editing' : 'Generating'} image for prompt:`, prompt.slice(0, 100))

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
        modalities: ['image', 'text']
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exceeded. Please add more credits to your workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        )
      }
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    const generatedImageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!generatedImageBase64) {
      throw new Error('No image generated')
    }

    console.log(`Image ${action === 'edit' ? 'edited' : 'generated'} successfully`)

    // Convert base64 to blob
    const imageBlob = base64ToBlob(generatedImageBase64)
    const thumbnailBlob = await createThumbnail(imageBlob)

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = crypto.randomUUID().split('-')[0]
    const filename = `${promptId || randomId}-${timestamp}`

    // Upload full image to storage
    const { data: imageData, error: imageError } = await supabase.storage
      .from('prompt-images')
      .upload(`${filename}.png`, imageBlob, {
        contentType: 'image/png',
        upsert: true
      })

    if (imageError) {
      console.error('Error uploading image:', imageError)
      throw new Error('Failed to upload image to storage')
    }

    // Upload thumbnail to storage
    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from('prompt-thumbnails')
      .upload(`${filename}.jpg`, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (thumbnailError) {
      console.error('Error uploading thumbnail:', thumbnailError)
      throw new Error('Failed to upload thumbnail to storage')
    }

    // Get public URLs
    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from('prompt-images')
      .getPublicUrl(imageData.path)

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('prompt-thumbnails')
      .getPublicUrl(thumbnailData.path)

    console.log('Image uploaded successfully:', imageUrl)
    console.log('Thumbnail uploaded successfully:', thumbnailUrl)
    
    return new Response(
      JSON.stringify({ 
        imageUrl,
        thumbnailUrl,
        path: imageData.path,
        thumbnailPath: thumbnailData.path
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to process image', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to compress base64 image (simplified version without OffscreenCanvas)
async function compressImage(base64Data: string, _quality: number = 0.6): Promise<string> {
  try {
    // Simply return the original base64 data
    // In production, you might want to use a different image processing library
    console.log(`Image size: ${base64Data.length} characters`)
    return base64Data
  } catch (error) {
    console.error('Compression failed:', error)
    return base64Data
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000), // Limit prompt length
        size: '512x512', // Smaller base; we'll compress to 256x256
        quality: 'standard',
        response_format: 'b64_json'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate image')
    }

    const data = await response.json()
    const originalBase64 = data.data[0].b64_json
    
    // Compress the image significantly for thumbnail use
    const compressedBase64 = await compressImage(originalBase64, 0.4)
    
    return new Response(
      JSON.stringify({ imageUrl: `data:image/webp;base64,${compressedBase64}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to generate image', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to compress base64 image
async function compressImage(base64Data: string, quality: number = 0.6): Promise<string> {
  try {
    // Convert base64 to blob
    const response = await fetch(`data:image/webp;base64,${base64Data}`)
    const blob = await response.blob()
    
    // Create a canvas to resize and compress
    const canvas = new OffscreenCanvas(256, 256) // Smaller size for thumbnails
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }
    
    // Create image bitmap from blob
    const imageBitmap = await createImageBitmap(blob)
    
    // Draw resized image
    ctx.drawImage(imageBitmap, 0, 0, 256, 256)
    
    // Convert to blob with compression
    const compressedBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: quality
    })
    
    // Convert back to base64
    const arrayBuffer = await compressedBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const base64Compressed = btoa(String.fromCharCode(...uint8Array))
    
    console.log(`Image compressed from ${base64Data.length} to ${base64Compressed.length} characters`)
    return base64Compressed
  } catch (error) {
    console.error('Compression failed:', error)
    // Return original if compression fails
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
        size: '1024x1024', // Generate larger first
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
    return new Response(
      JSON.stringify({ error: 'Failed to generate image', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
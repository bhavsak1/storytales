import { fal } from '@fal-ai/client'
import { NextResponse } from 'next/server'

fal.config({
  credentials: process.env.FAL_KEY
})

export async function GET() {
  const result = await fal.subscribe('fal-ai/flux/dev', {
    input: {
      prompt: `Children's storybook illustration, watercolor style, 
      soft warm lighting, pastel colors. A happy girl with curly hair 
      named Aria playing with friendly dinosaurs in a magical forest. 
      Whimsical, cozy, professional children's book quality.`,
      image_size: 'landscape_4_3',
      num_inference_steps: 28,
    }
  })

  return NextResponse.json({ 
    imageUrl: result.data.images[0].url 
  })
}
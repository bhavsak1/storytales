import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

fal.config({ credentials: process.env.FAL_KEY })

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File

    if (!photo) {
      return NextResponse.json({ valid: false, error: 'No photo provided' })
    }

    // Convert photo to base64 for Claude Vision
    const photoBuffer = await photo.arrayBuffer()
    const base64Photo = Buffer.from(photoBuffer).toString('base64')
    const mediaType = photo.type as 'image/jpeg' | 'image/png' | 'image/webp'

    // Step 1: Validate with Claude Vision
    console.log('Validating photo with Claude Vision...')
    const validation = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Photo,
            },
          },
          {
            type: 'text',
            text: `Look at this photo carefully.
            Return JSON only:
            {
              "is_valid": true or false,
              "is_child": true or false,
              "has_clear_face": true or false,
              "reason": "brief reason if invalid"
            }
            
            Set is_valid to true only if:
            - It shows a clear face of a child
            - The face is well lit and visible
            - It is not blurry
            
            Set is_valid to false if:
            - No child's face visible
            - Image is blurry or too dark
            - It's not a photo of a child`
          }
        ]
      }]
    })

    const validationText = validation.content[0].type === 'text'
      ? validation.content[0].text : ''
    const cleaned = validationText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const validationResult = JSON.parse(cleaned)
    console.log('Validation result:', validationResult)

    if (!validationResult.is_valid) {
      return NextResponse.json({
        valid: false,
        error: validationResult.reason || 'Please upload a clear photo of a child.'
      })
    }

    // Check if this is a coloring book upload (skip avatar generation)
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode')

    if (mode === 'coloringbook') {
      // Coloring book mode: save original photo to Supabase, skip Wan avatar
      console.log('Coloring book mode — saving original photo...')
      const fileName = `photos/${Date.now()}-original.jpg`

      const { error: uploadError } = await supabase.storage
        .from('storybooks')
        .upload(fileName, photoBuffer, {
          contentType: photo.type || 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.log('Storage upload error:', uploadError)
        return NextResponse.json({ valid: false, error: 'Could not save photo.' })
      }

      const { data: urlData } = supabase.storage
        .from('storybooks')
        .getPublicUrl(fileName)

      console.log('Photo saved to Supabase:', urlData.publicUrl)
      return NextResponse.json({ valid: true, photoUrl: urlData.publicUrl })
    }

    // Step 2: Upload photo to fal.ai storage
    console.log('Uploading photo to fal.ai...')
    const photoFile = new File([photoBuffer], photo.name, { type: photo.type })
    const photoUrl = await fal.storage.upload(photoFile)
    console.log('Photo uploaded:', photoUrl)

    // Step 3: Generate avatar using Wan 2.6
    console.log('Generating avatar with Wan 2.6...')
    const avatarResult = await fal.subscribe('wan/v2.6/image-to-image', {
      input: {
        prompt: `Convert this child's photo into a beautiful children's storybook character illustration.
        Watercolor art style, soft warm colors, whimsical and magical feel.
        Keep the child's face features, hair color, eye color and skin tone very accurate.
        The character should look exactly like the child but in a storybook illustration style.
        White or transparent background. No text, no borders.
        Professional children's book character quality.`,
        image_urls: [photoUrl],
        negative_prompt: 'realistic photo, photorealistic, blurry, dark, scary, adult, text, watermark',
        num_images: 1,
      }
    }) as { data: { images: { url: string }[] } }

    const avatarUrl = avatarResult.data.images[0].url
    console.log('Avatar generated:', avatarUrl)

    // Step 4: Save avatar to Supabase Storage
    const avatarResponse = await fetch(avatarUrl)
    const avatarBuffer = await avatarResponse.arrayBuffer()
    const fileName = `avatars/${Date.now()}-avatar.jpg`

    const { error: uploadError } = await supabase.storage
      .from('storybooks')
      .upload(fileName, avatarBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.log('Storage upload error:', uploadError)
      // Return the fal.ai URL as fallback
      return NextResponse.json({
        valid: true,
        photoUrl: avatarUrl,
      })
    }

    const { data: urlData } = supabase.storage
      .from('storybooks')
      .getPublicUrl(fileName)

    console.log('Avatar saved to Supabase:', urlData.publicUrl)

    return NextResponse.json({
      valid: true,
      photoUrl: urlData.publicUrl,
    })

  } catch (error) {
    console.log('Validate photo error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Could not process photo. Please try again.'
    })
  }
}
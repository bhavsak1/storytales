import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface StoryPage {
  page: number
  text: string
  scene: string
}

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { childName, age, interests, theme, storyLength, dedication, userId, photoUrl } = await request.json()
    console.log('User ID received:', userId)  
    console.log('Photo URL received:', photoUrl)
    console.log('Photo URL received:', photoUrl)
console.log('Using model:', photoUrl ? 'wan/v2.6/image-to-image' : 'fal-ai/flux/schnell')

    // Step 1: Save order to Supabaseprompt: `Children's storybook
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        child_name: childName,
        child_age: age,
        interests: interests,
        theme: theme,
        status: 'generating',
        user_id: userId,
        amount: 0
      })
      .select()
      .single()

    if (orderError) {
      console.log('Order error:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }
    console.log('Order saved:', order.id)

    // Step 2: Generate story with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Write a 3 page children's story about a child named ${childName}, 
        aged ${age}, who loves ${interests}. Theme: ${theme}.
        Important: You are a master storyteller in the style of Sudha Murthy. 
        Your tone is simple, heartwarming, and moral-focused, yet you weave in modern Indian elements. 
        Use clear, descriptive language and focus on moral of the story. 
        Always ground the story in authentic Indian locations, culture, and values.
        Return JSON only:
        {
          "title": "story title",
          "character": {
          "description": "detailed physical description of ${childName} for illustration consistency - include hair color, hair style, eye color, skin tone, clothing colors and style. Be very specific.",
          "style": "cheerful and expressive"
        },
        "pages": [
          { "page": 1, "text": "story text", "scene": "illustration scene description mentioning ${childName} by name" },
          { "page": 2, "text": "story text", "scene": "illustration scene description mentioning ${childName} by name" },
          { "page": 3, "text": "story text", "scene": "illustration scene description mentioning ${childName} by name" }
        ]
      }`
      }]
    })
    console.log('Claude response received')

    const text = message.content[0].type === 'text'
      ? message.content[0].text : ''
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const story = JSON.parse(cleaned)
    console.log('Story parsed:', story.title)

    // Step 3: Save story to Supabase
    const { data: savedStory, error: storyError } = await supabase
      .from('stories')
      .insert({
        order_id: order.id,
        title: story.title,
        pages_json: story.pages,
        status: 'complete'
      })
      .select()
      .single()

    if (storyError) {
      console.log('Story error:', storyError)
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }
    console.log('Story saved:', savedStory.id)

    // Step 4: Update order status
    // Step 4: Update order status
    // Step 4: Generate illustrations
const { fal } = await import('@fal-ai/client')
fal.config({ credentials: process.env.FAL_KEY })

const imagePromises = story.pages.map((page: StoryPage) =>
  fal.subscribe(
  photoUrl ? 'wan/v2.6/image-to-image' : 'fal-ai/flux/schnell',
  {
    input: photoUrl ? {
      prompt: `Children's storybook illustration, watercolor style,
      soft warm lighting, pastel colors.
      Main character: ${page.scene}.
      The child must look exactly like the reference avatar.
      Keep face, hair color, eye color and skin tone identical to avatar.
      Set in India with warm Indian cultural elements.
      Whimsical, cozy, professional children's book quality.
      No text, no borders.`,
      image_urls: [photoUrl],
      negative_prompt: 'inconsistent character, different face, realistic photo, text, watermark',
      num_images: 1,
    } : {
      prompt: `Children's storybook illustration, watercolor style,
      soft warm lighting, pastel colors. ${page.scene}.
      Set in India with warm Indian cultural elements.
      Whimsical, cozy, professional children's book quality.`,
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
    }
  }
)
)
const imageResults = await Promise.all(imagePromises)
const illustrations = imageResults.map((r: { data: { images: { url: string }[] } }) => r.data.images[0].url)
console.log('Illustrations generated:', illustrations.length)

// Step 5: Save illustrations to Supabase
const illustrationRows = illustrations.map((url: string, index: number) => ({
  order_id: order.id,
  story_id: savedStory.id,
  page_number: index + 1,
  image_url: url,
  prompt_used: story.pages[index].scene,
  status: 'complete'
}))

const { error: illError } = await supabase
  .from('illustrations')
  .insert(illustrationRows)

if (illError) {
  console.log('Illustration save error:', illError)
}

// Step 6: Update order status
await supabase
  .from('orders')
  .update({ status: 'complete' })
  .eq('id', order.id)

// Auto-generate and save PDF
// Auto-generate PDF
try {
  const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3000' : 'http://localhost:3000'}/api/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: story.title,
      pages: story.pages,
      illustrations: illustrations,
      childName: childName,
      dedication: dedication || '',
      orderId: order.id,
    }),
  })
  const pdfData = await pdfResponse.json()
  console.log('PDF auto-generated:', pdfData.pdfUrl)
} catch (pdfError) {
  console.log('PDF generation error:', pdfError)
}
return NextResponse.json({ 
  success: true,
  orderId: order.id,
  story: story,
  illustrations: illustrations
})

  } catch (error) {
    console.log('Caught error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
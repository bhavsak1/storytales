import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ColoringPage {
  page: number
  letter?: string
  number?: string
  word: string
  text: string
  scene: string
}

// ─────────────────────────────────────────────
// Main API handler
// ─────────────────────────────────────────────

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const {
      childName,
      age,
      interests,
      mode,       // 'abc' | '123'
      pageCount,  // 10 | 26
      dedication,
      userId,
      photoUrl,
      existingOrderId,
    } = await request.json()

    console.log('=== Generate Learning Book ===')
    console.log('Mode:', mode, '| Pages:', pageCount)
    console.log('Child:', childName, '| Age:', age)
    console.log('Photo URL:', photoUrl)

    // ── Step 1: Extract child description from photo ───
    let characterDescription = `${childName} is a cheerful child with big bright eyes and a warm smile, wearing colorful clothes.`

    if (photoUrl) {
      try {
        console.log('Extracting child description via Claude Vision...')
        const photoResponse = await fetch(photoUrl)
        const photoBuffer = await photoResponse.arrayBuffer()
        const base64Photo = Buffer.from(photoBuffer).toString('base64')
        const contentType = photoResponse.headers.get('content-type') || 'image/jpeg'

        const visionResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType as 'image/jpeg' | 'image/png' | 'image/webp',
                  data: base64Photo,
                },
              },
              {
                type: 'text',
                text: `Describe this child's appearance for an illustrator. Include:
- Hair style and color
- Skin tone
- Face shape and features
- What they are wearing (or typical clothing style)
Return only a single paragraph description, no JSON, no markdown. Use the name ${childName}.`,
              },
            ],
          }],
        })

        const descText = visionResult.content[0].type === 'text' ? visionResult.content[0].text : ''
        if (descText.trim()) {
          characterDescription = descText.trim()
        }
        console.log('Character description:', characterDescription)
      } catch (descError) {
        console.log('Vision description error (using default):', descError)
      }
    }

    // ── Step 2: Get or create order ──────────
    let orderId: string

    if (existingOrderId) {
      // Payment flow: order already created by /api/create-order
      orderId = existingOrderId
      await supabase
        .from('orders')
        .update({ status: 'generating' })
        .eq('id', orderId)
      console.log('Using existing order:', orderId)
    } else {
      // Legacy/direct flow: create a new order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          child_name: childName,
          child_age: age,
          interests: interests,
          theme: mode === 'abc' ? 'ABC Adventure' : '123 World',
          status: 'generating',
          user_id: userId,
          amount: 199,
          book_type: 'coloringbook',
        })
        .select()
        .single()

      if (orderError) {
        console.log('Order error:', orderError)
        return NextResponse.json({ error: orderError.message }, { status: 500 })
      }
      orderId = order.id
      console.log('New order saved:', orderId)
    }

    // ── Step 3: Build Claude prompt for learning book ───
    const isAbc = mode === 'abc'
    const items = isAbc
      ? Array.from({ length: pageCount }, (_, i) => String.fromCharCode(65 + i))
      : Array.from({ length: pageCount }, (_, i) => String(i + 1))

    const itemLabel = isAbc ? 'letter' : 'number'
    const itemField = isAbc ? 'letter' : 'number'
    const themeName = isAbc ? 'ABC Adventure' : '123 World'

    const systemPrompt = `You are a master children's educational book writer specializing in fun, connected learning stories for ages 2-6.

Your writing rules:
- Each page teaches one ${itemLabel} through a story moment
- All pages form ONE connected adventure — ${childName} goes on a journey
- Each page: 1-2 short sentences (max 15 words each), age-appropriate vocabulary
- Each page has a highlight word starting with (or representing) that ${itemLabel}
- The word must be concrete and visual (easy to illustrate)
- Ground scenes in warm Indian settings: kitchen garden, village market, festival, riverside
- Include elements from the child's interests naturally
- The tone is warm, playful, and encouraging
- Return ONLY valid JSON. No markdown, no explanation.`

    const pageTemplate = isAbc
      ? `{ "page": 1, "letter": "A", "word": "Apple", "text": "${childName} found a big red Apple...", "scene": "${childName} stands in a garden holding a big Apple, smiling..." }`
      : `{ "page": 1, "number": "1", "word": "Sun", "text": "${childName} saw one bright Sun...", "scene": "${childName} looks up at one bright sun in the sky..." }`

    const userPrompt = `Write a ${pageCount}-page ${themeName} learning book for ${childName} (age ${age}) who loves ${interests}.

${isAbc ? `Letters to cover: ${items.join(', ')}` : `Numbers to cover: ${items.join(', ')}`}

STORY ARC: ${childName} goes on a connected journey/adventure. Each ${itemLabel} is a stop along the way. The adventure should feel like one flowing story, not disconnected pages.

INTERESTS — weave these into the story naturally: ${interests}
For example, if they love dinosaurs, the letter D could feature a Dinosaur. If they love space, S could be a Star.

CHARACTER: ${characterDescription}

Return this exact JSON:
{
  "title": "4-6 word playful title for this ${themeName} book",
  "pages": [
    ${pageTemplate},
    ... (${pageCount} pages total, one per ${itemLabel})
  ]
}

Each page must have: page, ${itemField}, word, text (1-2 sentences), scene (detailed illustration description showing ${childName} in the scene with the ${itemLabel} and word prominently visible).`

    // ── Step 4: Generate story with Claude ───
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    console.log('Claude response received')

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    const story = JSON.parse(cleaned)
    console.log('Story parsed:', story.title, '— pages:', story.pages.length)

    // ── Step 5: Save story to Supabase ───────
    const { data: savedStory, error: storyError } = await supabase
      .from('stories')
      .insert({
        order_id: orderId,
        title: story.title,
        pages_json: story.pages,
        status: 'complete',
      })
      .select()
      .single()

    if (storyError) {
      console.log('Story error:', storyError)
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }
    console.log('Story saved:', savedStory.id)

    // ── Step 6: Generate line-art illustrations ───
    const { fal } = await import('@fal-ai/client')
    fal.config({ credentials: process.env.FAL_KEY })

    console.log(`Generating ${story.pages.length} coloring page illustrations...`)

    const imagePromises = story.pages.map((page: ColoringPage) => {
      const itemChar = isAbc ? page.letter : page.number
      return fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: `Children's coloring book page, thick black outlines only, white background, no color fills, simple clean line art, printable style. ${characterDescription}. ${page.scene}. Large ${itemLabel} "${itemChar}" visible in the scene, drawn in bold outline style. No shading, no gray, no color. Clean black lines on pure white background.`,
          image_size: 'portrait_4_3',
          num_inference_steps: 4,
        },
      })
    })

    const imageResults = await Promise.all(imagePromises)
    const illustrations = imageResults.map(
      (r: { data: { images: { url: string }[] } }) => r.data.images[0].url
    )
    console.log('Illustrations generated:', illustrations.length)

    // ── Step 7: Save illustrations to Supabase ─
    const illustrationRows = illustrations.map((url: string, index: number) => ({
      order_id: orderId,
      story_id: savedStory.id,
      page_number: index + 1,
      image_url: url,
      prompt_used: story.pages[index].scene,
      status: 'complete',
    }))

    const { error: illError } = await supabase
      .from('illustrations')
      .insert(illustrationRows)

    if (illError) {
      console.log('Illustration save error:', illError)
    }

    // ── Step 8: Update order status ──────────
    await supabase
      .from('orders')
      .update({ status: 'complete' })
      .eq('id', orderId)

    // ── Step 9: Auto-generate coloring PDF ────
    try {
      const pdfResponse = await fetch('http://localhost:3000/api/generate-coloring-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          pages: story.pages,
          illustrations,
          childName,
          dedication: dedication || '',
          orderId: orderId,
          mode,
        }),
      })
      const pdfData = await pdfResponse.json()
      console.log('Coloring PDF auto-generated:', pdfData.pdfUrl)
    } catch (pdfError) {
      console.log('PDF generation error:', pdfError)
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      story,
      illustrations,
    })
  } catch (error) {
    console.log('Caught error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

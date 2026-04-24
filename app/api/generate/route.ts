import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  StoryPage,
  resolvePageCount,
  getIllustratedPages,
  extractSceneDescription,
  buildPrompt,
} from '@/lib/story-prompts'

// ─────────────────────────────────────────────
// Main API handler
// ─────────────────────────────────────────────

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const {
      childName,
      age,
      gender,
      interests,
      theme,
      storyLength,
      dedication,
      userId,
      photoUrl,
      existingOrderId,
    } = await request.json()

    console.log('User ID received:', userId)
    console.log('Photo URL received:', photoUrl)
    console.log('Age group:', age)
    console.log('Story length input:', storyLength)

    // ── Resolve page count ───────────────────
    const pageCount = resolvePageCount(storyLength, age)
    console.log('Resolved page count:', pageCount)

    // ── Step 1: Get or create order ──────────
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
          theme: theme,
          status: 'generating',
          user_id: userId,
          amount: 0,
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

    // ── Step 2: Build age-adaptive prompts ───
    const { systemPrompt, userPrompt } = buildPrompt({
      childName,
      age,
      gender: gender || 'Keep it neutral',
      interests,
      theme,
      pageCount,
    })

    // ── Step 3: Generate story with Claude ───
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    console.log('Claude response received')

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const story = JSON.parse(cleaned)
    console.log('Story parsed:', story.title, '— pages:', story.pages.length)

    // ── Step 4: Save story to Supabase ───────
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

    // ── Step 5: Generate illustrations ───────
    const { fal } = await import('@fal-ai/client')
    fal.config({ credentials: process.env.FAL_KEY })

    // Filter to only pages that need an illustration
    const illustratedPages = getIllustratedPages(age, pageCount)
    const pagesToIllustrate = story.pages.filter((page: StoryPage) => {
      const sceneDesc = extractSceneDescription(page.scene)
      const isIllustratedPage = illustratedPages.includes(page.page)
      return sceneDesc !== null && isIllustratedPage
    })

    console.log(
      `Illustrating ${pagesToIllustrate.length} of ${story.pages.length} pages`
    )

    const imagePromises = pagesToIllustrate.map((page: StoryPage) => {
      const sceneDesc = extractSceneDescription(page.scene) ?? ''
      return fal.subscribe(
        photoUrl ? 'wan/v2.6/image-to-image' : 'fal-ai/flux/schnell',
        {
          input: photoUrl
            ? {
                prompt: `Children's storybook illustration, Traditional hand-painted watercolor and loose-ink narrative illustration on textured paper. Featuring loose brushwork and soft, bleeding color edges. Soft, pen-and-ink or soft graphite outlines with variable weight. The entire image has a vignette composition with rough, bleeding watercolor wash edges against a textured white paper background. Special attention to the bleeding edges where the color fields meet, making sure they look natural and not contained. No clean vector lines or tight boundaries.
                Main character: ${sceneDesc}.
                The child must look exactly like the reference avatar.
                Keep face, hair color, eye color and skin tone identical to avatar.
                Set in India with warm Indian cultural elements.
                Whimsical, cozy, professional children's book quality.
                No text, no borders.`,
                image_urls: [photoUrl],
                negative_prompt:
                  'inconsistent character, different face, text, watermark',
                num_images: 1,
              }
            : {
                prompt: `Children's storybook illustration, watercolor style,
                soft warm lighting, pastel colors. ${sceneDesc}.
                Set in India with warm Indian cultural elements.
                Whimsical, cozy, professional children's book quality.`,
                image_size: 'landscape_4_3',
                num_inference_steps: 4,
              },
        }
      )
    })

    const imageResults = await Promise.all(imagePromises)
    const illustrationUrls = imageResults.map(
      (r: { data: { images: { url: string }[] } }) => r.data.images[0].url
    )
    console.log('Illustrations generated:', illustrationUrls.length)

    // Build full illustrations array — null for text-only pages
    // so page index always matches illustration index on the frontend
    const illustrations = story.pages.map((page: StoryPage) => {
      const pageIndex = pagesToIllustrate.findIndex(
        (p: StoryPage) => p.page === page.page
      )
      return pageIndex !== -1 ? illustrationUrls[pageIndex] : null
    })

    // ── Step 6: Save illustrations to Supabase ─
    const illustrationRows = illustrationUrls.map(
      (url: string, index: number) => ({
        order_id: orderId,
        story_id: savedStory.id,
        page_number: pagesToIllustrate[index].page,
        image_url: url,
        prompt_used:
          extractSceneDescription(pagesToIllustrate[index].scene) ?? '',
        status: 'complete',
      })
    )

    const { error: illError } = await supabase
      .from('illustrations')
      .insert(illustrationRows)

    if (illError) {
      console.log('Illustration save error:', illError)
    }

    // ── Step 7: Update order status ──────────
    await supabase
      .from('orders')
      .update({ status: 'complete' })
      .eq('id', orderId)

    // ── Step 8: Auto-generate PDF ─────────────
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'
      const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          pages: story.pages,
          illustrations,
          childName,
          dedication: dedication || '',
          orderId: orderId,
        }),
      })
      const pdfData = await pdfResponse.json()
      console.log('PDF auto-generated:', pdfData.pdfUrl)
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
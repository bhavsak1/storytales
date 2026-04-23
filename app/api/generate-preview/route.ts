import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import {
  StoryPage,
  extractSceneDescription,
  buildPrompt,
} from '@/lib/story-prompts'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { childName, age, interests, theme, gender, photoUrl } = await request.json()

    console.log('=== Generate Story Preview (2 pages) ===')
    console.log('Child:', childName, '| Age:', age, '| Theme:', theme)

    // ── Use the EXACT same prompt builder as full generation, just with 2 pages ──
    const { systemPrompt, userPrompt } = buildPrompt({
      childName,
      age: age || '4-5 years',
      gender: gender || 'Keep it neutral',
      interests,
      theme,
      pageCount: 2,
    })

    // ── Generate story with Claude (same model as full generation) ──
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    // Robust JSON parsing — handle truncated responses
    let story: { title: string; pages: StoryPage[] }
    try {
      story = JSON.parse(cleaned)
    } catch {
      console.log('JSON parse failed, attempting to repair truncated response...')
      // Try to close the JSON structure if it was truncated
      let repaired = cleaned
      // Count open/close braces and brackets to close any unclosed ones
      const openBraces = (repaired.match(/{/g) || []).length
      const closeBraces = (repaired.match(/}/g) || []).length
      const openBrackets = (repaired.match(/\[/g) || []).length
      const closeBrackets = (repaired.match(/]/g) || []).length

      // If we're inside a string value, close it
      // Find the last complete page object and truncate there
      const lastCompletePageEnd = repaired.lastIndexOf('},')
      const lastCompletePageEnd2 = repaired.lastIndexOf('}]')
      const cutPoint = Math.max(lastCompletePageEnd, lastCompletePageEnd2)

      if (cutPoint > 0) {
        repaired = repaired.substring(0, cutPoint + 1)
        // Close remaining brackets and braces
        const newOpenBrackets = (repaired.match(/\[/g) || []).length
        const newCloseBrackets = (repaired.match(/]/g) || []).length
        const newOpenBraces = (repaired.match(/{/g) || []).length
        const newCloseBraces = (repaired.match(/}/g) || []).length
        repaired += ']'.repeat(Math.max(0, newOpenBrackets - newCloseBrackets))
        repaired += '}'.repeat(Math.max(0, newOpenBraces - newCloseBraces))
      } else {
        // Fallback: just try to close everything
        repaired += '"'.repeat(openBraces % 2) // close any open string
        repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets))
        repaired += '}'.repeat(Math.max(0, openBraces - closeBraces))
      }

      try {
        story = JSON.parse(repaired)
        console.log('Successfully repaired truncated JSON')
      } catch (e2) {
        console.log('JSON repair also failed:', e2)
        throw new Error('Could not parse story response. Please try again.')
      }
    }
    console.log('Preview story parsed:', story.title, '— pages:', story.pages.length)

    // ── Generate illustrations (same approach as full generation) ──
    const { fal } = await import('@fal-ai/client')
    fal.config({ credentials: process.env.FAL_KEY })

    const pagesToIllustrate = story.pages.filter((page: StoryPage) => {
      const sceneDesc = extractSceneDescription(page.scene)
      return sceneDesc !== null
    })

    console.log(`Illustrating ${pagesToIllustrate.length} preview pages`)

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

    // Build illustrations array matching page indices
    const illustrations = story.pages.map((page: StoryPage) => {
      const pageIndex = pagesToIllustrate.findIndex(
        (p: StoryPage) => p.page === page.page
      )
      return pageIndex !== -1 ? illustrationUrls[pageIndex] : null
    })

    console.log('Preview illustrations generated:', illustrationUrls.length)

    return NextResponse.json({
      success: true,
      title: story.title,
      pages: story.pages,
      illustrations,
    })
  } catch (error) {
    console.log('Preview generation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

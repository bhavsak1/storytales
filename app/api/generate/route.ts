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
    const { childName, age, interests, theme, storyLength, dedication, userId } = await request.json()
    console.log('User ID received:', userId)  

    // Step 1: Save order to Supabase
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
  fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt: ` A soft watercolor and colored pencil storybook illustration. 
      The medium features gentle pencil sketched outlines, warm, blended wash colors, and a nostalgic, cozy atmosphere typical of children's literature from India. 
      Authentic traditional Indian architecture, furniture, and clothing are featured throughout.
      Whimsical, cozy, Sudha Murthy book style,professional children's book quality. ${page.scene}.
      Keep character consistency with this description: ${story.character.description} and style: ${story.character.style}
      `,
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
    }
  })
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
try {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Cover page
  doc.setFillColor(255, 248, 238)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  doc.setTextColor(45, 27, 0)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(story.title, pageWidth - 40)
  doc.text(titleLines, pageWidth / 2, 80, { align: 'center' })
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(92, 61, 30)
  doc.text(`A personalized story for ${childName}`, pageWidth / 2, 120, { align: 'center' })
  doc.setFontSize(12)
  doc.setTextColor(244, 168, 50)
  doc.text('Created with StoryTales', pageWidth / 2, 140, { align: 'center' })

  // Story pages
  for (const page of story.pages) {
    doc.addPage()
    doc.setFillColor(255, 248, 238)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(244, 168, 50)
    doc.text(`Page ${page.page} of ${story.pages.length}`, pageWidth / 2, 12, { align: 'center' })

    // Try to embed illustration
    const imageUrl = illustrations[page.page - 1]
    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        const imageData = `data:image/jpeg;base64,${base64}`
        doc.addImage(imageData, 'JPEG', 20, 18, pageWidth - 40, 120)
      } catch {
        doc.setFillColor(232, 213, 176)
        doc.roundedRect(20, 18, pageWidth - 40, 120, 4, 4, 'F')
      }
    }

    doc.setFontSize(13)
    doc.setTextColor(45, 27, 0)
    doc.setFont('helvetica', 'normal')
    const textLines = doc.splitTextToSize(page.text, pageWidth - 40)
    doc.text(textLines, pageWidth / 2, 158, { align: 'center' })
  }

  // Last page
  doc.addPage()
  doc.setFillColor(255, 248, 238)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(244, 168, 50)
  doc.text('The End', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(92, 61, 30)
  doc.text('Created with love using StoryTales', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' })

  // Save to Supabase Storage
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  const fileName = `${order.id}-${childName}-storybook.pdf`

  const { error: uploadError } = await supabase.storage
    .from('storybooks')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (!uploadError) {
    const { data: urlData } = supabase.storage
      .from('storybooks')
      .getPublicUrl(fileName)

    // Update story with PDF URL
    await supabase
      .from('stories')
      .update({ pdf_url: urlData.publicUrl })
      .eq('order_id', order.id)

    console.log('PDF auto-saved:', urlData.publicUrl)
  }
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
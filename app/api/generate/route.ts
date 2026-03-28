import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { childName, age, interests, theme } = await request.json()
    console.log('Received:', { childName, age, interests, theme })

    // Step 1: Save order to Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        child_name: childName,
        child_age: age,
        interests: interests,
        theme: theme,
        status: 'generating',
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
        Return JSON only:
        {
          "title": "story title",
          "pages": [
            { "page": 1, "text": "story text", "scene": "illustration scene description" },
            { "page": 2, "text": "story text", "scene": "illustration scene description" },
            { "page": 3, "text": "story text", "scene": "illustration scene description" }
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
    await supabase
      .from('orders')
      .update({ status: 'complete' })
      .eq('id', order.id)

    return NextResponse.json({ 
      success: true,
      orderId: order.id,
      story: story
    })

  } catch (error) {
    console.log('Caught error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
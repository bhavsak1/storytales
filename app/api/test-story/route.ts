import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function GET() {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Write a 3 page children's story about a girl named Aria who loves dinosaurs.
      Return JSON only with this structure:
      {
        "title": "story title",
        "pages": [
          { "page": 1, "text": "story text for page 1" },
          { "page": 2, "text": "story text for page 2" },
          { "page": 3, "text": "story text for page 3" }
        ]
      }`
    }]
  })

  const text = message.content[0].type === 'text' 
    ? message.content[0].text 
    : ''

  // Remove markdown code blocks if Claude adds them
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()
    
  return NextResponse.json(JSON.parse(cleaned))
}
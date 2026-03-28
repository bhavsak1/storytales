import { inngest } from './inngest'
import Anthropic from '@anthropic-ai/sdk'
import { fal } from '@fal-ai/client'

const anthropic = new Anthropic()

fal.config({
  credentials: process.env.FAL_KEY
})

interface StoryPage {
  page: number
  text: string
  scene: string
}

export const generateStory = inngest.createFunction(
  {
    id: 'generate-story',
    triggers: [{ event: 'story/generate' }]
  },
  async ({ event }: { event: { data: { childName: string, age: string, interests: string, theme: string } } }) => {
    const { childName, age, interests, theme } = event.data

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Write a 3 page children's story about a child named ${childName}, 
        aged ${age}, who loves ${interests}. Theme: ${theme}.
        Return JSON only:
        {
          "title": "story title",
          "pages": [
            { "page": 1, "text": "...", "scene": "illustration scene description" },
            { "page": 2, "text": "...", "scene": "illustration scene description" },
            { "page": 3, "text": "...", "scene": "illustration scene description" }
          ]
        }`
      }]
    })
    
    const text = message.content[0].type === 'text' 
      ? message.content[0].text : ''
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const story = JSON.parse(cleaned)

    const imagePromises = story.pages.map((page: StoryPage) => 
      fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt: `Children's storybook illustration, watercolor style, 
          soft warm lighting, pastel colors. ${page.scene}. 
          Whimsical, cozy, professional children's book quality.`,
          image_size: 'landscape_4_3',
          num_inference_steps: 28,
        }
      })
    )
    const results = await Promise.all(imagePromises)
    const illustrations = results.map((r: { data: { images: { url: string }[] } }) => r.data.images[0].url)
    return { story, illustrations }
  }
)
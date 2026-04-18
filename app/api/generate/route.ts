import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface StoryPage {
  page: number
  text: string
  scene: string | SceneObject
}

interface SceneObject {
  description: string
  speech_bubble: {
    speaker: string
    line: string
  }
}

// ─────────────────────────────────────────────
// Age → recommended pages mapping
// ─────────────────────────────────────────────

const AGE_RECOMMENDED_PAGES: Record<string, number> = {
  '2-3 years': 6,
  '4-5 years': 6,
  '6-7 years': 8,
  '8-10 years': 10,
  '11+ years': 15,
}

// ─────────────────────────────────────────────
// Resolve final page count
// ─────────────────────────────────────────────

function resolvePageCount(storyLength: string, age: string): number {
  if (storyLength === 'recommended') {
    return AGE_RECOMMENDED_PAGES[age] ?? 6
  }
  return parseInt(storyLength, 10) || 6
}

// ─────────────────────────────────────────────
// Build page scaffold for JSON schema in prompt
// ─────────────────────────────────────────────

function buildPageScaffold(
  pageCount: number,
  useNestedScene: boolean,
  illustratedPages: number[]
): string {
  return Array.from({ length: pageCount }, (_, i) => {
    const pageNum = i + 1
    const isIllustrated = illustratedPages.includes(pageNum)
    const sceneValue = isIllustrated
      ? useNestedScene
        ? `{ "description": "...", "speech_bubble": { "speaker": "...", "line": "..." } }`
        : `"Detailed illustration prompt: exact setting, what ${'{childName}'} is doing, colors, mood, Indian cultural detail. Always name ${'{childName}'}. "`
      : `"text only page — no illustration"`

    return `    { "page": ${pageNum}, "text": "...", "scene": ${sceneValue} }`
  }).join(',\n')
}

// ─────────────────────────────────────────────
// Which pages get illustrations
// ─────────────────────────────────────────────

function getIllustratedPages(age: string, pageCount: number): number[] {
  if (age === '2-3 years' || age === '4-5 years') {
    // Every page illustrated
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  if (age === '6-7 years') {
    // Every page illustrated
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  if (age === '8-10 years') {
    // Odd pages only: 1, 3, 5, 7, 9
    return Array.from({ length: pageCount }, (_, i) => i + 1).filter(p => p % 2 !== 0)
  }
  if (age === '11+ years') {
    // Only page 1 and last page
    return [1, pageCount]
  }
  return Array.from({ length: pageCount }, (_, i) => i + 1)
}

// ─────────────────────────────────────────────
// Main prompt builder
// ─────────────────────────────────────────────

function buildPrompt(params: {
  childName: string
  age: string
  gender: string
  interests: string
  theme: string
  pageCount: number
}): { systemPrompt: string; userPrompt: string } {
  const { childName, age, gender, interests, theme, pageCount } = params

  const pronoun = gender === 'Girl' ? 'she' : gender === 'Boy' ? 'he' : 'they'
  const pronounPossessive = gender === 'Girl' ? 'her' : gender === 'Boy' ? 'his' : 'their'
  const illustratedPages = getIllustratedPages(age, pageCount)
  const useNestedScene = age === '2-3 years' || age === '4-5 years'
  const pageScaffold = buildPageScaffold(pageCount, useNestedScene, illustratedPages)
    .replace(/\{childName\}/g, childName)

  // ── 2-3 years ──────────────────────────────
  if (age === '2-3 years') {
    const systemPrompt = `You are a master children's story writer specializing in toddler books for ages 2-3.

Your writing rules are absolute:
- Maximum 3 sentences per page. Each sentence is 4-7 words only.
- Use only words a 2-year-old knows: eat, big, little, happy, run, soft, loud, yummy, found, gave, hugged.
- Use one sound word per page: munch! oink! splash! giggle! boom! yummy! moo! quack!
- Every page — ${childName} DOES something. ${pronoun} runs, finds, gives, hugs, laughs. Never passive.
- Use gentle repetition across pages. Same phrase returns slightly changed.
- The child is always the hero. ${pronoun} discovers, ${pronoun} decides, ${pronoun} acts.

DIALOGUE RULES:
- Every page must have exactly one line of spoken dialogue — either from ${childName} or the animal.
- Dialogue is short: 3-5 words only. Sound like a real toddler or a funny animal voice.
- Weave dialogue naturally into narration. Example: ${childName} held out her roti. "Here you go!" she said. Munch!
- Animal voice: playful and warm. Child voice: simple and enthusiastic.
- Only use: said, asked, whispered, giggled, shouted.

ILLUSTRATION SPEECH BUBBLE RULES:
- Every scene description must include a speech_bubble field.
- Speech bubble: the single most important spoken line from that page.
- Keep it 3-5 words — fits inside a small illustrated bubble.
- Attribute clearly: who is speaking and what they say.

- Ground every scene in warm Indian life: steel dabba, banana leaf, courtyard, Dadi's kitchen, mango tree, kolam, marigold garlands.
- The moral is NEVER stated. It lives only in the final image.
- Story must feel warm, cozy, and safe. No conflict stronger than "hungry" or "lost."
- Return only valid JSON. No markdown, no explanation, no preamble.`

    const userPrompt = `Write a ${pageCount}-page toddler story for a 2-3 year old ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} named ${childName} who loves ${interests}. The story world is: ${theme}.

INTERESTS — weave ALL of these equally across pages: ${interests}.
Each interest must appear meaningfully on at least one page — not all crammed onto one page.

Build the story using these building blocks:
- Include animals and food items drawn from ${childName}'s interests: ${interests}
- By page 2: ${childName} discovers something surprising — an animal, a sound, a visitor
- By page ${Math.floor(pageCount * 0.6)}: ${childName} does one kind act — shares food, gives a hug, helps someone
- Final page: Warm, cozy resolution — everyone is happy, full, or together
- Include exactly one funny sound-word moment per page
- Include one moment of repetition — a phrase or action that echoes an earlier page
- Setting must reflect the theme (${theme}) but grounded in Indian life: courtyard, kitchen garden, rooftop, or market
- ${childName} must drive every page — ${pronoun} discovers, ${pronoun} decides, ${pronoun} acts

DIALOGUE REQUIREMENTS:
- Every page must have one natural dialogue line woven into the narration
- Child's voice: enthusiastic, simple — "More please!" / "Come here!" / "I share!"
- Animal's voice: warm and funny — "Moo?" / "More roti?" / "Thank you, ${childName}!"
- Read-aloud feel: a parent doing voices should feel natural and fun

Invent a surprising, non-generic plot with one unexpected funny moment. Do not use a predictable "child finds animal, feeds it, hugs it" arc.

Character description for illustration consistency:
${childName} is a cheerful toddler with big brown eyes, short black hair, wearing a bright colourful outfit suited to ${pronounPossessive} adventures. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} has a wide smile and chubby cheeks. Style: round, soft, expressive — like a Masha and the Bear character.

Return this exact JSON:
{
  "title": "4-5 word title, playful and rhyme-y",
  "character": {
    "description": "Write ${childName}'s full physical description here for illustration consistency",
    "style": "round, soft, expressive — like a Masha and the Bear character"
  },
  "pages": [
${pageScaffold}
  ]
}`

    return { systemPrompt, userPrompt }
  }

  // ── 4-5 years ──────────────────────────────
  if (age === '4-5 years') {
    const systemPrompt = `You are a master children's story writer specializing in picture books for ages 4-5.

Your writing rules are absolute:
- 3-5 sentences per page. Each sentence 8-12 words.
- Vocabulary: simple but slightly richer — brave, curious, worried, discovered, wonderful, finally.
- One new interesting word per story — explained through context, never directly.
- Every page has one clear emotion ${childName} feels — show it through action, not words.
- ${childName} faces a small real problem: something lost, someone lonely, something that seems scary.
- ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} tries at least twice before succeeding — effort matters.
- Include one animal character with a distinct personality (shy, greedy, funny, proud).
- Ground every scene in warm, specific Indian life: jalebis, autorickshaw, kolam, Pongal, gulab jamun, neem tree, charpoy.
- Moral is shown through the story's ending — never stated, never lectured.

DIALOGUE RULES:
- Each page must have 1-2 lines of natural dialogue woven into the narration.
- Dialogue reveals character personality — the animal sounds like itself (nervous, boastful, sweet).
- Child's voice: curious and kind — "But why?" / "I can help!" / "Don't be scared."
- Animal's voice: distinct personality — a proud peacock speaks differently from a shy mouse.
- Dialogue moves the story forward — not just describing what is happening.
- Use a variety of tags: said, whispered, grumbled, laughed, called out, announced.

ILLUSTRATION SPEECH BUBBLE RULES:
- Every scene description must include a speech_bubble field.
- Pick the single most character-revealing line from that page for the bubble.
- Maximum 6 words — fits a small illustrated speech bubble.
- Alternate speakers across pages — do not give ${childName} the bubble every page.

- Return only valid JSON. No markdown, no explanation, no preamble.`

    const userPrompt = `Write a ${pageCount}-page picture book story for a 4-5 year old ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} named ${childName} who loves ${interests}. The story world is: ${theme}.

INTERESTS — weave ALL of these equally across pages: ${interests}.
Each interest must appear meaningfully on at least one page — not all crammed onto one page.
At least one interest drives the central plot. Others appear as details, settings, or character moments.

Build the story using these building blocks:
- Include at least one animal with a distinct personality drawn from ${childName}'s interests
- Include food items and other elements from: ${interests}
- Page 1: Establish ${childName}'s world, spark ${pronounPossessive} curiosity — something unusual catches ${pronounPossessive} eye
- Page 2: ${childName} discovers a problem — something is lost, wrong, or someone needs help
- Page ${Math.ceil(pageCount * 0.4)}: ${childName} tries to solve it. First attempt fails or surprises ${pronounPossessive}.
- Page ${Math.ceil(pageCount * 0.6)}: ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} tries again differently. The animal helps or complicates things.
- Page ${pageCount - 1}: Problem solved through ${childName}'s kindness or cleverness — not luck.
- Page ${pageCount}: Warm resolution. Something small but meaningful changes.
- Setting must feel vividly Indian and reflect the theme (${theme}): a festival, a street market, a grandmother's home, a village.
- The animal must appear in at least half the pages and have one funny or surprising moment.

DIALOGUE REQUIREMENTS:
- Every page has 1-2 dialogue lines woven naturally into narration
- Animal personality comes through in HOW it speaks
- Example: Shy mouse: "I... I don't think I can," it squeaked, hiding behind the flour pot.
- Dialogue should feel like a read-aloud performance — fun for parents to do different voices

Invent a specific, non-generic plot. Avoid: "child helps lost animal find home."
Push for something unexpected — a festival gone wrong, a food mystery, a misunderstanding between animals.

Character description for illustration consistency:
${childName} is a curious ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} with bright brown eyes, hair tied neatly, wearing a colourful kurta and leggings suited to ${pronounPossessive} adventures. Style: warm watercolor, expressive face, slightly Pixar-like proportions.

Return this exact JSON:
{
  "title": "5-6 word title, curious and adventurous in tone",
  "character": {
    "description": "Write ${childName}'s full physical description here for illustration consistency",
    "style": "warm watercolor, expressive, slightly Pixar-like proportions"
  },
  "pages": [
${pageScaffold}
  ]
}`

    return { systemPrompt, userPrompt }
  }

  // ── 6-7 years ──────────────────────────────
  if (age === '6-7 years') {
    const systemPrompt = `You are a master children's story writer specializing in early adventure picture books for ages 6-7.

Your writing rules are absolute:
- 4-6 sentences per page. Sentences can be 10-16 words.
- Vocabulary: adventurous — daring, enormous, trembling, discover, ancient, mysterious, zoomed, whispered.
- Introduce 1-2 new words per story, explained through context.
- ${childName} is a proper hero — brave, makes real decisions, faces real age-appropriate stakes.
- Include a sidekick: one animal or friend with a distinct funny or loyal personality.
- The problem must have 3 clear obstacles — not just one. Each harder than the last.
- Include one moment of self-doubt for ${childName} — and one moment where ${pronoun} pushes through anyway.
- Humor is welcome — funny misunderstandings, a cowardly sidekick, a snooty villain animal.
- Ground in India — real festivals, real foods, real places: Goa beach, Rajasthan fort, Kerala backwaters, Mysore palace, Mumbai local train, Hampi ruins.
- Moral is complex: courage, honesty, or loyalty — tested under pressure, never preached.
- Return only valid JSON. No markdown, no explanation, no preamble.`

    const userPrompt = `Write a ${pageCount}-page adventure story for a 6-7 year old ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} named ${childName} who loves ${interests}. The story world is: ${theme}.

INTERESTS — weave ALL of these equally across pages: ${interests}.
Each interest must appear meaningfully — at least one drives the central plot, at least one appears in a funny or exciting moment, at least one connects ${childName} to ${pronounPossessive} sidekick.

Build the story using these building blocks:
- Include one animal sidekick with a strong funny personality (cowardly, greedy, dramatic, or proud)
- Include elements from ALL of ${childName}'s interests: ${interests}
- Page 1: Establish ${childName}'s world. Drop a hook in the last sentence.
- Page 2: The adventure begins — an unexpected discovery, invitation, or problem appears.
- Page ${Math.ceil(pageCount * 0.35)}: First obstacle — surprising and slightly funny.
- Page ${Math.ceil(pageCount * 0.5)}: Second obstacle — harder. ${childName} almost gives up. Sidekick says something unhelpful but funny.
- Page ${Math.ceil(pageCount * 0.65)}: A clue or unexpected help arrives. ${childName} figures something important out.
- Page ${Math.ceil(pageCount * 0.8)}: Third and final obstacle — biggest challenge. ${childName} must be brave or clever.
- Page ${pageCount - 1}: Victory — but with one small twist. It doesn't go perfectly and that's okay.
- Page ${pageCount}: Warm resolution. Something in ${childName}'s world is different now.

Setting must be a specific vivid Indian location tied to the theme (${theme}). Name the place.
The animal sidekick must appear on at least half the pages. Give it one running joke that pays off at the end.

Invent a surprising non-generic plot. Avoid: "child goes on a treasure hunt."
Push for something original: a cook-off at a royal palace, a runaway festival elephant, a mystery on a houseboat, a lost recipe that saves a grandmother's restaurant.

Character description for illustration consistency:
${childName} is a brave ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} with bright brown eyes, hair tied back, wearing a practical outfit with red sneakers suited to adventure. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} has a determined expression. Style: detailed watercolor with warm golden Indian light, dynamic action poses.

Return this exact JSON:
{
  "title": "6-7 word title, bold and exciting",
  "character": {
    "description": "Write ${childName}'s full physical description here for illustration consistency",
    "style": "detailed watercolor, warm golden Indian light, dynamic poses"
  },
  "pages": [
${pageScaffold}
  ]
}`

    return { systemPrompt, userPrompt }
  }

  // ── 8-10 years ─────────────────────────────
  if (age === '8-10 years') {
    const systemPrompt = `You are a master children's story writer in the style of Sudha Murthy — warm, grounded, morally rich, and deeply Indian. You write for readers aged 8-10 who are ready for real stories with real emotions.

Your writing rules are absolute:
- 6-8 sentences per page. Rich full paragraphs. Sentences up to 20 words.
- Vocabulary: sophisticated but never alienating — reluctant, peculiar, realised, hesitated, enormous responsibility, unexpected consequence.
- Introduce 2-3 new words per story, always clear from context.
- ${childName} faces a moral dilemma — not just a physical challenge. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} must choose between two things ${pronoun} values.
- Supporting characters have real depth — the antagonist has a reason, the helper has a flaw.
- Illustrated pages only on odd pages and select pages. Text carries the story on the rest.
- Include dialogue — it should feel natural and reveal character, not just move plot.
- Ground deeply in India — specific regional culture, real geography, real festivals, real food with its stories.
- The moral is complex and never resolved neatly. ${childName} grows — but the world stays complicated.
- Writing style: warm, wise, quietly funny, like a favourite grandmother telling a story.
- Return only valid JSON. No markdown, no explanation, no preamble.`

    const userPrompt = `Write a ${pageCount}-page story for an 8-10 year old ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} named ${childName} who loves ${interests}. The story world is: ${theme}.

INTERESTS — weave ALL of these equally across pages: ${interests}.
At least one interest has symbolic meaning in the story. At least one carries a family memory or cultural significance. At least one connects two characters together.

Build the story using these building blocks:
- Include an animal that has symbolic meaning — not just a pet or sidekick
- Include a food item that carries cultural or family memory — a recipe, a tradition, a smell
- Weave in all of ${childName}'s interests naturally: ${interests}
- Page 1: Establish ${childName}'s world with a rich specific detail. End with something that disrupts ${pronounPossessive} normal.
- Page 2: The disruption unfolds. ${childName} learns something that changes how ${pronoun} sees a situation.
- Page ${Math.ceil(pageCount * 0.3)}: ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} investigates or gets pulled deeper. Meet a key supporting character.
- Page ${Math.ceil(pageCount * 0.4)}: A secret or truth is partially revealed. ${childName} must decide whether to act.
- Page ${Math.ceil(pageCount * 0.5)}: ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} acts — but it makes things more complicated, not simpler.
- Page ${Math.ceil(pageCount * 0.6)}: The moral dilemma sharpens. ${childName} must choose between two things ${pronoun} values.
- Page ${Math.ceil(pageCount * 0.7)}: Things go wrong. A consequence ${pronoun} didn't expect.
- Page ${Math.ceil(pageCount * 0.8)}: Help comes from an unexpected source. A new perspective shifts everything.
- Page ${pageCount - 1}: Resolution — not perfect. Something is gained, something is left open.
- Page ${pageCount}: A quiet final moment. ${childName} reflects. One line that stays with the reader.

Illustrated pages: ${illustratedPages.join(', ')}. All other pages: mark scene as "text only page — no illustration."

Setting must be rooted in a specific Indian cultural context tied to the theme (${theme}) — a family wedding, a village during a regional festival, an old family home being sold, a grandmother's kitchen and its secrets.

Avoid generic plots. Write something that could sit beside Sudha Murthy's Grandma's Bag of Stories — specific, human, quietly surprising.

Character description for illustrated pages:
${childName} is a thoughtful ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'child'} with observant dark brown eyes, hair pulled back simply, wearing a plain cotton outfit. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} looks like ${pronoun} is always thinking about something. Style: muted detailed watercolor, earthy tones, chapter book illustration style.

Return this exact JSON:
{
  "title": "6-8 word title, quiet and intriguing — not action-adventure",
  "character": {
    "description": "Write ${childName}'s full physical description for illustrated pages",
    "style": "muted detailed watercolor, earthy tones, chapter book illustration style"
  },
  "pages": [
${pageScaffold}
  ]
}`

    return { systemPrompt, userPrompt }
  }

  // ── 11+ years ──────────────────────────────
  const systemPrompt = `You are a master children's story writer specializing in young adult lite fiction for readers aged 11 and above.

Your writing rules are absolute:
- 8-10 sentences per page. Full rich paragraphs. Sentences up to 25 words.
- Vocabulary: confident and real — conflicted, consequence, belonging, reputation, loyalty, compromise, complicated, realised.
- Introduce 3-4 new words per story, always clear from context. Never dumbed down.
- ${childName} faces a real-world problem involving people ${pronoun} cares about — a friendship fracture, a family pressure, a choice between fitting in and doing right.
- Supporting characters are fully human — the antagonist is not evil, just different. The helper has their own struggles.
- No illustrations except on page 1 and the final page. The writing carries everything.
- Dialogue is the engine — conversations reveal character, create tension, and drive plot forward.
- Internal monologue matters — show ${childName}'s thoughts, doubts, and realisations in ${pronounPossessive} own voice.
- Ground deeply in modern India — school life, social media pressure, joint family dynamics, urban vs small town tension, competitive exams, cricket matches, food as memory and identity.
- The ending is honest — not a perfect resolution. Growth is shown but the world stays complicated.
- Writing tone: warm but unflinching. Like an older sister telling you the truth with love.
- Return only valid JSON. No markdown, no explanation, no preamble.`

  const userPrompt = `Write a ${pageCount}-page young adult story for an 11+ year old ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'person'} named ${childName} who loves ${interests}. The story world is: ${theme}.

INTERESTS — weave ALL of these equally across pages: ${interests}.
At least one interest drives a key plot moment. At least one appears in a memory or emotional flashback. At least one connects two characters together. At least one is the thing ${childName} almost gives up on.

Build the story in three acts:

ACT 1 — Setup (Pages 1-${Math.ceil(pageCount * 0.27)}):
- Page 1: Open in the middle of something — a moment, a conversation, a place. Establish ${childName}'s voice immediately. End with a hint of what is about to change.
- Page 2: ${childName}'s normal world. ${pronounPossessive.charAt(0).toUpperCase() + pronounPossessive.slice(1)} friendships, ${pronounPossessive} family, what ${pronoun} wants, what worries ${pronoun}. Weave ${interests} naturally into ${pronounPossessive} daily life — as who ${pronoun} is, not a plot device.
- Page 3: The disruption arrives. A decision is forced on ${childName} or someone close to ${pronoun}.
- Page ${Math.ceil(pageCount * 0.27)}: ${childName} is pulled in two directions. The central tension is clear.

ACT 2 — Struggle (Pages ${Math.ceil(pageCount * 0.27) + 1}-${Math.ceil(pageCount * 0.8)}):
- ${childName} makes ${pronounPossessive} first choice. It feels right in the moment.
- Consequences begin — something unexpected shifts.
- A key conversation where truths are said and not said.
- ${childName} doubts ${pronoun}self. Internal monologue is strong here.
- A small moment of warmth — funny, human, brief relief.
- The central conflict peaks. ${childName} faces something ${pronoun} has been avoiding.
- ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} makes a harder second choice. This one costs ${pronoun} something real.

ACT 3 — Resolution (Pages ${Math.ceil(pageCount * 0.8) + 1}-${pageCount}):
- The fallout. Not everything is fixed. Some things are awkward.
- An unexpected moment of clarity from an unlikely source.
- ${childName} acts on that clarity. Not perfectly. But honestly.
- Final page: A quiet closing scene. Life continues — but ${childName} is slightly different now. Last line is one sentence that stays with the reader.

DIALOGUE REQUIREMENTS:
- Every page has at least 2 lines of dialogue
- Conversations feel real — interrupted, unfinished, full of subtext
- Characters talk past each other sometimes — that is intentional
- ${childName}'s internal voice appears on every page

Setting must be rooted in specific modern Indian life tied to the theme (${theme}). Name the city, school, neighbourhood. Include social media, exams, family expectations, or friendship group dynamics.

Illustrations only on pages 1 and ${pageCount}. All other pages: mark scene as "text only page — no illustration."

Character description for illustrated pages:
${childName} is a thoughtful ${gender === 'Girl' ? 'girl' : gender === 'Boy' ? 'boy' : 'person'} with sharp observant eyes, hair in a practical style, wearing a school uniform or casual everyday clothes. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} looks like ${pronoun} is always three steps ahead in ${pronounPossessive} own head. Style: clean minimal line art, graphic novel aesthetic, one accent color.

Return this exact JSON:
{
  "title": "4-6 word title — understated, intriguing, not action-adventure",
  "character": {
    "description": "Write ${childName}'s full physical description for illustrated pages",
    "style": "clean minimal line art, graphic novel aesthetic, one accent color"
  },
  "pages": [
${pageScaffold}
  ]
}`

  return { systemPrompt, userPrompt }
}

// ─────────────────────────────────────────────
// Extract scene string for Wan 2.6
// ─────────────────────────────────────────────

function extractSceneDescription(scene: string | SceneObject): string | null {
  if (!scene) return null
  if (typeof scene === 'string') {
    if (scene === 'text only page — no illustration') return null
    return scene
  }
  // Nested object (age 2-3 and 4-5) — append speech bubble to scene description
  const desc = scene.description ?? null
  if (!desc) return null

  const bubble = scene.speech_bubble
  if (bubble?.speaker && bubble?.line) {
    return `${desc} Include a hand-drawn speech bubble in the illustration with the text "${bubble.line}" spoken by ${bubble.speaker}. The speech bubble should look like a classic children's book illustration bubble — rounded, slightly wobbly, with a natural tail pointing to the speaker.`
  }

  return desc
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
      gender,
      interests,
      theme,
      storyLength,
      dedication,
      userId,
      photoUrl,
    } = await request.json()

    console.log('User ID received:', userId)
    console.log('Photo URL received:', photoUrl)
    console.log('Age group:', age)
    console.log('Story length input:', storyLength)

    // ── Resolve page count ───────────────────
    const pageCount = resolvePageCount(storyLength, age)
    console.log('Resolved page count:', pageCount)

    // ── Step 1: Save order to Supabase ───────
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
    console.log('Order saved:', order.id)

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
        order_id: order.id,
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
        order_id: order.id,
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
      .eq('id', order.id)

    // ── Step 8: Auto-generate PDF ─────────────
    try {
      const pdfResponse = await fetch('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          pages: story.pages,
          illustrations,
          childName,
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
      story,
      illustrations,
    })
  } catch (error) {
    console.log('Caught error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
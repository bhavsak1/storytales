import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface StoryPage {
  page: number
  text: string
  scene: string
}

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${base64}`
  } catch {
    return ''
  }
}

function generatePageHtml(
  page: StoryPage,
  imageData: string,
  totalPages: number,
  childName: string
): string {
  return `
    <div class="page">
      <div class="page-header">
        <span class="page-num">✦ ${page.page} of ${totalPages} ✦</span>
      </div>

      <div class="illustration-wrap">
        ${imageData ? `
          <div class="brush-frame">
            <img src="${imageData}" class="illustration" />
            <div class="brush-overlay top"></div>
            <div class="brush-overlay bottom"></div>
            <div class="brush-overlay left"></div>
            <div class="brush-overlay right"></div>
            <div class="brush-corner tl"></div>
            <div class="brush-corner tr"></div>
            <div class="brush-corner bl"></div>
            <div class="brush-corner br"></div>
          </div>
        ` : `
          <div class="illustration-placeholder">
            <span>✨</span>
          </div>
        `}
      </div>

      <div class="divider">
        <span class="divider-star">❋</span>
      </div>

      <div class="story-text">${page.text}</div>

      <div class="page-footer">StoryGennie · ${childName}&apos;s Story</div>
    </div>
  `
}

export async function POST(request: Request) {
  try {
    const { title, pages, illustrations, childName, dedication, orderId } = await request.json()

    // Fetch all images as base64
    const imageDataList = await Promise.all(
      illustrations.map((url: string) => fetchImageAsBase64(url))
    )

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Fredoka+One&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: white;
    font-family: 'Nunito', sans-serif;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    background: white;
    padding: 14mm 16mm;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  /* Subtle corner decorations */
  .page::before, .page::after {
    content: '❧';
    position: absolute;
    font-size: 18px;
    color: #F4A832;
    opacity: 0.4;
  }
  .page::before { top: 8mm; left: 10mm; }
  .page::after { bottom: 8mm; right: 10mm; transform: rotate(180deg); }

  /* Cover page */
  .cover {
    width: 210mm;
    min-height: 297mm;
    background: white;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20mm;
    position: relative;
  }

  .cover-border {
    position: absolute;
    inset: 8mm;
    border: 2px solid #F4A832;
    border-radius: 8px;
    opacity: 0.4;
  }

  .cover-border-inner {
    position: absolute;
    inset: 11mm;
    border: 1px solid #F4A832;
    border-radius: 6px;
    opacity: 0.25;
  }

  .cover-emoji {
    font-size: 64px;
    margin-bottom: 12mm;
  }

  .cover-title {
    font-family: 'Fredoka One', cursive;
    font-size: 36px;
    color: #2D1B00;
    line-height: 1.2;
    margin-bottom: 8mm;
    max-width: 160mm;
  }

  .cover-subtitle {
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    color: #5C3D1E;
    font-weight: 600;
    margin-bottom: 6mm;
  }

  .cover-brand {
    font-family: 'Caveat', cursive;
    font-size: 18px;
    color: #F4A832;
    margin-top: 10mm;
  }

  /* Dedication page */
  .dedication {
    width: 210mm;
    min-height: 297mm;
    background: white;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20mm;
    text-align: center;
  }

  .dedication-label {
    font-family: 'Fredoka One', cursive;
    font-size: 14px;
    color: #F4A832;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 6mm;
  }

  .dedication-text {
    font-family: 'Caveat', cursive;
    font-size: 22px;
    color: #2D1B00;
    line-height: 1.6;
    max-width: 150mm;
  }

  .dedication-line {
    width: 40mm;
    height: 1px;
    background: #F4A832;
    margin: 6mm auto;
    opacity: 0.5;
  }

  /* Page header */
  .page-header {
    width: 100%;
    text-align: center;
    margin-bottom: 5mm;
  }

  .page-num {
    font-family: 'Nunito', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #F4A832;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Illustration with brush stroke effect */
  .illustration-wrap {
    width: 100%;
    margin-bottom: 4mm;
  }

  .brush-frame {
    position: relative;
    width: 100%;
    border-radius: 4px;
    overflow: hidden;
  }

  .illustration {
    width: 100%;
    height: 95mm;
    object-fit: cover;
    display: block;
    border-radius: 4px;
  }

  /* Brush stroke overlays — simulate painted edges */
  .brush-overlay {
    position: absolute;
    pointer-events: none;
  }

  .brush-overlay.top {
    top: 0; left: 0; right: 0;
    height: 18mm;
    background: linear-gradient(
      to bottom,
      white 0%,
      rgba(255,255,255,0.85) 25%,
      rgba(255,255,255,0.5) 55%,
      rgba(255,255,255,0.15) 75%,
      transparent 100%
    );
  }

  .brush-overlay.bottom {
    bottom: 0; left: 0; right: 0;
    height: 18mm;
    background: linear-gradient(
      to top,
      white 0%,
      rgba(255,255,255,0.85) 25%,
      rgba(255,255,255,0.5) 55%,
      rgba(255,255,255,0.15) 75%,
      transparent 100%
    );
  }

  .brush-overlay.left {
    top: 0; left: 0; bottom: 0;
    width: 14mm;
    background: linear-gradient(
      to right,
      white 0%,
      rgba(255,255,255,0.85) 25%,
      rgba(255,255,255,0.4) 60%,
      transparent 100%
    );
  }

  .brush-overlay.right {
    top: 0; right: 0; bottom: 0;
    width: 14mm;
    background: linear-gradient(
      to left,
      white 0%,
      rgba(255,255,255,0.85) 25%,
      rgba(255,255,255,0.4) 60%,
      transparent 100%
    );
  }

  /* Corner brush strokes — uneven organic feel */
  .brush-corner {
    position: absolute;
    width: 22mm;
    height: 22mm;
    pointer-events: none;
  }

  .brush-corner.tl {
    top: 0; left: 0;
    background: radial-gradient(ellipse at 0% 0%, white 0%, rgba(255,255,255,0.9) 30%, transparent 65%);
  }

  .brush-corner.tr {
    top: 0; right: 0;
    background: radial-gradient(ellipse at 100% 0%, white 0%, rgba(255,255,255,0.9) 30%, transparent 65%);
  }

  .brush-corner.bl {
    bottom: 0; left: 0;
    background: radial-gradient(ellipse at 0% 100%, white 0%, rgba(255,255,255,0.9) 30%, transparent 65%);
  }

  .brush-corner.br {
    bottom: 0; right: 0;
    background: radial-gradient(ellipse at 100% 100%, white 0%, rgba(255,255,255,0.9) 30%, transparent 65%);
  }

  .illustration-placeholder {
    width: 100%;
    height: 95mm;
    background: #FFF5E0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    border-radius: 4px;
  }

  /* Divider */
  .divider {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 3mm;
    margin: 3mm 0;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 0.5px;
    background: linear-gradient(to right, transparent, #F4A832, transparent);
  }

  .divider-star {
    font-size: 12px;
    color: #F4A832;
  }

  /* Story text */
  .story-text {
    font-family: 'Nunito', sans-serif;
    font-size: 13.5px;
    color: #2D1B00;
    line-height: 1.85;
    text-align: center;
    font-weight: 600;
    max-width: 165mm;
    flex: 1;
  }

  /* Page footer */
  .page-footer {
    margin-top: auto;
    padding-top: 4mm;
    font-family: 'Nunito', sans-serif;
    font-size: 9px;
    color: #C4A265;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* Last page */
  .last-page {
    width: 210mm;
    min-height: 297mm;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20mm;
  }

  .the-end {
    font-family: 'Fredoka One', cursive;
    font-size: 42px;
    color: #F4A832;
    margin-bottom: 6mm;
  }

  .last-subtitle {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    color: #5C3D1E;
    margin-bottom: 10mm;
  }

  .last-brand {
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    color: #C4A265;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  @media print {
    body { margin: 0; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-border"></div>
  <div class="cover-border-inner"></div>
  <div class="cover-emoji">📖</div>
  <div class="cover-title">${title}</div>
  <div class="cover-subtitle">A personalized story for ${childName}</div>
  <div class="dedication-line"></div>
  <div class="cover-brand">✨ Created with StoryGennie ✨</div>
</div>

${dedication ? `
<!-- DEDICATION PAGE -->
<div class="dedication">
  <div class="dedication-label">A special message</div>
  <div class="dedication-line"></div>
  <div class="dedication-text">${dedication}</div>
  <div class="dedication-line"></div>
</div>
` : ''}

<!-- STORY PAGES -->
${pages.map((page: StoryPage, index: number) =>
  generatePageHtml(page, imageDataList[index] || '', pages.length, childName)
).join('')}

<!-- LAST PAGE -->
<div class="last-page">
  <div class="the-end">The End</div>
  <div class="last-subtitle">~ ${childName}'s magical adventure ~</div>
  <div class="dedication-line"></div>
  <div class="last-brand">StoryGennie · storygennie.com</div>
</div>

</body>
</html>
    `

    // Launch Puppeteer and generate PDF
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    })

    const pdfUint8 = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
})
const pdfBuffer = Buffer.from(pdfUint8)

    await browser.close()

    // Save to Supabase Storage
    const fileName = `${orderId || Date.now()}-${childName}-storybook.pdf`

    const { error: uploadError } = await supabase.storage
      .from('storybooks')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.log('Upload error:', uploadError)
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${childName}-storybook.pdf"`,
        },
      })
    }

    const { data: urlData } = supabase.storage
      .from('storybooks')
      .getPublicUrl(fileName)

    // Update story record
    if (orderId) {
      await supabase
        .from('stories')
        .update({ pdf_url: urlData.publicUrl })
        .eq('order_id', orderId)
    }

    return NextResponse.json({
      success: true,
      pdfUrl: urlData.publicUrl,
    })

  } catch (error) {
    console.log('PDF error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
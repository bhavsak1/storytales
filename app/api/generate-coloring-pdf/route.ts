import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface ColoringPage {
  page: number
  letter?: string
  number?: string
  word: string
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

export async function POST(request: Request) {
  try {
    const { title, pages, illustrations, childName, dedication, orderId, mode } = await request.json()

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14

    // ── COVER PAGE ──
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Border
    doc.setDrawColor(60, 60, 60)
    doc.setLineWidth(2)
    doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 6, 6, 'S')
    doc.setLineWidth(0.5)
    doc.roundedRect(13, 13, pageWidth - 26, pageHeight - 26, 5, 5, 'S')

    // Cover title
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    const titleLines = doc.splitTextToSize(title, pageWidth - 50)
    doc.text(titleLines, pageWidth / 2, 100, { align: 'center' })

    // Subtitle
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`A ${mode === 'abc' ? 'ABC' : '123'} Coloring Book for ${childName}`, pageWidth / 2, 130, { align: 'center' })

    // Decorative line
    doc.setDrawColor(30, 30, 30)
    doc.setLineWidth(0.8)
    doc.line(55, 140, pageWidth - 55, 140)

    // Instructions
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text('Color each page and learn your letters!', pageWidth / 2, 155, { align: 'center' })

    // Brand
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text('Created with StoryGennie', pageWidth / 2, 175, { align: 'center' })

    // ── DEDICATION PAGE ──
    if (dedication) {
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setDrawColor(30, 30, 30)
      doc.setLineWidth(0.4)
      doc.line(50, pageHeight / 2 - 30, pageWidth - 50, pageHeight / 2 - 30)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text('A SPECIAL MESSAGE', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' })

      doc.setFontSize(14)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(30, 30, 30)
      const dedLines = doc.splitTextToSize(dedication, pageWidth - 60)
      doc.text(dedLines, pageWidth / 2, pageHeight / 2, { align: 'center', lineHeightFactor: 1.8 })

      doc.setLineWidth(0.4)
      doc.line(50, pageHeight / 2 + 25, pageWidth - 50, pageHeight / 2 + 25)
    }

    // ── CONTENT PAGES ──
    for (const page of pages as ColoringPage[]) {
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      const itemChar = mode === 'abc' ? page.letter : page.number
      const contentWidth = pageWidth - margin * 2

      // Large letter/number at top — outlined style
      doc.setFontSize(72)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text(itemChar || '', pageWidth / 2, 38, { align: 'center' })

      // Word badge below letter
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text(page.word, pageWidth / 2, 50, { align: 'center' })

      // Thin divider
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.3)
      doc.line(margin + 20, 55, pageWidth - margin - 20, 55)

      // Illustration
      const imgX = margin
      const imgY = 58
      const imgW = contentWidth
      const imgH = 160

      const imageUrl = illustrations[page.page - 1]
      if (imageUrl) {
        try {
          const imageData = await fetchImageAsBase64(imageUrl)
          if (imageData) {
            doc.addImage(imageData, 'JPEG', imgX, imgY, imgW, imgH, '', 'FAST')
          }
        } catch {
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'S')
          doc.setFontSize(11)
          doc.setTextColor(180, 180, 180)
          doc.text('[ Coloring Illustration ]', pageWidth / 2, imgY + imgH / 2, { align: 'center' })
        }
      }

      // Story text below illustration
      const textY = imgY + imgH + 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      const textLines = doc.splitTextToSize(page.text, contentWidth - 10)
      doc.text(textLines, pageWidth / 2, textY, { align: 'center', lineHeightFactor: 1.6 })

      // Page number at bottom
      doc.setFontSize(9)
      doc.setTextColor(160, 160, 160)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${page.page} of ${pages.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // ── LAST PAGE ──
    doc.addPage()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setDrawColor(30, 30, 30)
    doc.setLineWidth(2)
    doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 6, 6, 'S')

    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('The End!', pageWidth / 2, pageHeight / 2 - 16, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(80, 80, 80)
    doc.text(
      `Great job coloring, ${childName}!`,
      pageWidth / 2, pageHeight / 2 + 6,
      { align: 'center' }
    )

    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text('storygennie.com', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' })

    // ── SAVE TO SUPABASE ──
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const fileName = `coloring-${orderId || Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('storybooks')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.log('Upload error:', uploadError)
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="coloring-${childName}.pdf"`,
        },
      })
    }

    const { data: urlData } = supabase.storage
      .from('storybooks')
      .getPublicUrl(fileName)

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
    console.log('Coloring PDF error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

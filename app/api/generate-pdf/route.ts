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

export async function POST(request: Request) {
  try {
    const { title, pages, illustrations, childName, dedication, orderId } = await request.json()

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 16
    const contentWidth = pageWidth - margin * 2

    // ── HELPER: draw soft vignette around image ──
    const drawSoftEdges = (x: number, y: number, w: number, h: number) => {
      const steps = 12
      for (let i = 0; i < steps; i++) {
        const alpha = (1 - i / steps) * 0.85
        const offset = i * 0.8
        doc.setFillColor(255, 255, 255)
        doc.setGState(doc.GState({ opacity: alpha }))
        // Top edge
        doc.rect(x, y, w, offset + 1, 'F')
        // Bottom edge
        doc.rect(x, y + h - offset - 1, w, offset + 1, 'F')
        // Left edge
        doc.rect(x, y, offset + 1, h, 'F')
        // Right edge
        doc.rect(x + w - offset - 1, y, offset + 1, h, 'F')
      }
      doc.setGState(doc.GState({ opacity: 1 }))
    }

    // ── COVER PAGE ──
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Decorative border
    doc.setDrawColor(244, 168, 50)
    doc.setLineWidth(1)
    doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 5, 5, 'S')
    doc.setLineWidth(0.3)
    doc.setDrawColor(244, 200, 150)
    doc.roundedRect(11, 11, pageWidth - 22, pageHeight - 22, 4, 4, 'S')

    // Cover emoji
    doc.setFontSize(48)
    doc.text('📖', pageWidth / 2, 95, { align: 'center' })

    // Cover title
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(45, 27, 0)
    const titleLines = doc.splitTextToSize(title, pageWidth - 40)
    doc.text(titleLines, pageWidth / 2, 120, { align: 'center' })

    // Decorative line
    doc.setDrawColor(244, 168, 50)
    doc.setLineWidth(0.5)
    doc.line(50, 145, pageWidth - 50, 145)

    // Subtitle
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(92, 61, 30)
    doc.text(`A personalized story for ${childName}`, pageWidth / 2, 158, { align: 'center' })

    // Brand
    doc.setFontSize(11)
    doc.setTextColor(244, 168, 50)
    doc.text('✨  Created with StoryGennie  ✨', pageWidth / 2, 175, { align: 'center' })

    // ── DEDICATION PAGE ──
    if (dedication) {
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setDrawColor(244, 168, 50)
      doc.setLineWidth(0.4)
      doc.line(50, pageHeight / 2 - 30, pageWidth - 50, pageHeight / 2 - 30)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(244, 168, 50)
      doc.text('A SPECIAL MESSAGE', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' })

      doc.setFontSize(15)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(45, 27, 0)
      const dedLines = doc.splitTextToSize(dedication, pageWidth - 60)
      doc.text(dedLines, pageWidth / 2, pageHeight / 2, { align: 'center', lineHeightFactor: 1.8 })

      doc.setLineWidth(0.4)
      doc.line(50, pageHeight / 2 + 25, pageWidth - 50, pageHeight / 2 + 25)
    }

    // ── STORY PAGES ──
    for (const page of pages) {
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Subtle corner decorations
      doc.setFontSize(14)
      doc.setTextColor(244, 168, 50)
      doc.setGState(doc.GState({ opacity: 0.3 }))
      doc.text('❧', 10, 14)
      doc.text('❧', pageWidth - 10, 14, { align: 'right' })
      doc.text('❧', 10, pageHeight - 6)
      doc.text('❧', pageWidth - 10, pageHeight - 6, { align: 'right' })
      doc.setGState(doc.GState({ opacity: 1 }))

      // Page number
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(244, 168, 50)
      doc.text(
        `✦  ${page.page} of ${pages.length}  ✦`,
        pageWidth / 2, 12,
        { align: 'center' }
      )

      // Illustration
      const imageUrl = illustrations[page.page - 1]
      const imgX = margin
      const imgY = 16
      const imgW = contentWidth
      const imgH = 118

      if (imageUrl) {
        try {
          const imageData = await fetchImageAsBase64(imageUrl)
          if (imageData) {
            // Draw image
            doc.addImage(imageData, 'JPEG', imgX, imgY, imgW, imgH, '', 'FAST')
            // Soft vignette edges
            drawSoftEdges(imgX, imgY, imgW, imgH)
          }
        } catch {
          doc.setFillColor(255, 245, 224)
          doc.roundedRect(imgX, imgY, imgW, imgH, 4, 4, 'F')
          doc.setFontSize(11)
          doc.setTextColor(158, 128, 96)
          doc.text('[ Illustration ]', pageWidth / 2, imgY + imgH / 2, { align: 'center' })
        }
      }

      // Divider
      const divY = imgY + imgH + 6
      doc.setDrawColor(244, 168, 50)
      doc.setLineWidth(0.3)
      doc.setGState(doc.GState({ opacity: 0.6 }))
      doc.line(margin + 10, divY, pageWidth - margin - 10, divY)
      doc.setGState(doc.GState({ opacity: 1 }))
      doc.setFontSize(9)
      doc.setTextColor(244, 168, 50)
      doc.text('❋', pageWidth / 2, divY + 4, { align: 'center' })

      // Story text
      doc.setFontSize(12.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(45, 27, 0)
      const textLines = doc.splitTextToSize(page.text, contentWidth)
      doc.text(textLines, pageWidth / 2, divY + 10, {
        align: 'center',
        lineHeightFactor: 1.75,
      })

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(196, 162, 101)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `STORYGENNIE  ·  ${childName.toUpperCase()}'S STORY`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      )
    }

    // ── LAST PAGE ──
    doc.addPage()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setDrawColor(244, 168, 50)
    doc.setLineWidth(1)
    doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 5, 5, 'S')

    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(244, 168, 50)
    doc.text('The End', pageWidth / 2, pageHeight / 2 - 16, { align: 'center' })

    doc.setDrawColor(244, 168, 50)
    doc.setLineWidth(0.5)
    doc.line(50, pageHeight / 2 - 6, pageWidth - 50, pageHeight / 2 - 6)

    doc.setFontSize(13)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(92, 61, 30)
    doc.text(
      `~ ${childName}'s magical adventure ~`,
      pageWidth / 2, pageHeight / 2 + 6,
      { align: 'center' }
    )

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(196, 162, 101)
    doc.text('storygennie.com', pageWidth / 2, pageHeight / 2 + 18, { align: 'center' })

    // ── SAVE TO SUPABASE ──
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
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
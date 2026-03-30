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
    return `data:image/jpeg;base64,${base64}`
  } catch (error) {
    console.log('Image fetch error:', error)
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

    // ── COVER PAGE ──
    doc.setFillColor(255, 248, 238)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setTextColor(45, 27, 0)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(title, pageWidth - 40)
    doc.text(titleLines, pageWidth / 2, 80, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(92, 61, 30)
    doc.text(`A personalized story for ${childName}`, pageWidth / 2, 120, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(244, 168, 50)
    doc.text('Created with StoryTales', pageWidth / 2, 140, { align: 'center' })

    // ── DEDICATION PAGE ──
    if (dedication) {
      doc.addPage()
      doc.setFillColor(255, 253, 248)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setTextColor(92, 61, 30)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'italic')
      const dedLines = doc.splitTextToSize(dedication, pageWidth - 60)
      doc.text(dedLines, pageWidth / 2, pageHeight / 2, { align: 'center' })
    }

    // ── STORY PAGES ──
    for (const page of pages) {
      doc.addPage()
      doc.setFillColor(255, 248, 238)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Page number
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(244, 168, 50)
      doc.text(`Page ${page.page} of ${pages.length}`, pageWidth / 2, 12, { align: 'center' })

      // Illustration
      const imageUrl = illustrations[page.page - 1]
      if (imageUrl) {
        try {
          const imageData = await fetchImageAsBase64(imageUrl)
          if (imageData) {
            doc.addImage(imageData, 'JPEG', 20, 18, pageWidth - 40, 120)
          }
        } catch {
          doc.setFillColor(232, 213, 176)
          doc.setDrawColor(212, 196, 160)
          doc.roundedRect(20, 18, pageWidth - 40, 120, 4, 4, 'FD')
          doc.setFontSize(11)
          doc.setTextColor(158, 128, 96)
          doc.text('[ Illustration ]', pageWidth / 2, 82, { align: 'center' })
        }
      }

      // Story text
      doc.setFontSize(13)
      doc.setTextColor(45, 27, 0)
      doc.setFont('helvetica', 'normal')
      const textLines = doc.splitTextToSize(page.text, pageWidth - 40)
      doc.text(textLines, pageWidth / 2, 158, { align: 'center' })
    }

    // ── LAST PAGE ──
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

    // ── SAVE TO SUPABASE STORAGE ──
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
      // Fall back to direct download if upload fails
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${childName}-storybook.pdf"`,
        },
      })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('storybooks')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl
    console.log('PDF saved to Supabase:', publicUrl)

    // Update story record with PDF URL
    if (orderId) {
      await supabase
        .from('stories')
        .update({ pdf_url: publicUrl })
        .eq('order_id', orderId)
    }

    return NextResponse.json({
      success: true,
      pdfUrl: publicUrl,
    })

  } catch (error) {
    console.log('PDF error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      // Form data for generation
      childName,
      age,
      interests,
      mode,
      pageCount,
      dedication,
      userId,
      photoUrl,
    } = await request.json()

    // ── Step 1: Verify Razorpay Signature ──
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.log('Colorbook payment signature verification failed')
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      )
    }

    console.log('Colorbook payment signature verified for client orderId:', orderId)

    // ── Secure IDOR Protection: Fetch true order ID using verified razorpay_order_id ──
    const { data: orderRecord, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (fetchError || !orderRecord) {
      console.log('Order lookup failed for razorpay_order_id:', razorpay_order_id)
      return NextResponse.json(
        { error: 'Order not found for this payment.' },
        { status: 404 }
      )
    }

    const secureOrderId = orderRecord.id

    // ── Step 2: Update order as paid ──
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_id: razorpay_payment_id,
        payment_status: 'paid',
        status: 'generating',
      })
      .eq('id', secureOrderId)

    if (updateError) {
      console.log('Order update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('Colorbook order marked as paid, triggering generation for:', secureOrderId)

    // ── Step 3: Trigger full coloring book generation ──
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
    const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`

    const generateResponse = await fetch(`${baseUrl}/api/generate-learning-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childName,
        age,
        interests,
        mode,
        pageCount,
        dedication,
        userId,
        photoUrl,
        existingOrderId: secureOrderId,
      }),
    })

    const generateData = await generateResponse.json()

    if (!generateData.success) {
      return NextResponse.json(
        { error: generateData.error || 'Coloring book generation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: secureOrderId,
      story: generateData.story,
      illustrations: generateData.illustrations,
    })
  } catch (error) {
    console.log('Verify colorbook payment error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

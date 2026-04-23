import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Razorpay from 'razorpay'
import { getActivePlan } from '@/lib/pricing'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: Request) {
  try {
    const {
      childName,
      age,
      gender,
      interests,
      theme,
      storyLength,
      deliveryType,
      dedication,
      userId,
      photoUrl,
      email,
    } = await request.json()

    const activePlan = getActivePlan()

    // ── Step 1: Save a "pending" order to Supabase ──
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        child_name: childName,
        child_age: age,
        interests: interests,
        theme: theme,
        status: 'pending',
        user_id: userId,
        amount: activePlan.amountPaise, // from shared pricing config
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.log('Order creation error:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    console.log('Pending order created:', order.id)

    // ── Step 2: Create a Razorpay order ──
    const receiptId = `SG-${String(order.id).substring(0, 36)}`
    console.log('Creating Razorpay order with receipt:', receiptId)

    const razorpayOrder = await razorpay.orders.create({
      amount: activePlan.amountPaise, // from shared pricing config
      currency: 'INR',
      receipt: receiptId,
      notes: {
        orderId: String(order.id),
        childName: String(childName),
        userId: String(userId),
      },
    })

    console.log('Razorpay order created:', razorpayOrder.id)

    // ── Step 3: Save Razorpay order ID to Supabase ──
    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      // Pass back form data so verify-payment can use it for generation
      formData: {
        childName,
        age,
        gender,
        interests,
        theme,
        storyLength,
        deliveryType,
        dedication,
        userId,
        photoUrl,
        email,
      },
    })
  } catch (error) {
    console.log('Create order error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, childName, title, downloadUrl } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'StoryTales <onboarding@resend.dev>',
      to: email,
      subject: `${childName}'s Storybook is Ready! 📖`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FFF8EE;">
          
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 32px; color: #2D1B00; margin: 0;">📖 StoryTales</h1>
          </div>

          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #E8D5A0;">
            
            <h2 style="color: #2D1B00; font-size: 22px; margin: 0 0 12px;">
              ${childName}'s storybook is ready! 🎉
            </h2>
            
            <p style="color: #5C3D1E; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We've created a personalized storybook called 
              <strong>"${title}"</strong> just for ${childName}. 
              Click the button below to download it!
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a 
                href="${downloadUrl}"
                style="background: #F4A832; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: bold; display: inline-block;"
              >
                Download Storybook 📄
              </a>
            </div>

            <p style="color: #9E8060; font-size: 13px; text-align: center; margin: 0;">
              This link expires in 72 hours.
            </p>

          </div>

          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #9E8060; font-size: 12px;">
              Made with love by StoryTales ✨
            </p>
          </div>

        </div>
      `,
    })

    if (error) {
      console.log('Email error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Email sent:', data)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.log('Send email error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
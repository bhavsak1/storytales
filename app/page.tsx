import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ fontFamily: "'Nunito', sans-serif", background: '#FFF8EE', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .fredoka { font-family: 'Fredoka One', cursive; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #F4867A, #D9604F); color: white; transition: all 0.2s; display: inline-block; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,134,122,0.4); }
        .btn-secondary { background: white; color: #2D1B00; border: 2px solid #E8D5A0; transition: all 0.2s; display: inline-block; }
        .btn-secondary:hover { border-color: #F4A832; transform: translateY(-2px); }
        .book-card:hover { transform: translateY(-6px) rotate(-1deg); }
        .book-card:nth-child(2) { transform: rotate(2deg); margin-top: 12px; }
        .book-card:nth-child(2):hover { transform: translateY(-6px) rotate(1deg); }
        .book-card:nth-child(4) { transform: rotate(-1.5deg); margin-top: 8px; }
        .step-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(45,27,0,0.1); }
        .pricing-card:hover { transform: translateY(-4px); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 4s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: 'rgba(255,253,248,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1.5px solid #F5E6C8', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="fredoka" style={{ fontSize: '1.75rem', color: '#2D1B00' }}>📖 StoryTales</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#how-it-works" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#5C3D1E', textDecoration: 'none' }}>How it works</a>
          <a href="#pricing" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#5C3D1E', textDecoration: 'none' }}>Pricing</a>
          <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#5C3D1E', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/create" className="btn-primary fredoka" style={{ padding: '10px 24px', borderRadius: '50px', fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 14px rgba(244,134,122,0.35)' }}>
            Create Their Story ✨
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        {/* Left */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF5E0', border: '1.5px solid #F4A832', borderRadius: '50px', padding: '6px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#D4881A', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎁 Perfect gift for kids
          </div>
          <h1 className="fredoka" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', color: '#2D1B00', lineHeight: 1.1, marginBottom: '20px' }}>
            The most personal gift you can give a child
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#5C3D1E', lineHeight: 1.7, fontWeight: 600, marginBottom: '32px', maxWidth: '460px' }}>
            A professionally illustrated storybook where <strong>your child is the hero</strong> — crafted by AI in minutes, delivered to your door or inbox.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '32px' }}>
            <Link href="/create" className="btn-primary fredoka" style={{ padding: '16px 36px', borderRadius: '50px', fontSize: '1.2rem', textDecoration: 'none', boxShadow: '0 6px 20px rgba(244,134,122,0.4)' }}>
              Create Their Story ✨
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ padding: '15px 24px', borderRadius: '50px', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none' }}>
              See how it works →
            </a>
          </div>
          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex' }}>
              {['👩', '👴', '👨', '👵'].map((emoji, i) => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5E6C8', border: '2px solid #FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginLeft: i === 0 ? 0 : '-8px' }}>{emoji}</div>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5C3D1E' }}>2,400+ families gifted a story this month</span>
          </div>
        </div>

        {/* Right — Book grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { emoji: '🐉', title: "Aria's Dragon Quest", bg: '#FFF0D0', theme: 'Royal Kingdom' },
            { emoji: '🚀', title: "Rohan's Space Trip", bg: '#E8F5FF', theme: 'Space Explorer' },
            { emoji: '🦄', title: "Mia's Magic Forest", bg: '#F0FFE8', theme: 'Enchanted Forest' },
            { emoji: '🌊', title: "Arjun Under the Sea", bg: '#E8F5FF', theme: 'Ocean Adventure' },
          ].map((book, i) => (
            <div key={i} className="book-card" style={{ background: 'white', borderRadius: '16px', padding: '16px 12px 14px', textAlign: 'center', boxShadow: '0 4px 20px rgba(45,27,0,0.1)', border: '2px solid #F5E6C8', transition: 'transform 0.25s', cursor: 'pointer' }}>
              <div style={{ width: '100%', height: '90px', borderRadius: '10px', background: book.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', marginBottom: '10px' }}>{book.emoji}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: '#2D1B00', lineHeight: 1.3, marginBottom: '4px' }}>{book.title}</div>
              <div style={{ fontSize: '0.7rem', color: '#9E8060' }}>{book.theme}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <div style={{ background: 'white', borderTop: '1.5px solid #F5E6C8', borderBottom: '1.5px solid #F5E6C8', padding: '20px 48px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
        {[
          { icon: '🎨', text: 'AI illustrated' },
          { icon: '⚡', text: 'Ready in minutes' },
          { icon: '📦', text: 'Print & ship available' },
          { icon: '💝', text: '100% happiness guarantee' },
          { icon: '🇮🇳', text: 'Indian stories & settings' },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#5C3D1E' }}>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>{text}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 className="fredoka" style={{ fontSize: '2.2rem', color: '#2D1B00', marginBottom: '10px' }}>How the magic happens ✨</h2>
          <p style={{ color: '#5C3D1E', fontSize: '1rem', fontWeight: 600 }}>Three simple steps — takes under 3 minutes</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            { num: '1', emoji: '🧒', title: 'Tell us about them', desc: 'Name, age, photo and their favourite things' },
            { num: '2', emoji: '💛', title: 'Pick their passions', desc: 'Dinosaurs, space, unicorns — we weave them in' },
            { num: '3', emoji: '🎨', title: 'Choose a theme', desc: 'Adventure, fantasy, ocean — pick their world' },
            { num: '4', emoji: '📬', title: 'Receive the book', desc: 'PDF in minutes or printed hardcover at your door' },
          ].map((step, i) => (
            <div key={i} className="step-card" style={{ background: 'white', borderRadius: '20px', padding: '24px 20px', textAlign: 'center', border: '2px solid #F5E6C8', transition: 'all 0.25s', cursor: 'default' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FFF5E0', border: '2px solid #F5E6C8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 14px' }}>{step.emoji}</div>
              <div className="fredoka" style={{ fontSize: '1rem', color: '#2D1B00', marginBottom: '6px' }}>{step.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#5C3D1E', lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/create" className="btn-primary fredoka" style={{ padding: '16px 40px', borderRadius: '50px', fontSize: '1.2rem', textDecoration: 'none', boxShadow: '0 6px 20px rgba(244,134,122,0.4)' }}>
            Create Their Story ✨
          </Link>
        </div>
      </section>

      {/* SAMPLE STORIES */}
      <section style={{ background: 'white', borderTop: '1.5px solid #F5E6C8', borderBottom: '1.5px solid #F5E6C8', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="fredoka" style={{ fontSize: '2.2rem', color: '#2D1B00', marginBottom: '10px' }}>Stories families love 📖</h2>
            <p style={{ color: '#5C3D1E', fontSize: '1rem', fontWeight: 600 }}>Every story is unique — just like your child</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { emoji: '🐉', title: "Aria and the Dragon's Secret", theme: 'Royal Kingdom', age: '6 years', interests: 'Dragons, Art', bg: '#FFF0D0', text: "In the golden city of Jaipur, young Aria discovered a tiny dragon hiding behind the marigold garlands of the old haveli..." },
              { emoji: '🚀', title: "Rohan's Trip to the Stars", theme: 'Space Explorer', age: '8 years', interests: 'Space, Science', bg: '#E8F5FF', text: "On the rooftop of their Mumbai apartment, Rohan pointed his telescope at the night sky and gasped — a spaceship was waiting for him..." },
              { emoji: '🦄', title: "Mia's Enchanted Forest", theme: 'Enchanted Forest', age: '4 years', interests: 'Unicorns, Music', bg: '#F0FFE8', text: "Deep in the forest behind her dadi's village, little Mia heard a melody that only she could follow. The trees parted, and there she was..." },
            ].map((story, i) => (
              <div key={i} style={{ borderRadius: '20px', overflow: 'hidden', border: '2px solid #F5E6C8', background: '#FFFDF8' }}>
                <div style={{ height: '120px', background: story.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>{story.emoji}</div>
                <div style={{ padding: '20px' }}>
                  <div className="fredoka" style={{ fontSize: '1.05rem', color: '#2D1B00', marginBottom: '8px' }}>{story.title}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.7rem', background: '#FFF5E0', color: '#D4881A', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{story.theme}</span>
                    <span style={{ fontSize: '0.7rem', background: '#F5E6C8', color: '#5C3D1E', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{story.age}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#5C3D1E', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{story.text}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="fredoka" style={{ fontSize: '2.2rem', color: '#2D1B00', marginBottom: '10px' }}>Simple, honest pricing 💰</h2>
          <p style={{ color: '#5C3D1E', fontSize: '1rem', fontWeight: 600 }}>No subscription. Pay once, keep forever.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { name: 'Digital PDF', price: '₹299', desc: 'Download instantly. Read on any device.', features: ['Personalized story', 'AI illustrations', 'PDF download', 'Email delivery'], popular: false, color: '#F5E6C8', accent: '#D4881A' },
            { name: 'Printed Hardcover', price: '₹1,199', desc: 'Premium full-color book delivered to your door.', features: ['Everything in Digital', 'Hardcover print', 'Ships in 5-7 days', 'Gift ready'], popular: true, color: '#F4867A', accent: 'white' },
            { name: 'Both', price: '₹1,399', desc: 'Best value — PDF now, hardcover later.', features: ['Everything included', 'PDF instantly', 'Hardcover shipped', 'Best value'], popular: false, color: '#F5E6C8', accent: '#D4881A' },
          ].map((plan, i) => (
            <div key={i} className="pricing-card" style={{ borderRadius: '20px', overflow: 'hidden', border: plan.popular ? '3px solid #F4867A' : '2px solid #F5E6C8', background: plan.popular ? '#FFF0EE' : 'white', transition: 'all 0.25s', position: 'relative' }}>
              {plan.popular && (
                <div style={{ background: '#F4867A', color: 'white', textAlign: 'center', padding: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Most Popular
                </div>
              )}
              <div style={{ padding: '24px' }}>
                <div className="fredoka" style={{ fontSize: '1.3rem', color: '#2D1B00', marginBottom: '4px' }}>{plan.name}</div>
                <div className="fredoka" style={{ fontSize: '2.2rem', color: plan.popular ? '#F4867A' : '#D4881A', marginBottom: '8px' }}>{plan.price}</div>
                <div style={{ fontSize: '0.82rem', color: '#5C3D1E', marginBottom: '20px', lineHeight: 1.5 }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: '#5C3D1E' }}>
                      <span style={{ color: '#6BAF8D', fontWeight: 900 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link href="/create" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '50px', fontFamily: "'Fredoka One', cursive", fontSize: '1rem', textDecoration: 'none', background: plan.popular ? 'linear-gradient(135deg, #F4867A, #D9604F)' : '#FFF5E0', color: plan.popular ? 'white' : '#D4881A', border: plan.popular ? 'none' : '2px solid #F4A832', boxShadow: plan.popular ? '0 4px 14px rgba(244,134,122,0.35)' : 'none' }}>
                  Get Started ✨
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#2D1B00', padding: '80px 48px', textAlign: 'center' }}>
        <div className="float" style={{ fontSize: '3rem', marginBottom: '20px' }}>📖</div>
        <h2 className="fredoka" style={{ fontSize: '2.4rem', color: 'white', marginBottom: '14px' }}>
          Give them a story they&apos;ll never forget
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', fontWeight: 600, marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
          Join thousands of parents and grandparents who have gifted a personalized storybook.
        </p>
        <Link href="/create" style={{ display: 'inline-block', background: '#F4A832', color: '#2D1B00', padding: '18px 48px', borderRadius: '50px', fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', textDecoration: 'none', boxShadow: '0 6px 24px rgba(244,168,50,0.4)' }}>
          Create Their Story ✨
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1A0A00', padding: '28px 48px', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
        Made with ❤️ for little dreamers everywhere · © 2025 StoryTales
      </footer>
    </main>
  )
}

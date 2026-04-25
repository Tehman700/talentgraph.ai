// site.jsx — Interactive landing page for Datapilot AI
// Designed for a 1920x1080 stage but fills viewport. Mounts at #site-root.

const S_BLUE = '#1710E6';
const S_LIME = '#8DC651';
const S_INK = '#0e0e12';
const S_PAPER = '#f6f4ef';
const S_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
const S_SERIF = "'Instrument Serif', 'Fraunces', Georgia, serif";

// ── Shared chrome ───────────────────────────────────────────────────────────
function TopBar({ mode = 'light', status = 'Linear', onModeClick }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const fg = mode === 'dark' ? S_PAPER : S_INK;
  const subtle = mode === 'dark' ? 'rgba(246,244,239,0.5)' : 'rgba(14,14,18,0.55)';
  const pillBg = mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff';
  const pillBorder = mode === 'dark' ? 'rgba(246,244,239,0.25)' : S_INK;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      fontFamily: S_MONO, fontSize: 13, letterSpacing: '0.04em',
      color: fg, pointerEvents: 'none',
    }}>
      <div style={{ textTransform: 'uppercase', pointerEvents: 'auto' }}>
        Datapilot&nbsp;AI
      </div>

      <div
        onClick={onModeClick}
        style={{
          pointerEvents: 'auto', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: pillBg,
          border: `1.5px solid ${pillBorder}`,
          padding: '6px 14px 6px 8px',
          borderRadius: 999,
          fontSize: 13,
          color: fg,
        }}>
        <span style={{
          width: 14, height: 14, borderRadius: 999,
          background: status === 'Experimental' ? S_LIME : S_BLUE,
          display: 'inline-block',
        }}/>
        <span style={{ textTransform: 'none', letterSpacing: 0 }}>{status}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 22, pointerEvents: 'auto' }}>
        <span style={{ color: mode === 'dark' ? S_LIME : S_BLUE, fontVariantNumeric: 'tabular-nums' }}>
          {hh} {mm} {ss} PST
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: fg }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: S_LIME, display: 'inline-block' }}/>
          <span style={{ textTransform: 'none', letterSpacing: 0 }}>Open for work</span>
        </span>
      </div>
    </div>
  );
}

function BottomNav({ active = 'Work', onNav, mode = 'light' }) {
  const items = ['Work', 'Play', 'About', 'Pricing'];
  const btnBg = mode === 'dark' ? 'rgba(255,255,255,0.08)' : S_INK;
  const btnFg = mode === 'dark' ? S_PAPER : S_PAPER;
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 40,
    }}>
      <button onClick={() => onNav && onNav('close')} style={{
        width: 40, height: 40, borderRadius: 999,
        background: btnBg, color: btnFg, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: S_MONO, fontSize: 16,
      }}>×</button>
      {items.map(it => (
        <button key={it} onClick={() => onNav && onNav(it)} style={{
          background: active === it ? S_BLUE : btnBg,
          color: btnFg,
          border: 'none', borderRadius: 6,
          padding: '10px 18px',
          fontFamily: S_MONO, fontSize: 14,
          cursor: 'pointer',
        }}>{it}</button>
      ))}
    </div>
  );
}

function SectionNumbers({ active = 1, onClick }) {
  // floating right-top small tiles
  return (
    <div style={{ position: 'fixed', top: 92, right: 24, zIndex: 30, display: 'flex', gap: 4 }}>
      {[3, 2, 1].map(n => (
        <button key={n} onClick={() => onClick && onClick(n)} style={{
          width: 44, height: 44, borderRadius: 4,
          background: active === n ? S_BLUE : '#fff',
          color: active === n ? S_PAPER : S_INK,
          border: `1.5px solid ${S_INK}`,
          fontFamily: S_MONO, fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
        }}>{String(n).padStart(2, '0')}</button>
      ))}
    </div>
  );
}

// ── Section 1: Hero ─────────────────────────────────────────────────────────
function Hero({ onScrollNext }) {
  // reveal-on-mount
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(id);
  }, []);

  const reveal = (delay) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
  });

  return (
    <section style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '120px 40px 160px', background: S_PAPER, color: S_INK,
    }} data-screen-label="01 Hero">
      {/* kicker */}
      <div style={{
        fontFamily: S_MONO, fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase',
        color: '#6b6458', marginBottom: 48, ...reveal(100),
      }}>
        — Datapilot AI · v2.6 —
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: S_SERIF, fontWeight: 400,
        fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 1.12,
        letterSpacing: '-0.02em',
        textAlign: 'center', margin: 0,
        maxWidth: 900,
        position: 'relative', zIndex: 2,
        ...reveal(200),
      }}>
        <span style={{ whiteSpace: 'nowrap' }}>Clean data,</span>{' '}
        <span style={{ whiteSpace: 'nowrap' }}>
          <em style={{
            fontStyle: 'italic', color: S_LIME,
            fontFamily: S_SERIF,
            position: 'relative',
          }}>
            beautifully
            <svg viewBox="0 0 400 16" preserveAspectRatio="none" style={{
              position: 'absolute', left: 0, bottom: -4, width: '100%', height: 10,
              opacity: mounted ? 1 : 0, transition: 'opacity 600ms 1200ms',
            }}>
              <path d="M2 10 Q 100 2 200 8 T 398 6" stroke={S_LIME} strokeWidth="4" fill="none" strokeLinecap="round"/>
            </svg>
          </em><span style={{ color: S_BLUE }}>.</span>
        </span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: S_MONO, fontSize: 16, color: '#4a453d',
        marginTop: 72, maxWidth: 680, textAlign: 'center', lineHeight: 1.6,
        position: 'relative', zIndex: 2,
        ...reveal(500),
      }}>
        Datapilot's AI solo-shipped an MVP that deduplicated <b style={{ color: S_INK }}>1,000,000</b>
        &nbsp;customer rows in 6 seconds after the first prompt.
      </p>

      {/* floating accent chips — pushed to corners so they don't cross the headline */}
      <FloatingChip
        style={{ left: '3%', top: '18%', background: S_BLUE, color: S_PAPER, transform: 'rotate(-8deg)' }}
        mounted={mounted} delay={800}
      >
        <span style={{ fontFamily: S_SERIF, fontSize: 34, fontStyle: 'italic' }}>clean</span>
      </FloatingChip>
      <FloatingChip
        style={{ right: '3%', top: '16%', background: '#fff', color: S_INK, transform: 'rotate(6deg)',
                 border: `1.5px solid ${S_INK}` }}
        mounted={mounted} delay={1000}
      >
        <span style={{ fontFamily: S_MONO, fontSize: 13 }}>normalize ✓</span>
      </FloatingChip>
      <FloatingChip
        style={{ left: '4%', bottom: '14%', background: S_LIME, color: S_INK, transform: 'rotate(4deg)' }}
        mounted={mounted} delay={1200}
      >
        <span style={{ fontFamily: S_MONO, fontSize: 13 }}>dedupe 9,412</span>
      </FloatingChip>
      <FloatingChip
        style={{ right: '4%', bottom: '16%', background: S_INK, color: S_PAPER, transform: 'rotate(-5deg)' }}
        mounted={mounted} delay={1400}
      >
        <span style={{ fontFamily: S_MONO, fontSize: 13 }}>enrich ·•· ✨</span>
      </FloatingChip>
    </section>
  );
}

function FloatingChip({ children, style, mounted, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute',
      padding: '10px 18px',
      borderRadius: 999,
      boxShadow: '0 10px 30px rgba(14,14,18,0.1)',
      opacity: mounted ? 1 : 0,
      transition: `opacity 700ms ${delay}ms, transform 1400ms ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Section 2: Numbered case studies (Work) ─────────────────────────────────
const CASES = [
  {
    year: '2026', n: '01',
    title: 'Contextual AI editing for spreadsheets',
    blurb: 'Re-shipped the CSV editor with an inline AI column. Typing a column header proposes transformations across 100k rows; users approve diffs before commit.',
    kpis: ['50M rows/mo', '−82% manual review', '4.9 CSAT'],
    bg: S_BLUE, fg: S_PAPER, accent: S_LIME,
    visual: 'editor',
  },
  {
    year: '2026', n: '02',
    title: 'Datapilot — visual system & product language',
    blurb: 'Defined the full visual system for Datapilot: 60+ components, 3 surface modes, a motion spec and a mascot-driven onboarding. Owned direction across product + brand.',
    kpis: ['60+ components', '12 surfaces', '1 happy mascot'],
    bg: S_INK, fg: S_PAPER, accent: S_LIME,
    visual: 'system',
  },
  {
    year: '2025', n: '03',
    title: 'Pipeline operator — batch cleaning at scale',
    blurb: 'Designed the operator mode for teams running weekly ingest pipelines. Step-by-step lineage, reversible ops, and a live preview that shows before/after on any step.',
    kpis: ['410 pipelines', '99.98% uptime', '6 week MVP'],
    bg: '#1a1a20', fg: S_PAPER, accent: S_LIME,
    visual: 'pipeline',
  },
];

function Work({ activeIdx, onActive }) {
  return (
    <section style={{
      background: S_PAPER, padding: '160px 0 180px', position: 'relative',
    }} data-screen-label="02 Work">
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '0 40px',
      }}>
        <div style={{
          fontFamily: S_MONO, fontSize: 12, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: '#6b6458', marginBottom: 80,
        }}>
          ( selected work ) — 03 projects
        </div>
      </div>

      {CASES.map((c, i) => (
        <CaseBlock key={c.n} c={c} idx={i} onEnter={() => onActive && onActive(i + 1)} />
      ))}
    </section>
  );
}

function CaseBlock({ c, idx, onEnter }) {
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        onEnter && onEnter();
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = (d) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(30px)',
    transition: `opacity 800ms cubic-bezier(.2,.7,.2,1) ${d}ms, transform 800ms cubic-bezier(.2,.7,.2,1) ${d}ms`,
  });

  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: '1fr 1.2fr',
      gap: 0, alignItems: 'stretch',
      margin: '0 auto', maxWidth: 1400, padding: '0 40px 120px',
    }}>
      {/* left: copy */}
      <div style={{ paddingRight: 60, paddingTop: 40 }}>
        <div style={{
          fontFamily: S_MONO, fontSize: 14, color: '#6b6458', letterSpacing: '0.1em',
          ...reveal(0),
        }}>
          {c.year} — {c.n}
        </div>
        <h3 style={{
          fontFamily: S_SERIF, fontWeight: 400, fontSize: 56, lineHeight: 1.05,
          letterSpacing: '-0.02em', color: S_INK, marginTop: 14, marginBottom: 28,
          ...reveal(100),
        }}>
          {c.title}
        </h3>
        <p style={{
          fontFamily: S_MONO, fontSize: 15, lineHeight: 1.6, color: '#3d3830',
          maxWidth: 480, ...reveal(200),
        }}>
          {c.blurb}
        </p>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32,
          ...reveal(300),
        }}>
          {c.kpis.map(k => (
            <span key={k} style={{
              fontFamily: S_MONO, fontSize: 12,
              padding: '6px 12px',
              border: `1px solid ${S_INK}`,
              borderRadius: 4,
              background: '#fff', color: S_INK,
            }}>{k}</span>
          ))}
        </div>
        <button style={{
          marginTop: 36,
          background: S_INK, color: S_PAPER, border: 'none', borderRadius: 4,
          padding: '12px 18px', fontFamily: S_MONO, fontSize: 13, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 10,
          ...reveal(400),
        }}>
          Case study ↗
        </button>
      </div>

      {/* right: visual card */}
      <div style={{
        background: c.bg, borderRadius: 12, minHeight: 620,
        position: 'relative', overflow: 'hidden',
        ...reveal(150),
      }}>
        <CaseVisual c={c} inView={inView} />
      </div>
    </div>
  );
}

function CaseVisual({ c, inView }) {
  if (c.visual === 'editor') return <EditorVisual inView={inView} />;
  if (c.visual === 'system') return <SystemVisual inView={inView} />;
  return <PipelineVisual inView={inView} />;
}

function EditorVisual({ inView }) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 48, color: S_PAPER, fontFamily: S_MONO }}>
      {/* mock window */}
      <div style={{
        background: '#fff', color: S_INK, borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
        transform: inView ? 'translateY(0) rotate(-1.5deg)' : 'translateY(40px) rotate(-1.5deg)',
        opacity: inView ? 1 : 0,
        transition: 'opacity 800ms 300ms, transform 1000ms 300ms cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderBottom: '1px solid #eceae2',
          fontSize: 12,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#e06c6c' }}/>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#e6b347' }}/>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#7ac36a' }}/>
          <span style={{ marginLeft: 16, color: '#6b6458' }}>customers_master.csv</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', fontSize: 13 }}>
          <Cell head>row</Cell>
          <Cell head>email</Cell>
          <Cell head>phone</Cell>
          <Cell head accent>✨ cleaned_name</Cell>

          <Cell>001</Cell><Cell>JOHN@ACME.com</Cell><Cell>+1-415-555-0100</Cell><Cell diff>John Rivera</Cell>
          <Cell>002</Cell><Cell>jane @ acme.com</Cell><Cell>(415) 555·0133</Cell><Cell diff>Jane Cho</Cell>
          <Cell>003</Cell><Cell>dup@acme.com</Cell><Cell>555.0100</Cell><Cell dup>— merged →</Cell>
          <Cell>004</Cell><Cell>kai@acme.co</Cell><Cell>+44 20 7946 0958</Cell><Cell diff>Kai Tanaka</Cell>
        </div>
      </div>

      {/* floating prompt */}
      <div style={{
        position: 'absolute', right: 40, bottom: 90,
        background: S_LIME, color: S_INK, padding: '10px 14px', borderRadius: 6,
        fontSize: 13, transform: 'rotate(3deg)',
        opacity: inView ? 1 : 0,
        transition: 'opacity 700ms 900ms',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      }}>
        clean names ✓
      </div>
    </div>
  );
}

function Cell({ children, head, accent, diff, dup }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderBottom: '1px solid #eceae2',
      borderRight: '1px solid #eceae2',
      background: head ? (accent ? S_LIME : '#f6f4ef') : (diff ? '#eaf7dd' : dup ? '#eceae2' : '#fff'),
      color: head ? S_INK : (diff ? '#2f5115' : dup ? '#8a8478' : S_INK),
      fontWeight: head ? 600 : 400,
      fontFamily: head ? S_MONO : S_MONO,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {children}
    </div>
  );
}

function SystemVisual({ inView }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, color: S_PAPER, fontFamily: S_MONO,
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)',
      gap: 12, padding: 40,
    }}>
      {[
        { l: 'Aa', style: { background: S_PAPER, color: S_INK, fontFamily: S_SERIF, fontSize: 72 } },
        { l: '01 primary', style: { background: S_BLUE, color: S_PAPER } },
        { l: '02 accent',  style: { background: S_LIME, color: S_INK } },
        { l: 'radius 4 · 8 · 12', style: { background: '#fff', color: S_INK } },
        { l: '→', style: { background: S_PAPER, color: S_INK, fontSize: 80, fontFamily: S_SERIF } },
        { l: 'grid · 8', style: { background: '#2b2b33', color: S_PAPER } },
        { l: 'spacing · xl', style: { background: '#fff', color: S_INK } },
        { l: 'motion · ease-out', style: { background: S_LIME, color: S_INK } },
        { l: 'shadow · md', style: { background: S_PAPER, color: S_INK } },
      ].map((tile, i) => (
        <div key={i} style={{
          ...tile.style,
          borderRadius: 6, padding: 18,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
          fontSize: tile.style.fontSize || 13,
          opacity: inView ? 1 : 0,
          transform: inView ? 'scale(1)' : 'scale(0.9)',
          transition: `opacity 600ms ${200 + i*60}ms, transform 700ms ${200 + i*60}ms cubic-bezier(.2,.7,.2,1)`,
        }}>
          {tile.l}
        </div>
      ))}
    </div>
  );
}

function PipelineVisual({ inView }) {
  const steps = [
    { l: 'Ingest',    n: '12.4M rows' },
    { l: 'Dedupe',    n: '−9,412' },
    { l: 'Normalize', n: '48 rules' },
    { l: 'Enrich',    n: '✨ AI' },
    { l: 'Validate',  n: 'pass ✓' },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0, padding: 48, color: S_PAPER, fontFamily: S_MONO,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18,
    }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '40px 1fr 140px 80px',
          alignItems: 'center', gap: 14,
          background: i === 3 ? 'rgba(141,198,81,0.15)' : 'rgba(246,244,239,0.05)',
          border: `1px solid ${i === 3 ? S_LIME : 'rgba(246,244,239,0.15)'}`,
          borderRadius: 8, padding: '14px 18px',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateX(0)' : 'translateX(-40px)',
          transition: `opacity 600ms ${150 + i*120}ms, transform 700ms ${150 + i*120}ms cubic-bezier(.2,.7,.2,1)`,
        }}>
          <span style={{ color: 'rgba(246,244,239,0.5)', fontSize: 12 }}>{String(i+1).padStart(2, '0')}</span>
          <span style={{ fontFamily: S_SERIF, fontSize: 28, color: S_PAPER }}>{s.l}</span>
          <span style={{ fontSize: 13, color: i === 3 ? S_LIME : 'rgba(246,244,239,0.7)' }}>{s.n}</span>
          <span style={{ height: 3, background: i <= 3 ? S_LIME : 'rgba(246,244,239,0.2)', borderRadius: 2 }}/>
        </div>
      ))}
    </div>
  );
}

// ── Section 3: Testimonial ──────────────────────────────────────────────────
function Testimonial() {
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const reveal = (d) => ({
    opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 900ms ${d}ms, transform 900ms ${d}ms cubic-bezier(.2,.7,.2,1)`,
  });

  return (
    <section ref={ref} style={{
      background: S_INK, color: S_PAPER, padding: '160px 40px', position: 'relative',
    }} data-screen-label="03 Testimonial">
      <h2 style={{
        fontFamily: S_SERIF, fontWeight: 400,
        fontSize: 'clamp(60px, 9vw, 160px)', lineHeight: 0.95, letterSpacing: '-0.03em',
        textAlign: 'center', margin: 0, maxWidth: 1400, marginInline: 'auto',
        ...reveal(0),
      }}>
        Apparently, Datapilot is <em style={{ fontStyle: 'italic', color: S_LIME }}>fun</em><br/>
        to work with!
      </h2>

      <div style={{
        display: 'grid', gridTemplateColumns: '120px 1fr 120px',
        maxWidth: 900, margin: '110px auto 0', alignItems: 'start',
      }}>
        <div style={{
          fontFamily: S_SERIF, fontSize: 160, color: S_LIME, lineHeight: 0.7,
          ...reveal(200),
        }}>“</div>
        <div style={{
          fontFamily: S_MONO, fontSize: 16, lineHeight: 1.7, color: 'rgba(246,244,239,0.85)',
          ...reveal(300),
        }}>
          Datapilot has an exceptional ability to bring clarity and life to ambiguous data,
          turning it into reliable rows our analysts actually trust. Highly resourceful
          and deeply connected to the operator's workflow — always one prompt away from
          the right fix.
          <div style={{ marginTop: 36, fontStyle: 'italic', color: 'rgba(246,244,239,0.55)' }}>
            Head of Data · Superreply<br/>
            Anubhav Agarwal
          </div>
        </div>
        <div style={{
          fontFamily: S_SERIF, fontSize: 160, color: S_LIME, textAlign: 'right', lineHeight: 0.7,
          ...reveal(400),
        }}>”</div>
      </div>
    </section>
  );
}

// ── Section 4: Work-with-me CTA ─────────────────────────────────────────────
function CTA({ onReplay }) {
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const reveal = (d) => ({
    opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 900ms ${d}ms, transform 900ms ${d}ms cubic-bezier(.2,.7,.2,1)`,
  });

  return (
    <section ref={ref} style={{
      background: S_PAPER, color: S_INK, padding: '160px 40px 220px',
      textAlign: 'center', position: 'relative', minHeight: '80vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }} data-screen-label="04 CTA">
      <div style={{
        fontFamily: S_MONO, fontSize: 13, color: '#6b6458',
        letterSpacing: '0.3em', textTransform: 'uppercase', ...reveal(0),
      }}>
        Still here?
      </div>

      <h2 style={{
        fontFamily: S_SERIF, fontWeight: 400,
        fontSize: 'clamp(80px, 12vw, 200px)', lineHeight: 1, letterSpacing: '-0.04em',
        margin: '40px 0 20px', position: 'relative', ...reveal(100),
      }}>
        Clean with&nbsp;
        <em style={{ fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
          me
          {/* "I know you want to" sticker */}
          <span style={{
            position: 'absolute', left: '100%', top: '-10%',
            background: S_BLUE, color: S_PAPER,
            padding: '6px 12px', borderRadius: 4,
            fontFamily: S_MONO, fontSize: 14, fontStyle: 'normal',
            transform: 'rotate(-3deg) translateX(20px)',
            whiteSpace: 'nowrap',
            opacity: inView ? 1 : 0,
            transition: 'opacity 700ms 900ms',
          }}>
            I know you want to
          </span>
        </em>
        <span style={{ color: S_BLUE }}>.</span>
        {/* arrow */}
        <svg viewBox="0 0 200 120" style={{
          position: 'absolute', left: '65%', top: '-30%', width: 140, height: 90,
          opacity: inView ? 1 : 0, transition: 'opacity 900ms 700ms',
        }}>
          <path d="M10 110 Q 100 -10 180 40" stroke={S_BLUE} strokeWidth="3" fill="none"/>
          <path d="M165 28 L 182 42 L 170 58" stroke={S_BLUE} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </h2>

      <div style={{
        display: 'flex', gap: 40, marginTop: 40, fontFamily: S_MONO, fontSize: 16,
        ...reveal(200),
      }}>
        <a href="#" style={{ color: S_INK, textDecoration: 'none', borderBottom: `1.5px solid ${S_INK}` }}>Email</a>
        <a href="#" style={{ color: S_INK, textDecoration: 'none', borderBottom: `1.5px solid ${S_INK}` }}>Docs</a>
        <a href="#" style={{ color: S_BLUE, textDecoration: 'none', borderBottom: `1.5px solid ${S_BLUE}` }}>@datapilotai</a>
      </div>

      <div style={{
        position: 'absolute', left: 28, bottom: 28,
        fontFamily: S_MONO, fontSize: 11, color: '#8a8478',
      }}>
        © 2026 — Definitely not our first draft.
      </div>

      <button onClick={onReplay} style={{
        position: 'absolute', left: 28, bottom: 90,
        width: 44, height: 44, background: S_BLUE, color: S_PAPER,
        border: 'none', borderRadius: 4, cursor: 'pointer',
        fontFamily: S_MONO, fontSize: 18,
      }} title="Replay intro">↑</button>
    </section>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
function Site({ onReplay }) {
  const [active, setActive] = React.useState(1);
  const scrollTo = (n) => {
    const labels = ['01 Hero', '02 Work', '03 Testimonial', '04 CTA'];
    const el = document.querySelector(`[data-screen-label="${labels[n - 1]}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: S_PAPER, color: S_INK, minHeight: '100vh' }}>
      <TopBar mode="light" status="Linear"/>
      <SectionNumbers active={active} onClick={scrollTo}/>
      <Hero/>
      <Work activeIdx={active} onActive={setActive}/>
      <Testimonial/>
      <CTA onReplay={onReplay}/>
      <BottomNav active="Work" mode="light"/>
    </div>
  );
}

Object.assign(window, { Site });

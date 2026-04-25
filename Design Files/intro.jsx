// intro.jsx — 10s animated intro for Datapilot AI
// Mounted inside a <Stage width={1920} height={1080} duration={10}>

const BLUE = '#1710E6';
const LIME = '#8DC651';
const INK = '#0e0e12';
const PAPER = '#f6f4ef';
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
const SERIF = "'Instrument Serif', 'Fraunces', Georgia, serif";
const SERIF_I = "'Instrument Serif', 'Fraunces', Georgia, serif";

// Status bar chrome — persistent across the intro
function Chrome({ onRoute }) {
  const t = useTime();
  // blinking dot
  const pulse = 0.55 + 0.45 * Math.sin(t * 3.2);

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      color: INK, fontFamily: MONO, fontSize: 18, letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      <div style={{ position: 'absolute', left: 40, top: 36 }}>
        DATAPILOT&nbsp;AI
      </div>

      <div style={{
        position: 'absolute', top: 28,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff',
        border: `1.5px solid ${INK}`,
        padding: '8px 14px 8px 10px',
        borderRadius: 999,
        fontSize: 14,
      }}>
        <span style={{
          width: 14, height: 14, borderRadius: 999, background: BLUE, display: 'inline-block',
        }}/>
        <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: MONO }}>Cinematic</span>
      </div>

      <div style={{
        position: 'absolute', right: 40, top: 36,
        display: 'flex', alignItems: 'center', gap: 22, fontSize: 18,
      }}>
        <span style={{ color: BLUE }}>23 09 18 PST</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: INK }}>
          <span style={{
            width: 10, height: 10, borderRadius: 999,
            background: LIME, display: 'inline-block',
            opacity: pulse,
          }}/>
          Shipping v2.6
        </span>
      </div>
    </div>
  );
}

// Scene 1 (0–3s): "Messy data." establishing shot with scattered chips
function SceneMess() {
  const { localTime } = useSprite();

  const chips = [
    { t: 'user_id,NaN,??',       x: 280,  y: 360, r: -7,  d: 0.05 },
    { t: 'john@ACME.COM ',       x: 1180, y: 300, r: 4,   d: 0.15 },
    { t: '  +1 (415) 555',       x: 420,  y: 760, r: 6,   d: 0.25 },
    { t: '2026/13/45',           x: 1340, y: 780, r: -5,  d: 0.35 },
    { t: '"unknown"',            x: 200,  y: 580, r: 3,   d: 0.45 },
    { t: '£1,299.00  ',          x: 1460, y: 540, r: -3,  d: 0.55 },
    { t: 'null, null, null',     x: 740,  y: 820, r: 2,   d: 0.65 },
    { t: 'DUPLICATE',            x: 1100, y: 140, r: -8,  d: 0.75 },
  ];

  return (
    <>
      {chips.map((c, i) => {
        const appear = clamp((localTime - c.d) / 0.35, 0, 1);
        const eased = Easing.easeOutBack(appear);
        const fadeOut = clamp((localTime - 2.4) / 0.5, 0, 1);
        const op = eased * (1 - fadeOut);
        const scale = 0.7 + 0.3 * eased;
        return (
          <div key={i} style={{
            position: 'absolute', left: c.x, top: c.y,
            transform: `translate(-50%,-50%) rotate(${c.r}deg) scale(${scale})`,
            opacity: op,
            fontFamily: MONO, fontSize: 26, color: '#8a8478',
            background: '#eceae2',
            padding: '10px 16px',
            border: '1px dashed #b9b2a3',
            borderRadius: 6,
            whiteSpace: 'pre',
          }}>
            {c.t}
          </div>
        );
      })}

      {/* small label */}
      <div style={{
        position: 'absolute', left: '50%', top: 470,
        transform: 'translate(-50%,-50%)',
        fontFamily: MONO, fontSize: 18, color: '#8a8478',
        textTransform: 'uppercase', letterSpacing: '0.2em',
        opacity: clamp((localTime - 0.8) / 0.4, 0, 1) * (1 - clamp((localTime - 2.4) / 0.5, 0, 1)),
      }}>
        — your spreadsheet, right now —
      </div>

      {/* BIG WORD */}
      <div style={{
        position: 'absolute', left: '50%', top: 560,
        transform: `translate(-50%,-50%) scale(${0.92 + 0.08 * Easing.easeOutCubic(clamp((localTime - 1.1) / 0.8, 0, 1))})`,
        fontFamily: SERIF, fontSize: 280, fontWeight: 400,
        color: INK, letterSpacing: '-0.03em', lineHeight: 1,
        opacity: clamp((localTime - 1.1) / 0.4, 0, 1) * (1 - clamp((localTime - 2.5) / 0.5, 0, 1)),
      }}>
        Messy<span style={{ fontStyle: 'italic', color: BLUE }}>.</span>
      </div>
    </>
  );
}

// Scene 2 (3–7s): big hero moment — "Clean data beautifully."
function SceneHero() {
  const { localTime, duration } = useSprite();

  const line1Op = clamp((localTime - 0.2) / 0.6, 0, 1);
  const line2Op = clamp((localTime - 0.9) / 0.7, 0, 1);
  const funReveal = clamp((localTime - 1.8) / 0.9, 0, 1);
  const subOp = clamp((localTime - 2.4) / 0.6, 0, 1);

  const exitT = clamp((localTime - (duration - 0.5)) / 0.5, 0, 1);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      opacity: 1 - exitT,
      transform: `translateY(${-exitT * 24}px)`,
    }}>
      {/* mono kicker */}
      <div style={{
        position: 'absolute', left: '50%', top: 340,
        transform: 'translate(-50%,-50%)',
        fontFamily: MONO, fontSize: 18, color: '#6b6458',
        textTransform: 'uppercase', letterSpacing: '0.26em',
        opacity: line1Op,
      }}>
        datapilot — introducing
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, top: 460,
        textAlign: 'center',
        fontFamily: SERIF, fontSize: 220, fontWeight: 400,
        color: INK, letterSpacing: '-0.035em', lineHeight: 0.95,
      }}>
        <span style={{
          display: 'inline-block',
          opacity: line1Op,
          transform: `translateY(${(1 - Easing.easeOutCubic(line1Op)) * 20}px)`,
        }}>Clean data</span>
        {' '}
        <span style={{
          display: 'inline-block',
          fontStyle: 'italic',
          color: LIME,
          opacity: funReveal,
          transform: `translateY(${(1 - Easing.easeOutBack(funReveal)) * 30}px) rotate(${(1 - funReveal) * -4}deg)`,
        }}>beautifully</span>
        <span style={{ color: BLUE, opacity: line2Op }}>.</span>
      </div>

      {/* underline swipe under "beautifully" */}
      <div style={{
        position: 'absolute', left: '50%', top: 700,
        transform: 'translateX(-50%)',
        width: 560 * clamp((funReveal - 0.3) / 0.7, 0, 1),
        height: 6,
        background: LIME,
        borderRadius: 3,
      }}/>

      {/* subtitle */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 760,
        textAlign: 'center',
        fontFamily: MONO, fontSize: 22, color: '#4a453d',
        opacity: subOp,
        letterSpacing: '0.02em',
      }}>
        AI that de-duplicates, normalizes &amp; enriches your rows —
        <span style={{ color: BLUE }}> in seconds.</span>
      </div>

      {/* small floating accent squares */}
      <div style={{
        position: 'absolute', left: 220, top: 430,
        width: 56, height: 56, background: BLUE, borderRadius: 6,
        transform: `rotate(${12 + localTime * 6}deg)`,
        opacity: line1Op,
      }}/>
      <div style={{
        position: 'absolute', right: 220, top: 520,
        width: 40, height: 40, background: LIME, borderRadius: 4,
        transform: `rotate(${-20 - localTime * 5}deg)`,
        opacity: line2Op,
      }}/>
    </div>
  );
}

// Scene 3 (7–10s): CTA moment — "Work with Datapilot." + button pop
function SceneCTA() {
  const { localTime, duration } = useSprite();

  const op1 = clamp((localTime - 0.1) / 0.5, 0, 1);
  const op2 = clamp((localTime - 0.8) / 0.6, 0, 1);
  const arrowPull = clamp((localTime - 1.6) / 0.6, 0, 1);
  const btnPop = clamp((localTime - 2.0) / 0.5, 0, 1);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: INK,
      color: PAPER,
    }}>
      {/* kicker */}
      <div style={{
        position: 'absolute', left: '50%', top: 280,
        transform: 'translate(-50%,-50%)',
        fontFamily: MONO, fontSize: 18, color: 'rgba(246,244,239,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.3em',
        opacity: op1,
      }}>
        Still here?
      </div>

      {/* big line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 500,
        textAlign: 'center',
        fontFamily: SERIF, fontSize: 200, fontWeight: 400,
        color: PAPER, letterSpacing: '-0.035em', lineHeight: 1,
      }}>
        <span style={{
          display: 'inline-block',
          opacity: op1,
          transform: `translateY(${(1 - Easing.easeOutCubic(op1)) * 30}px)`,
        }}>Let&rsquo;s clean&nbsp;</span>
        <span style={{
          display: 'inline-block',
          fontStyle: 'italic',
          opacity: op2,
          transform: `translateY(${(1 - Easing.easeOutCubic(op2)) * 30}px)`,
        }}>it</span>
        <span style={{ opacity: op2 }}>.</span>
      </div>

      {/* arrow + highlighted label */}
      <div style={{
        position: 'absolute', left: '50%', top: 420,
        transform: `translate(-50%,-50%) translateX(${300 - 40 * arrowPull}px)`,
        opacity: arrowPull,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ overflow: 'visible' }}>
          <path d={`M10 60 Q 60 0 110 40`}
            stroke={BLUE} strokeWidth="4" fill="none"
            strokeDasharray="400"
            strokeDashoffset={400 - 400 * arrowPull}/>
          <path d="M95 28 L 112 40 L 100 54"
            stroke={BLUE} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"
            opacity={clamp((arrowPull - 0.7) / 0.3, 0, 1)}/>
        </svg>
        <div style={{
          background: BLUE, color: PAPER,
          fontFamily: MONO, fontSize: 22,
          padding: '10px 16px', borderRadius: 4,
          transform: 'rotate(-2deg)',
        }}>
          I know you want to
        </div>
      </div>

      {/* CTA button row */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 110,
        transform: `translate(-50%, 0) scale(${0.8 + 0.2 * Easing.easeOutBack(btnPop)})`,
        opacity: btnPop,
        display: 'flex', gap: 12,
      }}>
        <button style={{
          background: BLUE, color: PAPER,
          border: 'none', borderRadius: 6,
          padding: '18px 28px',
          fontFamily: MONO, fontSize: 20,
          display: 'inline-flex', alignItems: 'center', gap: 12,
        }}>
          <span>Enter the site</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, background: PAPER, color: BLUE, borderRadius: 999,
            fontSize: 16, fontWeight: 700,
          }}>→</span>
        </button>
        <button style={{
          background: 'transparent', color: PAPER,
          border: `1.5px solid ${PAPER}`, borderRadius: 6,
          padding: '18px 24px',
          fontFamily: MONO, fontSize: 20,
        }}>
          Docs
        </button>
      </div>
    </div>
  );
}

function IntroMovie({ onEnter }) {
  const t = useTime();
  // after scene 2 starts, chrome should swap to dark-aware colors
  return (
    <>
      <Sprite start={0} end={3}>
        <SceneMess />
      </Sprite>
      <Sprite start={3} end={7}>
        <SceneHero />
      </Sprite>
      <Sprite start={7} end={10}>
        <SceneCTA />
      </Sprite>
      {t < 7 ? <Chrome /> : <ChromeDark />}
      <DataScreenLabel />
      {/* Floating "skip intro" */}
      <div style={{
        position: 'absolute', right: 40, bottom: 40, zIndex: 20,
        display: 'flex', gap: 8,
      }}>
        <button
          onClick={onEnter}
          style={{
            background: t >= 7 ? '#fff' : INK,
            color: t >= 7 ? INK : '#fff',
            border: 'none', borderRadius: 6,
            padding: '12px 18px',
            fontFamily: MONO, fontSize: 16,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
          Skip intro →
        </button>
      </div>
    </>
  );
}

function ChromeDark() {
  const t = useTime();
  const pulse = 0.55 + 0.45 * Math.sin(t * 3.2);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      color: PAPER, fontFamily: MONO, fontSize: 18, letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      <div style={{ position: 'absolute', left: 40, top: 36 }}>DATAPILOT&nbsp;AI</div>
      <div style={{
        position: 'absolute', top: 28,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.06)',
        border: `1.5px solid rgba(246,244,239,0.25)`,
        padding: '8px 14px 8px 10px',
        borderRadius: 999,
        fontSize: 14, color: PAPER,
      }}>
        <span style={{ width: 14, height: 14, borderRadius: 999, background: LIME, display: 'inline-block' }}/>
        <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: MONO }}>Finale</span>
      </div>
      <div style={{
        position: 'absolute', right: 40, top: 36,
        display: 'flex', alignItems: 'center', gap: 22, fontSize: 18,
      }}>
        <span style={{ color: LIME }}>23 09 25 PST</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: LIME, opacity: pulse }}/>
          Open for work
        </span>
      </div>
    </div>
  );
}

// stamp timestamp into the stage wrapper for commenting
function DataScreenLabel() {
  const t = useTime();
  React.useEffect(() => {
    const root = document.getElementById('intro-root');
    if (root) root.setAttribute('data-screen-label', `intro @ ${t.toFixed(1)}s`);
  }, [Math.floor(t)]);
  return null;
}

Object.assign(window, { IntroMovie, BLUE, LIME, INK, PAPER, MONO, SERIF });

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  motion, useReducedMotion, useScroll, useMotionValueEvent,
  useTransform, useInView, AnimatePresence,
} from 'framer-motion';
import {
  Home, FolderKanban, LayoutGrid, MessageSquare, Clock, Settings,
  Plus, RotateCw, Lock, Sparkles, Layers, Command, PanelsTopLeft,
  Download, ArrowRight, Send, FileText, Globe, StickyNote,
  Compass, Gauge, Mic, GitPullRequest, Database,
  Mail, Check,
} from 'lucide-react';

/* brand icons (lucide dropped brands) */
const GithubIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);
const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
  </svg>
);
const YoutubeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.55 12 3.55 12 3.55s-7.51 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.51 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
  </svg>
);
import './styles.css';

/* ---------- shared motion ---------- */
const EASE = [0.16, 1, 0.3, 1];
const fadeUp = (y = 16, d = 0.6) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration: d, ease: EASE } },
});
const stagger = (gap = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});
const VIEW = { once: true, amount: 0.25 };

/* ---------- VC mark (inline SVG — blue V + ink C) ---------- */
function Mark({ size = 26 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="vGrad" x1="6" y1="8" x2="22" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fbcfb" />
          <stop offset="1" stopColor="#3f8ef7" />
        </linearGradient>
      </defs>
      {/* V */}
      <path d="M2 8.5 L10.5 8.5 L16.5 28.5 L22.5 8.5 L31 8.5 L20.5 41.5 L12.5 41.5 Z" fill="url(#vGrad)" />
      {/* C */}
      <path
        d="M41.2 16.2 A 11.4 11.4 0 1 0 41.2 35.8"
        stroke="#1b1e26"
        strokeWidth="8.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ---------- magnetic button ---------- */
function Magnetic({ children }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.24 });
  };
  return (
    <motion.span
      ref={ref}
      className="magnetic"
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.6 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.span>
  );
}

/* ---------- nav ---------- */
function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));
  return (
    <motion.nav
      className={`nav ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="navInner">
        <a className="brand" href="#top"><Mark /><span>VCorv</span></a>
        <div className="navLinks">
          <a href="#products">Products</a>
          <a href="#corv-ai">Corv AI</a>
          <a href="#browser">Browser</a>
          <a href="#agent">Agent</a>
          <a href="#download">Download</a>
        </div>
        <Magnetic>
          <a className="btn ghost small" href="#download"><Download size={15} strokeWidth={2} />Download</a>
        </Magnetic>
      </div>
    </motion.nav>
  );
}

/* ---------- typing loop for the mockup omnibox ---------- */
const QUERIES = [
  'how do AI agents share memory?',
  'summarize my 12 open tabs',
  'what changed in the RoPE paper?',
];
function useTypingLoop(reduce) {
  const [text, setText] = useState('');
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  useEffect(() => {
    if (reduce) { setText(QUERIES[0]); setAnswered(true); return; }
    let i = 0; let alive = true;
    const q = QUERIES[qi];
    setAnswered(false); setText('');
    const type = setInterval(() => {
      if (!alive) return;
      i += 1; setText(q.slice(0, i));
      if (i >= q.length) {
        clearInterval(type);
        setTimeout(() => alive && setAnswered(true), 350);
        setTimeout(() => alive && setQi((v) => (v + 1) % QUERIES.length), 5200);
      }
    }, 55);
    return () => { alive = false; clearInterval(type); };
  }, [qi, reduce]);
  return { text, answered, qi };
}

/* ---------- browser mockup (HTML/CSS, alive) ---------- */
function BrowserMockup({ reduce, parallaxY, inline }) {
  const railIcons = [Home, FolderKanban, LayoutGrid, MessageSquare, Clock];
  const { text, answered, qi } = useTypingLoop(reduce);
  const activeTab = qi % 3;
  return (
    <motion.div
      className={`mockupWrap ${inline ? 'inline' : ''}`}
      style={{ transformPerspective: 1200, y: parallaxY }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotateX: 8 }}
      {...(inline
        ? { whileInView: reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 3 }, viewport: { once: true, amount: 0.25 } }
        : { animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 4 } })}
      transition={{ duration: 0.9, delay: inline ? 0.1 : 0.3, ease: EASE }}
    >
      <motion.div
        className="mockup"
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="tabStrip">
          <div className="trafficDots"><span /><span /><span /></div>
          {[['Q3 Research — Spaces', Mark], ['arxiv.org', Globe], ['Draft notes', FileText]].map(([label, Icon], i) => (
            <div key={label} className={`tab ${activeTab === i ? 'active' : ''}`}>
              {Icon === Mark ? <Mark size={13} /> : <Icon size={12} />}
              <em>{label}</em><i>×</i>
            </div>
          ))}
          <div className="tabNew"><Plus size={13} /></div>
        </div>
        <div className="addressRow">
          <span className="navBtn">←</span>
          <span className="navBtn">→</span>
          <span className="navBtn"><RotateCw size={12} /></span>
          <div className="addressBar typingBar">
            <Sparkles size={11} className="blueIcon" />
            <span className="url typed">{text}<i className="caret" /></span>
            <span className="askAI"><Sparkles size={11} /> Ask AI</span>
          </div>
          <span className="navBtn"><Settings size={13} /></span>
        </div>
        <div className="mockupBody">
          <aside className="iconRail">
            {railIcons.map((Icon, i) => (
              <motion.span
                key={i}
                className={`railIcon ${i === 1 ? 'active' : ''}`}
                animate={reduce ? {} : { opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
              >
                <Icon size={15} strokeWidth={1.8} />
              </motion.span>
            ))}
            <span className="railSpacer" />
            <span className="railIcon"><Settings size={15} strokeWidth={1.8} /></span>
          </aside>
          <div className="mockupContent">
            <div className="contentPane">
              <div className="paneHeader"><b>Q3 Research</b><span>12 tabs · 4 notes · 2 agents</span></div>
              <div className="skeletonGrid">
                <div className="skCard"><span className="skLine w70" /><span className="skLine w40" /></div>
                <div className="skCard"><span className="skLine w60" /><span className="skLine w50" /></div>
                <div className="skCard wide"><span className="skLine w80" /><span className="skLine w60" /><span className="skLine w30" /></div>
              </div>
            </div>
            <div className="aiPane">
              <div className="aiHeader"><Sparkles size={12} /> VCorv AI</div>
              <AnimatePresence mode="wait">
                {answered ? (
                  <motion.div
                    key={`ans-${qi}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <div className="aiMsg them">
                      {['Agents share memory through vector stores and shared context files. Your open tabs cover three patterns…',
                        'Done — 12 tabs, 3 themes: retrieval memory, agent orchestration, eval methods. Full digest ready.',
                        'The RoPE scaling section changed: longer contexts via base-frequency interpolation. Diff highlighted.'][qi]}
                    </div>
                    <div className="aiMsg me">{['Turn that into a comparison table.', 'Pin the digest to this space.', 'Add it to my notes.'][qi]}</div>
                  </motion.div>
                ) : (
                  <motion.div key={`dots-${qi}`} className="aiTyping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span /><span /><span />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="aiInput"><span>Ask anything…</span><Send size={11} /></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- hero suite teaser ---------- */
function HeroSuiteTeaser() {
  const items = [
    [Sparkles, 'Corv AI', 'The intelligence', '#corv-ai', 'blue'],
    [Compass, 'Browser', 'The workspace', '#browser', 'cyan'],
    [Mic, 'Agent', 'The hands', '#agent', 'violet'],
  ];
  return (
    <motion.div className="heroSuite" variants={stagger(0.12)} initial="hidden" animate="show">
      {items.map(([Icon, name, role, href, accent]) => (
        <motion.a
          key={name}
          className={`heroSuiteCard accent-${accent}`}
          href={href}
          variants={fadeUp(24, 0.6)}
          whileHover={{ y: -6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <span className="heroSuiteIcon"><Icon size={18} strokeWidth={1.9} /></span>
          <span className="heroSuiteText">
            <b>{name}</b>
            <em>{role}</em>
          </span>
          <ArrowRight size={15} className="hsArrow" />
        </motion.a>
      ))}
    </motion.div>
  );
}

/* ---------- hero ---------- */
function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const auroraY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 90]);
  return (
    <header className="hero" id="top">
      <motion.div className="aurora" style={{ y: auroraY }} aria-hidden="true">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      </motion.div>
      <span className="grain" aria-hidden="true" />
      <motion.div className="heroText" variants={stagger(0.09)} initial="hidden" animate="show">
        <motion.div
          className="heroMark"
          variants={{
            hidden: { opacity: 0, scale: 0.85, filter: 'blur(10px)' },
            show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
          }}
        >
          <motion.span
            className="heroMarkGlow"
            animate={reduce ? {} : { opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <motion.span
            animate={reduce ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="heroMarkInner"
          >
            <Mark size={148} />
          </motion.span>
        </motion.div>
        <h1 className="heroWord" aria-label="VCorv">
          {['V', 'Corv'].map((w, i) => (
            <motion.span
              key={i}
              className={i === 0 ? 'heroV' : 'heroC'}
              variants={{
                hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
                show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
              }}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p className="sub heroTag" variants={fadeUp()}>
          <span className="shimmer">Think faster.</span> Browse quieter.
        </motion.p>
        <motion.div className="heroActions" variants={fadeUp()}>
          <Magnetic><a className="btn primary" href="#products">Explore the suite <ArrowRight size={15} /></a></Magnetic>
        </motion.div>
      </motion.div>
      <HeroSuiteTeaser />
    </header>
  );
}

/* ---------- persona marquee ---------- */
const personas = ['Researchers', 'Developers', 'Founders', 'Students', 'Writers', 'Analysts', 'Designers', 'Traders'];
function PersonaStrip() {
  const list = [...personas, ...personas];
  return (
    <motion.section
      className="personaStrip"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      <p className="stripLabel">Built for people who live in the browser</p>
      <div className="marquee">
        <div className="marqueeTrack">
          {list.map((p, i) => <span key={`${p}-${i}`}>{p}<i>·</i></span>)}
        </div>
      </div>
    </motion.section>
  );
}

/* ---------- stats band (count-up) ---------- */
function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setN(to); return; }
    let start; let raf;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 1200, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduce]);
  return <b ref={ref}>{n}{suffix}</b>;
}
function StatsBand() {
  return (
    <motion.section className="statsBand" variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={VIEW}>
      {[
        [<CountUp key="1" to={1} />, 'workspace for everything'],
        [<CountUp key="2" to={80} suffix="%" />, 'less tab chaos'],
        [<CountUp key="3" to={12} suffix="s" />, 'to full project context'],
      ].map(([num, label], i) => (
        <motion.div className="stat" key={i} variants={fadeUp(14, 0.5)}>
          {num}<span>{label}</span>
        </motion.div>
      ))}
    </motion.section>
  );
}

/* ---------- feature blocks ---------- */
function FeatureBlock({ id, flip, blue, accent = 'blue', eyebrow, title, body, points, card }) {
  return (
    <div className={`feature ${flip ? 'flip' : ''} accent-${accent}`} id={id}>
      <motion.div
        className="featureText"
        initial={{ opacity: 0, x: flip ? 32 : -32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={VIEW}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <p className="eyebrow tick">{eyebrow}</p>
        <h3>{title}</h3>
        <p className="body">{body}</p>
        <ul className="pointList">{points.map((p) => <li key={p}>{p}</li>)}</ul>
      </motion.div>
      <motion.div
        className="featureCardWrap glow"
        initial={{ opacity: 0, y: 24, scale: blue ? 0.98 : 1 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={VIEW}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      >
        <span className="cardGlow" aria-hidden="true" />
        <motion.div className="glassCard sheen" whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          {card}
        </motion.div>
      </motion.div>
    </div>
  );
}

function SpacesCard() {
  const reduce = useReducedMotion();
  const base = [
    ['Q3 Research', '12 tabs'],
    ['Launch plan', '8 tabs'],
    ['Side project', '5 tabs'],
    ['Reading list', '21 tabs'],
  ];
  const [order, setOrder] = useState(base);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setOrder((o) => { const n = [...o]; n.push(n.shift()); return n; });
      setActive(0);
    }, 3200);
    return () => clearInterval(t);
  }, [reduce]);
  return (
    <div className="cardUI">
      <div className="cardUIHead"><Layers size={14} /> Spaces</div>
      {order.map(([name, meta], i) => (
        <motion.div
          key={name}
          layout
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className={`spaceRow ${i === active ? 'active' : ''}`}
        >
          <i /><b>{name}</b><span>{meta}</span>
        </motion.div>
      ))}
      <div className="spaceNew"><Plus size={13} /> New space</div>
    </div>
  );
}

const CHAT_SCRIPT = [
  ['them', 'Long-context handling combines positional tricks with sparse attention. Three of your tabs overlap…'],
  ['me', 'Compare them against what I read yesterday.'],
  ['them', 'Yesterday you read the RoPE scaling paper. Here\u2019s the delta — new method wins past 128k tokens.'],
  ['me', 'Pin that to my research space.'],
];
function ChatCard() {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(reduce ? CHAT_SCRIPT.length : 0);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
    const run = (i) => {
      if (!alive) return;
      if (i >= CHAT_SCRIPT.length) {
        later(() => { setCount(0); run(0); }, 3000);
        return;
      }
      if (CHAT_SCRIPT[i][0] === 'them') {
        setTyping(true);
        later(() => { setTyping(false); setCount(i + 1); run(i + 1); }, 1000);
      } else {
        later(() => { setCount(i + 1); run(i + 1); }, 1300);
      }
    };
    run(0);
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [reduce]);
  return (
    <div className="cardUI chat">
      <div className="omnibar">
        <Command size={13} />
        <span>how do transformers handle long context?</span>
        <em><Sparkles size={11} /> AI</em>
      </div>
      <div className="chatFlow">
        <AnimatePresence>
          {CHAT_SCRIPT.slice(0, count).map(([who, msg], i) => (
            <motion.div
              key={`${i}-${msg.slice(0, 8)}`}
              className={`chatMsg ${who}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {msg}
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && count < CHAT_SCRIPT.length && (
          <div className="aiTyping inChat"><span /><span /><span /></div>
        )}
      </div>
    </div>
  );
}

function WorkspaceCard() {
  const reduce = useReducedMotion();
  const [glow, setGlow] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setGlow((g) => (g + 1) % 3), 1600);
    return () => clearInterval(t);
  }, [reduce]);
  const tiles = [
    [Globe, 'Browser', ['w80', 'w60', 'w70']],
    [StickyNote, 'Notes', ['w70', 'w50']],
    [Sparkles, 'AI summary', ['w90', 'w75', 'w40']],
  ];
  return (
    <div className="cardUI split">
      {tiles.map(([Icon, label, lines], i) => (
        <div key={label} className={`tile ${i === 2 ? 'wide' : ''} ${glow === i ? 'glowing' : ''}`}>
          <div className="tileHead"><Icon size={12} /> {label}</div>
          {lines.map((w, j) => <span key={j} className={`skLine ${w}`} />)}
        </div>
      ))}
    </div>
  );
}

function Features() {
  return (
    <section className="features section" id="features">
      <FeatureBlock
        accent="cyan"
        eyebrow="Spaces"
        title="Every project gets its own room"
        body="Tabs, notes, and files cluster around the work — not around a window. Switch spaces and your entire context follows."
        points={['Auto-grouped tabs by project', 'Notes and files live alongside pages', 'Instant context switching']}
        card={<SpacesCard />}
      />
      <FeatureBlock
        flip
        blue
        accent="blue"
        eyebrow="Native AI"
        title="Ask from the address bar"
        body="No sidebar bolt-on. Type a question where you'd type a URL and VCorv answers with full awareness of your tabs and history."
        points={['Chat directly from the omnibox', 'Answers grounded in your open tabs', 'Remembers what you read yesterday']}
        card={<ChatCard />}
      />
      <FeatureBlock
        accent="violet"
        eyebrow="Unified workspace"
        title="Browse, write, and think in one place"
        body="Split views put pages, notes, and AI output side by side. Stop alt-tabbing between five apps to finish one thought."
        points={['Split-view pages and notes', 'AI summaries pinned to the work', 'One window, zero app-switching']}
        card={<WorkspaceCard />}
      />
    </section>
  );
}

/* ---------- product showcases: Corv AI / Browser / Agent ---------- */

/* Corv AI — streaming chat demo */
const AI_TURNS = [
  { q: 'Draft a launch tweet for VCorv in my voice.', a: 'Here’s a draft: “We rebuilt the browser around one idea — it should think with you. Meet VCorv.” Want it punchier or more technical?' },
  { q: 'Explain vector databases like I’m 12.', a: 'Imagine a library where books sit near other books that *mean* similar things, not just alphabetical order. That’s a vector database — it shelves ideas by meaning.' },
];
function CorvAIMock({ reduce }) {
  const [ti, setTi] = useState(0);
  const [phase, setPhase] = useState(reduce ? 'done' : 'ask'); // ask -> think -> stream -> done
  const [streamed, setStreamed] = useState(reduce ? AI_TURNS[0].a : '');
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms));
    setPhase('ask'); setStreamed('');
    later(() => setPhase('think'), 900);
    later(() => {
      setPhase('stream');
      const a = AI_TURNS[ti].a;
      let i = 0;
      const iv = setInterval(() => {
        if (!alive) { clearInterval(iv); return; }
        i += 2;
        setStreamed(a.slice(0, i));
        if (i >= a.length) {
          clearInterval(iv);
          setPhase('done');
          later(() => setTi((v) => (v + 1) % AI_TURNS.length), 3200);
        }
      }, 28);
      timers.push(iv);
    }, 2100);
    return () => { alive = false; timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); };
  }, [ti, reduce]);
  return (
    <div className="aiMock">
      <div className="aiMockHead">
        <span className="aiMockBrand"><Mark size={16} /> Corv AI</span>
        <span className="aiMockModel">corv-1 · fast</span>
      </div>
      <div className="aiMockBody">
        <motion.div
          key={`q-${ti}`}
          className="aiMockMsg user"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {AI_TURNS[ti].q}
        </motion.div>
        {phase === 'think' && (
          <div className="aiTyping"><span /><span /><span /></div>
        )}
        {(phase === 'stream' || phase === 'done') && (
          <div className="aiMockMsg bot">
            {streamed}{phase === 'stream' && <i className="caret dark" />}
          </div>
        )}
      </div>
      <div className="aiMockInput">
        <span>Message Corv AI…</span>
        <span className="aiMockSend"><Send size={12} /></span>
      </div>
    </div>
  );
}

/* Agent — voice waveform demo */
const AGENT_STEPS = [
  { state: 'Listening', line: '“Hey Corv — book my usual court for Saturday 10am.”' },
  { state: 'Working', line: 'Checking availability · Riverside Courts…' },
  { state: 'Done', line: '✓ Court 3 booked · Sat 10:00–11:00 · confirmation sent' },
];
function AgentMock({ reduce }) {
  const [si, setSi] = useState(reduce ? 2 : 0);
  useEffect(() => {
    if (reduce) return;
    const iv = setInterval(() => setSi((v) => (v + 1) % AGENT_STEPS.length), 2600);
    return () => clearInterval(iv);
  }, [reduce]);
  const step = AGENT_STEPS[si];
  const bars = [14, 26, 18, 32, 22, 36, 20, 28, 16, 24, 30, 18];
  return (
    <div className="agentMock">
      <div className="agentOrb">
        <motion.span
          className="agentOrbRing"
          animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="agentOrbCore"><Mic size={20} /></span>
      </div>
      <div className="waveBars" aria-hidden="true">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            animate={reduce ? { height: h } : { height: [h * 0.4, h, h * 0.55, h * 0.9, h * 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={si}
          className="agentStatus"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          <span className={`agentBadge s${si}`}>{step.state}</span>
          <p>{step.line}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* Browser — full live mockup (moved from hero) */
function BrowserFullMock({ reduce }) {
  return <BrowserMockup reduce={reduce} inline />;
}

/* Browser — compact live tab demo (unused, kept for reference) */
function BrowserMiniMock({ reduce }) {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const iv = setInterval(() => setTab((v) => (v + 1) % 3), 2400);
    return () => clearInterval(iv);
  }, [reduce]);
  const tabs = [['Research', Globe], ['Notes', FileText], ['Corv AI', Sparkles]];
  return (
    <div className="miniMock">
      <div className="miniTabs">
        {tabs.map(([label, Icon], i) => (
          <span key={label} className={`miniTab ${tab === i ? 'active' : ''}`}>
            <Icon size={11} /> {label}
          </span>
        ))}
      </div>
      <div className="miniBody">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="miniPane"
          >
            {tab === 0 && (<><span className="skLine w80" /><span className="skLine w60" /><span className="skLine w70" /><span className="skLine w40" /></>)}
            {tab === 1 && (<><b className="miniNoteTitle">Launch checklist</b><span className="skLine w70" /><span className="skLine w50" /><span className="skLine w60" /></>)}
            {tab === 2 && (<div className="miniChat"><span className="miniBubble">Summarize this page</span><span className="miniBubble bot">Done — 3 key points pinned to your space.</span></div>)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const SHOWCASES = [
  {
    id: 'corv-ai',
    accent: 'blue',
    num: '01',
    eyebrow: 'Corv AI',
    status: 'The intelligence',
    title: 'One AI. Every surface.',
    body: 'Corv AI is our standalone assistant — chat like you would with any frontier model, but tuned for real work. It’s the same brain that powers the browser and the agent.',
    points: ['Standalone chat app', 'Fast, grounded answers', 'Powers the whole VCorv suite'],
    Mock: CorvAIMock,
    features: [
      [MessageSquare, 'Chat that remembers', 'Threads, history, and context that carry across sessions — pick up any conversation where you left it.'],
      [Sparkles, 'Grounded answers', 'Answers pull from your tabs, notes, and history when you allow it — not just generic knowledge.'],
      [Layers, 'One brain, everywhere', 'The same AI behind the browser omnibox and the agent — learn it once, use it everywhere.'],
    ],
  },
  {
    id: 'browser',
    accent: 'cyan',
    num: '02',
    eyebrow: 'VCorv Browser',
    status: 'The workspace',
    title: 'The browser built around it.',
    body: 'Spaces, tabs, notes, and Corv AI in the omnibox — one calm workspace where browsing, writing, and asking happen in the same flow.',
    points: ['Project-based Spaces', 'AI in the address bar', 'macOS first, Electron-powered'],
    Mock: BrowserFullMock,
    bare: true,
    cta: true,
    flip: true,
    features: [
      [FolderKanban, 'Spaces', 'Every project gets its own room — tabs, notes, and files cluster around the work and switch together.'],
      [Command, 'Ask from the address bar', 'Type a question where you’d type a URL. Answers become chat threads with full page context.'],
      [PanelsTopLeft, 'Split-view workspace', 'Pages, notes, and AI output side by side. One window, zero app-switching.'],
    ],
  },
  {
    id: 'agent',
    accent: 'violet',
    num: '03',
    eyebrow: 'VCorv Agent',
    status: 'The hands',
    title: 'Say it. It’s handled.',
    body: 'The agent takes action — voice-first, fully local, private by architecture. Wake it, ask for something real, and watch it get done.',
    points: ['Voice-first, wake word built in', '100% on-device — zero cloud', 'Executes multi-step tasks'],
    Mock: AgentMock,
    features: [
      [Mic, 'Wake word, hands free', 'Say the word and talk — speech-to-text and voice replies without touching the keyboard.'],
      [Lock, 'Private by architecture', 'Runs 100% on-device. Your voice and your tasks never leave the machine.'],
      [Clock, 'Multi-step execution', 'Booking, drafting, organizing — it chains the steps and reports back when it’s done.'],
    ],
  },
];

function Products() {
  const reduce = useReducedMotion();
  return (
    <section className="products section" id="products">
      <motion.div variants={fadeUp()} initial="hidden" whileInView="show" viewport={VIEW}>
        <p className="eyebrow center tick">The VCorv suite</p>
        <h2 className="center">Three products. One brain.</h2>
        <p className="sub center productsSub">
          The AI, the browser it lives in, and the agent that acts for you —
          built to work alone, unstoppable together.
        </p>
      </motion.div>
      <div className="showcases">
        {SHOWCASES.map(({ id, accent, num, eyebrow, status, title, body, points, Mock, flip, features, bare, cta }) => (
          <div className={`productBlock accent-${accent}`} id={id} key={id}>
            <motion.div
              className="productHeader"
              variants={fadeUp(16, 0.5)}
              initial="hidden"
              whileInView="show"
              viewport={VIEW}
            >
              <span className="productNum">{num}</span>
              <span className="productName">{eyebrow}</span>
              <span className="productRole">{status}</span>
            </motion.div>
            <div className={`feature showcase ${flip ? 'flip' : ''}`}>
              <motion.div
                className="featureText"
                initial={{ opacity: 0, x: flip ? 32 : -32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={VIEW}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <h3>{title}</h3>
                <p className="body">{body}</p>
                <ul className="pointList">{points.map((p) => <li key={p}>{p}</li>)}</ul>
                {cta && (
                  <div className="productCta">
                    <Magnetic>
                      <a className="btn primary" href="#download"><Download size={15} /> Download for macOS</a>
                    </Magnetic>
                  </div>
                )}
              </motion.div>
              <motion.div
                className="featureCardWrap glow"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEW}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              >
                <span className="cardGlow" aria-hidden="true" />
                {bare ? (
                  <Mock reduce={reduce} />
                ) : (
                  <motion.div className="glassCard sheen" whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                    <Mock reduce={reduce} />
                  </motion.div>
                )}
              </motion.div>
            </div>
            <motion.div
              className="featureMiniGrid"
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {features.map(([Icon, head, text]) => (
                <motion.div key={head} className="featureMini" variants={fadeUp(16, 0.5)} whileHover={{ y: -4 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
                  <span className="featureMiniIcon"><Icon size={17} strokeWidth={1.9} /></span>
                  <b>{head}</b>
                  <p>{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
      <motion.div className="labStrip" variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={VIEW}>
        <motion.p className="labStripLabel" variants={fadeUp(12, 0.4)}>Also from the lab</motion.p>
        <div className="labRow">
          {[[Gauge, 'TokenWatch', 'AI API cost control · Beta'], [GitPullRequest, 'Code Review AI', 'Automated PR review · OSS'], [Database, 'AI Database Assistant', 'English → SQL · OSS']].map(([Icon, name, meta]) => (
            <motion.a key={name} className="labChip" href="https://github.com/ScipionT2" target="_blank" rel="noreferrer" variants={fadeUp(12, 0.4)} whileHover={{ y: -3 }}>
              <Icon size={15} strokeWidth={1.9} />
              <b>{name}</b>
              <span>{meta}</span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- how it works ---------- */
const steps = [
  ['01', 'Install', 'Download VCorv and import your bookmarks and profiles in one click.'],
  ['02', 'Connect', 'Sign in once. VCorv learns your projects and organizes your tabs into spaces.'],
  ['03', 'Work', 'Browse, ask, and write in one flow — your browser finally keeps up.'],
];
function HowItWorks() {
  return (
    <section className="how section" id="how">
      <motion.div variants={fadeUp()} initial="hidden" whileInView="show" viewport={VIEW}>
        <p className="eyebrow center tick">How it works</p>
        <h2 className="center">Up and running in minutes</h2>
      </motion.div>
      <motion.div className="stepsRow" variants={stagger(0.12)} initial="hidden" whileInView="show" viewport={VIEW}>
        {steps.map(([n, h, p], i) => (
          <React.Fragment key={n}>
            {i > 0 && (
              <motion.span
                className="stepDivider"
                variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.6, ease: EASE } } }}
                aria-hidden="true"
              />
            )}
            <motion.div className="step" variants={fadeUp(16, 0.5)}>
              <span className="stepNum">{n}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </motion.div>
          </React.Fragment>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  const reduce = useReducedMotion();
  return (
    <section className="cta section" id="download">
      <div className="ctaMarkWrap">
        <motion.span
          className="ctaHalo"
          animate={reduce ? { opacity: 0.25 } : { opacity: [0.2, 0.35, 0.2], scale: [1, 1.06, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        {!reduce && (
          <span className="orbits" aria-hidden="true">
            <span className="orbit o1"><i /></span>
            <span className="orbit o2"><i /></span>
            <span className="orbit o3"><i /></span>
          </span>
        )}
        <Mark size={56} />
      </div>
      <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={VIEW}>
        <motion.h2 variants={fadeUp(20)}>Think faster.<br />Browse quieter.</motion.h2>
        <motion.p className="sub" variants={fadeUp(20)}>Free while in beta. macOS today — Windows and Linux next.</motion.p>
        <motion.div variants={fadeUp(20)}>
          <Magnetic>
            <a className="btn primary large" href="#download"><Download size={17} /> Download VCorv</a>
          </Magnetic>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ---------- footer ---------- */
const FOOTER_COLS = [
  {
    head: 'Products',
    links: [
      ['Corv AI', '#corv-ai'],
      ['VCorv Browser', '#browser'],
      ['VCorv Agent', '#agent'],
      ['TokenWatch', 'https://github.com/ScipionT2/TokenWatch'],
      ['Corv Chat', 'https://github.com/ScipionT2/corv-chat'],
    ],
  },
  {
    head: 'Company',
    links: [
      ['About', '#top'],
      ['The suite', '#products'],
      ['How it works', '#how'],
      ['Contact', 'mailto:hello@vcorv.com'],
    ],
  },
  {
    head: 'Resources',
    links: [
      ['GitHub', 'https://github.com/ScipionT2'],
      ['OpenViz', 'https://github.com/ScipionT2/OpenViz'],
      ['Privacy', '#'],
      ['Terms', '#'],
    ],
  },
  {
    head: 'Get VCorv',
    links: [
      ['Download', '#download'],
      ['Beta access', '#download'],
      ['GitHub releases', 'https://github.com/ScipionT2'],
    ],
  },
];

function Footer() {
  const [email, setEmail] = useState('');
  const [subbed, setSubbed] = useState(false);
  return (
    <footer className="footer big">
      <div className="footerGrid">
        <div className="footerBrandCol">
          <span className="footerBrand"><Mark size={26} /> <b>VCorv</b></span>
          <p className="footerBlurb">
            VCorv is an independent AI product lab — building the browser, the AI,
            and the agent that make working with intelligence feel effortless.
            Designed and built in Texas.
          </p>
          <div className="footerBadges">
            <span className="fBadge"><GithubIcon size={13} /> Open source at heart</span>
            <span className="fBadge"><Lock size={13} /> Privacy-first — local AI options</span>
            <span className="fBadge"><Sparkles size={13} /> Founded 2026 · building in public</span>
          </div>
        </div>
        <div className="footerCols">
          {FOOTER_COLS.map(({ head, links }) => (
            <div className="footerCol" key={head}>
              <b>{head}</b>
              {links.map(([label, href]) => (
                <a key={label} href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>{label}</a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footerLower">
        <div className="footerFollow">
          <b>Follow us</b>
          <div className="socialRow">
            <a href="https://github.com/ScipionT2" target="_blank" rel="noreferrer" aria-label="GitHub"><GithubIcon size={16} /></a>
            <a href="#" aria-label="X"><XIcon size={16} /></a>
            <a href="#" aria-label="YouTube"><YoutubeIcon size={16} /></a>
            <a href="mailto:hello@vcorv.com" aria-label="Email"><Mail size={16} /></a>
          </div>
        </div>
        <div className="footerNews">
          <b>The VCorv Update</b>
          <p>Ship notes, launches, and what we’re building next. No spam.</p>
          {subbed ? (
            <div className="newsDone"><Check size={15} /> You’re in — first update coming soon.</div>
          ) : (
            <form
              className="newsForm"
              onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setSubbed(true); }}
            >
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Magnetic><button className="btn primary newsBtn" type="submit">Subscribe</button></Magnetic>
            </form>
          )}
        </div>
      </div>
      <p className="footerCopy">© 2026 VCorv. The browser that thinks with you.</p>
    </footer>
  );
}

/* ---------- app ---------- */
function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PersonaStrip />
        <StatsBand />
        <Products />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);

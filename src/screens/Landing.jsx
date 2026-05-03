import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const NAV_LINKS = ["Features", "How It Works", "Pricing", "Docs"];

const FEATURES = [
  { icon: "⬡", title: "Neural Code Gen", desc: "Context-aware generation that understands your entire codebase architecture, not just the current file.", accent: "#00f5ff" },
  { icon: "◈", title: "Real-Time Debug", desc: "AI watches your runtime, predicts stack traces before they crash, and patches logic on the fly.", accent: "#b84dff" },
  { icon: "⬟", title: "Multi-Lang Fluency", desc: "Seamless cross-language refactoring. Move logic from Python to Rust without losing semantic meaning.", accent: "#00ff88" },
  { icon: "⬢", title: "Codebase Memory", desc: "Persistent vector memory of your entire project. Ask questions about code written six months ago.", accent: "#ff6b35" },
  { icon: "◉", title: "PR Intelligence", desc: "Automated code reviews with security audits, performance insights, and style enforcement built-in.", accent: "#00f5ff" },
  { icon: "⬡", title: "Team Sync", desc: "Shared AI context across your whole team. One mate, infinite collaborators, zero context switching.", accent: "#b84dff" },
];

const STEPS = [
  { num: "01", title: "Connect Your Repo", desc: "OAuth into GitHub, GitLab, or Bitbucket. Code Mate indexes your entire workspace in seconds." },
  { num: "02", title: "Open the Terminal", desc: "Talk to Code Mate in natural language, use inline hints, or let it watch your editor live." },
  { num: "03", title: "Ship Faster", desc: "From boilerplate to bug fix to full feature — deployed, reviewed, and documented automatically." },
];

const PLANS = [
  { name: "Solo", price: "$0", period: "forever", features: ["5K tokens/day", "1 repo", "Basic completion", "Community support"], cta: "Start Free", highlight: false },
  { name: "Pro", price: "$19", period: "per month", features: ["Unlimited tokens", "Unlimited repos", "Neural debug mode", "Codebase memory", "Priority support"], cta: "Go Pro", highlight: true },
  { name: "Team", price: "$79", period: "per month", features: ["Everything in Pro", "Team context sync", "Admin dashboard", "SSO / SAML", "SLA guarantee"], cta: "Contact Sales", highlight: false },
];

function GlitchText({ children, className = "" }) {
  return (
    <span className={`glitch-wrap ${className}`} data-text={children}>
      {children}
    </span>
  );
}

function GridBackground() {
  return (
    <div className="grid-bg" aria-hidden="true">
      <div className="grid-lines" />
      <div className="grid-radial" />
      <div className="scan-line" />
    </div>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5.1) % 100}%`,
    delay: `${(i * 0.4) % 8}s`,
    dur: `${6 + (i % 3) * 2}s`,
    size: `${2 + (i % 3)}px`,
  }));
  return (
    <div className="particles" aria-hidden="true">
      {particles.map((p) => (
        <div key={p.id} className="particle" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, width: p.size, height: p.size }} />
      ))}
    </div>
  );
}

function TerminalWindow() {
  const lines = [
    { type: "prompt", text: "codemate> analyze --file=server.js" },
    { type: "info", text: "⬡ Scanning 847 lines..." },
    { type: "warn", text: "◈ Found: Potential SQL injection @ line 203" },
    { type: "success", text: "⬟ Auto-patch applied. Tests passing." },
    { type: "prompt", text: "codemate> refactor --to=typescript" },
    { type: "info", text: "⬡ Generating type definitions..." },
    { type: "success", text: "◉ Refactor complete. 0 type errors." },
    { type: "cursor", text: "codemate> _" },
  ];
  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
        <span className="terminal-title">codemate — zsh</span>
      </div>
      <div className="terminal-body">
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line line-${line.type}`} style={{ animationDelay: `${i * 0.35}s` }}>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app">
      <GridBackground />
      <FloatingParticles />

      <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">Code<span className="logo-accent">Mate</span> AI</span>
          </div>
          <ul className="nav-links">
            {NAV_LINKS.map((l) => (
              <li key={l}><a href={`#${l.toLowerCase().replace(" ", "-")}`}>{l}</a></li>
            ))}
          </ul>
          <button onClick={() => navigate("/login")} className="btn btn-outline">Sign In</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge"><span className="badge-dot" />v2.4 — Neural Engine Live</div>
        <h1 className="hero-headline">
          Your AI<br />
          <GlitchText className="headline-accent">Coding Mate</GlitchText><br />
          Has Arrived
        </h1>
        <p className="hero-sub">
          Code Mate AI pairs with your IDE to generate, debug, refactor, and review — with deep codebase memory and real-time intelligence that actually understands your stack.
        </p>
        <div className="hero-cta">
          <button onClick={() => navigate("/register")} className="btn btn-primary">Start Building Free <span className="btn-arrow">→</span></button>
          <button className="btn btn-ghost">Watch Demo ▶</button>
        </div>
        <div className="hero-stats">
          {[["98%", "Accuracy"], ["< 80ms", "Response"], ["50K+", "Devs"]].map(([val, label]) => (
            <div key={label} className="stat">
              <span className="stat-val">{val}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="hero-terminal"><TerminalWindow /></div>
      </section>

      <section className="section features" id="features">
        <div className="section-label">◈ CAPABILITIES</div>
        <h2 className="section-title">Built for the <span className="text-accent">future</span> of coding</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card" style={{ "--card-accent": f.accent }}>
              <div className="feature-icon" style={{ color: f.accent }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="card-glow" style={{ background: f.accent }} />
            </div>
          ))}
        </div>
      </section>

      <section className="section how-it-works" id="how-it-works">
        <div className="section-label">⬡ PROTOCOL</div>
        <h2 className="section-title">Three steps to <span className="text-accent">ship</span> faster</h2>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className="step">
              <div className="step-number">{s.num}</div>
              <div className="step-content"><h3>{s.title}</h3><p>{s.desc}</p></div>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      <section className="section pricing" id="pricing">
        <div className="section-label">⬟ PLANS</div>
        <h2 className="section-title">Simple, <span className="text-accent">transparent</span> pricing</h2>
        <div className="pricing-grid">
          {PLANS.map((p) => (
            <div key={p.name} className={`pricing-card ${p.highlight ? "pricing-highlight" : ""}`}>
              {p.highlight && <div className="pricing-badge">Most Popular</div>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                <span className="price-val">{p.price}</span>
                <span className="price-period">/{p.period}</span>
              </div>
              <ul className="plan-features">
                {p.features.map((f) => (<li key={f}><span className="check">◉</span> {f}</li>))}
              </ul>
              <button className={`btn ${p.highlight ? "btn-primary" : "btn-outline"} btn-full`}>{p.cta}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div className="cta-inner">
          <h2>Ready to merge with the future?</h2>
          <p>Join 50,000+ developers shipping faster with Code Mate AI.</p>
          <button onClick={() => navigate("/register")} className="btn btn-primary btn-lg">Get Started — It's Free <span className="btn-arrow">→</span></button>
        </div>
        <div className="cta-orb" />
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">Code<span className="logo-accent">Mate</span> AI</span>
          </div>
          <div className="footer-links">
            {["Privacy", "Terms", "Docs", "Blog", "GitHub"].map((l) => (<a key={l} href="#">{l}</a>))}
          </div>
          <p className="footer-copy">© 2026 CodeMate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

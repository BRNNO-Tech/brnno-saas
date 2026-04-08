"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { landingCss1 } from "./landing-css-1";
import { landingCss2 } from "./landing-css-2";
import { landingCss3 } from "./landing-css-3";
import { landingCss4 } from "./landing-css-4";

const marketingLandingCss = [landingCss1, landingCss2, landingCss3, landingCss4].join("\n");

const BOOK_CALL_HREF =
  (typeof process.env.NEXT_PUBLIC_BOOK_CALL_URL === "string" && process.env.NEXT_PUBLIC_BOOK_CALL_URL.trim()) ||
  "/book-demo";

function BookCallLink({
  className,
  style,
  children,
  onClick,
}: {
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const external = /^https?:\/\//i.test(BOOK_CALL_HREF);
  if (external) {
    return (
      <a
        href={BOOK_CALL_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={BOOK_CALL_HREF} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}

function GlobalStyles() {
  return <style>{marketingLandingCss}</style>;
}

function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const rPos = useRef({ x: 0, y: 0 });
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!finePointer) return;
    const move = (e: globalThis.MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dot.current) {
        dot.current.style.left = `${e.clientX}px`;
        dot.current.style.top = `${e.clientY}px`;
      }
    };
    const over = (e: globalThis.MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button,a,[role='button']")) document.body.classList.add("hovering");
      else document.body.classList.remove("hovering");
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    let raf = 0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      rPos.current.x = lerp(rPos.current.x, pos.current.x, 0.14);
      rPos.current.y = lerp(rPos.current.y, pos.current.y, 0.14);
      if (ring.current) {
        ring.current.style.left = `${rPos.current.x}px`;
        ring.current.style.top = `${rPos.current.y}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      cancelAnimationFrame(raf);
    };
  }, [finePointer]);

  if (!finePointer) return null;

  return (
    <>
      <div id="cursor-dot" ref={dot} />
      <div id="cursor-ring" ref={ring} />
    </>
  );
}

function Grain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let id = 0;
    let t = 0;
    const draw = () => {
      const w = (c.width = window.innerWidth);
      const h = (c.height = window.innerHeight);
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = () => {
      if (t % 2 === 0) draw();
      t++;
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas id="grain" ref={ref} />;
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .how-step");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("vis");
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function Counter({
  to,
  suffix = "",
  duration = 1800,
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const current = ease * to;
            setVal(decimals > 0 ? Number(current.toFixed(decimals)) : Math.floor(current));
            if (p < 1) requestAnimationFrame(tick);
            else setVal(to);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration, decimals]);
  return (
    <span ref={ref}>
      {decimals > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : val.toLocaleString()}
      {suffix}
    </span>
  );
}

function useDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    const down = (e: globalThis.MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.userSelect = "none";
    };
    const up = () => {
      isDown = false;
      el.style.userSelect = "";
    };
    const move = (e: globalThis.MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX);
    };
    el.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    el.addEventListener("mousemove", move);
    return () => {
      el.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      el.removeEventListener("mousemove", move);
    };
  }, [ref]);
}

function FeatCard({
  num,
  icon,
  title,
  desc,
  tag,
}: {
  num: string;
  icon: string;
  title: string;
  desc: string;
  tag: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const move = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);
  return (
    <div className="feat-card" ref={cardRef} onMouseMove={move}>
      <div className="feat-card-glow" />
      <div className="feat-card-num">{num}</div>
      <div className="feat-card-icon">{icon}</div>
      <div className="feat-card-t">{title}</div>
      <div className="feat-card-d">{desc}</div>
      <span className="feat-card-tag">{tag}</span>
    </div>
  );
}

function PhoneCenter() {
  return (
    <div className="p-phone center">
      <div className="p-notch" />
      <div className="p-screen" style={{ height: 560 }}>
        <div className="p-header-band">
          <div className="p-header-band-inner" />
          <div className="p-header-band-accent">
            <svg width="100%" height="100%" viewBox="0 0 270 110" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F2C94C" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#F2C94C" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect width="270" height="110" fill="url(#hg)" />
              <circle cx="200" cy="20" r="60" fill="rgba(242,201,76,0.05)" />
            </svg>
          </div>
          <div className="p-avatar-wrap">
            <div className="p-avatar">
              <span style={{ fontSize: 26 }}>🧔</span>
            </div>
          </div>
          <div className="p-book-badge">Book Now</div>
        </div>
        <div className="p-body">
          <div>
            <div className="p-name">Marcus Cole</div>
            <div className="p-handle">@marcusdetails</div>
            <div className="p-title">Elite Mobile Detailer · 5★</div>
          </div>
          <div className="p-rating">
            <div className="p-stars">★★★★★</div>
            <div className="p-rating-val">4.9</div>
            <div className="p-rating-ct">· 214 REVIEWS</div>
          </div>
          <div className="p-tabs">
            {["Portfolio", "Services", "About"].map((t, i) => (
              <div key={t} className={`p-tab ${i === 1 ? "active" : ""}`}>
                {t}
              </div>
            ))}
          </div>
          <div className="p-services">
            <div className="p-svc-group-label">Paint & Exterior</div>
            {[
              { name: "Full Detail", time: "4–5 hrs", price: "$249" },
              { name: "Paint Correction", time: "6–8 hrs", price: "$499" },
              { name: "Ceramic Coat", time: "1–2 days", price: "$899" },
            ].map(({ name, time, price }) => (
              <div key={name} className="p-svc-row">
                <div>
                  <div className="p-svc-name">{name}</div>
                  <div className="p-svc-time">{time}</div>
                </div>
                <div className="p-svc-price">{price}</div>
              </div>
            ))}
            <div className="p-svc-group-label" style={{ marginTop: 4 }}>
              Interior
            </div>
            {[
              { name: "Deep Interior", time: "2–3 hrs", price: "$149" },
              { name: "Odor Removal", time: "1–2 hrs", price: "$99" },
            ].map(({ name, time, price }) => (
              <div key={name} className="p-svc-row">
                <div>
                  <div className="p-svc-name">{name}</div>
                  <div className="p-svc-time">{time}</div>
                </div>
                <div className="p-svc-price">{price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneL1() {
  const colors = ["#1a1200", "#0f1a00", "#001a0a", "#1a0005", "#0a0018", "#120f00"];
  const emojis = ["🚗", "🏎️", "🚙", "🛻", "🚐", "🏁"];
  return (
    <div className="p-phone l1">
      <div className="p-notch" style={{ width: 58, height: 18, top: 8 }} />
      <div className="p-screen" style={{ height: 490 }}>
        <div className="p-header-band" style={{ height: 90 }}>
          <div className="p-header-band-inner" style={{ background: "linear-gradient(135deg, #001a0a, #0d0d0d)" }} />
          <div className="p-avatar-wrap sm">
            <div className="p-avatar sm">
              <span>👩</span>
            </div>
          </div>
          <div className="p-book-badge sm">Book</div>
        </div>
        <div className="p-body sm">
          <div>
            <div className="p-name sm">Jenna Rivera</div>
            <div className="p-handle">@jennashine</div>
            <div className="p-title sm">Mobile Detailer · Utah</div>
          </div>
          <div className="p-tabs">
            {["Portfolio", "Services", "About"].map((t, i) => (
              <div key={t} className={`p-tab ${i === 0 ? "active" : ""}`}>
                {t}
              </div>
            ))}
          </div>
          <div className="p-portfolio">
            {colors.map((bg, i) => (
              <div
                key={bg}
                className="p-port-cell"
                style={{ background: bg, border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ fontSize: 14 }}>{emojis[i]}</span>
              </div>
            ))}
          </div>
          <div className="p-rating">
            <div className="p-stars">★★★★★</div>
            <div className="p-rating-val">5.0</div>
            <div className="p-rating-ct">· 87 REVIEWS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneR1() {
  return (
    <div className="p-phone r1">
      <div className="p-notch" style={{ width: 58, height: 18, top: 8 }} />
      <div className="p-screen" style={{ height: 490 }}>
        <div className="p-header-band" style={{ height: 90 }}>
          <div className="p-header-band-inner" style={{ background: "linear-gradient(135deg, #00081a, #0d0d0d)" }} />
          <div className="p-avatar-wrap sm">
            <div className="p-avatar sm" style={{ borderColor: "rgba(96,165,250,0.5)" }}>
              <span>👨‍🔧</span>
            </div>
          </div>
          <div className="p-book-badge sm">Book</div>
        </div>
        <div className="p-body sm">
          <div>
            <div className="p-name sm">Tyler Brooks</div>
            <div className="p-handle">@tylerdetailco</div>
            <div className="p-title sm">Fleet & Luxury Specialist</div>
          </div>
          <div className="p-tabs">
            {["Portfolio", "Services", "About"].map((t, i) => (
              <div key={t} className={`p-tab ${i === 1 ? "active" : ""}`}>
                {t}
              </div>
            ))}
          </div>
          <div className="p-services">
            {[
              { name: "Waterless Wash", time: "45 min", price: "$69" },
              { name: "Express Detail", time: "90 min", price: "$129" },
              { name: "Full Detail", time: "3–4 hrs", price: "$219" },
              { name: "Fleet Package", time: "By quote", price: "Custom" },
            ].map(({ name, time, price }) => (
              <div key={name} className="p-svc-row">
                <div>
                  <div className="p-svc-name">{name}</div>
                  <div className="p-svc-time">{time}</div>
                </div>
                <div className="p-svc-price sm">{price}</div>
              </div>
            ))}
          </div>
          <div className="p-rating">
            <div className="p-stars">★★★★★</div>
            <div className="p-rating-val">4.8</div>
            <div className="p-rating-ct">· 143 REVIEWS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneFar({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div className={`p-phone ${isLeft ? "l2" : "r2"}`}>
      <div className="p-notch" style={{ width: 52, height: 16, top: 8 }} />
      <div className="p-screen" style={{ height: 460 }}>
        <div
          className="p-header-band"
          style={{
            height: 80,
            background: isLeft ? "linear-gradient(135deg,#1a1200,#0d0d0d)" : "linear-gradient(135deg,#0a0018,#0d0d0d)",
          }}
        >
          <div className="p-avatar-wrap sm">
            <div
              className="p-avatar sm"
              style={{ borderColor: isLeft ? "rgba(242,201,76,0.3)" : "rgba(139,92,246,0.4)" }}
            >
              <span>{isLeft ? "👩‍💼" : "🧑"}</span>
            </div>
          </div>
          <div
            className="p-book-badge sm"
            style={{
              background: isLeft ? "var(--o)" : "#7c3aed",
              color: isLeft ? "#0a0a0a" : "#fff",
            }}
          >
            Book
          </div>
        </div>
        <div className="p-body sm" style={{ gap: 7 }}>
          <div className="p-name sm">{isLeft ? "Sofia Martinez" : "Devon Park"}</div>
          <div className="p-handle">{isLeft ? "@sofiashineco" : "@devondetails"}</div>
          <div className="p-title sm">{isLeft ? "Ceramic & PPF Expert" : "Boats & RVs Specialist"}</div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 32,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 6,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setEmail("");
      setName("");
      setError("");
    }, 400);
  };

  return (
    <div
      className={`modal-overlay ${open ? "open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="presentation"
    >
      <div className="modal-box">
        <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>
        {done ? (
          <div className="modal-success">
            <div className="modal-success-icon">🎉</div>
            <div className="modal-success-title">You&apos;re in.</div>
            <div className="modal-success-sub">
              We&apos;ll reach out shortly to learn about your business and get you set up on BRNNO.
            </div>
          </div>
        ) : (
          <>
            <div className="modal-eyebrow">
              <span className="hero-eyebrow-pulse" /> Join BRNNO
            </div>
            <div className="modal-title">
              Let&apos;s get you
              <br />
              <em>set up.</em>
            </div>
            <div className="modal-sub">
              Drop your email and we&apos;ll reach out personally to walk you through the platform and get your business
              live.
            </div>
            <div className="modal-input-wrap">
              <input
                className="modal-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="modal-input"
                placeholder="Your email address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              />
              {error && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#ef4444",
                    fontFamily: "var(--mono)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {error}
                </div>
              )}
              <button type="button" className="modal-submit" onClick={() => void handleSubmit()} disabled={loading}>
                {loading ? "Sending..." : "Join BRNNO →"}
              </button>
            </div>
            <div className="modal-fine">No spam. We&apos;ll reach out within 24 hours.</div>
          </>
        )}
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [faqOpen, setFaqOpen] = useState(false);
  return (
    <div
      className={`faq-item ${faqOpen ? "open" : ""}`}
      onClick={() => setFaqOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFaqOpen((o) => !o);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-icon">+</span>
      </div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "📋",
    title: "Job Management",
    desc: "Create, dispatch, and track every job from intake to completion. Keep your team aligned with clear status at every step.",
    tag: "Core Platform",
  },
  {
    icon: "💸",
    title: "Smart Invoicing",
    desc: "Generate invoices in one tap. Send via SMS or email. Collect payment before the customer even gets inside.",
    tag: "Payments",
  },
  {
    icon: "🗓️",
    title: "Online booking",
    desc: "Customers pick services and time from your public profile. Requests land on your calendar with what you need to run the job.",
    tag: "Customer App",
  },
  {
    icon: "💬",
    title: "Leads & messaging",
    desc: "Keep every lead and conversation in one place — reply fast, automate follow-ups, and turn chats into booked jobs.",
    tag: "Growth",
  },
  {
    icon: "📦",
    title: "Inventory Control",
    desc: "Log product usage per job. Get low-stock alerts before you're caught short mid-service.",
    tag: "Operations",
  },
  {
    icon: "⭐",
    title: "Reputation Engine",
    desc: "Automated post-job reviews, customer follow-ups, and a public business profile that wins more bookings.",
    tag: "Marketing",
  },
];

export default function MarketingLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const featRef = useRef<HTMLDivElement>(null);
  useDragScroll(featRef);
  useReveal();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const year = new Date().getFullYear();

  return (
    <>
      <GlobalStyles />
      <Cursor />
      <Grain />

      <EmailModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {["Platform", "How it works", "Pricing", "FAQ"].map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
            className="mobile-menu-link"
            onClick={() => setMenuOpen(false)}
          >
            {l}
          </a>
        ))}
        <Link href="/login" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
          Log in
        </Link>
        <button
          type="button"
          className="mobile-menu-cta"
          onClick={() => {
            setMenuOpen(false);
            setModalOpen(true);
          }}
        >
          Join BRNNO
        </button>
        <BookCallLink className="btn-cta-book btn-cta-book--drawer" onClick={() => setMenuOpen(false)}>
          Book a call <span className="arr">↗</span>
        </BookCallLink>
      </div>

      <nav className={`nav ${scrolled ? "s" : ""}`}>
        <div className="nav-logo">
          BRN<em>NO</em>
        </div>
        <div className="nav-links">
          {["Platform", "How it works", "Pricing", "FAQ"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="nav-link">
              {l}
            </a>
          ))}
          <Link href="/login" className="nav-link">
            Log in
          </Link>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <BookCallLink className="btn-cta-book btn-cta-book--nav">
            Book a call <span className="arr">↗</span>
          </BookCallLink>
          <button type="button" className="nav-pill" onClick={() => setModalOpen(true)}>
            Join BRNNO
          </button>
        </div>
        <button
          type="button"
          className={`nav-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-mesh" />
        <div className="hero-ghost-text">DETAIL</div>

        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="hero-eyebrow shi1">
            <span className="hero-eyebrow-pulse" />
            On-demand detailing platform — now in early access
          </div>

          <h1 className="hero-h1">
            <span className="shi2">RUN YOUR</span>
            <span className="line2 shi3">DETAIL BIZ</span>
            <span className="line3 shi4">SMARTER.</span>
          </h1>

          <div className="hero-grid2">
            <p className="hero-desc shi4">
              BRNNO is the operating system for mobile detailers — full SaaS tools for businesses, on-demand booking for
              customers. Everything in one place.
            </p>
            <div>
              <div className="hero-cta-row shi5">
                <button type="button" className="btn-mag" onClick={() => setModalOpen(true)}>
                  Join BRNNO →
                </button>
                <BookCallLink className="btn-cta-book">
                  Book a call <span className="arr">↗</span>
                </BookCallLink>
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 32 }} className="shi5">
                {[
                  ["500+", "on waitlist"],
                  ["$2M+", "processed"],
                  ["60s", "avg booking"],
                ].map(([n, l]) => (
                  <div key={n}>
                    <div style={{ fontFamily: "var(--display)", fontSize: 24, color: "var(--txt)", lineHeight: 1 }}>
                      {n}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "var(--muted2)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginTop: 4,
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-ind">
          <div className="scroll-line" />
          Scroll
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-t">
          {[...Array(2)].map((_, di) =>
            [
              "Job Management",
              "Stripe Payments",
              "SMS Invoicing",
              "Online Booking",
              "Inventory Control",
              "2-Way Messaging",
              "Lead Inbox",
              "Customer Portal",
              "Fleet Support",
              "On-Demand Booking",
              "AI Assistant",
            ].map((t, i) => (
              <span key={`${di}-${i}`} className="ticker-it">
                <span className="d" />
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <section className="profile-sect">
        <div className="profile-glow" />
        <div className="profile-head reveal">
          <div className="profile-kicker">
            <span className="profile-kicker-dot" />
            Your public profile
          </div>
          <h2 className="profile-h2">
            One link.
            <br />
            Your entire <em>business.</em>
          </h2>
          <p className="profile-sub">
            Every detailer on BRNNO gets a fully branded public profile — services, portfolio, reviews, and instant
            booking. Share one link and let it work for you 24/7.
          </p>
        </div>
        <div className="profile-stage">
          <PhoneFar side="left" />
          <PhoneL1 />
          <PhoneCenter />
          <PhoneR1 />
          <PhoneFar side="right" />
        </div>
        <div className="profile-callouts reveal">
          {[
            {
              icon: "🔗",
              title: "One shareable link",
              desc: "Send it in a text, add it to Instagram. Customers book directly — no app download needed.",
            },
            {
              icon: "🎨",
              title: "Fully branded",
              desc: "Your name, logo, photos, and services. Looks like you hired a design team.",
            },
            {
              icon: "📸",
              title: "Portfolio gallery",
              desc: "Show off your best work. Before/afters and job photos build instant trust with new customers.",
            },
            {
              icon: "⭐",
              title: "Reviews built in",
              desc: "BRNNO auto-requests reviews after every job. Your rating grows on autopilot.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="profile-callout">
              <div className="callout-icon">{icon}</div>
              <div>
                <div className="callout-t">{title}</div>
                <div className="callout-d">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-sect">
        <div className="stats-label reveal">By the numbers</div>
        <div className="stats-grid reveal">
          {[
            { n: 500, s: "+", l: "Detailing businesses\non the waitlist", pre: "", decimals: 0 },
            { n: 2, s: "M+", l: "Dollars in revenue\nprocessed through BRNNO", pre: "$", decimals: 0 },
            { n: 60, s: "s", l: "Average time to\ncomplete a booking", pre: "", decimals: 0 },
            { n: 4.9, s: "★", l: "Average platform\nrating from customers", pre: "", decimals: 1 },
          ].map(({ n, s, l, pre, decimals }, i) => (
            <div className="stat-c" key={l}>
              <div className="stat-bg-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="stat-n">
                {pre}
                <Counter to={n} decimals={decimals} />
                <span className="su">{s}</span>
              </div>
              <div className="stat-lbl" style={{ whiteSpace: "pre-line" }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="feat-sect">
        <div className="feat-head">
          <div>
            <h2 className="feat-h2 reveal-left">
              Everything
              <br />
              you <span>need.</span>
            </h2>
          </div>
          <p className="feat-sub reveal">
            Built from the ground up with real detailers — not adapted from generic field service software.
          </p>
        </div>
        <div className="feat-scroll" ref={featRef}>
          {FEATURES.map((f, i) => (
            <FeatCard key={f.title} num={`0${i + 1}`} {...f} />
          ))}
        </div>
        <div className="feat-drag-hint">
          <span style={{ fontSize: 14 }}>←</span> drag to explore <span style={{ fontSize: 14 }}>→</span>
        </div>
      </section>

      <section id="how-it-works" className="how-sect">
        <div className="stats-label reveal">How it works</div>
        <div className="how-ghost">GO</div>
        <div className="how-steps">
          {[
            [
              "Create your account",
              "Sign up free — no credit card. Add your business, services, and pricing in under five minutes.",
            ],
            [
              "Build your service catalog",
              "Set your packages, pricing, and team members. Customize everything from your dashboard.",
            ],
            [
              "Share your booking link",
              "Send your public profile anywhere you market — social, SMS, or your website. Customers book in seconds from the link; you control services, pricing, and availability.",
            ],
            ["Get paid instantly", "Complete jobs, send invoices, collect payments. Stripe payouts hit your bank fast."],
          ].map(([t, d], i) => (
            <div className="how-step" key={t}>
              <div className="how-step-num">0{i + 1}</div>
              <div>
                <div className="how-step-t">{t}</div>
                <div className="how-step-d">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="split-sect">
        <div className="split-left">
          <div className="split-kicker reveal">For detailing businesses</div>
          <h2 className="split-h reveal">
            Your business.
            <br />
            Fully automated.
          </h2>
          <ul className="split-list reveal">
            {[
              "Dispatch jobs and keep everyone aligned on job status",
              "Send invoices via SMS and collect before you leave the lot",
              "Manage inventory usage per job automatically",
              "Your own public business profile and booking page",
              "Pro: 2-way messaging, AI Assistant, and lower booking fees with Stripe Connect",
            ].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="split-right">
          <div className="split-kicker reveal">Dashboard preview</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Today's Revenue", "$1,248", "↑ 14% vs last week"],
                ["Active Jobs", "8", "3 pending · 5 in progress"],
              ].map(([l, v, s]) => (
                <div key={l} className="split-card reveal">
                  <div className="split-card-label">{l}</div>
                  <div className="split-card-val">
                    {typeof v === "string" && v.startsWith("$") ? (
                      <>
                        <em>$</em>
                        {v.slice(1)}
                      </>
                    ) : (
                      v
                    )}
                  </div>
                  <div className="split-card-sub">{s}</div>
                </div>
              ))}
            </div>
            {[
              { name: "Marcus T.", service: "Full Detail + Ceramic", amount: "$349", status: "Complete", col: "#22c55e" },
              { name: "Sarah R.", service: "Interior + Wash", amount: "$128", status: "En Route", col: "#F97316" },
              { name: "Kyle B.", service: "Paint Correction", amount: "$499", status: "Scheduled", col: "#60a5fa" },
            ].map(({ name, service, amount, status, col }) => (
              <div
                key={name}
                className="split-card reveal"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginBottom: 2 }}>{name}</div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--muted2)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {service}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 22, color: "var(--txt)" }}>{amount}</div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: col,
                      fontFamily: "var(--mono)",
                      letterSpacing: "0.08em",
                      marginTop: 2,
                    }}
                  >
                    {status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="split-sect" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="split-right" style={{ borderRight: "1px solid var(--border)", borderLeft: "none" }}>
          <div className="split-kicker reveal">Booking preview</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              className="split-card reveal"
              style={{
                background: "linear-gradient(135deg, rgba(242,201,76,0.07), var(--bg))",
                borderColor: "rgba(242,201,76,0.2)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  marginBottom: 8,
                }}
              >
                Your next service
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 28, color: "var(--txt)", marginBottom: 4 }}>
                Full Detail · today 2:00 PM
              </div>
              <div style={{ fontSize: 13, color: "var(--muted2)", fontWeight: 300 }}>
                With Jake · 2014 Tesla Model 3 · confirmation sent
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <div
                  style={{
                    flex: 1,
                    background: "rgba(242,201,76,0.1)",
                    border: "1px solid rgba(242,201,76,0.2)",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--o)", letterSpacing: "0.1em" }}>
                    TOTAL
                  </div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 28, color: "var(--txt)" }}>$199</div>
                </div>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: "var(--o)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontFamily: "var(--body)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  View booking →
                </button>
              </div>
            </div>
            {["Full Detail — Tesla Model 3 — Completed, last Tuesday", "Interior Clean — Ford F-150 — Completed, Dec 14", "Ceramic Coat — BMW M3 — Scheduled, Mar 8 @ 9AM"].map((item) => {
              const [svc, car, stat] = item.split(" — ");
              const col = stat.startsWith("Completed") ? "#22c55e" : "#60a5fa";
              return (
                <div
                  key={item}
                  className="split-card reveal"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginBottom: 2 }}>{svc}</div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        color: "var(--muted2)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {car}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: col,
                      fontWeight: 700,
                      fontFamily: "var(--mono)",
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stat.split(",")[0].toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="split-left" style={{ background: "var(--s1)", borderRight: "none" }}>
          <div className="split-kicker reveal">For customers</div>
          <h2 className="split-h reveal">
            Book a detailer
            <br />
            in 60 seconds.
          </h2>
          <ul className="split-list reveal">
            {[
              "Book a service and time slot in under a minute — no app download",
              "Transparent pricing — no surprise fees",
              "Full service history for every vehicle you own",
              "Secure payments via card or Apple Pay",
              "Automatic receipts and rebooking reminders",
            ].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <section id="pricing" className="pricing-sect">
        <div className="pricing-head reveal">
          <h2 className="pricing-h">
            Simple
            <br />
            <span style={{ color: "var(--o)" }}>pricing.</span>
          </h2>
          <p className="pricing-sub">Start free. Upgrade when your business is ready.</p>
        </div>
        <div className="pricing-grid reveal">
          {[
            {
              name: "Free",
              price: "0",
              period: "forever, no credit card",
              hot: false,
              btn: "Get started free",
              feats: [
                "Customer management",
                "Service management",
                "Job management",
                "Invoicing",
                "Calendar",
                "Booking and business profiles",
                "Booking fee: 3.5% + $0.30 per transaction",
              ],
            },
            {
              name: "Pro",
              price: "50",
              period: "/month with Stripe Connect ($70/mo without) · cancel anytime",
              hot: true,
              btn: "Upgrade to Pro",
              feats: [
                "Everything in Free, plus:",
                "2-way messaging",
                "Custom branding",
                "Twilio number + $5 credits/month",
                "AI Assistant + AI features across modules",
                "Booking fee: 2.9% + $0.30 per transaction",
              ],
            },
          ].map(({ name, price, period, hot, btn, feats }) => (
            <div key={name} className={`p-card ${hot ? "hot" : ""}`}>
              {hot && <div className="p-hot-tag">Most popular</div>}
              <div className="p-name">{name}</div>
              <div className="p-price">
                <sup>$</sup>
                {price}
              </div>
              <div className="p-period">{period}</div>
              <button type="button" className={`p-btn ${hot ? "hot" : ""}`} onClick={() => setModalOpen(true)}>
                {btn}
              </button>
              <div className="p-div" />
              {feats.map((f) => (
                <div key={f} className="p-feat">
                  {f}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="faq-sect">
        <div className="stats-label reveal">FAQ</div>
        <h2 className="feat-h2 reveal-left" style={{ marginBottom: 0 }}>
          Got <span>questions?</span>
        </h2>
        <div className="faq-grid reveal">
          {[
            [
              "Is BRNNO really free?",
              "Yes — the Free plan is $0/month forever, no credit card required. You get customer, service, and job management, invoicing, calendar, and booking and business profiles. You pay a booking fee only when customers pay through BRNNO (3.5% + $0.30 per transaction). Upgrade to Pro for lower booking fees and more features.",
            ],
            [
              "How do I get paid?",
              "BRNNO uses Stripe Connect. Once you connect your Stripe account, payments from customers go directly to your bank account. Payouts typically arrive within 2 business days.",
            ],
            [
              "Do my customers need to download an app?",
              "Nope. Customers book through your public BRNNO profile link — no app download required. They get SMS/email confirmations and reminders for their appointment.",
            ],
            [
              "Can I use BRNNO if I'm a solo detailer?",
              "Absolutely — most of our users are solo operators. BRNNO is built to scale from one person to a full team without changing your workflow.",
            ],
            [
              "What's included in the Pro plan?",
              "Everything in Free, plus 2-way messaging, custom branding, a Twilio number with $5 credits/month, the AI Assistant and AI features across modules, and a lower booking fee (2.9% + $0.30 per transaction). Pro is $50/month with Stripe Connect or $70/month without — annual billing saves you money vs paying monthly.",
            ],
            [
              "How do customers book me?",
              "They use your public BRNNO profile link — share it like any other booking URL. They pick a service and time in the browser (no app download), pay through Stripe when you’ve set that up, and receive confirmations and reminders.",
            ],
            [
              "Is there a contract or commitment?",
              "No long-term contracts. Pro is billed monthly or annually and you can cancel any time. Your data is always yours.",
            ],
            [
              "What's the difference between Free and Pro?",
              "Free gives you full core ops — customers, jobs, services, calendar, invoicing, and booking profiles — with a 3.5% + $0.30 booking fee when customers pay through BRNNO. Pro adds messaging, custom branding, a Twilio line with monthly credits, the AI Assistant, and a lower booking fee (2.9% + $0.30), with subscription pricing that’s lower when you use Stripe Connect.",
            ],
          ].map(([q, a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      <section className="cta-sect">
        <div className="cta-ghost">BRNNO</div>
        <div className="hero-eyebrow reveal" style={{ margin: "0 auto 28px", width: "fit-content" }}>
          <span className="hero-eyebrow-pulse" /> Early access is open
        </div>
        <h2 className="cta-h reveal">
          Your detail biz
          <br />
          <em>deserves better.</em>
        </h2>
        <p className="cta-p reveal">
          Stop duct-taping spreadsheets and text threads together. BRNNO handles the ops — you handle the work.
        </p>
        <div className="cta-row reveal">
          <button type="button" className="btn-mag btn-mag--xl" onClick={() => setModalOpen(true)}>
            Join BRNNO →
          </button>
          <BookCallLink className="btn-cta-book btn-cta-book--xl">
            Book a call <span className="arr">↗</span>
          </BookCallLink>
        </div>
      </section>

      <footer className="footer">
        <div className="f-logo">
          BRN<em>NO</em>
        </div>
        <div className="f-links">
          <Link href="/privacy" className="f-link">
            Privacy
          </Link>
          <Link href="/terms" className="f-link">
            Terms
          </Link>
          <Link href="/contact" className="f-link">
            Contact
          </Link>
          <a
            href="https://x.com/JohnJake228812"
            target="_blank"
            rel="noopener noreferrer"
            className="f-link"
          >
            Twitter
          </a>
        </div>
        <div className="f-copy">© {year} BRNNO Technologies, Inc.</div>
      </footer>
    </>
  );
}

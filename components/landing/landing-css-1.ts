/** Split for tooling limits; concatenated in marketing-landing.tsx */
export const landingCss1 = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:      #060606;
      --s1:      #0D0D0D;
      --s2:      #131313;
      --border:  rgba(255,255,255,0.06);
      --o:       #F2C94C;
      --o2:      #F5D676;
      --txt:     #F0EDE8;
      --muted:   #555;
      --muted2:  #888;
      --display: 'Bebas Neue', sans-serif;
      --body:    'DM Sans', sans-serif;
      --mono:    'JetBrains Mono', monospace;
    }

    html { scroll-behavior: smooth; overflow-x: hidden; }
    body {
      background: var(--bg); color: var(--txt);
      font-family: var(--body);
      overflow-x: hidden;
    }
    @media (hover: hover) and (pointer: fine) {
      body { cursor: none; }
      * { cursor: none !important; }
    }

    #cursor-dot {
      position: fixed; width: 8px; height: 8px; border-radius: 50%;
      background: var(--o); pointer-events: none; z-index: 9999;
      transform: translate(-50%, -50%);
      transition: width 0.2s, height 0.2s, opacity 0.2s;
      mix-blend-mode: normal;
    }
    #cursor-ring {
      position: fixed; width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid rgba(242,201,76,0.5); pointer-events: none; z-index: 9998;
      transform: translate(-50%, -50%);
      transition: transform 0.12s ease, width 0.3s, height 0.3s, border-color 0.3s;
    }
    body.hovering #cursor-dot { width: 14px; height: 14px; }
    body.hovering #cursor-ring { width: 56px; height: 56px; border-color: rgba(242,201,76,0.3); }

    #grain {
      position: fixed; inset: 0; pointer-events: none; z-index: 9990;
      opacity: 0.022; mix-blend-mode: overlay;
    }

    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 500;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px; height: 60px;
      transition: background 0.4s, border-color 0.4s;
      border-bottom: 1px solid transparent;
    }
    .nav.s {
      background: rgba(6,6,6,0.85); backdrop-filter: blur(20px) saturate(1.4);
      border-color: var(--border);
    }
    .nav-logo {
      font-family: var(--display); font-size: 26px; letter-spacing: 0.06em; color: var(--txt);
    }
    .nav-logo em { color: var(--o); font-style: normal; }
    .nav-links { display: flex; gap: 36px; }
    .nav-link { font-size: 13px; font-weight: 500; color: var(--muted2); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
    .nav-link:hover { color: var(--txt); }
    .nav-pill {
      font-family: var(--body); font-size: 14px; font-weight: 700;
      background: var(--o); color: #0a0a0a; border: none;
      padding: 10px 24px; border-radius: 100px; letter-spacing: 0.04em;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      text-shadow: 0 1px 0 rgba(255,255,255,0.35);
      box-shadow: 0 0 20px rgba(242,201,76,0.25), 0 1px 0 rgba(255,255,255,0.2) inset;
    }
    .nav-pill:hover { background: #d4a800; box-shadow: 0 0 32px rgba(242,201,76,0.45), 0 1px 0 rgba(255,255,255,0.25) inset; transform: translateY(-1px); }

    .nav-hamburger {
      display: none; flex-direction: column; justify-content: center; gap: 5px;
      width: 36px; height: 36px; background: none; border: none; padding: 4px;
      z-index: 600;
    }
    .nav-hamburger span {
      display: block; height: 1.5px; background: var(--txt); border-radius: 2px;
      transition: transform 0.3s ease, opacity 0.3s ease, width 0.3s ease;
      transform-origin: center;
    }
    .nav-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .nav-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .nav-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

    .mobile-menu {
      position: fixed; inset: 0; z-index: 490;
      background: rgba(6,6,6,0.97); backdrop-filter: blur(24px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0;
      opacity: 0; pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .mobile-menu.open { opacity: 1; pointer-events: all; }
    .mobile-menu-link {
      font-family: var(--display); font-size: clamp(40px, 10vw, 64px);
      letter-spacing: 0.04em; color: var(--muted2); text-decoration: none;
      padding: 12px 0; border-bottom: 1px solid var(--border); width: 80%;
      text-align: center; transition: color 0.2s;
    }
    .mobile-menu-link:last-of-type { border-bottom: none; }
    .mobile-menu-link:hover { color: var(--o); }
    .mobile-menu-cta {
      margin-top: 40px; font-family: var(--body); font-size: 17px; font-weight: 700;
      background: var(--o); color: #0a0a0a; border: none;
      padding: 15px 44px; border-radius: 100px;
      transition: background 0.2s, box-shadow 0.2s;
      letter-spacing: 0.04em;
      text-shadow: 0 1px 0 rgba(255,255,255,0.35);
      box-shadow: 0 0 24px rgba(242,201,76,0.3), 0 1px 0 rgba(255,255,255,0.2) inset;
    }
    .mobile-menu-cta:hover { background: #d4a800; box-shadow: 0 0 36px rgba(242,201,76,0.45), 0 1px 0 rgba(255,255,255,0.25) inset; }

    @media(max-width: 768px) {
      .nav-links { display: none; }
      .nav-pill { display: none; }
      .nav-hamburger { display: flex; }
    }

    .hero {
      position: relative; min-height: 100vh; display: flex; align-items: center;
      padding: 80px 48px 60px; overflow: hidden;
    }
    .hero-mesh {
      position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 70% 60% at 60% 40%, rgba(242,201,76,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 80%, rgba(242,201,76,0.04) 0%, transparent 55%),
        radial-gradient(ellipse 60% 50% at 10% 70%, rgba(242,201,76,0.03) 0%, transparent 60%);
    }
    .hero-grid-bg {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 80px 80px;
      mask-image: radial-gradient(ellipse 90% 100% at 50% 0%, black 0%, transparent 80%);
    }
    .hero-eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--o);
      border: 1px solid rgba(242,201,76,0.25); padding: 6px 14px; border-radius: 4px;
      background: rgba(242,201,76,0.05); margin-bottom: 32px;
    }
    .hero-eyebrow-pulse {
      width: 6px; height: 6px; border-radius: 50%; background: var(--o);
      animation: pulse 1.6s ease infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

    .hero-h1 {
      font-family: var(--display); font-size: clamp(80px, 12vw, 160px);
      line-height: 0.9; letter-spacing: 0.01em; color: var(--txt);
      position: relative; z-index: 1;
    }
    .hero-h1 .line2 { color: var(--o); display: block; }
    .hero-h1 .line3 {
      display: block;
      -webkit-text-stroke: 1px rgba(240,237,232,0.25);
      color: transparent;
    }

    .hero-grid2 {
      display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 56px;
      align-items: end; max-width: 800px;
    }
    @media(max-width: 768px) {
      .hero-grid2 { grid-template-columns: 1fr; gap: 32px; }
      .scroll-ind { left: 24px; }
    }

    .hero-desc {
      font-size: 16px; line-height: 1.7; color: var(--muted2); max-width: 420px; font-weight: 300;
    }
    .hero-cta-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }

    .btn-mag {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: var(--body); font-size: 15px; font-weight: 700;
      background: var(--o); color: #0a0a0a; border: none;
      padding: 15px 34px; border-radius: 8px; letter-spacing: 0.045em;
      transition: box-shadow 0.2s, background 0.2s, transform 0.15s;
      position: relative; overflow: hidden;
      text-shadow: 0 1px 0 rgba(255,255,255,0.4);
      box-shadow: 0 0 28px rgba(242,201,76,0.28), 0 1px 0 rgba(255,255,255,0.25) inset;
    }
    .btn-mag::before {
      content:''; position:absolute; inset:0;
      background: linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
      transform: translateX(-100%); transition: transform 0.5s;
    }
    .btn-mag:hover { box-shadow: 0 0 44px rgba(242,201,76,0.42); background: #d4a800; transform: translateY(-1px); }
    .btn-mag:hover::before { transform: translateX(100%); }

    .btn-mag--xl {
      font-size: 17px;
      padding: 17px 42px;
      border-radius: 8px;
      letter-spacing: 0.05em;
    }

    /* Book a call — secondary CTA, high contrast vs muted ghost */
    .btn-cta-book {
      font-family: var(--body); font-size: 15px; font-weight: 600;
      color: var(--txt);
      background: rgba(242,201,76,0.12);
      border: 1.5px solid rgba(242,201,76,0.55);
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px;
      padding: 15px 30px; border-radius: 8px;
      letter-spacing: 0.045em;
      text-decoration: none;
      transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
      box-shadow: 0 0 28px rgba(242,201,76,0.12);
    }
    .btn-cta-book:hover {
      color: #fff;
      background: rgba(242,201,76,0.22);
      border-color: rgba(242,201,76,0.95);
      box-shadow: 0 0 40px rgba(242,201,76,0.28);
      transform: translateY(-1px);
    }
    .btn-cta-book .arr { transition: transform 0.2s; opacity: 0.95; }
    .btn-cta-book:hover .arr { transform: translateX(4px); }

    .btn-cta-book--nav {
      font-size: 13px;
      font-weight: 600;
      padding: 9px 20px;
      border-radius: 100px;
      letter-spacing: 0.05em;
    }

    .btn-cta-book--xl {
      font-size: 17px;
      font-weight: 600;
      padding: 17px 38px;
      border-radius: 8px;
      letter-spacing: 0.05em;
    }

    .btn-cta-book--drawer {
      margin-top: 20px;
      font-size: 16px;
      padding: 14px 36px;
      border-radius: 100px;
    }

    .btn-ghost2 {
      font-family: var(--body); font-size: 14px; font-weight: 500;
      background: transparent; color: var(--muted2); border: none;
      display: inline-flex; align-items: center; gap: 6px;
      padding: 14px 0; letter-spacing: 0.02em;
      transition: color 0.2s; text-decoration: none;
    }
    .btn-ghost2:hover { color: var(--txt); }
    .btn-ghost2 .arr { transition: transform 0.2s; }
    .btn-ghost2:hover .arr { transform: translateX(4px); }

    .hero-ghost-text {
      position: absolute; bottom: -20px; right: -20px;
      font-family: var(--display); font-size: clamp(140px, 22vw, 300px);
      color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.03);
      line-height: 1; pointer-events: none; user-select: none; letter-spacing: 0.04em;
      z-index: 0;
    }

    .scroll-ind {
      position: absolute; bottom: 36px; left: 48px;
      display: flex; align-items: center; gap: 12px;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      color: var(--muted); text-transform: uppercase;
    }
    .scroll-line {
      width: 40px; height: 1px; background: var(--muted);
      position: relative; overflow: hidden;
    }
    .scroll-line::after {
      content:''; position:absolute; inset:0;
      background: var(--o);
      animation: scanLine 1.8s ease infinite;
    }
    @keyframes scanLine { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

    .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal.vis { opacity: 1; transform: translateY(0); }
    .reveal-left { opacity: 0; transform: translateX(-32px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal-left.vis { opacity: 1; transform: translateX(0); }

    .slash-div {
      height: 120px; background: linear-gradient(135deg, var(--bg) 49.5%, var(--s1) 49.5%);
      margin-top: -1px;
    }

    .ticker { overflow: hidden; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--s1); padding: 14px 0; }
    .ticker-t { display: flex; width: max-content; animation: mq 28s linear infinite; }
    @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    .ticker-it {
      display: flex; align-items: center; gap: 16px; padding: 0 36px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--muted2); white-space: nowrap;
    }
    .ticker-it .d { width: 3px; height: 3px; border-radius: 50%; background: var(--o); flex-shrink: 0; }

    .stats-sect { padding: 120px 48px; position: relative; overflow: hidden; }
    .stats-label {
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--o); margin-bottom: 80px;
    }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--border); border-radius: 2px; }
    .stat-c {
      padding: 48px 40px; border-right: 1px solid var(--border);
      position: relative; overflow: hidden; transition: background 0.3s;
    }
    .stat-c:last-child { border-right: none; }
    .stat-c:hover { background: var(--s1); }
    .stat-n {
      font-family: var(--display); font-size: clamp(56px, 6vw, 88px);
      line-height: 0.9; color: var(--txt); letter-spacing: 0.01em;
    }
    .stat-n .su { color: var(--o); }
    .stat-lbl { font-size: 13px; color: var(--muted2); margin-top: 12px; font-weight: 300; line-height: 1.5; }
    .stat-bg-num {
      position: absolute; top: -10px; right: -10px;
      font-family: var(--display); font-size: 100px; color: rgba(255,255,255,0.02);
      line-height: 1; pointer-events: none; letter-spacing: 0.04em;
    }
`;

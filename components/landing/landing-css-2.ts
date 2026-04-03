export const landingCss2 = `
    .feat-sect { padding: 120px 0; }
    .feat-head { padding: 0 48px; margin-bottom: 60px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .feat-h2 {
      font-family: var(--display); font-size: clamp(48px, 6vw, 80px);
      line-height: 0.95; letter-spacing: 0.01em; color: var(--txt);
    }
    .feat-h2 span { color: var(--o); }
    .feat-sub { font-size: 15px; color: var(--muted2); max-width: 340px; line-height: 1.65; font-weight: 300; }

    .feat-scroll {
      display: flex; gap: 16px; overflow-x: auto; padding: 0 48px 24px;
      scrollbar-width: none; -webkit-overflow-scrolling: touch;
      scroll-snap-type: x mandatory;
    }
    .feat-scroll::-webkit-scrollbar { display: none; }
    .feat-card {
      flex: 0 0 320px; background: var(--s1); border: 1px solid var(--border);
      border-radius: 16px; padding: 32px; scroll-snap-align: start;
      position: relative; overflow: hidden; cursor: grab;
      transition: border-color 0.3s, transform 0.3s;
    }
    .feat-card:active { cursor: grabbing; }
    .feat-card:hover { border-color: rgba(242,201,76,0.3); transform: translateY(-4px); }
    .feat-card-glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(242,201,76,0.07) 0%, transparent 55%);
      opacity: 0; transition: opacity 0.4s;
    }
    .feat-card:hover .feat-card-glow { opacity: 1; }
    .feat-card-num {
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
      color: var(--o); text-transform: uppercase; margin-bottom: 28px;
    }
    .feat-card-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(242,201,76,0.08); border: 1px solid rgba(242,201,76,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; margin-bottom: 24px;
    }
    .feat-card-t { font-family: var(--display); font-size: 28px; letter-spacing: 0.02em; color: var(--txt); margin-bottom: 12px; }
    .feat-card-d { font-size: 14px; color: var(--muted2); line-height: 1.7; font-weight: 300; }
    .feat-card-tag {
      display: inline-block; margin-top: 24px; font-family: var(--mono);
      font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--o); background: rgba(242,201,76,0.08);
      border: 1px solid rgba(242,201,76,0.18); padding: 4px 10px; border-radius: 4px;
    }
    .feat-drag-hint {
      display: flex; align-items: center; gap: 8px; padding: 0 48px;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      color: var(--muted); text-transform: uppercase; margin-top: 8px;
    }

    .how-sect { padding: 120px 48px; background: var(--s1); position: relative; overflow: hidden; }
    .how-ghost {
      position: absolute; right: -40px; top: 50%; transform: translateY(-50%);
      font-family: var(--display); font-size: clamp(180px, 28vw, 380px);
      color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.025);
      line-height: 1; pointer-events: none; letter-spacing: 0.02em;
    }
    .how-steps { display: flex; flex-direction: column; gap: 0; max-width: 760px; position: relative; z-index: 1; }
    .how-step {
      display: grid; grid-template-columns: 80px 1fr; gap: 32px;
      padding: 40px 0; border-bottom: 1px solid var(--border);
      position: relative;
      opacity: 0; transform: translateX(-24px); transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .how-step.vis { opacity: 1; transform: translateX(0); }
    .how-step:last-child { border-bottom: none; }
    .how-step-num {
      font-family: var(--display); font-size: 56px; line-height: 1;
      color: rgba(242,201,76,0.15); letter-spacing: 0.02em; padding-top: 4px;
    }
    .how-step-t { font-family: var(--display); font-size: 32px; letter-spacing: 0.02em; color: var(--txt); margin-bottom: 10px; }
    .how-step-d { font-size: 15px; color: var(--muted2); line-height: 1.7; font-weight: 300; }

    .split-sect {
      display: grid; grid-template-columns: 1fr 1fr;
      min-height: 600px;
    }
    @media(max-width:800px){ .split-sect{ grid-template-columns:1fr; } }
    .split-left {
      padding: 100px 48px; background: var(--bg); display: flex; flex-direction: column; justify-content: center;
      border-right: 1px solid var(--border);
    }
    .split-right {
      padding: 100px 48px; background: var(--s1); display: flex; flex-direction: column; justify-content: center;
    }
    .split-kicker {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.15em;
      text-transform: uppercase; color: var(--o); margin-bottom: 28px;
    }
    .split-h { font-family: var(--display); font-size: clamp(40px, 5vw, 64px); line-height: 0.95; letter-spacing: 0.02em; margin-bottom: 24px; }
    .split-p { font-size: 15px; color: var(--muted2); line-height: 1.75; font-weight: 300; }
    .split-list { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-top: 32px; }
    .split-list li {
      display: flex; align-items: flex-start; gap: 12px;
      font-size: 14px; color: var(--muted2); line-height: 1.6;
    }
    .split-list li::before { content:'→'; color: var(--o); flex-shrink: 0; font-weight: 600; margin-top: 1px; }
    .split-card {
      background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 28px;
      margin-top: 12px; position: relative; overflow: hidden;
    }
    .split-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 14px;
      background: linear-gradient(135deg, rgba(242,201,76,0.05) 0%, transparent 60%);
    }
    .split-card-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted2); margin-bottom: 8px; }
    .split-card-val { font-family: var(--display); font-size: 42px; color: var(--txt); line-height: 1; }
    .split-card-val em { color: var(--o); font-style: normal; }
    .split-card-sub { font-size: 12px; color: var(--muted2); margin-top: 6px; }
`;

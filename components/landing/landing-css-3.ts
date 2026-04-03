export const landingCss3 = `
    .pricing-sect { padding: 120px 48px; }
    .pricing-head { text-align: center; margin-bottom: 64px; }
    .pricing-h { font-family: var(--display); font-size: clamp(48px, 6vw, 84px); letter-spacing: 0.02em; line-height: 0.95; }
    .pricing-sub { font-size: 16px; color: var(--muted2); margin-top: 16px; font-weight: 300; }
    .pricing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; max-width: 720px; margin: 0 auto; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    @media(max-width:600px){ .pricing-grid{ grid-template-columns:1fr; } }
    .p-card { background: var(--s1); padding: 40px 36px; position: relative; border-right: 1px solid var(--border); }
    .p-card:last-child { border-right: none; }
    .p-card.hot { background: linear-gradient(160deg, rgba(242,201,76,0.07) 0%, var(--s1) 50%); }
    .p-hot-tag {
      position: absolute; top: 20px; right: 20px;
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--o); background: rgba(242,201,76,0.1); border: 1px solid rgba(242,201,76,0.25);
      padding: 4px 10px; border-radius: 4px;
    }
    .pricing-sect .p-card .p-name { font-family: var(--display); font-size: 30px; letter-spacing: 0.04em; margin-bottom: 20px; color: var(--txt); }
    .p-price { font-family: var(--display); font-size: 72px; line-height: 0.9; color: var(--txt); margin-bottom: 4px; }
    .p-price sup { font-size: 28px; vertical-align: super; line-height: 0; }
    .p-period { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; color: var(--muted2); margin-bottom: 32px; }
    .p-btn { width: 100%; padding: 12px; border-radius: 6px; font-family: var(--body); font-size: 14px; font-weight: 600; border: 1px solid var(--border); background: transparent; color: var(--txt); margin-bottom: 28px; transition: all 0.2s; }
    .p-btn:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); }
    .p-btn.hot { background: var(--o); border-color: var(--o); color: #0a0a0a; font-weight: 700; }
    .p-btn.hot:hover { background: #d4a800; box-shadow: 0 0 24px rgba(242,201,76,0.35); }
    .p-div { height: 1px; background: var(--border); margin-bottom: 24px; }
    .p-feat { font-size: 13px; color: var(--muted2); padding: 6px 0; display: flex; gap: 10px; align-items: flex-start; line-height: 1.5; font-weight: 300; }
    .p-feat::before { content: '✓'; color: var(--o); flex-shrink: 0; font-weight: 700; font-size: 12px; margin-top: 1px; }

    .cta-sect {
      padding: 140px 48px; position: relative; overflow: hidden;
      background: linear-gradient(160deg, rgba(242,201,76,0.06) 0%, transparent 50%);
      border-top: 1px solid var(--border); text-align: center;
    }
    .cta-ghost {
      position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
      font-family: var(--display); font-size: clamp(100px, 18vw, 240px);
      color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.025);
      line-height: 1; pointer-events: none; letter-spacing: 0.06em; white-space: nowrap;
    }
    .cta-h { font-family: var(--display); font-size: clamp(56px, 8vw, 120px); line-height: 0.9; letter-spacing: 0.01em; position: relative; z-index: 1; }
    .cta-h em { color: var(--o); font-style: normal; display: block; }
    .cta-p { font-size: 17px; color: var(--muted2); margin: 24px auto 40px; max-width: 440px; font-weight: 300; line-height: 1.65; position: relative; z-index: 1; }
    .cta-row { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; align-items: center; position: relative; z-index: 1; }
`;

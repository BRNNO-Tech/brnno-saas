export const landingCss4 = `
    .profile-sect {
      padding: 140px 48px 100px;
      position: relative; overflow: hidden;
      border-top: 1px solid var(--border);
    }
    .profile-glow {
      position: absolute; width: 700px; height: 500px;
      left: 50%; top: 55%; transform: translate(-50%, -50%);
      background: radial-gradient(ellipse, rgba(242,201,76,0.07) 0%, transparent 65%);
      pointer-events: none; z-index: 0;
    }
    .profile-head { text-align: center; position: relative; z-index: 2; margin-bottom: 20px; }
    .profile-kicker {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--o);
      border: 1px solid rgba(242,201,76,0.25); padding: 6px 14px;
      border-radius: 4px; background: rgba(242,201,76,0.05); margin-bottom: 28px;
    }
    .profile-kicker-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--o); animation: pulse 1.6s ease infinite; }
    .profile-h2 { font-family: var(--display); font-size: clamp(52px, 7vw, 96px); line-height: 0.92; letter-spacing: 0.01em; color: var(--txt); }
    .profile-h2 em { font-style: normal; color: var(--o); }
    .profile-sub { font-family: var(--body); font-size: 16px; color: var(--muted2); max-width: 460px; margin: 20px auto 0; line-height: 1.7; font-weight: 300; }

    .profile-stage { position: relative; height: 620px; display: flex; align-items: flex-end; justify-content: center; margin-top: 72px; z-index: 2; }

    .p-phone {
      position: absolute; width: 230px; background: #111;
      border: 1px solid rgba(255,255,255,0.1); border-radius: 38px; overflow: hidden;
      box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08);
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, opacity 0.4s ease;
      transform-origin: bottom center;
    }
    .p-phone.center {
      width: 270px; z-index: 10; bottom: 0;
      animation: phoneFloat 4.5s ease-in-out infinite;
      box-shadow: 0 60px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08), 0 0 60px rgba(242,201,76,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
    }
    @keyframes phoneFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
    .p-phone.l1 { left: calc(50% - 310px); bottom: -30px; transform: rotate(-6deg); opacity: 0.85; z-index: 6; }
    .p-phone.l2 { left: calc(50% - 490px); bottom: -60px; transform: rotate(-12deg); opacity: 0.5; z-index: 4; }
    .p-phone.r1 { right: calc(50% - 310px); bottom: -30px; transform: rotate(6deg); opacity: 0.85; z-index: 6; }
    .p-phone.r2 { right: calc(50% - 490px); bottom: -60px; transform: rotate(12deg); opacity: 0.5; z-index: 4; }
    .p-phone.l1:hover { transform: rotate(-3deg) translateY(-16px) scale(1.02); opacity: 1; z-index: 8; box-shadow: 0 50px 100px rgba(0,0,0,0.75), 0 0 40px rgba(242,201,76,0.1); }
    .p-phone.l2:hover { transform: rotate(-6deg) translateY(-16px) scale(1.02); opacity: 0.9; z-index: 7; }
    .p-phone.r1:hover { transform: rotate(3deg) translateY(-16px) scale(1.02); opacity: 1; z-index: 8; box-shadow: 0 50px 100px rgba(0,0,0,0.75), 0 0 40px rgba(242,201,76,0.1); }
    .p-phone.r2:hover { transform: rotate(6deg) translateY(-16px) scale(1.02); opacity: 0.9; z-index: 7; }

    .p-notch { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 72px; height: 20px; background: #060606; border-radius: 10px; z-index: 20; }
    .p-screen { width: 100%; height: 100%; display: flex; flex-direction: column; background: #0D0D0D; }
    .p-header-band { height: 110px; position: relative; flex-shrink: 0; }
    .p-header-band-inner { position: absolute; inset: 0; background: linear-gradient(135deg, #1a1200 0%, #0d0d0d 100%); }
    .p-header-band-accent { position: absolute; inset: 0; opacity: 0.5; }
    .p-avatar-wrap { position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%); width: 58px; height: 58px; }
    .p-avatar-wrap.sm { width: 48px; height: 48px; bottom: -22px; }
    .p-avatar { width: 100%; height: 100%; border-radius: 50%; border: 2px solid rgba(242,201,76,0.5); background: linear-gradient(135deg, #2a1f00, #1a1200); display: flex; align-items: center; justify-content: center; font-size: 22px; overflow: hidden; box-shadow: 0 0 0 3px #0D0D0D; }
    .p-avatar.sm { font-size: 18px; }
    .p-book-badge { position: absolute; top: 48px; right: 14px; background: var(--o); color: #0a0a0a; font-family: var(--body); font-size: 10px; font-weight: 700; padding: 5px 12px; border-radius: 100px; letter-spacing: 0.04em; box-shadow: 0 4px 12px rgba(242,201,76,0.25); }
    .p-book-badge.sm { font-size: 9px; padding: 4px 10px; top: 40px; right: 10px; }
    .p-body { flex: 1; padding: 36px 16px 16px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
    .p-body.sm { padding: 30px 12px 12px; gap: 8px; }
    .p-phone .p-name { font-family: var(--display); font-size: 20px; letter-spacing: 0.04em; color: var(--txt); text-align: center; line-height: 1; }
    .p-phone .p-name.sm { font-size: 16px; }
    .p-handle { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; color: var(--muted2); text-align: center; text-transform: uppercase; margin-top: 2px; }
    .p-title { font-size: 11px; color: var(--o); text-align: center; font-weight: 500; margin-top: -4px; }
    .p-title.sm { font-size: 10px; }
    .p-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 3px; }
    .p-tab { flex: 1; text-align: center; font-family: var(--mono); font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase; padding: 5px 4px; border-radius: 6px; color: var(--muted2); }
    .p-tab.active { background: rgba(242,201,76,0.12); color: var(--o); border: 1px solid rgba(242,201,76,0.2); }
    .p-services { display: flex; flex-direction: column; gap: 5px; }
    .p-svc-group-label { font-family: var(--mono); font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); padding: 2px 0 4px; }
    .p-svc-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 7px; transition: border-color 0.2s; }
    .p-svc-row:hover { border-color: rgba(242,201,76,0.2); }
    .p-svc-name { font-size: 10px; font-weight: 600; color: var(--txt); }
    .p-svc-time { font-family: var(--mono); font-size: 8px; color: var(--muted2); margin-top: 1px; }
    .p-svc-price { font-family: var(--display); font-size: 14px; color: var(--txt); }
    .p-svc-price.sm { font-size: 12px; }
    .p-portfolio { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; border-radius: 8px; overflow: hidden; }
    .p-port-cell { aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .p-rating { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 10px; background: rgba(242,201,76,0.05); border: 1px solid rgba(242,201,76,0.12); border-radius: 7px; }
    .p-stars { color: var(--o); font-size: 9px; letter-spacing: 1px; }
    .p-rating-val { font-family: var(--display); font-size: 14px; color: var(--txt); }
    .p-rating-ct { font-family: var(--mono); font-size: 8px; color: var(--muted2); letter-spacing: 0.08em; }
    .profile-callouts { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-top: 64px; position: relative; z-index: 2; }
    .profile-callout { display: flex; align-items: flex-start; gap: 12px; max-width: 220px; }
    .callout-icon { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; background: rgba(242,201,76,0.07); border: 1px solid rgba(242,201,76,0.15); display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .callout-t { font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
    .callout-d { font-size: 12px; color: var(--muted2); line-height: 1.5; font-weight: 300; }

    @media(max-width: 900px) {
      .p-phone.l2, .p-phone.r2 { display: none; }
      .p-phone.l1 { left: calc(50% - 260px); }
      .p-phone.r1 { right: calc(50% - 260px); }
      .profile-stage { height: 520px; }
    }
    @media(max-width: 600px) {
      .p-phone.l1, .p-phone.r1 { display: none; }
      .profile-stage { height: 480px; }
      .profile-sect { padding: 100px 24px 80px; }
    }

    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      opacity: 0; pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .modal-overlay.open { opacity: 1; pointer-events: all; }
    .modal-box {
      background: var(--s1); border: 1px solid rgba(242,201,76,0.2);
      border-radius: 20px; padding: 48px 40px; max-width: 480px; width: 100%;
      position: relative;
      transform: translateY(24px) scale(0.97);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(242,201,76,0.06);
    }
    .modal-overlay.open .modal-box { transform: translateY(0) scale(1); }
    .modal-close {
      position: absolute; top: 16px; right: 16px;
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      color: var(--muted2); width: 32px; height: 32px; border-radius: 8px;
      font-size: 16px; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover { background: rgba(255,255,255,0.1); color: var(--txt); }
    .modal-eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--o);
      border: 1px solid rgba(242,201,76,0.2); padding: 5px 12px;
      border-radius: 4px; background: rgba(242,201,76,0.05); margin-bottom: 20px;
    }
    .modal-title {
      font-family: var(--display); font-size: clamp(32px, 5vw, 48px);
      line-height: 0.95; letter-spacing: 0.02em; color: var(--txt); margin-bottom: 12px;
    }
    .modal-title em { color: var(--o); font-style: normal; }
    .modal-sub { font-size: 14px; color: var(--muted2); line-height: 1.65; font-weight: 300; margin-bottom: 28px; }
    .modal-input-wrap { display: flex; flex-direction: column; gap: 10px; }
    .modal-input {
      width: 100%; padding: 13px 16px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--border);
      border-radius: 8px; color: var(--txt); font-family: var(--body); font-size: 15px;
      transition: border-color 0.2s, box-shadow 0.2s; outline: none;
    }
    .modal-input::placeholder { color: var(--muted); }
    .modal-input:focus { border-color: rgba(242,201,76,0.4); box-shadow: 0 0 0 3px rgba(242,201,76,0.08); }
    .modal-submit {
      width: 100%; padding: 14px; border-radius: 8px;
      background: var(--o); color: #0a0a0a; border: none;
      font-family: var(--body); font-size: 15px; font-weight: 700;
      letter-spacing: 0.02em; transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .modal-submit:hover:not(:disabled) { background: #d4a800; box-shadow: 0 0 32px rgba(242,201,76,0.3); transform: translateY(-1px); }
    .modal-submit:disabled { opacity: 0.6; }
    .modal-success {
      text-align: center; padding: 16px 0;
    }
    .modal-success-icon { font-size: 40px; margin-bottom: 16px; }
    .modal-success-title { font-family: var(--display); font-size: 32px; color: var(--txt); margin-bottom: 8px; }
    .modal-success-sub { font-size: 14px; color: var(--muted2); line-height: 1.65; font-weight: 300; }
    .modal-fine { font-family: var(--mono); font-size: 10px; color: var(--muted); text-align: center; margin-top: 12px; letter-spacing: 0.06em; }

    .faq-sect { padding: 120px 48px; border-top: 1px solid var(--border); }
    .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-top: 56px; }
    @media(max-width: 768px) { .faq-grid { grid-template-columns: 1fr; } .faq-sect { padding: 80px 24px; } }
    .faq-item {
      padding: 28px 32px; border: 1px solid var(--border);
      background: var(--s1); cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .faq-item:hover { background: var(--s2); border-color: rgba(242,201,76,0.2); }
    .faq-item.open { border-color: rgba(242,201,76,0.25); background: linear-gradient(135deg, rgba(242,201,76,0.05), var(--s1)); }
    .faq-q {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      font-family: var(--display); font-size: 22px; letter-spacing: 0.02em; color: var(--txt);
    }
    .faq-icon { color: var(--o); font-size: 20px; flex-shrink: 0; transition: transform 0.3s ease; line-height: 1.2; }
    .faq-item.open .faq-icon { transform: rotate(45deg); }
    .faq-a {
      font-size: 14px; color: var(--muted2); line-height: 1.75; font-weight: 300;
      max-height: 0; overflow: hidden; transition: max-height 0.4s ease, margin-top 0.3s ease;
      margin-top: 0;
    }
    .faq-item.open .faq-a { max-height: 200px; margin-top: 14px; }

    .footer {
      border-top: 1px solid var(--border); padding: 40px 48px;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;
    }
    .f-logo { font-family: var(--display); font-size: 22px; letter-spacing: 0.06em; }
    .f-logo em { color: var(--o); font-style: normal; }
    .f-links { display: flex; gap: 28px; }
    .f-link { font-size: 13px; color: var(--muted2); text-decoration: none; transition: color 0.2s; }
    .f-link:hover { color: var(--txt); }
    .f-copy { font-family: var(--mono); font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }

    @media(max-width:768px){
      .nav-links { display: none; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .stat-c { border-bottom: 1px solid var(--border); }
      .hero { padding: 100px 24px 60px; }
      .stats-sect, .feat-sect, .how-sect, .pricing-sect, .cta-sect { padding-left: 24px; padding-right: 24px; }
      .feat-head, .feat-drag-hint { padding-left: 24px; padding-right: 24px; }
      .feat-scroll { padding-left: 24px; padding-right: 24px; }
      .split-left, .split-right { padding: 64px 24px; }
      .footer { padding: 32px 24px; }
      .nav { padding: 0 24px; }
    }

    @keyframes shimIn { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform:translateY(0) } }
    .shi1 { animation: shimIn 0.8s ease 0.1s both; }
    .shi2 { animation: shimIn 0.8s ease 0.25s both; }
    .shi3 { animation: shimIn 0.8s ease 0.4s both; }
    .shi4 { animation: shimIn 0.8s ease 0.55s both; }
    .shi5 { animation: shimIn 0.8s ease 0.7s both; }
`;

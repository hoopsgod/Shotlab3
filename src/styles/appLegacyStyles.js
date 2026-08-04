export const _STYLES_CSS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700;800&display=swap'); :root{--bg-0:#0B0D10;--surface-1:#0F1115;--surface-2:#141821;--surface-3:#171D28;--text-1:#E5E7EB;--text-2:#9CA3AF;--text-3:#6B7280;--stroke-1:rgba(255,255,255,0.08);--stroke-2:rgba(255,255,255,0.12);--shadow-0:none;--shadow-1:0 2px 10px rgba(0,0,0,0.35);--shadow-2:0 8px 24px rgba(0,0,0,0.45);--radius-card:20px;--stack-gap:28px;--card-pad:22px;--mini-card-pad:18px;--accent:#C8FF1A;--accent-soft:rgba(200,255,26,0.18);--color-primary:var(--accent);--color-primary-dim:#A3CC00;--color-primary-glow:var(--accent-soft);--color-secondary:var(--text-2);--color-secondary-dim:rgba(156,163,175,0.16);--color-danger:#FF4545;--color-warning:#FFA500;--color-bg-base:var(--bg-0);--color-bg-card:var(--surface-2);--color-bg-elevated:var(--surface-1);--color-bg-subtle:var(--stroke-1);--color-text-primary:var(--text-1);--color-text-secondary:var(--text-2);--color-text-muted:var(--text-3);--tracking-tight:0.04em;--tracking-default:0.06em;--tracking-wide:0.10em;--text-primary:var(--text-1);--text-secondary:var(--text-2);--text-tertiary:var(--text-3);--accent-default:var(--accent);--accent-feed:var(--accent);--accent-drills:#9BFF3D;--accent-events:#77D7FF;--accent-lifting:#FFB347;--accent-sc:#5ED0FF;--accent-players:#CFA8FF;--nav-inactive:var(--text-2);--nav-inactive-icon:color-mix(in srgb,var(--text-2) 78%, var(--text-3));--nav-active-text:var(--accent);--nav-indicator-height:3px;--nav-focus:var(--accent-soft);--nav-active-glow:color-mix(in srgb,var(--accent) 32%, transparent);--coach-text-scale-small:1;--coach-text-scale-medium:1;--coach-text-scale-display:1;--motion-fast:120ms;--motion-base:180ms;--motion-slow:240ms;--motion-ease-standard:cubic-bezier(0.2,0,0,1);--motion-ease-decel:cubic-bezier(0,0,0,1);--motion-ease-accel:cubic-bezier(0.4,0,1,1);--press-scale:.985;--hover-lift:-1px;} :root[data-text-scale="large"]{--coach-text-scale-small:1.12;--coach-text-scale-medium:1.11;--coach-text-scale-display:1.04;} :root[data-text-scale="xl"]{--coach-text-scale-small:1.22;--coach-text-scale-medium:1.20;--coach-text-scale-display:1.06;} *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}body{background:${BG};overflow-x:hidden}.coach-mode{background:#0B0A09!important}.coach-mode input,.coach-mode textarea{font-size:calc(13px * var(--coach-text-scale-medium));line-height:1.4;}input,textarea{font-family:${FB}}.u-allcaps-long{text-transform:none;letter-spacing:var(--tracking-tight);font-weight:600}.u-meta-label{text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary);font-weight:600;font-size:calc(10px * var(--coach-text-scale-small));}.u-secondary-text{color:var(--text-secondary)}button:focus-visible,a:focus-visible{outline:2px solid var(--page-accent,var(--color-primary,#C8FF00));outline-offset:2px}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}input[type=number]{-moz-appearance:textfield}::-webkit-scrollbar{width:0}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes scaleIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes glow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 0 transparent}}@keyframes heroGlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes rippleOut{0%{transform:scale(0);opacity:.5}100%{transform:scale(4);opacity:0}}@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes orbDrift{0%{transform:translate(-50%,-50%) scale(1)}25%{transform:translate(-40%,-60%) scale(1.1)}50%{transform:translate(-60%,-45%) scale(.95)}75%{transform:translate(-45%,-55%) scale(1.05)}100%{transform:translate(-55%,-50%) scale(1)}}@keyframes confettiBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{opacity:0}}@keyframes particleFly{0%{transform:translate(0,0) scale(1);opacity:1}60%{opacity:.8}100%{transform:var(--fly-to);opacity:0}}@keyframes screenFadeIn{from{opacity:0}to{opacity:1}}@keyframes detailEnter{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes ballEntrance{0%{opacity:0;transform:scale(.85)}100%{opacity:1;transform:scale(1)}}@keyframes shadowEntrance{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}@keyframes cardEntrance{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes demoEntrance{from{opacity:0}to{opacity:1}}@keyframes metricPop{from{transform:scale(.8);opacity:.6}to{transform:scale(1);opacity:1}}@keyframes flashPress{0%{opacity:1}40%{opacity:1}100%{opacity:0}}@keyframes rankBounce{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}@keyframes badgeFlash{0%,100%{stroke:#555555}25%,75%{stroke:#C8FF00}50%{stroke:#555555}}.fade-up{animation:fadeUp .4s ease-out both}.screen-fade-in{animation:screenFadeIn .2s ease-out both}.detail-enter{animation:detailEnter .25s ease-out both}.scale-in{animation:scaleIn .35s ease-out both}.btn-v{transition:transform .12s ease,box-shadow .2s ease,filter .18s ease;position:relative;overflow:hidden}.btn-v:hover{filter:brightness(1.04)}.btn-v:active{transform:scale(.975)}.btn-v::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,.15);opacity:0;pointer-events:none}.btn-v:active::after{animation:flashPress .2s ease-out forwards}.cta-primary,.cta-secondary,.cta-ghost,.cta-danger,.cta-primary-accent,.cta-brand{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;min-height:calc(54px + ((var(--coach-text-scale-medium) - 1) * 8px));width:calc(100% - 32px)!important;margin-left:16px!important;margin-right:16px!important;height:auto!important;padding:calc(11px + ((var(--coach-text-scale-medium) - 1) * 3px)) 16px!important;border-radius:14px!important;cursor:pointer;font-family:${FB}!important;font-size:calc(13px * var(--coach-text-scale-medium))!important;font-weight:700!important;letter-spacing:var(--tracking-default)!important;text-transform:uppercase;transition:transform var(--motion-fast) var(--motion-ease-standard),box-shadow var(--motion-base) var(--motion-ease-standard),opacity var(--motion-base) var(--motion-ease-standard),filter var(--motion-base) var(--motion-ease-standard),border-color var(--motion-base) var(--motion-ease-standard),color var(--motion-base) var(--motion-ease-standard),background var(--motion-base) var(--motion-ease-standard)}.cta-primary,.cta-primary-accent,.cta-brand{border:1px solid color-mix(in srgb,var(--color-primary,var(--team-brand-primary,#C8FF00)) 68%, transparent);color:var(--team-brand-on-primary,var(--team-brand-primary-text,#0B0D10));background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--color-primary,var(--team-brand-primary,#C8FF00));box-shadow:0 4px 24px color-mix(in srgb,var(--color-primary,var(--team-brand-primary,#C8FF00)) 26%, transparent)}.cta-secondary{border:1px solid color-mix(in srgb,var(--stroke-2,rgba(255,255,255,.12)) 85%, transparent);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0)),var(--surface-1,#0F1115);color:var(--text-1,#E5E7EB);box-shadow:var(--shadow-0,none)}.cta-ghost{border:1px solid transparent;background:transparent;color:var(--text-2,#9CA3AF);box-shadow:none}.cta-danger{border:1px solid color-mix(in srgb,var(--color-danger,#FF4545) 62%, transparent);color:#FFFFFF;background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),color-mix(in srgb,var(--color-danger,#FF4545) 88%, #8B0000 12%);box-shadow:0 4px 20px color-mix(in srgb,var(--color-danger,#FF4545) 32%, transparent)}.cta-primary:active,.cta-primary-accent:active,.cta-brand:active,.cta-secondary:active,.cta-ghost:active,.cta-danger:active{transform:scale(.97)}.cta-primary:active,.cta-primary-accent:active,.cta-brand:active{box-shadow:0 4px 24px color-mix(in srgb,var(--page-accent,var(--color-primary,#C8FF00)) 14%, transparent)}.cta-danger:active{box-shadow:0 4px 18px color-mix(in srgb,var(--color-danger,#FF4545) 20%, transparent)}.cta-primary:hover,.cta-primary-accent:hover,.cta-brand:hover,.cta-secondary:hover,.cta-danger:hover{filter:brightness(1.05)}.cta-ghost:hover{background:rgba(255,255,255,.04);color:var(--text-1,#E5E7EB)}.cta-primary:focus-visible,.cta-primary-accent:focus-visible,.cta-brand:focus-visible{outline:2px solid var(--page-accent,var(--color-primary,#C8FF00));outline-offset:2px}.cta-secondary:focus-visible,.cta-ghost:focus-visible{outline:2px solid var(--stroke-2,rgba(255,255,255,.12));outline-offset:2px}.cta-danger:focus-visible{outline:2px solid var(--color-danger,#FF4545);outline-offset:2px}.cta-primary[disabled],.cta-primary-accent[disabled],.cta-brand[disabled],.cta-primary[data-loading='true'],.cta-primary-accent[data-loading='true'],.cta-brand[data-loading='true'],.cta-secondary[disabled],.cta-secondary[data-loading='true'],.cta-ghost[disabled],.cta-ghost[data-loading='true'],.cta-danger[disabled],.cta-danger[data-loading='true']{opacity:.4;box-shadow:none;cursor:not-allowed}.cta-primary[disabled] .cta-icon,.cta-primary-accent[disabled] .cta-icon,.cta-brand[disabled] .cta-icon,.cta-primary[data-loading='true'] .cta-icon,.cta-primary-accent[data-loading='true'] .cta-icon,.cta-brand[data-loading='true'] .cta-icon,.cta-secondary[disabled] .cta-icon,.cta-secondary[data-loading='true'] .cta-icon,.cta-ghost[disabled] .cta-icon,.cta-ghost[data-loading='true'] .cta-icon,.cta-danger[disabled] .cta-icon,.cta-danger[data-loading='true'] .cta-icon{display:none}.cta-primary[disabled]::before,.cta-primary[data-loading='true']::before,.cta-primary-accent[disabled]::before,.cta-primary-accent[data-loading='true']::before,.cta-brand[disabled]::before,.cta-brand[data-loading='true']::before,.cta-secondary[disabled]::before,.cta-secondary[data-loading='true']::before,.cta-ghost[disabled]::before,.cta-ghost[data-loading='true']::before,.cta-danger[disabled]::before,.cta-danger[data-loading='true']::before{content:'';width:12px;height:12px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;display:inline-block;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.cta-secondary-link{margin-top:16px;font-family:${FB};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-2,#9CA3AF);background:none;border:none;padding:0;cursor:pointer}.cta-secondary-link:hover,.cta-secondary-link:focus-visible{color:var(--text-1,#E5E7EB);text-decoration:underline}.ch{transition:transform .1s ease,background-color .15s ease,border-color .15s ease}.ch:hover{background:#1A1A1A!important;border-color:rgba(200,255,0,.15)!important}.ch:active{transform:scale(.985)}.tb{background-size:200% 100%;animation:shimmer 3s linear infinite}.cnt-up{animation:countUp .5s ease-out both}.grd-bdr{background:linear-gradient(135deg,${VOLT}15,${ORANGE}10,${CYAN}10);padding:1px;border-radius:17px}.grd-bdr>div{border-radius:16px}.glass-hdr{background:${BG}cc;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid ${BORDER_CLR}80;box-shadow:0 4px 30px ${BG}80}.card-glow-v,.card-glow-o,.card-glow-c{box-shadow:var(--shadow-1)}.particle{position:absolute;border-radius:50%;pointer-events:none;animation:particleFly .7s ease-out forwards}@keyframes bbBounce{0%{transform:translateY(0) scaleY(1) scaleX(1)}40%{transform:translateY(8px) scaleY(.7) scaleX(1.3)}70%{transform:translateY(-6px) scaleY(1.1) scaleX(.95)}100%{transform:translateY(0) scaleY(1) scaleX(1)}}@keyframes badgeReveal{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes shineSwipe{0%{left:-60%}100%{left:160%}}.badge-pop{animation:badgeReveal .6s cubic-bezier(.34,1.56,.64,1) both}.badge-shine{position:relative;overflow:hidden}.badge-shine::after{content:'';position:absolute;top:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:shineSwipe 1.2s ease .3s}@keyframes slideInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}@keyframes slideInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}@keyframes ballSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes ballBounceIn{0%{transform:scale(0) translateY(40px);opacity:0}50%{transform:scale(1.15) translateY(-10px);opacity:1}70%{transform:scale(.95) translateY(4px)}100%{transform:scale(1) translateY(0)}}@keyframes podiumPulse{0%,100%{box-shadow:0 0 12px var(--pod-c,${VOLT})22}50%{box-shadow:0 0 28px var(--pod-c,${VOLT})33}}.slide-r{animation:slideInRight .3s ease-out both}.slide-l{animation:slideInLeft .3s ease-out both}.ball-spin{animation:ballSpin 8s linear infinite}.auth-ball-enter{animation:ballEntrance .6s cubic-bezier(.34,1.56,.64,1) both}.auth-shadow-enter{animation:shadowEntrance .6s cubic-bezier(.34,1.56,.64,1) both}.auth-card-enter{animation:cardEntrance .4s ease-out .2s both}.auth-demo-enter{animation:demoEntrance .25s ease-out .7s both}.metric-pop{display:inline-block;animation:metricPop .3s ease-out both}.rank-bounce{animation:rankBounce .4s cubic-bezier(.34,1.56,.64,1)}.rank-badge-flash{animation:badgeFlash .6s ease-in-out 2}.ball-bounce{animation:ballBounceIn .7s cubic-bezier(.34,1.56,.64,1) both}.podium-glow{animation:podiumPulse 2s ease-in-out infinite}.grad-text{background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}.page{--page-accent:var(--accent-default);--nav-accent:var(--accent-default);}@keyframes pageSoftEnter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.page{animation:pageSoftEnter .22s ease-out both;}.page[data-accent="feed"]{--page-accent:var(--accent-feed);--nav-accent:var(--accent-feed);}.page[data-accent="drills"]{--page-accent:var(--accent-drills);--nav-accent:var(--accent-drills);}.page[data-accent="events"]{--page-accent:var(--accent-events);--nav-accent:var(--accent-events);}.page[data-accent="sc"]{--page-accent:var(--accent-sc);--nav-accent:var(--accent-sc);}.page[data-accent="players"]{--page-accent:var(--accent-players);--nav-accent:var(--accent-players);}.page-header{margin-top:10px;margin-bottom:20px;}.page-title{text-transform:none;letter-spacing:var(--tracking-tight);line-height:1.05;max-width:100%;word-break:break-word;}.page-identity-bar{height:4px;width:68px;margin-top:12px;border-radius:999px;background:linear-gradient(90deg,var(--page-accent),transparent);opacity:0.95;}.accent-card{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,0));border:1px solid color-mix(in srgb,var(--stroke-1) 76%, transparent);box-shadow:var(--shadow-1);transition:transform .16s ease,box-shadow .2s ease,border-color .2s ease,opacity .2s ease;}.accent-card::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:999px;background:var(--page-accent);opacity:0.7;} .accent-card:hover{transform:translateY(-1px);box-shadow:var(--shadow-2);border-color:color-mix(in srgb,var(--page-accent) 18%, var(--stroke-2));} .accent-card:active{transform:translateY(0) scale(.995);} .bottom-nav .tab{color:var(--nav-inactive);opacity:.86;padding-top:calc(9px + ((var(--coach-text-scale-medium) - 1) * 4px));padding-bottom:calc(7px + ((var(--coach-text-scale-medium) - 1) * 4px));transition:transform var(--motion-base) var(--motion-ease-standard),opacity var(--motion-base) var(--motion-ease-standard);will-change:transform;}.bottom-nav .tab .tab-icon{color:var(--nav-inactive-icon);transition:color 150ms ease-out,filter 150ms ease-out,opacity 150ms ease-out;line-height:1;opacity:.86;}.bottom-nav .tab .tab-label{color:var(--nav-inactive);font-size:calc(10px * var(--coach-text-scale-medium));font-weight:500;opacity:.92;transition:color 150ms ease-out,font-weight 150ms ease-out,opacity 150ms ease-out;}.bottom-nav .tab::after{content:"";position:absolute;top:4px;left:50%;transform:translateX(-50%);width:22px;height:var(--nav-indicator-height);border-radius:999px;background:var(--tab-accent,var(--nav-accent));opacity:0;transition:opacity 150ms ease-out;}.bottom-nav .tab.is-active,.bottom-nav .tab.active{color:var(--nav-active-text);opacity:1;transform:translateY(-1px);}.bottom-nav .tab.is-active .tab-icon,.bottom-nav .tab.active .tab-icon{color:var(--tab-accent,var(--nav-accent));opacity:1;filter:drop-shadow(0 0 3px var(--nav-active-glow));}.bottom-nav .tab.is-active .tab-label,.bottom-nav .tab.active .tab-label{color:var(--tab-accent,var(--nav-accent));font-weight:600;opacity:1;}.bottom-nav .tab.is-active::after,.bottom-nav .tab.active::after{opacity:0.82;}.bottom-nav .tab:focus-visible{outline:2px solid var(--nav-focus);outline-offset:3px;border-radius:10px;}.bottom-nav .tab:active{transform:translateY(0) scale(.98);opacity:1;}.bottom-nav .tab .tab-icon,.bottom-nav .tab .tab-label{will-change:transform,color,opacity;}.bottom-nav .tab:active .tab-icon{transform:scale(.94);} .ds-button:hover:not(:disabled){filter:brightness(1.04);transform:translateY(-1px);} .ds-button:active:not(:disabled){transform:scale(.98);} .ds-button:focus-visible,.ds-chip:focus-visible,.ds-input:focus-visible,.ds-metric-card:focus-visible{outline:2px solid var(--page-accent,var(--accent));outline-offset:2px;} .ds-chip:hover:not(:disabled){border-color:color-mix(in srgb,var(--accent) 55%, var(--stroke-1));} .ds-chip:active:not(:disabled){transform:scale(.98);} .ds-input:hover{border-color:color-mix(in srgb,var(--accent) 28%, var(--stroke-1));} .ds-input:focus-visible{border-color:var(--page-accent,var(--accent));box-shadow:0 0 0 3px color-mix(in srgb,var(--page-accent,var(--accent)) 22%, transparent);} .ds-metric-card:hover{border-color:color-mix(in srgb,var(--page-accent,var(--accent)) 30%, var(--stroke-1));box-shadow:0 10px 20px rgba(0,0,0,.28);} .ds-metric-card:active{transform:scale(.99);} .modal-shell,.modal-card{transition:opacity var(--motion-base) var(--motion-ease-standard), transform var(--motion-base) var(--motion-ease-standard);} .modal-shell{backdrop-filter:blur(0px);}.modal-shell[data-open="true"]{backdrop-filter:blur(2px);} .state-fade{animation:screenFadeIn .18s ease both;} @media (max-width:767px){.bottom-nav .tab{min-height:56px;padding-top:10px;padding-bottom:8px;} .bottom-nav .tab .tab-label{font-size:11px;} .ds-button,.ds-chip{min-height:44px;}}@media(prefers-reduced-motion:reduce){*,.fade-up,.scale-in,.slide-r,.slide-l,.ball-spin,.ball-bounce,.badge-pop,.cnt-up,.podium-glow,.tb,.btn-v,.ch{animation:none!important;transition:none!important}}
.coach-mode .page-title,.coach-mode .pageHeaderText h1,.coach-mode .heroStatLbl,.coach-mode .sidebar-nav .nav-title,.coach-mode .insights-panel .panel-title{letter-spacing:0.08em;line-height:1.15;}
.coach-mode .pageHeaderText p,.coach-mode .coach-tools-trigger,.coach-mode .coach-tools-trigger__chevron,.coach-mode .placeholder,.coach-mode .sidebar-nav .nav-item{color:rgba(255,255,255,0.78);}
.coach-mode .pageHeaderText p,.coach-mode .placeholder{line-height:1.4;}
`;

export const _PAGE_SIGNATURE_CSS=`
.pageShell{--pageAccent:#B8FF00;--pageAccentGlow:rgba(184,255,0,.35);--pageAccentBg:rgba(184,255,0,.08);--page-accent:#B8FF00;--page-accent-soft:rgba(184,255,0,.08);--page-accent-border:rgba(184,255,0,.35);display:flex;flex-direction:column;gap:var(--stack-gap);}
.pageShell{--surface-panel:var(--surface-2);--surface-panel-strong:var(--surface-3);--surface-border:color-mix(in srgb,var(--stroke-1) 88%, rgba(255,255,255,0.02));--surface-border-strong:var(--stroke-2);--surface-radius:var(--radius-card);--surface-shadow:var(--shadow-1);--surface-shadow-strong:var(--shadow-2);}
.pageHeader{margin:0 0 14px;padding:14px 14px 10px;border-radius:16px;border:1px solid color-mix(in srgb,var(--pageAccent) 28%, transparent);background:linear-gradient(135deg,var(--pageAccentBg),rgba(10,10,10,.96) 55%);box-shadow:0 8px 24px rgba(0,0,0,.3);}
.pageHeader{border-radius:var(--surface-radius);border:1px solid var(--surface-border);background:linear-gradient(180deg,color-mix(in srgb,var(--surface-panel-strong) 88%, #000),var(--surface-panel));box-shadow:var(--surface-shadow);}
.pageHeaderTop{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.pageHeaderBadge{width:48px;height:48px;border-radius:14px;border:1px solid color-mix(in srgb,var(--headerAccent) 42%, var(--surface-border));background:color-mix(in srgb,var(--surface-panel-strong) 84%, var(--headerAccent) 16%);display:flex;align-items:center;justify-content:center;color:var(--headerAccent);box-shadow:none;flex-shrink:0;}
.pageHeaderText{min-width:0;flex:1 1 220px;}.pageHeaderText h1{font-family:${FD};font-size:26px;letter-spacing:var(--tracking-default);color:#fff;line-height:1;word-break:break-word;}
.pageHeaderText p{font-family:${FB};font-size:calc(11px * var(--coach-text-scale-medium));color:var(--text-secondary);margin-top:4px;text-transform:uppercase;letter-spacing:var(--tracking-tight);}
.pageHeaderRight{margin-left:auto;flex-shrink:0;}
.pageHeaderPill{padding:6px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--pageAccent) 50%, transparent);background:color-mix(in srgb,var(--pageAccent) 14%, #1A1A1A);font-family:${FB};font-size:calc(10px * var(--coach-text-scale-medium));color:var(--pageAccent);font-weight:700;letter-spacing:var(--tracking-tight);text-transform:uppercase;transition:background .15s ease,box-shadow .15s ease,border-color .15s ease,transform .1s ease;}
.pageHeaderPill:hover{background:color-mix(in srgb,var(--pageAccent) 24%, #1A1A1A);border-color:color-mix(in srgb,var(--pageAccent) 62%, transparent);}
.pageHeaderPill:active{transform:translateY(1px);}
.pageHeaderPill:focus-visible{outline:2px solid var(--page-accent);outline-offset:2px;}
.pageHeaderPillBrand{border-color:color-mix(in srgb,var(--team-brand-primary) 50%, transparent);background:color-mix(in srgb,var(--team-brand-primary) 18%, #1A1A1A);color:var(--team-brand-accent-text);}
.pageHeaderPillBrand:hover{background:color-mix(in srgb,var(--team-brand-primary) 26%, #1A1A1A);border-color:color-mix(in srgb,var(--team-brand-primary) 68%, transparent);}
.pageHeaderPillBrand:focus-visible{outline-color:var(--team-brand-nav-active);}
.pageAccentBar{height:3px;width:42%;border-radius:999px;background:color-mix(in srgb,var(--headerAccent) 70%, transparent);box-shadow:none;margin-top:12px;}
.coachEventsSlimHeader{display:none;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;border:1px solid var(--surface-border);background:var(--surface-panel-strong);margin:0 0 12px;min-width:0;box-shadow:var(--surface-shadow);}
.coachEventsSlimHeaderLeft{display:flex;align-items:center;gap:8px;min-width:0;}
.coachEventsSlimHeaderLabel{font-family:${FD};font-size:calc(16px * var(--coach-text-scale-display));letter-spacing:var(--tracking-default);color:#fff;line-height:1;white-space:nowrap;}
.heroModule{position:relative;overflow:hidden;border:1px solid var(--surface-border-strong);border-radius:var(--surface-radius);padding:var(--card-pad);margin-bottom:var(--stack-gap);background:var(--surface-panel-strong);box-shadow:var(--surface-shadow-strong);}
.heroModule::before{content:'';position:absolute;left:0;top:0;width:54px;height:4px;background:var(--pageAccent);}
.premiumSummaryPanel{position:relative;overflow:hidden;border-radius:20px;padding:20px 18px;border:1px solid color-mix(in srgb,var(--pageAccent) 16%, var(--surface-border));background:linear-gradient(160deg,#10141c 0%,#0f141d 52%,#0c1118 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 10px 22px rgba(0,0,0,.22);}
.premiumSummaryPanel::before{content:"";position:absolute;left:18px;top:0;width:72px;height:3px;border-radius:999px;background:color-mix(in srgb,var(--pageAccent) 76%, transparent);}
.premiumSummaryTop{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;position:relative;z-index:1;}
.premiumSummaryBadge{width:40px;height:40px;border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--pageAccent) 14%, #141a24),#111722);display:flex;align-items:center;justify-content:center;color:var(--pageAccent);}
.premiumSummaryMeta{font-family:${FB};font-size:11px;color:var(--text-2);margin-top:6px;letter-spacing:0.02em;line-height:1.4;}
.premiumSummaryActions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;position:relative;z-index:1;padding-top:14px;border-top:1px solid rgba(255,255,255,.06);}
.premiumStatGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px;position:relative;z-index:1;}
.premiumStatTile{padding:14px 12px;border-radius:14px;background:linear-gradient(180deg,#161d29,#131a24);text-align:left;box-shadow:inset 0 1px 0 rgba(255,255,255,.03);}
.premiumStatTile .heroStatVal{color:var(--pageAccent);font-size:24px;line-height:1;}
.premiumStatTile .heroStatLbl{color:var(--text-2);margin-top:8px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
.heroStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px;}
.heroStat{background:color-mix(in srgb,var(--surface-panel) 86%, #0A0C10);border:1px solid var(--surface-border);border-radius:12px;padding:8px;text-align:center;}
.heroStatVal{font-family:${FD};color:var(--pageAccent);font-size:20px;line-height:1;}
.heroStatLbl{font-family:${FB};font-size:calc(9px * var(--coach-text-scale-medium));color:var(--text-tertiary);letter-spacing:var(--tracking-tight);margin-top:2px;}
.feedListItem{position:relative;padding-left:14px;}
.feedListItem::before{content:'';position:absolute;left:0;top:17px;width:6px;height:6px;border-radius:50%;background:var(--pageAccent);box-shadow:0 0 8px var(--pageAccentGlow);}
.drillsMetrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--stack-gap);margin-bottom:var(--stack-gap);}
.drillsMetricTile{border-left:2px solid color-mix(in srgb,var(--pageAccent) 65%, transparent);}
.eventsDatePill{display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:6px 8px;border-radius:999px;background:var(--semantic-info-surface);border:1px solid var(--semantic-info-border);color:var(--semantic-info);font-size:calc(10px * var(--coach-text-scale-medium));font-family:${FB};font-weight:700;letter-spacing:.08em;}
.scSection{border-top:1px solid var(--semantic-neutral-border);padding-top:10px;margin-top:10px;}
.playersAvatarRing{outline:2px solid color-mix(in srgb,var(--team-brand-secondary) 65%, transparent);outline-offset:1px;border-radius:50%;}
.bottom-nav .tab.is-active::before,.bottom-nav .tab.active::before{display:none;}
.accent-card{background:var(--surface-panel)!important;border:1px solid var(--surface-border)!important;border-radius:var(--surface-radius)!important;box-shadow:var(--surface-shadow)!important;}
.accent-card::before{width:2px!important;top:14px!important;bottom:14px!important;background:color-mix(in srgb,var(--page-accent) 62%, transparent)!important;opacity:.55!important;}
@media(min-width:768px){.pageHeaderBadge{width:56px;height:56px;}.drillsMetrics{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:767px){.premiumStatGrid{grid-template-columns:repeat(2,minmax(0,1fr));}.premiumSummaryActions .pageHeaderPill{flex:1;justify-content:center;}}
@media(max-width:767px){.coachEventsHeaderCard{display:none;}.coachEventsSlimHeader{display:flex;}}


@media (hover: hover) and (pointer: fine){.heroModule{transition:transform 150ms ease,box-shadow 150ms ease;}.heroModule:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,0.50);}}
/* === Coach Typography Readability Patch (Rec #4) === */
.coach-mode h1,
.coach-mode h2,
.coach-mode h3,
.coach-mode .page-title,
.coach-mode .title,
.coach-mode .heading,
.coach-mode .sectionTitle,
.coach-mode .cardTitle,
.coach-mode .pageTitle{
  letter-spacing:0.04em;
}

.coach-mode .kicker,
.coach-mode .label,
.coach-mode .metaLabel,
.coach-mode .subtitle,
.coach-mode .pageHeaderText p{
  letter-spacing:0.06em;
  font-size:calc(1em * var(--coach-text-scale-medium));
}

.coach-mode .helper,
.coach-mode .muted,
.coach-mode .description,
.coach-mode .subtext,
.coach-mode .hint,
.coach-mode .meta,
.coach-mode small,
.coach-mode p:not(.page-title){
  color:#B0B6BD;
  opacity:.78;
  font-size:calc(1em * var(--coach-text-scale-medium));
}

/* ================================
   ShotLab Depth System (Rec #2)
   Add-only patch: tokens + safe selectors
   ================================ */

:root{
  --bg-0:#0B0D10;

  --surface-1:#0F1115;
  --surface-2:#141821;
  --surface-3:#171D28;

  --stroke-1:rgba(255,255,255,0.08);
  --stroke-2:rgba(255,255,255,0.12);

  --semantic-success:#4ADE80;
  --semantic-success-surface:rgba(74,222,128,0.10);
  --semantic-success-border:rgba(74,222,128,0.34);
  --semantic-info:#38BDF8;
  --semantic-info-surface:rgba(56,189,248,0.10);
  --semantic-info-border:rgba(56,189,248,0.34);
  --semantic-warning:#F59E0B;
  --semantic-warning-surface:rgba(245,158,11,0.10);
  --semantic-warning-border:rgba(245,158,11,0.34);
  --semantic-danger:#F87171;
  --semantic-danger-surface:rgba(248,113,113,0.10);
  --semantic-danger-border:rgba(248,113,113,0.34);
  --semantic-neutral:#94A3B8;
  --semantic-neutral-surface:rgba(148,163,184,0.09);
  --semantic-neutral-border:rgba(148,163,184,0.28);

  --shadow-0:none;
  --shadow-1:0 2px 10px rgba(0,0,0,0.35);
  --shadow-2:0 8px 24px rgba(0,0,0,0.45);

  --radius-card:20px;

  --stack-gap:24px;
}

/* Tier 2 default "card-like" surfaces (safe, common class/id patterns) */
.card,
.Card,
.panel,
.Panel,
.tile,
.Tile,
.widget,
.Widget,
.surface,
.Surface,
[class*="card"],
[class*="Card"],
[class*="panel"],
[class*="Panel"],
[class*="tile"],
[class*="Tile"]{
  background: color-mix(in srgb, var(--surface-2) 94%, #0A0C10) !important;
  border: 1px solid color-mix(in srgb, var(--stroke-1) 86%, rgba(255,255,255,0.02)) !important;
  border-radius: var(--surface-radius, var(--radius-card)) !important;
  box-shadow: var(--shadow-1) !important;
}

/* Tier 3: hero / primary blocks (targets common "hero/summary/report/log" patterns) */
.hero,
.Hero,
.summary,
.Summary,
.report,
.Report,
.sessionLog,
.SessionLog,
[class*="Hero"],
[class*="hero"],
[class*="Report"],
[class*="report"],
[class*="Summary"],
[class*="summary"],
[class*="Session"],
[class*="session"],
[class*="Log"],
[class*="log"]{
  background: var(--surface-3) !important;
  border: 1px solid var(--stroke-2) !important;
  box-shadow: var(--shadow-2) !important;
}

/* Tier 1: large background panels if present */
.section,
.Section,
.containerPanel,
.ContainerPanel,
[class*="Section"],
[class*="section"]{
  background: var(--surface-1);
}

/* Remove neon glow from containers (only affects elements that already have glowy shadows) */
.card,
.Card,
.panel,
.Panel,
.tile,
.Tile,
.widget,
.Widget,
[class*="card"],
[class*="Card"],
[class*="panel"],
[class*="Panel"],
[class*="tile"],
[class*="Tile"]{
  filter: none !important;
  text-shadow: none !important;
}

/* Vertical rhythm: increase spacing in common stacks/lists without changing layout */
.stack,
.Stack,
.list,
.List,
.feed,
.Feed,
.grid,
.Grid,
[class*="stack"],
[class*="Stack"],
[class*="list"],
[class*="List"],
[class*="feed"],
[class*="Feed"]{
  gap: var(--stack-gap);
}

/* If stacks are not using gap, add margin between siblings safely */
.stack > * + *,
.Stack > * + *,
.list > * + *,
.List > * + *,
[class*="stack"] > * + *,
[class*="Stack"] > * + *,
[class*="list"] > * + *,
[class*="List"] > * + *{
  margin-top: var(--stack-gap);
}

/* Desktop-only subtle hover lift for Tier 3 (safe, no mobile impact) */
@media (hover:hover) and (pointer:fine){
  .hero:hover,
  .Hero:hover,
  .summary:hover,
  .Summary:hover,
  .report:hover,
  .Report:hover,
  .sessionLog:hover,
  .SessionLog:hover,
  [class*="Hero"]:hover,
  [class*="hero"]:hover,
  [class*="Report"]:hover,
  [class*="report"]:hover,
  [class*="Summary"]:hover,
  [class*="summary"]:hover,
  [class*="Session"]:hover,
  [class*="session"]:hover,
  [class*="Log"]:hover,
  [class*="log"]:hover{
    box-shadow: 0 12px 28px rgba(0,0,0,0.50) !important;
    transform: translateY(-2px);
    transition: transform 150ms ease, box-shadow 150ms ease;
  }
}
`;

export const _DESKTOP_SHELL_CSS=`:root{--shell-bg:#070707;--panel-bg:rgba(255,255,255,0.04);--panel-border:rgba(255,255,255,0.08);--text-dim:rgba(255,255,255,0.62);} .team-brand .pageHeaderBadge,.team-brand .pageAccentBar{background:var(--team-brand-header-accent)!important;box-shadow:0 0 16px color-mix(in srgb,var(--team-brand-header-accent) 44%, transparent)!important;}.team-brand .pageHeaderPill{border-color:var(--team-brand-badge-border)!important;background:var(--team-brand-badge-bg)!important;color:var(--team-brand-badge-text)!important;}.team-brand .cta-primary,.team-brand .cta-primary-accent{background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 100%),var(--team-brand-primary)!important;color:var(--team-brand-primary-text)!important;box-shadow:0 4px 24px color-mix(in srgb,var(--team-brand-primary) 30%, transparent)!important;}.team-brand .bottom-nav .tab.is-active,.team-brand .bottom-nav .tab.active{color:var(--team-brand-nav-active)!important;}.team-brand .bottom-nav .tab.is-active::before,.team-brand .bottom-nav .tab.active::before{background:var(--team-brand-nav-active)!important;}.team-brand .chip:not([data-tone]),.team-brand .badge:not([data-tone]),.team-brand [class*="chip"]:not([data-tone]),.team-brand [class*="badge"]:not([data-tone]){background:var(--team-brand-badge-bg)!important;border-color:var(--team-brand-badge-border)!important;color:var(--team-brand-badge-text)!important;}.app-shell{min-height:100vh;background:var(--shell-bg);}@media (min-width:1024px){.app-shell.is-desktop{display:grid;grid-template-columns:240px minmax(640px,1fr) 320px;gap:var(--stack-gap);padding:var(--stack-gap);align-items:start;}.sidebar-nav{position:sticky;top:18px;height:calc(100vh - 36px);background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--mini-card-pad);overflow:auto;}.sidebar-nav .nav-title{font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--text-dim);margin:6px 10px 14px;}.sidebar-nav .nav-item{display:flex;align-items:center;gap:10px;padding:12px 12px;border-radius:14px;color:rgba(255,255,255,0.70);cursor:pointer;user-select:none;border:1px solid transparent;transition:background 140ms ease,border-color 140ms ease,transform 120ms ease;width:100%;background:transparent;text-align:left;}.sidebar-nav .nav-item:hover{background:rgba(255,255,255,0.05);transform:translateY(-1px);}.sidebar-nav .nav-item.is-active{background:color-mix(in srgb,var(--team-brand-nav-active) 10%, transparent);border-color:color-mix(in srgb,var(--team-brand-nav-active) 22%, transparent);color:var(--team-brand-nav-active);}.shell-main{min-width:0;}.content-wrap{background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--card-pad);}.insights-panel{position:sticky;top:18px;height:calc(100vh - 36px);background:var(--surface-1);border:1px solid var(--stroke-1);border-radius:var(--radius-card);box-shadow:var(--shadow-0);padding:var(--mini-card-pad);overflow:auto;}.insights-panel .panel-title{font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--text-dim);margin:6px 10px 14px;}.insights-panel .placeholder{background:rgba(0,0,0,0.35);border:1px dashed rgba(255,255,255,0.14);border-radius:14px;padding:14px;color:rgba(255,255,255,0.55);font-size:13px;line-height:1.35;}}`;

export const _PLAYER_COMPACT_DASHBOARD_CSS=`
.player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 88px) + 24px + env(safe-area-inset-bottom, 0px));-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;scroll-padding-bottom:var(--player-scroll-bottom-padding);}
.player-home-compact-dashboard{--player-dashboard-gap:14px;--player-dashboard-card-pad:18px;--player-dashboard-card-pad-compact:16px;--player-dashboard-chip-pad:4px 8px;--player-dashboard-chip-font:10px;--player-dashboard-section-title:22px;--player-dashboard-title-tight:1;--player-dashboard-chip-bg:rgba(8,10,14,0.78);--player-dashboard-chip-border:rgba(255,255,255,0.14);gap:var(--player-dashboard-gap);}
.player-dashboard-chip{display:inline-flex;align-items:center;max-width:100%;}
@media (max-width:767px){
  .player-scroll-container{--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 88px) + 24px + env(safe-area-inset-bottom, 0px));}
  .player-home-compact-dashboard{--player-dashboard-gap:10px;--player-dashboard-card-pad:18px;--player-dashboard-card-pad-compact:16px;--player-dashboard-section-title:22px;--player-dashboard-chip-font:10px;--player-dashboard-chip-pad:4px 8px;--player-dashboard-card-radius:18px;--player-dashboard-card-compact-radius:16px;--player-dashboard-card-compact-bg:linear-gradient(155deg,rgba(14,18,24,0.88),rgba(8,10,14,0.86));--player-dashboard-card-compact-shadow:0 12px 26px rgba(0,0,0,0.24);--player-dashboard-chip-row-gap:6px;--player-dashboard-primary-cta-min-h:50px;--player-dashboard-primary-cta-font:14px;--player-dashboard-schedule-header-mb:9px;--player-dashboard-schedule-grid-gap:8px;--player-dashboard-schedule-item-pad:11px;--player-dashboard-schedule-item-radius:12px;--player-dashboard-schedule-meta-font:11px;--player-dashboard-schedule-meta-leading:1.35;--player-dashboard-schedule-cta-min-h:34px;--player-dashboard-schedule-cta-pad:5px 10px;--player-dashboard-schedule-cta-font:10px;--player-dashboard-schedule-cta-bg:rgba(255,255,255,0.025);--player-dashboard-schedule-cta-border:rgba(255,255,255,0.16);--player-dashboard-schedule-cta-color:rgba(229,231,235,0.86);margin-bottom:22px;}
}
`;

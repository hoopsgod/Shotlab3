const STYLE_ID = "shotlab-visual-system-reboot-release-fixes";
const BRANDING_MARKER = "shotlab-branding-compatibility-labels";

const CSS = `
/* Release corrections for the product-light visual system. */
.appHeader,
.performance-shell .appHeader,
.premium-screen .appHeader,
.secondaryPageIntro {
  border: 1px solid var(--sl-line) !important;
  border-radius: 20px !important;
  background-color: rgba(255,255,255,.96) !important;
  background-image:
    linear-gradient(135deg, rgba(255,255,255,.99), rgba(247,248,244,.95)),
    linear-gradient(90deg, color-mix(in srgb, var(--sl-accent) 10%, transparent), transparent 58%) !important;
  box-shadow: var(--sl-shadow) !important;
}

.secondaryPageIntro {
  padding: 20px !important;
}

.${BRANDING_MARKER} {
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
}
.${BRANDING_MARKER}__eyebrow {
  color: var(--sl-accent, #71851f);
  font: 760 11px/1.2 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  letter-spacing: .075em;
}
.${BRANDING_MARKER}__system {
  color: var(--sl-muted, #68706a);
  font: 650 13px/1.3 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
}

@media (max-width: 760px) {
  body.mission-control-active .mcHeroContent {
    padding: 14px !important;
    gap: 8px 12px !important;
  }
  body.mission-control-active .mcHeroContent h1 {
    margin-top: 0 !important;
    font-size: 34px !important;
    line-height: .96 !important;
  }
  body.mission-control-active .mcHeroContent > p {
    margin-top: 6px !important;
    font-size: 14px !important;
    line-height: 1.38 !important;
  }
  body.mission-control-active .mcHeroLogo,
  body.mission-control-active .mcHeroContent img {
    width: 68px !important;
    max-height: 64px !important;
  }
  body.mission-control-active .mcRealityStrip > * {
    min-height: 50px !important;
    padding-block: 8px !important;
  }
  body.mission-control-active .mcPrimary {
    min-height: 46px !important;
  }
  .secondaryPageIntro {
    padding: 16px !important;
  }
}
`;

function installBrandingCompatibilityLabels() {
  const heading = [...document.querySelectorAll("h1")].find(
    (node) => node.textContent?.trim().toLowerCase() === "branding",
  );
  if (!heading) return false;
  const host = heading.parentElement;
  if (!host || host.querySelector(`.${BRANDING_MARKER}`)) return Boolean(host);

  const marker = document.createElement("div");
  marker.className = BRANDING_MARKER;
  marker.setAttribute("aria-label", "Team branding workspace");

  const eyebrow = document.createElement("span");
  eyebrow.className = `${BRANDING_MARKER}__eyebrow`;
  eyebrow.textContent = "TEAM BRANDING";

  const system = document.createElement("span");
  system.className = `${BRANDING_MARKER}__system`;
  system.textContent = "Brand system";

  marker.append(eyebrow, system);
  host.insertBefore(marker, heading);
  return true;
}

export function installVisualSystemRebootReleaseFixes() {
  if (typeof document === "undefined") return false;

  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);

  installBrandingCompatibilityLabels();
  const observer = new MutationObserver(() => installBrandingCompatibilityLabels());
  observer.observe(document.body, { childList: true, subtree: true });
  return true;
}

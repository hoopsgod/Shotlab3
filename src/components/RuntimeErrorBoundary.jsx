import { Component, Fragment } from "react";

const fallbackShellStyle = {
  minHeight: "100dvh",
  background: "#080808",
  color: "#F3F6F7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  boxSizing: "border-box",
};

const fallbackCardStyle = {
  width: "100%",
  maxWidth: 520,
  borderRadius: 18,
  padding: 22,
  background: "linear-gradient(150deg, #171A1D, #101214)",
  border: "1px solid rgba(255,181,71,.42)",
  boxShadow: "0 24px 70px rgba(0,0,0,.48)",
  fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const buttonStyle = {
  minHeight: 44,
  borderRadius: 12,
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: ".08em",
  cursor: "pointer",
};

function classifyRuntimeError(error) {
  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("loading chunk") || message.includes("dynamically imported module")) return "asset_load_failed";
  if (name === "referenceerror") return "render_reference_error";
  if (name === "typeerror") return "render_type_error";
  return "render_failed";
}

function reportRuntimeError(error) {
  const code = classifyRuntimeError(error);
  window.__shotlabBootMark?.("runtime_error_boundary", code);
  console.error("[runtime-boundary] app render failed", { code });
  try {
    window.dispatchEvent(new CustomEvent("shotlab:runtime-error", { detail: { code } }));
  } catch {}
}

export default class RuntimeErrorBoundary extends Component {
  state = { error: null, recoveryAttempt: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    reportRuntimeError(error);
  }

  retry = () => {
    this.setState((state) => ({ error: null, recoveryAttempt: state.recoveryAttempt + 1 }));
  };

  reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <main style={fallbackShellStyle}>
          <section role="alert" aria-labelledby="runtime-error-title" style={fallbackCardStyle}>
            <div style={{ color: "#FFB547", fontSize: 11, fontWeight: 900, letterSpacing: ".14em", marginBottom: 8 }}>
              QUICK RECOVERY
            </div>
            <h1 id="runtime-error-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>
              ShotLab needs a quick reset
            </h1>
            <p style={{ margin: "10px 0 0", color: "#C8CDD2", fontSize: 14, lineHeight: 1.55 }}>
              A screen ran into a loading problem. Try reopening it here. If the problem continues, reload ShotLab.
            </p>
            <p style={{ margin: "10px 0 0", color: "#9099A1", fontSize: 12, lineHeight: 1.5 }}>
              These recovery actions do not clear training data saved on this device.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              <button
                type="button"
                data-testid="runtime-error-retry"
                onClick={this.retry}
                style={{ ...buttonStyle, flex: "1 1 160px", border: "1px solid #C8FF1A", background: "#C8FF1A", color: "#080808" }}
              >
                TRY AGAIN
              </button>
              <button
                type="button"
                data-testid="runtime-error-reload"
                onClick={this.reload}
                style={{ ...buttonStyle, flex: "1 1 160px", border: "1px solid rgba(255,255,255,.2)", background: "transparent", color: "#F3F6F7" }}
              >
                RELOAD SHOTLAB
              </button>
            </div>
          </section>
        </main>
      );
    }

    return <Fragment key={this.state.recoveryAttempt}>{this.props.children}</Fragment>;
  }
}

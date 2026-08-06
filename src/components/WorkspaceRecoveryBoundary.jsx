import { Component, Fragment } from "react";
import { buildWorkspaceRecoveryModel } from "../lib/workspaceRecovery.js";
import styles from "./WorkspaceRecoveryBoundary.module.css";

function reportWorkspaceError(error, label) {
  const model = buildWorkspaceRecoveryModel({ error, label });
  window.__shotlabBootMark?.("workspace_error_boundary", `${model.code}:${String(label || "workspace").toLowerCase().replace(/\s+/g, "_")}`);
  console.error("[workspace-boundary] section render failed", { code: model.code, label });
  try {
    window.dispatchEvent(new CustomEvent("shotlab:workspace-error", {
      detail: { code: model.code, label: String(label || "workspace") },
    }));
  } catch {}
  return model;
}

export function WorkspaceRecoveryNotice({
  model,
  onPrimary,
  onReload,
  testId = "workspace-recovery-state",
}) {
  const primaryIsReload = model.primaryAction === "reload";
  return (
    <section className={styles.shell} role="alert" aria-labelledby={`${testId}-title`} data-testid={testId} data-error-code={model.code}>
      <div className={styles.card}>
        <div className={styles.eyebrow}>{model.eyebrow}</div>
        <h2 className={styles.title} id={`${testId}-title`}>{model.title}</h2>
        <p className={styles.detail}>{model.detail}</p>
        <p className={styles.note}>{model.note}</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={primaryIsReload ? onReload : onPrimary} data-testid={`${testId}-primary`}>
            {model.primaryLabel}
          </button>
          {!primaryIsReload ? (
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onReload} data-testid={`${testId}-reload`}>
              Reload ShotLab
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default class WorkspaceRecoveryBoundary extends Component {
  state = { error: null, recoveryAttempt: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    reportWorkspaceError(error, this.props.label);
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState((state) => ({ error: null, recoveryAttempt: state.recoveryAttempt + 1 }));
    }
  }

  retry = () => {
    this.setState((state) => ({ error: null, recoveryAttempt: state.recoveryAttempt + 1 }));
  };

  reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const model = buildWorkspaceRecoveryModel({ error: this.state.error, label: this.props.label });
      return (
        <WorkspaceRecoveryNotice
          model={model}
          onPrimary={this.retry}
          onReload={this.reload}
          testId={this.props.testId}
        />
      );
    }

    return <Fragment key={this.state.recoveryAttempt}>{this.props.children}</Fragment>;
  }
}

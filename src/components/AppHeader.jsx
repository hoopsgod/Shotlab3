import styles from "./AppHeader.module.css";

const variantClass = (variant) => styles[variant] || styles.standard;

export default function AppHeader({
  variant = "standard",
  eyebrow,
  title,
  subtitle,
  leading,
  brandLockup,
  action,
}) {
  const isIconOnlyAction = Boolean(action && !action.label);

  return (
    <header className={`appHeader ${styles.header} ${variantClass(variant)}`} data-variant={variant}>
      <div className={`appHeaderMain ${styles.main}`}>
        <div className={`appHeaderIdentity ${styles.identity}`}>
          {leading ? <div className={`appHeaderLeading ${styles.leading}`}>{leading}</div> : null}
          <div className={`appHeaderCopy ${styles.copy}`}>
            {eyebrow ? <div className={`appHeaderEyebrow ${styles.eyebrow}`}>{eyebrow}</div> : null}
            <h1 className={`appHeaderTitle ${styles.title}`}>{title}</h1>
            {subtitle ? <p className={`appHeaderSubtitle ${styles.subtitle}`}>{subtitle}</p> : null}
          </div>
        </div>

        {(brandLockup || action) ? (
          <div className={`appHeaderTools ${styles.tools}`}>
            {brandLockup ? <div className={`appHeaderBrand ${styles.brand}`}>{brandLockup}</div> : null}
            {action ? (
              <button
                className={`appHeaderAction ${styles.action} ${isIconOnlyAction ? styles.iconOnly : ""}`}
                type="button"
                onClick={action.onClick}
                aria-label={action.ariaLabel || action.label}
              >
                {action.icon}
                {action.label ? <span>{action.label}</span> : null}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

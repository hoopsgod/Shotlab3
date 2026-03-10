import ViewportPreviewToggle from "../components/ViewportPreviewToggle";

export default function AppShell({
  ready,
  loadingFallback,
  StylesComponent,
  isDesktopViewport,
  previewMode,
  onPreviewModeChange,
  previewShellClass,
  previewContentClass,
  children,
}) {
  if (!ready) {
    return (
      <>
        <StylesComponent />
        {loadingFallback}
      </>
    );
  }

  return (
    <>
      <StylesComponent />
      {isDesktopViewport && (
        <ViewportPreviewToggle mode={previewMode} onChange={onPreviewModeChange} />
      )}
      <div className={previewShellClass}>
        <div className={previewContentClass}>{children}</div>
      </div>
    </>
  );
}

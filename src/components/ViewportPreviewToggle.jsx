export default function ViewportPreviewToggle({mode="desktop",onChange}){
return <div className="viewport-preview-toggle" role="group" aria-label="Viewport preview mode">
  <span className="viewport-preview-toggle__label">Preview</span>
  <button
    type="button"
    className={`viewport-preview-toggle__button ${mode==="desktop"?"is-active":""}`}
    onClick={()=>onChange?.("desktop")}
    aria-pressed={mode==="desktop"}
  >
    Desktop
  </button>
  <button
    type="button"
    className={`viewport-preview-toggle__button ${mode==="mobile"?"is-active":""}`}
    onClick={()=>onChange?.("mobile")}
    aria-pressed={mode==="mobile"}
  >
    Mobile
  </button>
</div>;
}

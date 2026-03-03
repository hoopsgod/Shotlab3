export default function PageSignature({ title, subtitle, icon, accent, rightAction }) {
  return (
    <header className="pageSignature" style={{ "--signatureAccent": accent }}>
      <div className="pageSignatureTop">
        <div className="pageSignatureBadge">{icon}</div>
        <div className="pageSignatureText">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {rightAction ? <div className="pageSignatureRight">{rightAction}</div> : null}
      </div>
      <div className="pageSignatureBar" aria-hidden="true" />
    </header>
  );
}

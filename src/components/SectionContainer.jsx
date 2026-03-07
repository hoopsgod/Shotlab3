function SectionContainer({ as: Component = "section", className = "", style, children, ...props }) {
  return (
    <Component
      {...props}
      className={`motion-section ${className}`.trim()}
      style={{
        marginBottom: "var(--section-gap)",
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default SectionContainer;

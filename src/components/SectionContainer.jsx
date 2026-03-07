function SectionContainer({ as: Component = "section", style, children, ...props }) {
  return (
    <Component
      {...props}
      style={{
        marginBottom: "var(--stack-section)",
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default SectionContainer;

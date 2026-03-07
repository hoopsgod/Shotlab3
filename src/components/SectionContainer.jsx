function SectionContainer({ as: Component = "section", style, children, ...props }) {
  return (
    <Component
      {...props}
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

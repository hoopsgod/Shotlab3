import spacing from "../spacing";

function SectionContainer({ as: Component = "section", className = "", style, children, ...props }) {
  return (
    <Component
      {...props}
      className={`section-container ${className}`.trim()}
      style={{
        marginBottom: `${spacing.lg}px`,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default SectionContainer;

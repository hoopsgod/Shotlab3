import spacing from "../spacing";

function SectionContainer({ as: Component = "section", style, children, ...props }) {
  return (
    <Component
      {...props}
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

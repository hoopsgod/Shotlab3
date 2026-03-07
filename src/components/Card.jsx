import spacing from "../spacing";

function Card({ as: Component = "div", style, children, ...props }) {
  return (
    <Component
      {...props}
      style={{
        padding: `${spacing.md}px`,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default Card;

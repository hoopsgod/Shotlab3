import spacing from "../spacing";

function Card({ as: Component = "div", className = "", style, children, ...props }) {
  return (
    <Component
      {...props}
      className={`shared-card ${className}`.trim()}
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

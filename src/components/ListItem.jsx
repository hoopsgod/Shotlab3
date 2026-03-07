import spacing from "../spacing";

function ListItem({ as: Component = "div", className = "", style, children, ...props }) {
  return (
    <Component
      {...props}
      className={`shared-nav-item ${className}`.trim()}
      style={{
        padding: `${spacing.compactCard}px`,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

export default ListItem;

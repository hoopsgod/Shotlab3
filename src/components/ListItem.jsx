import spacing from "../spacing";

function ListItem({ as: Component = "div", style, children, ...props }) {
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

export default ListItem;

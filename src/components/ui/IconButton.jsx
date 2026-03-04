export default function IconButton({ className = "", type = "button", children, ...props }) {
  return (
    <button type={type} className={`iconBtn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

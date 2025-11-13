export default function Button({ children, variant = "default", className = "", ...props }) {
  const variants = {
    default: "btn",
    primary: "btn btn-primary",
    subtle: "btn",
    danger: "btn btn-danger",
    ghost: "btn btn-ghost",
  };
  return (
    <button className={`${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}

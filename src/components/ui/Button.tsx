import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<
  Variant,
  { color: string; border: string; bg: string; shadow: string }
> = {
  primary: {
    color: "#1A1225",
    border: "1px solid #E66CBC",
    bg: "#E66CBC",
    shadow: "0 0 12px rgba(230, 108, 188, 0.4)",
  },
  secondary: {
    color: "#E66CBC",
    border: "1px solid #E66CBC",
    bg: "transparent",
    shadow: "0 0 8px rgba(230, 108, 188, 0.3)",
  },
  danger: {
    color: "#fff",
    border: "1px solid #FF5A7E",
    bg: "#FF5A7E",
    shadow: "0 0 8px rgba(255, 90, 126, 0.3)",
  },
  ghost: {
    color: "#E66CBC",
    border: "1px solid transparent",
    bg: "transparent",
    shadow: "none",
  },
};

const sizeStyles: Record<Size, { padding: string; fontSize: string }> = {
  sm: { padding: "4px 12px", fontSize: "12px" },
  md: { padding: "8px 16px", fontSize: "14px" },
  lg: { padding: "12px 24px", fontSize: "16px" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: "inherit",
        fontWeight: 600,
        color: v.color,
        backgroundColor: v.bg,
        border: v.border,
        borderRadius: "4px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        boxShadow: v.shadow,
        transition: "box-shadow 0.2s, opacity 0.2s",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          style={{
            display: "inline-block",
            width: "14px",
            height: "14px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "btn-spin 0.6s linear infinite",
          }}
        />
      )}
      {children}
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg) } }`}</style>
    </button>
  );
}

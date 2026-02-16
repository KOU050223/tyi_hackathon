interface LoadingSpinnerProps {
  size?: number;
}

export function LoadingSpinner({ size = 32 }: LoadingSpinnerProps) {
  const borderWidth = Math.max(2, Math.round(size / 10));

  return (
    <>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `${borderWidth}px solid rgba(230, 108, 188, 0.2)`,
          borderTopColor: "#E66CBC",
          borderRadius: "50%",
          animation: "neon-spin 0.8s linear infinite",
          boxShadow: "0 0 8px rgba(230, 108, 188, 0.3)",
        }}
      />
      <style>{`@keyframes neon-spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}

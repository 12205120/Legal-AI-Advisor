import React from "react";

export default function NeonButton({
  children,
  onClick,
  color = "cyan",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl border border-${color}-400/50 bg-${color}-500/10 hover:bg-${color}-500/20 text-${color}-300 font-semibold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const baseStyle = "px-3 py-1.5 text-xs font-medium rounded-md font-sans transition-all active:scale-95 disabled:opacity-50 select-none cursor-pointer";
    const variants = {
      primary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
      secondary: "bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300",
      accent: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold",
      danger: "bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${className || ''}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

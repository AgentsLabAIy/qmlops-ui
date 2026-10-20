import * as React from "react"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="space-y-1 w-full text-left">
        <label className="block text-[11px] font-medium text-slate-400 font-sans">{label}</label>
        <input
          type="range"
          ref={ref}
          className={`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 visual-slider ${className || ''}`}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

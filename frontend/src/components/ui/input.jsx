import React from "react";
import { cn } from "./utils";

export const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

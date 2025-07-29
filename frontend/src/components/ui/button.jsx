import React from "react";
import { cn } from "./utils";

export const Button = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-sky-500 text-white hover:bg-sky-600 px-4 py-2",
        className
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";

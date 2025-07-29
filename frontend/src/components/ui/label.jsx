import React from "react";
import { cn } from "./utils";

export const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
});

Label.displayName = "Label";

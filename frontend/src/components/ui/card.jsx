import React from "react";
import { cn } from "./utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

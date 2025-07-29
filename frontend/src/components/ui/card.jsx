import React from "react";
import { cn } from "./utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn("rounded-lg border border-slate-700 bg-slate-800 text-white shadow-sm", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

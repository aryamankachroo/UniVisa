import { type ReactNode } from "react";
import { cn } from "./ui/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  /** Bento grid: col-span-1 to 12, row-span-1 to 2 */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rowSpan?: 1 | 2;
  padding?: "none" | "sm" | "md" | "lg";
}

const colSpanClass: Record<number, string> = {
  1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4",
  5: "col-span-5", 6: "col-span-6", 7: "col-span-7", 8: "col-span-8",
  9: "col-span-9", 10: "col-span-10", 11: "col-span-11", 12: "col-span-12",
};
const rowSpanClass: Record<number, string> = { 1: "row-span-1", 2: "row-span-2" };

export function BentoCard({
  children,
  className,
  colSpan,
  rowSpan,
  padding = "md",
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "glass bento overflow-hidden",
        "border border-white/60 dark:border-white/10",
        padding === "none" && "p-0",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        colSpan != null && colSpanClass[colSpan],
        rowSpan != null && rowSpanClass[rowSpan],
        className
      )}
    >
      {children}
    </div>
  );
}

import { cn } from "../components/ui/utils";

interface RiskBadgeProps {
  level: "high" | "medium" | "low";
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const styles = {
    high: "bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/20",
    medium: "bg-[#FFB347]/10 text-[#FFB347] border-[#FFB347]/20",
    low: "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20",
  };

  const labels = {
    high: "High Risk",
    medium: "Medium Risk",
    low: "Low Risk",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[level],
        className
      )}
    >
      {labels[level]}
    </span>
  );
}

import { Clock, AlertTriangle, Info, LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface AlertCardProps {
  type: "deadline" | "warning" | "info";
  title: string;
  description: string;
  ctaText?: string;
  onCtaClick?: () => void;
  timestamp?: string;
  className?: string;
}

export function AlertCard({
  type,
  title,
  description,
  ctaText,
  onCtaClick,
  timestamp,
  className,
}: AlertCardProps) {
  const config: Record<
    string,
    { icon: LucideIcon; color: string; bgColor: string }
  > = {
    deadline: {
      icon: Clock,
      color: "#FFB347",
      bgColor: "rgba(255, 179, 71, 0.1)",
    },
    warning: {
      icon: AlertTriangle,
      color: "#FF4D4D",
      bgColor: "rgba(255, 77, 77, 0.1)",
    },
    info: {
      icon: Info,
      color: "#6C63FF",
      bgColor: "rgba(108, 99, 255, 0.1)",
    },
  };

  const { icon: Icon, color, bgColor } = config[type];

  return (
    <div
      className={cn(
        "glass bento rounded-2xl border border-white/60 dark:border-white/10 p-5 flex gap-4",
        className
      )}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {ctaText && (
          <Button
            onClick={onCtaClick}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {ctaText}
          </Button>
        )}
      </div>
      {timestamp && (
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          {timestamp}
        </div>
      )}
    </div>
  );
}

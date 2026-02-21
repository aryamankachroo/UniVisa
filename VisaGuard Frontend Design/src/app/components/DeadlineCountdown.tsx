import { motion } from "motion/react";

interface DeadlineCountdownProps {
  title: string;
  date: Date;
  daysRemaining: number;
}

export function DeadlineCountdown({
  title,
  date,
  daysRemaining,
}: DeadlineCountdownProps) {
  const getUrgencyColor = (days: number) => {
    if (days <= 7) return "#FF4D4D";
    if (days <= 30) return "#FFB347";
    return "#4CAF50";
  };

  const color = getUrgencyColor(daysRemaining);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="flex flex-col items-end">
        <div
          className="text-2xl font-bold"
          style={{ color }}
        >
          {daysRemaining}
        </div>
        <div className="text-xs text-muted-foreground">
          {daysRemaining === 1 ? "day" : "days"}
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "motion/react";

interface RiskScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function RiskScoreGauge({ score, size = "lg" }: RiskScoreGaugeProps) {
  const getRiskColor = (score: number) => {
    if (score > 70) return "#FF4D4D";
    if (score >= 40) return "#FFB347";
    return "#4CAF50";
  };

  const getRiskLabel = (score: number) => {
    if (score > 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  const sizes = {
    sm: { width: 120, strokeWidth: 8, fontSize: "1.5rem" },
    md: { width: 180, strokeWidth: 12, fontSize: "2rem" },
    lg: { width: 240, strokeWidth: 16, fontSize: "3rem" },
  };

  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getRiskColor(score);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width, height: width }}>
        <svg width={width} height={width} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ fontSize }}
            className="font-bold"
          >
            {score}
          </motion.div>
          <div className="text-xs text-muted-foreground">/ 100</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium" style={{ color }}>
          {getRiskLabel(score)}
        </div>
      </div>
    </div>
  );
}

import { RiskBadge } from "./RiskBadge";
import { cn } from "./ui/utils";

interface StudentRowProps {
  name: string;
  country: string;
  visa: string;
  programEnd: string;
  riskScore: number;
  topRiskFlag: string;
  lastActive: string;
  isExpanded: boolean;
  onClick: () => void;
}

export function StudentRow({
  name,
  country,
  visa,
  programEnd,
  riskScore,
  topRiskFlag,
  lastActive,
  isExpanded,
  onClick,
}: StudentRowProps) {
  const getRiskLevel = (score: number): "high" | "medium" | "low" => {
    if (score > 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return "bg-[#FF4D4D]/5 border-l-[#FF4D4D]";
    if (score >= 40) return "bg-[#FFB347]/5 border-l-[#FFB347]";
    return "bg-[#4CAF50]/5 border-l-[#4CAF50]";
  };

  return (
    <tr
      className={cn(
        "border-b border-border cursor-pointer transition-colors hover:bg-muted/50 border-l-4",
        getRiskColor(riskScore),
        isExpanded && "bg-muted/50"
      )}
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="font-medium">{name}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{country}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{visa}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{programEnd}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{riskScore}</span>
          <RiskBadge level={getRiskLevel(riskScore)} />
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
        {topRiskFlag}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{lastActive}</td>
    </tr>
  );
}

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface InsightCardProps {
  title: string;
  description: string;
  percentage: number;
  source: string;
  data?: Array<{ name: string; value: number }>;
  /** Use inside glass bento for transparent background */
  variant?: "default" | "minimal";
}

export function InsightCard({
  title,
  description,
  percentage,
  source,
  data,
  variant = "default",
}: InsightCardProps) {
  const chartData = data || [
    { name: "Confused", value: percentage },
    { name: "Clear", value: 100 - percentage },
  ];
  const isMinimal = variant === "minimal";

  return (
    <div className={isMinimal ? "bg-transparent border-0 p-0" : "bg-card rounded-lg border border-border p-4"}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="h-32 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#A0A0B0", fontSize: 12 }}
              axisLine={false}
            />
            <YAxis hide />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "var(--primary)" : "rgba(0,0,0,0.06)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground">Source: {source}</div>
    </div>
  );
}

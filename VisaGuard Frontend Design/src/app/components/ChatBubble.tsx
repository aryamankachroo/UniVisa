import { cn } from "./ui/utils";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  isAI: boolean;
  source?: string;
  timestamp?: string;
}

export function ChatBubble({ message, isAI, source, timestamp }: ChatBubbleProps) {
  if (isAI) {
    return (
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 max-w-[80%]">
          <div className="bg-card rounded-lg rounded-tl-none p-4 border border-border">
            <p className="text-sm leading-relaxed">{message}</p>
            {source && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <span className="text-primary">📄</span>
                  <span>Source: {source}</span>
                </div>
              </div>
            )}
          </div>
          {timestamp && (
            <div className="text-xs text-muted-foreground mt-1 ml-1">
              {timestamp}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 justify-end">
      <div className="flex-1 max-w-[80%] flex justify-end">
        <div className="bg-primary rounded-lg rounded-tr-none p-4">
          <p className="text-sm text-primary-foreground leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
        <User className="w-5 h-5 text-foreground" />
      </div>
    </div>
  );
}

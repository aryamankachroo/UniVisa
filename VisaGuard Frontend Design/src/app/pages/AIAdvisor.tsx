import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, Send, Briefcase, Search, FileText } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { SidebarUserFooter } from "../components/SidebarUserFooter";
import { ChatBubble } from "../components/ChatBubble";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getAnswer } from "../UniVisaAdvisor";
import { chat, getStudentId } from "../api";

interface Message {
  id: number;
  message: string;
  isAI: boolean;
  source?: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    message: "Hi! I'm your UniVisa AI advisor. I'm here to help with F-1/J-1 visa compliance. Ask me about work authorization, travel, OPT/CPT, address reporting, or anything else — I'll answer from our policy Q&A.",
    isAI: true,
    timestamp: "Just now",
  },
];

const QUICK_QUESTIONS = [
  "Can I work more than 20hrs this week?",
  "What happens if I miss my OPT deadline?",
  "Do I need to report my new address?",
];

export default function AIAdvisor() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("ai");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(2);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text) return;

    const userMsgId = nextIdRef.current++;
    const userMessage: Message = {
      id: userMsgId,
      message: text,
      isAI: false,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setChatError(null);
    setIsTyping(true);

    const aiMsgId = nextIdRef.current++;
    try {
      const studentId = getStudentId();
      const result = await chat(studentId, text);
      const answer = result?.answer ?? "No response.";
      const isErrorAnswer =
        /GEMINI_API_KEY|encountered an error|not configured|could not respond|Please try again/i.test(
          answer
        );
      const useBackend = !isErrorAnswer && answer !== "No response.";
      const finalAnswer = useBackend ? answer : getAnswer(text);
      const source = useBackend && result?.sources?.length ? result.sources[0] : undefined;
      const aiMessage: Message = {
        id: aiMsgId,
        message: finalAnswer,
        isAI: true,
        timestamp: "Just now",
        source,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const fallbackAnswer = getAnswer(text);
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          message: fallbackAnswer,
          isAI: true,
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNavigation = (path: string, nav: string) => {
    setActiveNav(nav);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Shield className="w-8 h-8 text-primary shrink-0" />
            <span className="text-xl font-bold truncate" style={{ fontFamily: "var(--font-family-heading)" }}>
              UniVisa
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handleNavigation("/dashboard", "dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigation("/ai-advisor", "ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "ai"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>AI Advisor</span>
          </button>
          <button
            onClick={() => handleNavigation("/cpt", "cpt")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === "cpt" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Briefcase className="w-5 h-5" />
            <span>CPT / Internship</span>
          </button>
          <button
            onClick={() => handleNavigation("/opportunities", "opportunities")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === "opportunities" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Search className="w-5 h-5" />
            <span>Opportunities</span>
          </button>
          <button
            onClick={() => handleNavigation("/profile", "profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "profile"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => handleNavigation("/alerts", "alerts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "alerts"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Alerts</span>
            <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              3
            </span>
          </button>
          <button
            onClick={() => handleNavigation("/policy-alerts", "policy")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "policy" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Policy Alerts</span>
          </button>
        </nav>

        <SidebarUserFooter />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="border-b border-border p-6 bg-card">
          <h1 className="text-2xl font-semibold mb-2">AI Advisor</h1>
          <p className="text-sm text-muted-foreground">
            Ask me anything about F-1 visa compliance (answers from UniVisa Q&A)
          </p>
          {chatError && (
            <p className="mt-2 text-sm text-destructive">{chatError}</p>
          )}
          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                onClick={() => handleSendMessage(question)}
                className="px-3 py-1.5 rounded-full text-sm bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages - min-h-0 lets flex child shrink so overflow-y-auto can scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 bg-background">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.message}
                isAI={msg.isAI}
                source={msg.source}
                timestamp={msg.timestamp}
              />
            ))}
            {isTyping && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="bg-card rounded-lg rounded-tl-none p-4 border border-border">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about your visa situation..."
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              className="bg-primary hover:bg-primary/90"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

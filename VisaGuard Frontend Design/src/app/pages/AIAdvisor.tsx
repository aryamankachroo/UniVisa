import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Send, Briefcase, Search, FileText } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { ChatBubble } from "../components/ChatBubble";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getAnswer } from "../UniVisaAdvisor";

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
    setTimeout(() => {
      const answer = getAnswer(text);
      const aiMessage: Message = {
        id: aiMsgId,
        message: answer,
        isAI: true,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 900);
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
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => handleNavigation("/dashboard", "dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeNav === "dashboard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigation("/ai-advisor", "ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeNav === "ai"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeNav === "profile"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => handleNavigation("/alerts", "alerts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeNav === "alerts"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Alerts</span>
            <span className="ml-auto bg-destructive/90 text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
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
        <div className="p-4 border-t border-white/40 dark:border-white/10">
          <div className="px-4 py-3">
            <div className="font-medium text-foreground">Riya Sharma</div>
            <div className="text-sm text-muted-foreground">Georgia Tech</div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
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
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                onClick={() => handleSendMessage(question)}
                className="px-4 py-2 rounded-xl text-sm bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
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
                <div className="glass bento rounded-2xl rounded-tl-none p-4 inline-block">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex-shrink-0 glass border-t border-white/60 dark:border-white/10 p-4 rounded-t-2xl mx-4 mb-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about your visa situation..."
              className="flex-1 rounded-xl border-white/60 bg-white/50 dark:bg-white/10"
            />
            <Button
              onClick={() => handleSendMessage()}
              className="bg-primary hover:bg-primary/90 rounded-xl px-5"
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

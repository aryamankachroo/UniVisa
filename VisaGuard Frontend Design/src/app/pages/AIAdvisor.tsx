import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Send } from "lucide-react";
import { ChatBubble } from "../components/ChatBubble";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { API_BASE, getStudentId } from "../lib/api";

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
    message: "Hi Riya! I'm your UniVisa AI advisor. I'm here to help you navigate F-1 visa compliance. I can answer questions about work authorization, travel, OPT/CPT, and more. All my responses are grounded in official USCIS policy documents.",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(2);
  const [chatStatus, setChatStatus] = useState<{ ok: boolean; gemini_configured: boolean } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch(`${API_BASE}/chat/status`)
      .then((r) => r.json())
      .then((data) => setChatStatus({ ok: true, gemini_configured: !!data?.gemini_configured }))
      .catch(() => setChatStatus({ ok: false, gemini_configured: false }));
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMsgId = nextIdRef.current++;
    const userMessage: Message = {
      id: userMsgId,
      message: text,
      isAI: false,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const aiMsgId = nextIdRef.current++;

    try {
      const studentId = getStudentId();
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, question: text }),
      });
      const data = await res.json().catch(() => ({}));
      let answer: string;
      if (res.ok) {
        const raw = data.answer;
        answer =
          typeof raw === "string" && raw.trim() !== ""
            ? raw.trim()
            : "No response.";
      } else {
        const detail = data.detail;
        if (typeof detail === "string") answer = detail;
        else if (Array.isArray(detail) && detail[0]?.msg) answer = detail.map((d: { msg?: string }) => d.msg).join(". ");
        else answer = "Could not reach the server. Is the backend running at " + API_BASE + "?";
      }
      const source =
        res.ok && Array.isArray(data.sources) && data.sources.length > 0
          ? data.sources.join(", ")
          : undefined;
      const aiMessage: Message = {
        id: aiMsgId,
        message: answer,
        isAI: true,
        source,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          message: "Could not reach the server at " + API_BASE + ". Make sure the backend is running.",
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
    <div className="flex h-screen min-h-0 overflow-hidden">
      {/* Glass sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col glass bento rounded-none border-r border-white/60 dark:border-white/10 rounded-r-2xl overflow-hidden">
        <div className="p-6 border-b border-white/40 dark:border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-family-heading)" }}>
              UniVisa
            </span>
          </Link>
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

      {/* Main: glass header + scroll area + glass input */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 glass border-b border-white/60 dark:border-white/10 px-6 py-5 rounded-b-2xl mx-4 mt-4 mb-0">
          <h1 className="text-xl font-semibold tracking-tight mb-1">AI Advisor</h1>
          <p className="text-sm text-muted-foreground">Ask me anything about F-1 visa compliance</p>
          {chatStatus && !chatStatus.ok && (
            <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              <strong>Backend not reachable.</strong> Start it from the project folder:{" "}
              <code className="bg-white/50 dark:bg-white/10 px-1.5 py-0.5 rounded">cd univisa-backend && ./run.sh</code> — then refresh.
            </div>
          )}
          {chatStatus?.ok && !chatStatus.gemini_configured && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-400">
              <strong>AI not configured.</strong> Add <code className="bg-white/50 dark:bg-white/10 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> to{" "}
              <code className="bg-white/50 dark:bg-white/10 px-1.5 py-0.5 rounded">univisa-backend/.env</code> (get a key at{" "}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">Google AI Studio</a>) and restart the backend.
            </div>
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

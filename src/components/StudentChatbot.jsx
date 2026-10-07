import { useState, useRef, useEffect } from "react";
import { ChatService } from "@/services/api";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  { icon: "📚", label: "Explain a concept" },
  { icon: "🗺️", label: "Navigate the portal" },
  { icon: "📝", label: "Practice questions" },
  { icon: "💡", label: "Study tips" },
];

export function StudentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;

    const userMsg = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      // Send only the last 20 messages (backend cap).
      // Truncate assistant messages to 800 chars to satisfy the backend
      // MAX_CONTENT_LENGTH limit — the full reply is still shown in the UI.
      const context = nextMessages.slice(-20).map((msg) =>
        msg.role === "assistant" && msg.content.length > 800
          ? { ...msg, content: msg.content.slice(0, 800) }
          : msg
      );
      const data = await ChatService.send(context);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Show greeting on first open
      setMessages([
        {
          role: "assistant",
          content: "Hi there! 👋 I'm your Xebia study assistant. Ask me anything about programming, your courses, or how to use the LMS!",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        aria-label="Open study bot"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6C1D5F 0%, #9B2D8F 100%)",
          boxShadow: "0 8px 32px rgba(108, 29, 95, 0.45)",
        }}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span>{isOpen ? "Close" : "Study Bot"}</span>
        {!isOpen && (
          <span
            className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
            title="Online"
          />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            width: "min(384px, calc(100vw - 24px))",
            height: "520px",
            background: "var(--bg-surface, #ffffff)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #6C1D5F 0%, #9B2D8F 100%)" }}
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm leading-tight">Xebia Study Bot</div>
              <div className="text-white/70 text-[11px]">AI Study Assistant</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="px-3 py-1.5 text-[10px] text-center shrink-0"
            style={{ background: "#fff8e7", color: "#92400e", borderBottom: "1px solid #fde68a" }}>
            ⚠️ Don&apos;t share passwords or sensitive personal information.
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white ${
                    msg.role === "user" ? "bg-purple-500" : "bg-[#6C1D5F]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "dark:bg-neutral-800 dark:text-white rounded-bl-sm"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #6C1D5F, #9B2D8F)" }
                      : { background: "#f3f4f6", color: "#1f2937" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white bg-[#6C1D5F]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm" style={{ background: "#f3f4f6" }}>
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {/* Suggestion chips (only when just the greeting is shown) */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.label)}
                    className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:scale-105 active:scale-95"
                    style={{
                      borderColor: "#6C1D5F",
                      color: "#6C1D5F",
                      background: "rgba(108,29,95,0.06)",
                    }}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-2 shrink-0 flex gap-2 items-end"
            style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              maxLength={800}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none border transition-colors disabled:opacity-50"
              style={{
                borderColor: "rgba(108,29,95,0.3)",
                background: "transparent",
                minHeight: "36px",
                maxHeight: "100px",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: "linear-gradient(135deg, #6C1D5F, #9B2D8F)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

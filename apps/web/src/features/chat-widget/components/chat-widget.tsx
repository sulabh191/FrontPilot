"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, SendHorizontal, X } from "lucide-react";
import { sendMessage } from "../lib/send-message";
import type { ChatMessage, WidgetConfig } from "../types";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

let nextId = 0;
const newId = () => `msg_${Date.now()}_${nextId++}`;

export function ChatWidget({ config }: { config: WidgetConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greeting", role: "assistant", content: config.greeting },
  ]);
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isReplying) return;

    const history: ChatMessage[] = [...messages, { id: newId(), role: "user", content: text }];
    setMessages(history);
    setInput("");
    setIsReplying(true);

    try {
      const reply = await sendMessage(config.tenantSlug, history);
      setMessages((current) => [...current, { id: newId(), role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: newId(), role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          aria-label={`Chat with ${config.agentName}`}
          className="flex h-[32rem] max-h-[calc(100vh-7rem)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{config.agentName}</p>
              <p className="text-xs text-indigo-100">{config.businessName} · Usually replies instantly</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 hover:bg-indigo-500"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isReplying && <TypingIndicator />}
            <div ref={listEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message…"
              aria-label="Message"
              maxLength={1000}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isReplying}
              aria-label="Send message"
              className="rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
          <p className="pb-2 text-center text-[10px] text-slate-400">Powered by FrontPilot</p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat" : `Chat with ${config.agentName}`}
        aria-expanded={isOpen}
        className="flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:scale-105 hover:bg-indigo-500"
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}

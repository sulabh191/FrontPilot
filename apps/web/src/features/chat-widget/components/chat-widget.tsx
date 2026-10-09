"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, SendHorizontal, X } from "lucide-react";
import { ChatRequestError, sendMessage } from "../lib/send-message";
import type { ChatMessage, WidgetConfig } from "../types";
import { MessageBubble } from "./message-bubble";
import { SuggestedQuestions } from "./suggested-questions";
import { TypingIndicator } from "./typing-indicator";

let nextId = 0;
const newId = () => `msg_${Date.now()}_${nextId++}`;

export function ChatWidget({ config }: { config: WidgetConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isWaitingForFirstWord, setIsWaitingForFirstWord] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    // The business's starter options are simply the greeting's suggestions.
    {
      id: "greeting",
      role: "assistant",
      content: config.greeting,
      suggestions: config.suggestedQuestions,
    },
  ]);
  // Set by the server after the first message; sent back with every later one.
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaitingForFirstWord]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Stop any reply in progress if the widget is removed from the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendText(input);
  }

  // Shared by the text box and the option buttons.
  async function sendText(rawText: string) {
    const text = rawText.trim();
    if (!text || isReplying) return;

    const history: ChatMessage[] = [...messages, { id: newId(), role: "user", content: text }];
    const replyId = newId();
    setMessages(history);
    setInput("");
    setIsReplying(true);
    setIsWaitingForFirstWord(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const updateReply = (update: (message: ChatMessage) => ChatMessage) =>
      setMessages((current) => current.map((m) => (m.id === replyId ? update(m) : m)));

    try {
      let started = false;
      await sendMessage(
        { tenantSlug: config.tenantSlug, conversationId, message: text },
        {
          onConversation: setConversationId,
          onText: (chunk) => {
            if (!started) {
              // First words arrived: swap the typing dots for a real message bubble.
              started = true;
              setIsWaitingForFirstWord(false);
              setMessages((current) => [
                ...current,
                { id: replyId, role: "assistant", content: chunk },
              ]);
            } else {
              updateReply((m) => ({ ...m, content: m.content + chunk }));
            }
          },
          onSuggestions: (options) => updateReply((m) => ({ ...m, suggestions: options })),
        },
        controller.signal,
      );
      if (!started) throw new Error("Empty reply");
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("[chat-widget]", error);
      const status = error instanceof ChatRequestError ? error.status : undefined;
      // 404: the conversation is gone (e.g. the database was reset), so start a fresh one next time.
      if (status === 404) setConversationId(undefined);
      setMessages((current) => [
        ...current.filter((m) => m.id !== replyId),
        { id: replyId, role: "assistant", content: errorMessage(status) },
      ]);
    } finally {
      setIsReplying(false);
      setIsWaitingForFirstWord(false);
    }
  }

  // Options are only offered under the latest agent message, and not while it is replying.
  const lastMessage = messages.at(-1);
  const currentOptions =
    !isReplying && lastMessage?.role === "assistant" ? (lastMessage.suggestions ?? []) : [];

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
              <p className="text-xs text-indigo-100">
                {config.businessName} · Usually replies instantly
              </p>
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
            {isWaitingForFirstWord && <TypingIndicator />}
            <SuggestedQuestions questions={currentOptions} onSelect={sendText} />
            <div ref={listEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 p-3"
          >
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

// What the visitor sees when a message can't be answered.
function errorMessage(status: number | undefined): string {
  if (status === 429) return "You're sending messages a little fast. Please wait a moment and try again.";
  if (status === 404) return "Sorry, I lost track of our chat. Please send your message again.";
  return "Sorry, I'm having trouble right now. Please try again, or call us directly.";
}

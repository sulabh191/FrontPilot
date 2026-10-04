import { cn } from "cn";
import type { ChatMessage } from "../types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "rounded-br-sm bg-indigo-600 text-white"
            : "rounded-bl-sm bg-slate-100 text-slate-900",
        )}
      >
        {message.content}
      </p>
    </div>
  );
}

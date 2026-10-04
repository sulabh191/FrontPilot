export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Assistant is typing">
      <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
        <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-slate-400" />
      </div>
    </div>
  );
}

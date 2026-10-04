// The chat shows plain text. If the model still writes Markdown,
// remove the most common marks so customers never see raw asterisks.
export function toPlainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replace(/__(.+?)__/g, "$1") // __bold__
    .replace(/^#{1,6}\s+/gm, "") // # headings
    .replace(/^\s*[-*]\s+/gm, "• "); // - list item → bullet
}

// Splits a document's text into small, focused chunks for embedding.
// Pure function: no database, no network, so it's easy to test.
//
// Strategy ("recursive" splitting, coarse to fine):
//   document → sections (Markdown headings) → paragraphs → sentences → words
// We only go finer when a piece is still too long, so chunks follow the
// document's own structure: one topic per chunk where possible.

export type Chunk = {
  index: number; // position in the document: 0, 1, 2…
  heading: string | null; // section path, e.g. "Services › Drain cleaning"
  content: string; // the chunk's text, never longer than maxChars
};

export type ChunkOptions = {
  maxChars: number; // hard limit per chunk
  overlapChars: number; // how much of the previous chunk to repeat at the start of the next
};

// ~800 characters ≈ 160 words ≈ 200 tokens: safely under MiniLM's 256-token limit,
// leaving room for the heading we prepend when embedding.
export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = { maxChars: 800, overlapChars: 100 };

export function chunkText(text: string, options: ChunkOptions = DEFAULT_CHUNK_OPTIONS): Chunk[] {
  // 1. Normalize line endings (Windows "\r\n", old Mac "\r") and surrounding whitespace.
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const chunks: Chunk[] = [];
  // 2. Sections by heading; 3. pieces that fit; 4. packed with overlap; 5. numbered.
  for (const section of splitIntoSections(normalized)) {
    const pieces = splitIntoPieces(section.body, options.maxChars);
    for (const content of packWithOverlap(pieces, options.maxChars, options.overlapChars)) {
      chunks.push({ index: chunks.length, heading: section.heading, content });
    }
  }
  return chunks;
}

// ---------- 2. Sections ----------

export type Section = { heading: string | null; body: string };

// "## Drain cleaning" → level 2, title "Drain cleaning". Needs a space after the #'s,
// so "#hashtag" is not a heading. Optional closing #'s ("## Title ##") are ignored.
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

export function splitIntoSections(text: string): Section[] {
  const sections: Section[] = [];
  const path: string[] = []; // current title per level: ["Services", "Drain cleaning"]
  let heading: string | null = null; // text before the first heading has no heading
  let lines: string[] = [];

  // Close the current section. Headings with no text under them produce nothing.
  const flush = () => {
    const body = lines.join("\n").trim();
    if (body) sections.push({ heading, body });
    lines = [];
  };

  for (const line of text.split("\n")) {
    const match = HEADING.exec(line);
    if (!match) {
      lines.push(line);
      continue;
    }
    flush();
    const level = match[1]!.length;
    // A level-2 heading replaces the previous level-2 one and drops anything deeper:
    // "Services › Drain cleaning" + "## Leak repair" → "Services › Leak repair".
    path.length = level - 1;
    path[level - 1] = match[2]!.trim();
    heading = path.filter(Boolean).join(" › "); // filter: skipped levels (# then ###) leave gaps
  }
  flush();
  return sections;
}

// ---------- 3. Pieces that each fit in maxChars ----------

export function splitIntoPieces(body: string, maxChars: number): string[] {
  return body
    .split(/\n\s*\n/) // paragraphs: separated by blank lines
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => {
      if (paragraph.length <= maxChars) return [paragraph];
      // Too long: split into sentences (after . ! or ?, keeping the punctuation).
      return paragraph
        .split(/(?<=[.!?])\s+/)
        .flatMap((sentence) =>
          sentence.length <= maxChars ? [sentence] : splitAtWords(sentence, maxChars),
        );
    });
}

// Last resort for a "sentence" longer than maxChars (e.g. a list with no full stops):
// cut at the last space before the limit, never in the middle of a word.
function splitAtWords(text: string, maxChars: number): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf(" ", maxChars);
    if (cut <= 0) cut = maxChars; // a single "word" longer than maxChars (e.g. a long URL): hard cut
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

// ---------- 4. Pack pieces into chunks, with overlap ----------

// Greedy packing: keep adding pieces while they fit. When a chunk is full, start the next
// one with the END of the previous chunk (overlap), so a fact on the boundary is still
// whole in one of them. The size limit always wins: no room → no overlap for that chunk.
export function packWithOverlap(
  pieces: string[],
  maxChars: number,
  overlapChars: number,
): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const piece of pieces) {
    if (!current) {
      current = piece;
    } else if (current.length + 1 + piece.length <= maxChars) {
      current += `\n${piece}`;
    } else {
      chunks.push(current);
      const overlap = tailAtWordBoundary(current, overlapChars);
      current =
        overlap && overlap.length + 1 + piece.length <= maxChars ? `${overlap}\n${piece}` : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// The last ~maxChars characters of `text`, starting at a word boundary (never mid-word).
function tailAtWordBoundary(text: string, maxChars: number): string {
  if (maxChars <= 0) return "";
  if (text.length <= maxChars) return text;
  const tail = text.slice(-maxChars);
  const firstSpace = tail.search(/\s/);
  return firstSpace === -1 ? "" : tail.slice(firstSpace + 1).trim();
}

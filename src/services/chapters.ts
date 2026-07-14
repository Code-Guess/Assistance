import type { TutorChapter } from "../schemas.js";

// Detects chapter-like headings: "Chapitre 3", "Chapter 3", "PARTIE II",
// or a numbered title on its own line ("3. Les fonctions").
const CHAPTER_PATTERN =
  /^(chapitre|chapter|partie|part)\s+\S+.{0,80}$|^\d+[.)]\s+.{2,80}$/gim;

export function detectChapters(text: string): TutorChapter[] {
  const matches = [...text.matchAll(CHAPTER_PATTERN)];

  if (matches.length === 0) {
    return [{ index: 0, title: "Introduction", start: 0, end: text.length }];
  }

  const chapters: TutorChapter[] = [];

  if (matches[0]!.index! > 0) {
    chapters.push({
      index: 0,
      title: "Introduction",
      start: 0,
      end: matches[0]!.index!,
    });
  }

  matches.forEach((match, i) => {
    const start = match.index!;
    const end =
      i + 1 < matches.length ? matches[i + 1]!.index! : text.length;
    chapters.push({
      index: chapters.length,
      title: match[0]!.trim().slice(0, 80),
      start,
      end,
    });
  });

  return chapters;
}

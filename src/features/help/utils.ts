import type { HelpTopic } from "./types";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[\u2014\u2013]\s*/g, "--")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getTopicIdFromHash(hash: string, topics: HelpTopic[]): string | null {
  if (!hash) return null;
  const clean = hash.replace(/^#/, "").trim().toLowerCase();
  if (!clean) return null;
  const match = topics.find((t) => t.id.toLowerCase() === clean);
  return match ? match.id : null;
}

export function searchTopics(query: string, topics: HelpTopic[]): HelpTopic[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const words = normalized.split(/\s+/).filter(Boolean);

  return topics.filter((topic) => {
    const fullText = `${topic.fullTitle} ${topic.searchIndex}`.toLowerCase();

    // Match exact phrase
    if (fullText.includes(normalized)) return true;

    // Match all whitespace-separated words
    if (words.length > 1 && words.every((w) => fullText.includes(w))) {
      return true;
    }

    return false;
  });
}

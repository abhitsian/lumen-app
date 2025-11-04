export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function extractExcerpt(text: string, maxLength: number = 200): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return truncateText(cleaned, maxLength);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

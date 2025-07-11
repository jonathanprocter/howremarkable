export function cleanEventTitle(title: string): string {
  if (!title) return '';

  return title
    .replace(/🔒\s*/g, '') // Remove lock symbols
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
    .replace(/[\u{2000}-\u{206F}]|[\u{2E00}-\u{2E7F}]|[\u{3000}-\u{303F}]/gu, '') // Remove special punctuation
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '') // Keep basic ASCII + Latin-1
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function cleanText(text: string): string {
  if (!text) return '';

  return text
    .replace(/🔒\s*/g, '')
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n\r]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean all text content in the DOM
export const cleanAllTextContent = () => {
  document.querySelectorAll('*').forEach(element => {
    if (element.textContent && element.children.length === 0) {
      const cleanedText = cleanText(element.textContent);
      if (cleanedText !== element.textContent) {
        element.textContent = cleanedText;
      }
    }
  });
};
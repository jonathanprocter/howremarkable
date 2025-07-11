export const cleanEventTitle = (title: string): string => {
  if (!title) return '';

  return title
    .replace(/🔒\s*/g, '') // Remove lock symbols
    .replace(/[\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove misc symbols
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove transport symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remove misc symbols
    .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
    .replace(/Ø=Ý/g, '') // Remove corrupted symbols
    .replace(/!•/g, '') // Remove broken navigation symbols
    .replace(/!•\s*/g, '') // Remove broken navigation symbols with spaces
    .replace(/Page \d+ of \d+/g, '') // Remove page numbers
    .replace(/Back to Weekly Overview/g, '') // Remove navigation text
    .replace(/Weekly Overview/g, '') // Remove navigation text
    .replace(/Sunday Tuesday/g, '') // Remove broken day text
    .replace(/[\u{2022}\u{2023}\u{2024}\u{2025}]/gu, '') // Remove bullet points
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

export function cleanAllEventTitles(events: any[]): any[] {
  return events.map(event => ({
    ...event,
    title: cleanEventTitle(event.title)
  }));
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
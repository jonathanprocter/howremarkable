export function cleanEventTitle(title: string): string {
  if (!title) return '';

  return title
    .replace(/🔒\s*/g, '') // Remove lock symbols
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove all emojis
    .replace(/[^\w\s\-\.\,\(\)\&]/g, '') // Remove special characters except basic punctuation and ampersand
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s*Appointment\s*$/i, ' Appointment') // Standardize appointment suffix
    .trim();
}

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

export const cleanText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/🔒\s*/g, '') // Remove lock symbol and following space
    .replace(/[\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remove misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Remove dingbats
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove more emoji ranges
    .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
    .replace(/Ø=Ý/g, '') // Remove more corrupted symbols
    .replace(/[!•]/g, '') // Remove exclamation and bullet points
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

export const cleanEventTitle = (title: string): string => {
  return cleanText(title);
};

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


export const cleanEventTitle = (title: string): string => {
  if (!title) return '';
  
  return title
    // Remove lock symbols and emoji
    .replace(/🔒\s*/g, '') // Remove lock symbol and following space
    .replace(/[\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove misc symbols
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Remove emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Remove transport symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remove misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Remove dingbats
    
    // Remove corrupted text symbols
    .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
    .replace(/Ø=Ý/g, '') // Remove corrupted symbols
    .replace(/Ø=/g, '') // Remove partial corrupted symbols
    .replace(/ÜÅ/g, '') // Remove remaining corrupted parts
    
    // Remove broken navigation elements
    .replace(/!•/g, '') // Remove broken navigation symbols
    .replace(/!•\s*/g, '') // Remove broken navigation symbols with spaces
    .replace(/Page \d+ of \d+/g, '') // Remove page numbers
    .replace(/Back to Weekly Overview/g, '') // Remove navigation text
    .replace(/Weekly Overview/g, '') // Remove navigation text
    .replace(/Sunday Tuesday/g, '') // Remove broken day text
    .replace(/←/g, '') // Remove arrow symbols
    .replace(/→/g, '') // Remove arrow symbols
    
    // Remove bullet points and list markers
    .replace(/[\u{2022}\u{2023}\u{2024}\u{2025}]/gu, '') // Remove bullet points
    .replace(/•/g, '') // Remove regular bullet
    .replace(/◦/g, '') // Remove hollow bullet
    .replace(/▪/g, '') // Remove square bullet
    .replace(/▫/g, '') // Remove hollow square bullet
    
    // Remove box drawing characters
    .replace(/[\u{2500}-\u{257F}]/gu, '') // Remove box drawing
    .replace(/[\u{2580}-\u{259F}]/gu, '') // Remove block elements
    
    // Clean up whitespace
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/^\s+|\s+$/g, '') // Trim
    .trim();
};

export const cleanAllEventTitles = (events: any[]): any[] => {
  return events.map(event => ({
    ...event,
    title: cleanEventTitle(event.title)
  }));
};

export const cleanDOMText = () => {
  // Clean up any remaining corrupted text in the DOM
  document.querySelectorAll('*').forEach(element => {
    if (element.textContent && (
      element.textContent.includes('Ø=ÜÅ') ||
      element.textContent.includes('!•') ||
      element.textContent.includes('🔒')
    )) {
      element.textContent = cleanEventTitle(element.textContent);
    }
  });
};

// Export for PDF functions
export const cleanTextForPDF = cleanEventTitle;

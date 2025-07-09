// Comprehensive title cleaning utility for all export functions
export const cleanEventTitle = (title: string): string => {
  if (!title) return 'Untitled Event';
  
  let cleanTitle = title;
  
  // Remove lock symbols and corrupted characters in all possible formats
  cleanTitle = cleanTitle.replace(/🔒\s*/g, ''); // Standard emoji
  cleanTitle = cleanTitle.replace(/[\uD83D\uDD12]/g, ''); // Unicode representation
  cleanTitle = cleanTitle.replace(/\uD83D\uDD12/g, ''); // Another Unicode format
  cleanTitle = cleanTitle.replace(/Ø=Ý/g, ''); // Corrupted encoding representation
  cleanTitle = cleanTitle.replace(/Ø=ÜÅ/g, ''); // New corrupted symbols
  cleanTitle = cleanTitle.replace(/[🔒]/g, ''); // Another format
  cleanTitle = cleanTitle.replace(/\u{1F512}/gu, ''); // Unicode escape sequence
  cleanTitle = cleanTitle.replace(/[!•]/g, ''); // Remove navigation symbols
  
  // Remove "Appointment" suffix
  cleanTitle = cleanTitle.replace(/\s*Appointment\s*$/i, '');
  
  // Remove extra whitespace and normalize
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
  
  // Handle case where title might be empty after cleaning
  if (!cleanTitle || cleanTitle === 'Appointment' || cleanTitle.trim() === '') {
    return 'Untitled Event';
  }
  
  return cleanTitle;
};

// Text cleaning for proper PDF display
export const cleanTextForPDF = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/🔒\s*/g, '') // Remove lock symbols
    .replace(/[\uD83D\uDD12]/g, '') // Unicode lock symbols
    .replace(/Ø=Ý/g, '') // Corrupted encoding
    .replace(/Ø=ÜÅ/g, '') // New corrupted symbols
    .replace(/[🔒]/g, '') // Standard lock emoji
    .replace(/\u{1F512}/gu, '') // Unicode escape
    .replace(/[!•]/g, '') // Remove navigation symbols
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};
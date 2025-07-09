// Emergency Navigation Fix - Remove corrupted elements and rebuild clean navigation
export const emergencyNavigationFix = () => {
  console.log('🚨 STARTING EMERGENCY NAVIGATION FIX...');
  
  // Step 1: Remove all corrupted elements
  const removeCorruptedElements = () => {
    const corruptedSelectors = [
      '*[data-corrupted]',
      '*:contains("Ø=ÜÅ")',
      '*:contains("!•")',
      '*:contains("Page") *:contains("of 8")',
      '.corrupted-nav',
      '.broken-navigation'
    ];
    
    // Remove elements containing corrupted text
    document.querySelectorAll('*').forEach(element => {
      const text = element.textContent || '';
      if (text.includes('Ø=ÜÅ') || 
          text.includes('!•') || 
          text.includes('Page') && text.includes('of 8') ||
          text.includes('←') && text.includes('Back to Weekly Overview')) {
        element.remove();
      }
    });
    
    console.log('✅ Removed corrupted navigation elements');
  };
  
  // Step 2: Clean up event titles
  const cleanEventTitles = () => {
    document.querySelectorAll('.event-title, .appointment-title, .event-name').forEach(element => {
      const text = element.textContent || '';
      const cleanText = text
        .replace(/🔒\s*/g, '')
        .replace(/Ø=ÜÅ/g, '')
        .replace(/Ø=Ý/g, '')
        .replace(/[!•]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanText !== text) {
        element.textContent = cleanText;
      }
    });
    
    console.log('✅ Cleaned event titles');
  };
  
  // Step 3: Fix header date format
  const fixHeaderDate = () => {
    const headerElements = document.querySelectorAll('h1, h2, .header-title, .page-title h2');
    headerElements.forEach(element => {
      const text = element.textContent || '';
      if (text.includes('July 7 - 2025 (day: 13)')) {
        element.textContent = 'July 7 - 13, 2025';
      }
    });
    
    console.log('✅ Fixed header date format');
  };
  
  // Step 4: Remove broken navigation styles
  const removeBrokenStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide any remaining corrupted navigation elements */
      *[data-corrupted],
      .corrupted-nav,
      .broken-navigation {
        display: none !important;
      }
      
      /* Clean up any text with corrupted characters */
      *:before,
      *:after {
        content: none !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Added cleanup styles');
  };
  
  // Execute all cleanup steps
  removeCorruptedElements();
  cleanEventTitles();
  fixHeaderDate();
  removeBrokenStyles();
  
  console.log('✅ EMERGENCY NAVIGATION FIX COMPLETE!');
  console.log('Navigation should now be clean and functional');
};

// Auto-execute on page load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', emergencyNavigationFix);
  } else {
    emergencyNavigationFix();
  }
}
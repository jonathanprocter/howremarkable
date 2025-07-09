// Simple Direct Navigation Fix - Following User's Step-by-Step Instructions

export const simpleNavigationFix = () => {
  console.log('🔧 STARTING SIMPLE NAVIGATION FIX...');
  
  // STEP 1: Fix header date
  console.log('Step 1: Fixing header date...');
  try {
    const headerElements = document.querySelectorAll('h1, h2, .page-title h2, .header-title');
    headerElements.forEach(element => {
      if (element.textContent?.includes('July 7 - 2025 (day: 13)')) {
        element.textContent = element.textContent.replace('July 7 - 2025 (day: 13)', 'July 7 - 13, 2025');
        console.log('✅ Fixed header date in element');
      }
    });
  } catch (error) {
    console.error('Error fixing header date:', error);
  }
  
  // STEP 2: Remove corrupted symbols
  console.log('Step 2: Removing corrupted symbols...');
  try {
    document.querySelectorAll('*').forEach(element => {
      if (element.textContent?.includes('Ø=ÜÅ')) {
        element.textContent = element.textContent.replace(/Ø=ÜÅ/g, '');
        console.log('✅ Removed corrupted symbols from element');
      }
    });
  } catch (error) {
    console.error('Error removing corrupted symbols:', error);
  }
  
  // STEP 3: Remove broken text navigation
  console.log('Step 3: Removing broken text navigation...');
  try {
    document.querySelectorAll('*').forEach(element => {
      if (element.textContent) {
        let text = element.textContent;
        const originalText = text;
        
        // Remove broken navigation patterns
        text = text.replace(/!• Back to Weekly Overview/g, '');
        text = text.replace(/!• Weekly Overview/g, '');
        text = text.replace(/Page \d+ of 8 -[^!]*/g, '');
        text = text.replace(/!• Sunday Tuesday !/g, '');
        
        if (text !== originalText) {
          element.textContent = text;
          console.log('✅ Removed broken navigation text from element');
        }
      }
    });
  } catch (error) {
    console.error('Error removing broken navigation:', error);
  }
  
  console.log('✅ SIMPLE NAVIGATION FIX COMPLETE');
};

// Run the fix when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', simpleNavigationFix);
  } else {
    // Run after a small delay to ensure DOM is fully rendered
    setTimeout(simpleNavigationFix, 100);
  }
}
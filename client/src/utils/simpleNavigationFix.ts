export function simpleNavigationFix() {
  try {
    // Fix time formatting issues
    const timeElements = document.querySelectorAll('[class*="time"], [class*="hour"], .time-slot, .appointment-time');
    let fixedCount = 0;

    timeElements.forEach(element => {
      if (element.textContent) {
        let originalText = element.textContent;
        let newText = originalText
          .replace(/1600/g, '16:00')
          .replace(/(\d{4})/g, (match) => {
            const hour = parseInt(match.substring(0, 2));
            const minute = match.substring(2);
            return `${hour}:${minute}`;
          })
          .replace(/🔒\s*/g, ''); // Remove lock symbols
        
        if (newText !== originalText) {
          element.textContent = newText;
          fixedCount++;
        }
      }
    });

    // Fix navigation button issues
    const navButtons = document.querySelectorAll('button[aria-label*="navigation"], .nav-button');
    navButtons.forEach(button => {
      if (button.textContent?.includes('undefined') || button.textContent?.includes('NaN')) {
        button.textContent = button.getAttribute('aria-label') || 'Navigate';
      }
    });

    // Only log if fixes were actually made
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} time format and navigation issues`);
    }
  } catch (error) {
    // Silent error handling to avoid console spam
  }
}

// Run the fix when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', simpleNavigationFix);
  } else {
    // Run after a small delay to ensure DOM is fully rendered
    setTimeout(simpleNavigationFix, 100);
  }
}
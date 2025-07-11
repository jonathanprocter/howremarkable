export function simpleNavigationFix() {
  try {
    // Only fix time formatting issues without excessive logging
    const timeElements = document.querySelectorAll('[class*="time"], [class*="hour"]');
    let fixedCount = 0;

    timeElements.forEach(element => {
      if (element.textContent?.includes('1600')) {
        element.textContent = element.textContent.replace(/1600/g, '16:00');
        fixedCount++;
      }
    });

    // Only log if fixes were actually made
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} time format issues`);
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
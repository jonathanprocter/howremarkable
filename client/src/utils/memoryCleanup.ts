export function performMemoryCleanup() {
  try {
    // Clear PDF export caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('pdf') || name.includes('export')) {
            caches.delete(name);
          }
        });
      });
    }

    // Clear large objects from memory
    const largeDivs = document.querySelectorAll('div[style*="display: none"]');
    largeDivs.forEach(div => {
      if (div.innerHTML.length > 10000) {
        div.innerHTML = '';
      }
    });

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    console.log('✅ Memory cleanup completed');
  } catch (error) {
    console.warn('Memory cleanup failed:', error);
  }
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(performMemoryCleanup, 5 * 60 * 1000);
}
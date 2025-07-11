export function performMemoryCleanup() {
  try {
    // Clear PDF export caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('pdf') || name.includes('export') || name.includes('calendar')) {
            caches.delete(name);
          }
        });
      });
    }

    // Clear large objects from memory
    const largeDivs = document.querySelectorAll('div[style*="display: none"]');
    largeDivs.forEach(div => {
      if (div.innerHTML.length > 5000) { // More aggressive threshold
        div.innerHTML = '';
      }
    });

    // Clear any temporary canvas elements
    const tempCanvases = document.querySelectorAll('canvas[data-temp="true"]');
    tempCanvases.forEach(canvas => canvas.remove());

    // Clear event listener cache if it exists
    if (window.eventListenerCache) {
      window.eventListenerCache.clear();
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Clean up any lingering PDF blobs
    if (window.pdfBlobCache) {
      window.pdfBlobCache.forEach(url => URL.revokeObjectURL(url));
      window.pdfBlobCache.clear();
    }

    console.log('✅ Enhanced memory cleanup completed');
  } catch (error) {
    console.warn('Memory cleanup failed:', error);
  }
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(performMemoryCleanup, 5 * 60 * 1000);
}
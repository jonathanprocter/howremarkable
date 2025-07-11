
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function cleanupEventListeners() {
  // Remove any lingering event listeners that might cause memory leaks
  const elements = document.querySelectorAll('[data-cleanup="true"]');
  elements.forEach(element => {
    element.removeAttribute('data-cleanup');
  });
}

export function optimizeForReMarkable() {
  // Optimize rendering for e-ink display
  document.body.style.setProperty('--scroll-behavior', 'auto');
  document.body.style.setProperty('--transition-duration', '0ms');
  
  // Disable animations that don't work well on e-ink
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      transition-duration: 0ms !important;
      animation-duration: 0ms !important;
    }
  `;
  document.head.appendChild(style);
}

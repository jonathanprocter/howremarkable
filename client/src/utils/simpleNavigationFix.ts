export const simpleNavigationFix = () => {
  console.log('🔧 STARTING SIMPLE NAVIGATION FIX...');

  try {
    // Remove corrupted navigation elements
    const elementsToRemove: Element[] = [];
    document.querySelectorAll('*').forEach(element => {
      const text = element.textContent || '';
      if (text.includes('Ø=') || text.includes('!•') || 
          (text.includes('Page') && text.includes('of 8')) ||
          text.includes('←') && text.includes('Back to Weekly Overview')) {
        elementsToRemove.push(element);
      }
    });

    elementsToRemove.forEach(el => el.remove());

    // Fix header date format safely
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.includes('July 7 - 2025 (day: 13)')) {
        textNodes.push(node as Text);
      }
    }

    textNodes.forEach(textNode => {
      textNode.textContent = textNode.textContent?.replace(
        /July 7 - 2025 \(day: 13\)/g, 
        'July 7 - 13, 2025'
      ) || '';
    });

    console.log('✅ SIMPLE NAVIGATION FIX COMPLETE');
  } catch (error) {
    console.error('Navigation fix error:', error);
  }
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
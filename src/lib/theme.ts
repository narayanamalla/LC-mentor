import { useLayoutEffect } from 'react';

/**
 * Custom React Hook to inject custom scrollbar styles and apply global Tailwind variables.
 */
export function useThemeInjector() {
  useLayoutEffect(() => {
    // Add modern Google Font to page head dynamically
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Apply global Font Family override
    document.body.style.fontFamily = "'Outfit', sans-serif";

    return () => {
      document.head.removeChild(link);
    };
  }, []);
}

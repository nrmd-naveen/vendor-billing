'use client';

import { useEffect } from 'react';

/**
 * Global component to sanitize input behaviors across the application.
 * Specifically prevents mouse wheel scrolling from changing values in numeric inputs.
 */
export default function InputBehavior() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // If the targeted element is a focused number input, prevent the scroll from changing its value
      if (
        document.activeElement instanceof HTMLInputElement &&
        document.activeElement.type === 'number'
      ) {
        // Blur briefly to stop the value change, or just preventDefault if it works reliably
        // preventDefault on wheel events can be tricky with passive listeners, 
        // but blurring is a safe and effective way to "lock" the value.
        document.activeElement.blur();
      }
    };

    // Add listener to window with capture to intercept before reaching the input
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return null;
}

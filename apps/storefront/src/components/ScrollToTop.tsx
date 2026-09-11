import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that whenever the route or page changes,
 * the viewport immediately jumps to the very top (front/header layer) of the new page,
 * completely preventing the issue where users land at the bottom/footer layer.
 * If an anchor hash is present (e.g. #tea-blog), it smoothly scrolls to that section.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      // Delay slightly so the target component has mounted into the DOM
      const timer = setTimeout(() => {
        const targetId = hash.replace(/^#/, '');
        const element = document.getElementById(targetId) || document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }

    // Temporarily disable CSS smooth scrolling so the jump to the top is instant and invisible
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
    html.scrollTop = 0;
    document.body.scrollTop = 0;

    // Re-enable original scroll behavior on the next frame
    const frame = requestAnimationFrame(() => {
      html.style.scrollBehavior = previousBehavior;
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, search, hash]);

  return null;
};

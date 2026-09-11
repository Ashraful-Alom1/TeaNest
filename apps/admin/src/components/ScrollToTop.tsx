import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that whenever the route or page changes in Admin,
 * the viewport immediately jumps to the very top,
 * preventing landing at the bottom or middle of tables/dashboards.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
};

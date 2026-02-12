// src/utils/useReveal.js
import { useEffect } from "react";

/**
 * Reveals elements (adds `.in-view`) when they enter the viewport.
 * Re-runs when `depsKey` changes so newly rendered nodes get animated too.
 *
 * Usage:
 *   useRevealOnScroll(
 *     '.reveal',
 *     { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
 *     `${articles.length}-${page}`   // <-- depsKey (string/number)
 *   )
 */
export function useRevealOnScroll(
  selector = ".reveal",
  { threshold = 0.1, rootMargin = "0px 0px -10% 0px" } = {},
  depsKey = null
) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(selector));

    // Fallback: if IntersectionObserver isn't supported, just reveal immediately
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        }
      },
      { threshold, rootMargin }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();

  }, [selector, threshold, rootMargin, depsKey]);
}
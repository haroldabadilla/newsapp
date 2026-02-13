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
  depsKey = null,
) {
  useEffect(() => {
    let io = null;

    // Small delay to ensure DOM elements are painted
    const timer = setTimeout(() => {
      const els = Array.from(document.querySelectorAll(selector));

      if (els.length === 0) {
        if (import.meta.env.DEV) {
          console.log(
            `[useRevealOnScroll] No elements found with selector "${selector}"`,
          );
        }
        return;
      }

      // Immediately reveal all newly rendered cards
      els.forEach((el) => {
        if (!el.classList.contains("in-view")) {
          el.classList.add("in-view");
        }
      });

      if (import.meta.env.DEV) {
        console.log(
          `[useRevealOnScroll] Found and revealed ${els.length} elements`,
        );
      }

      // Set up observer for cards that scroll into view (for future scrolling)
      if (!("IntersectionObserver" in window)) return;

      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (
              entry.isIntersecting &&
              !entry.target.classList.contains("in-view")
            ) {
              entry.target.classList.add("in-view");
            }
          }
        },
        { threshold, rootMargin },
      );

      els.forEach((el) => io.observe(el));
    }, 0);

    return () => {
      clearTimeout(timer);
      if (io) io.disconnect();
    };
  }, [selector, threshold, rootMargin, depsKey]);
}

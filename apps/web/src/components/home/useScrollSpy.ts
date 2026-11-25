import { useEffect, useState } from "react";

/**
 * Tracks which landing-page section is currently in view for the top bar and
 * mobile navigation drawer. Maintains the visible section set across observer
 * batches so short sections are not lost on fast scrolls, clears when back at
 * the top of the hero, and degrades to null when IntersectionObserver is absent.
 */
export function useScrollSpy(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sectionIds = idsKey ? idsKey.split(",") : [];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const visibleIds = new Set<string>();

    const updateActive = (): void => {
      if (window.scrollY < 80) {
        setActive(null);
        return;
      }

      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 24;
      if (atBottom) {
        setActive(sectionIds[sectionIds.length - 1] ?? null);
        return;
      }

      const firstVisible = sectionIds.find((id) => visibleIds.has(id));
      if (firstVisible) {
        setActive(firstVisible);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }
        updateActive();
      },
      { rootMargin: "-18% 0px -60% 0px", threshold: 0 },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    const onScroll = (): void => {
      if (window.scrollY < 80) {
        setActive(null);
        return;
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 24;
      if (atBottom) {
        setActive(sectionIds[sectionIds.length - 1] ?? null);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [idsKey]);

  return active;
}

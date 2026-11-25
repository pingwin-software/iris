import { useEffect, useState } from "react";

/**
 * Tracks which landing-page section is currently in view for the top bar and
 * mobile navigation drawer. Uses native CSS `scroll-target-group: auto`
 * (`:target-current`) when supported, falling back to an IntersectionObserver
 * that maintains the visible section set across observer batches, clears when
 * back at the top of the hero, and degrades to null when unavailable.
 */
export function useScrollSpy(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    const sectionIds = idsKey ? idsKey.split(",") : [];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const supportsScrollTargetGroup =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("scroll-target-group: auto");

    const applyBoundary = (): boolean => {
      if (window.scrollY < 80) {
        setActive(null);
        return true;
      }

      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 24;
      if (atBottom) {
        setActive(sectionIds[sectionIds.length - 1] ?? null);
        return true;
      }

      return false;
    };

    if (supportsScrollTargetGroup) {
      let forcedBottom = false;

      const syncFromTargetCurrent = (): void => {
        if (applyBoundary()) {
          forcedBottom = window.scrollY >= 80;
          return;
        }

        forcedBottom = false;
        let currentId: string | null;
        try {
          currentId =
            document
              .querySelector<HTMLAnchorElement>(".iris-home-spy-nav a:target-current")
              ?.getAttribute("href")
              ?.slice(1) || null;
        } catch {
          currentId = null;
        }
        setActive(currentId);
      };

      const onScroll = (): void => {
        if (applyBoundary()) {
          forcedBottom = window.scrollY >= 80;
          return;
        }

        if (forcedBottom) {
          forcedBottom = false;
          syncFromTargetCurrent();
        }
      };

      syncFromTargetCurrent();
      document.addEventListener("scrollend", syncFromTargetCurrent, { passive: true });
      window.addEventListener("scrollend", syncFromTargetCurrent, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        document.removeEventListener("scrollend", syncFromTargetCurrent);
        window.removeEventListener("scrollend", syncFromTargetCurrent);
        window.removeEventListener("scroll", onScroll);
      };
    }

    if (typeof IntersectionObserver === "undefined") return;

    const visibleIds = new Set<string>();

    const updateActive = (): void => {
      if (applyBoundary()) return;

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
      updateActive();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [idsKey]);

  return active;
}

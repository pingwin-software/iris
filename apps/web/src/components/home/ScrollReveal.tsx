import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

export interface UseInViewOnceOptions {
  threshold?: number | number[];
  rootMargin?: string;
}

const DEFAULT_THRESHOLD = 0.08;
const DEFAULT_ROOT_MARGIN = "0px 0px -6% 0px";

function shouldRevealImmediately(): boolean {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return true;
  }
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Observes `ref` until it intersects or moves above the viewport, locking to
 * `true` afterward so jump scrolls never leave content stuck invisible.
 */
export function useInViewOnce(
  ref: RefObject<HTMLElement | null>,
  options?: UseInViewOnceOptions,
): boolean {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);

  const [visible, setVisible] = useState<boolean>(shouldRevealImmediately);

  useLayoutEffect(() => {
    if (visible) return;
    const element = ref.current;
    if (!element) return;

    if (shouldRevealImmediately()) {
      setVisible(true);
      return;
    }

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    if (viewportHeight > 0 && element.getBoundingClientRect().top < viewportHeight * 0.96) {
      setVisible(true);
    }
  }, [ref, visible]);

  useEffect(() => {
    if (visible) return;
    const element = ref.current;
    if (!element) return;

    if (shouldRevealImmediately()) {
      setVisible(true);
      return;
    }

    let revealed = false;
    let rafId = 0;

    const reveal = (): void => {
      if (revealed) return;
      revealed = true;
      observer.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      setVisible(true);
    };

    const checkPosition = (): void => {
      rafId = 0;
      if (revealed) return;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      if (viewportHeight > 0 && element.getBoundingClientRect().top < viewportHeight * 0.96) {
        reveal();
      }
    };

    const scheduleCheck = (): void => {
      if (revealed || rafId !== 0) return;
      rafId = window.requestAnimationFrame(checkPosition);
    };

    const parsedThreshold = thresholdKey.includes(",")
      ? thresholdKey.split(",").map(Number)
      : Number(thresholdKey);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const rootTop = entry.rootBounds?.top ?? 0;
          if (entry.isIntersecting || entry.boundingClientRect.top <= rootTop) {
            reveal();
            break;
          }
        }
      },
      { threshold: parsedThreshold, rootMargin },
    );

    observer.observe(element);
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    checkPosition();

    return () => {
      revealed = true;
      observer.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [ref, visible, thresholdKey, rootMargin]);

  return visible;
}

export type ScrollRevealElement = "div" | "li" | "article";
export type ScrollRevealVariant = "up" | "scale" | "fade";

export interface ScrollRevealProps {
  as?: ScrollRevealElement;
  delay?: number;
  variant?: ScrollRevealVariant;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Reveals below-the-fold landing page blocks once as they enter the viewport.
 */
export function ScrollReveal({
  as = "div",
  delay = 0,
  variant = "up",
  className,
  style,
  children,
}: ScrollRevealProps): React.JSX.Element {
  const ref = useRef<HTMLElement | null>(null);
  const visible = useInViewOnce(ref);
  const setElementRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={setElementRef}
      data-reveal={visible ? "shown" : "hidden"}
      data-reveal-variant={variant}
      className={cn("iris-reveal", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

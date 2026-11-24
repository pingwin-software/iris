import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FontScaleContext } from "@/contexts/FontScaleContext";
import {
  applyFontScale,
  persistFontScale,
  readStoredFontScale,
} from "@/lib/font-scale";
import { setOverlayContainer } from "@/lib/overlay-container";

const DOCUMENT_SCROLL_ATTRIBUTE = "data-iris-document-scroll";

function isDocumentScrollActive(): boolean {
  const value = document.documentElement.getAttribute(DOCUMENT_SCROLL_ATTRIBUTE);
  return value !== null && value !== "false";
}

interface FontScaleProviderProps {
  children: React.ReactNode;
}

export function FontScaleProvider({
  children,
}: FontScaleProviderProps): React.JSX.Element {
  const [scale, setScaleState] = useState(() => readStoredFontScale());
  const scaleRootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const syncScale = (): void => {
      applyFontScale(
        scale,
        scaleRootRef.current,
        isDocumentScrollActive() ? { suspend: true } : undefined,
      );
    };

    syncScale();

    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      syncScale();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [DOCUMENT_SCROLL_ATTRIBUTE],
    });
    return () => {
      observer.disconnect();
    };
  }, [scale]);

  const setScale = useCallback((next: number) => {
    setScaleState(next);
    persistFontScale(next);
  }, []);

  const value = useMemo(() => ({ scale, setScale }), [scale, setScale]);

  return (
    <FontScaleContext.Provider value={value}>
      <div ref={scaleRootRef} data-iris-scale-root="">
        {children}
        {/* In-tree portal target so Radix overlays scale with the app and
            Floating UI can position them against their triggers. */}
        <div ref={setOverlayContainer} data-iris-overlay-root="" />
      </div>
    </FontScaleContext.Provider>
  );
}

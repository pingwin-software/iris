import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Link, Navigate, NavLink, useLocation, useParams } from "react-router-dom";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { IrisMark } from "@/components/brand/IrisMark";
import { useScrollSpy } from "@/components/home/useScrollSpy";
import "@/components/home/home.css";
import { APP_VERSION } from "@/lib/app-version";
import { loginEntryPath } from "@/lib/organization-login";
import { cn } from "@/lib/utils";
import {
  findRegulationDoc,
  headingId,
  REGULATION_DOCS,
  REGULATIONS_BASE_PATH,
  regulationDocPath,
  resolveRegulationHref,
} from "@/lib/regulations/documents";

/**
 * The public regulations wiki (/home/propisi, /home/propisi/:slug): what
 * Serbian law requires for e-invoices (SEF), e-dispatch notes and fiscal
 * receipts, for organizations using or considering Iris. It renders the
 * Markdown kept in docs/drzavne-integracije (see lib/regulations/documents.ts),
 * is reachable signed out, needs no API call and, like the landing page, is
 * Serbian only.
 */

interface TocHeading {
  id: string;
  text: string;
}

function stripInlineMarkdown(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+#+\s*$/, "")
    .trim();
}

function extractTocHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^(```|~~~)/.test(line.trimStart())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^##\s+(.+)$/.exec(line);
    if (!match) continue;
    const text = stripInlineMarkdown(match[1]);
    if (!text) continue;
    headings.push({ id: headingId(text), text });
  }

  return headings;
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function scrollIntoViewAndWait(
  element: HTMLElement,
  options: ScrollIntoViewOptions,
): { promise: Promise<void>; cancel: () => void } {
  const result = element.scrollIntoView?.(options) as unknown;
  if (result instanceof Promise) {
    return { promise: result, cancel: () => {} };
  }

  if (
    options.behavior !== "smooth" ||
    typeof element.scrollIntoView !== "function" ||
    typeof window === "undefined" ||
    typeof window.addEventListener !== "function"
  ) {
    return { promise: Promise.resolve(), cancel: () => {} };
  }

  let cleanup = (): void => {};
  const promise = new Promise<void>((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = (shouldResolve: boolean): void => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("scroll", onScroll);
      if (shouldResolve) resolve();
    };

    const onScrollEnd = (): void => finish(true);
    const onScroll = (): void => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => finish(true), 100);
    };

    cleanup = () => finish(false);
    window.addEventListener("scrollend", onScrollEnd, { once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    timeoutId = setTimeout(() => finish(true), 100);
  });

  return { promise, cancel: cleanup };
}

function useHeadingScrollPosition(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    const sectionIds = idsKey ? idsKey.split(",") : [];
    let rafId: number | null = null;

    const computeActive = (): void => {
      rafId = null;
      if (sectionIds.length === 0 || window.scrollY < 80) {
        setActiveId(null);
        return;
      }

      const docEl = document.documentElement;
      if (
        docEl.scrollHeight > window.innerHeight &&
        window.innerHeight + window.scrollY >= docEl.scrollHeight - 24
      ) {
        setActiveId(sectionIds[sectionIds.length - 1] ?? null);
        return;
      }

      // 68px fixed header + 80px reading zone (accommodates 5rem scroll-padding + scroll-mt-6 = 104px)
      const threshold = 148;
      let current: string | null = sectionIds[0] ?? null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          current = id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const scheduleUpdate = (): void => {
      if (rafId !== null) return;
      if (typeof window.requestAnimationFrame === "function") {
        rafId = window.requestAnimationFrame(computeActive);
      } else {
        computeActive();
      }
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("scrollend", scheduleUpdate, { passive: true });
    return () => {
      if (rafId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("scrollend", scheduleUpdate);
    };
  }, [idsKey]);

  return activeId;
}

function heading(level: 2 | 3 | 4) {
  const Tag = `h${level}` as const;
  const style = {
    2: "mt-12 border-t border-[var(--home-border)]/80 pt-8 text-[clamp(1.35rem,2.2vw,1.65rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[var(--home-ink)] first:mt-0 first:border-t-0 first:pt-0",
    3: "mt-8 text-[1.125rem] font-semibold tracking-[-0.015em] text-[var(--home-ink)]",
    4: "mt-6 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)]",
  }[level];
  return function Heading({ children }: { children?: ReactNode }): React.JSX.Element {
    return (
      <Tag
        id={headingId(textOf(Children.toArray(children)))}
        tabIndex={-1}
        className={cn("scroll-mt-6 outline-none", style)}
      >
        {children}
      </Tag>
    );
  };
}

const MARKDOWN_COMPONENTS: Components = {
  h1: heading(2),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  p: ({ children }) => (
    <p className="mt-3.5 text-[length:var(--home-text-body)] leading-[1.7] text-[var(--home-ink-muted)]">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mt-3.5 list-disc space-y-1.5 pl-5 text-[length:var(--home-text-body)] leading-[1.7] text-[var(--home-ink-muted)] [&_ul]:mt-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3.5 list-decimal space-y-1.5 pl-5 text-[length:var(--home-text-body)] leading-[1.7] text-[var(--home-ink-muted)] [&_ul]:mt-1.5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 [&>p]:mt-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[var(--home-ink)]">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-5 rounded-xl border-l-[3px] border-[var(--home-accent)] bg-[var(--home-surface)] px-5 py-4 shadow-[0_2px_12px_-6px_rgba(17,18,21,0.06)] ring-1 ring-[#111215]/[0.08] [&>p]:mt-0 [&>p]:text-[length:var(--home-text-sm)] [&>p]:leading-[1.65]">
      {children}
    </blockquote>
  ),
  a: ({ href = "", children }) => {
    const target = resolveRegulationHref(href);
    const className =
      "iris-focusable font-medium text-[var(--home-ink)] underline decoration-[var(--home-border-strong)] underline-offset-2 transition-[color,text-decoration-color] duration-150 hover:text-[var(--home-accent-ink)] hover:decoration-[var(--home-accent-ink)]";
    if (target.startsWith("/")) {
      return (
        <Link to={target} className={className}>
          {children}
        </Link>
      );
    }
    const external = /^https?:\/\//.test(target);
    return (
      <a
        href={target}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div
      tabIndex={0}
      role="region"
      aria-label="Tabela"
      className="iris-focusable mt-6 overflow-x-auto rounded-xl bg-[var(--home-surface)] shadow-[0_6px_24px_-12px_rgba(17,18,21,0.08)] ring-1 ring-[#111215]/[0.08]"
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-[length:var(--home-text-sm)] leading-[1.55]">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-[var(--home-surface-recessed)]/80 px-4 py-3 align-bottom text-[length:var(--home-text-sm)] font-semibold text-[var(--home-ink)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-[var(--home-border)]/60 px-4 py-3 align-top text-[length:var(--home-text-sm)] leading-[1.6] text-[var(--home-ink-muted)] tnum">
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code className="break-words rounded bg-[var(--home-surface-recessed)] px-1.5 py-0.5 font-mono text-[length:var(--home-text-sm)] text-[var(--home-ink)]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mt-5 max-w-full overflow-x-auto rounded-xl bg-[var(--home-surface)] p-4 text-[length:var(--home-text-sm)] leading-[1.55] text-[var(--home-ink)] ring-1 ring-[#111215]/[0.08] [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="mt-10 border-[var(--home-border)]" />,
};

export default function RegulationsPage(): React.JSX.Element {
  const { slug } = useParams();
  const { hash } = useLocation();
  const doc = findRegulationDoc(slug);

  const tocHeadings = useMemo(
    () => (doc ? extractTocHeadings(doc.markdown) : []),
    [doc],
  );
  const tocIds = useMemo(
    () => tocHeadings.map((item) => item.id),
    [tocHeadings],
  );

  const scrollRequestIdRef = useRef(0);
  const cancelPendingScrollRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-iris-document-scroll", "true");
    return () => {
      document.documentElement.removeAttribute("data-iris-document-scroll");
    };
  }, []);

  useEffect(() => {
    return () => {
      scrollRequestIdRef.current += 1;
      cancelPendingScrollRef.current?.();
      cancelPendingScrollRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!doc) return;
    const previousTitle = document.title;
    document.title = `${doc.title} · Iris`;
    let fragmentId: string | null = null;
    if (hash) {
      try {
        fragmentId = decodeURIComponent(hash.slice(1));
      } catch {
        fragmentId = null;
      }
    }
    const target = fragmentId ? document.getElementById(fragmentId) : null;
    if (target) {
      target.scrollIntoView?.();
    } else {
      try {
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch {
        // jsdom does not implement window.scrollTo
      }
    }
    return () => {
      document.title = previousTitle;
    };
  }, [doc, hash]);

  // Invoked after the doc/hash scroll effect so initial scrollY=0 is already applied.
  const spyActiveId = useScrollSpy(tocIds);
  const scrollPositionId = useHeadingScrollPosition(tocIds);

  const handleTocClick = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>, targetId: string): Promise<void> => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      event.preventDefault();
      const target = document.getElementById(targetId);
      if (!target) return;

      if (typeof window.history?.replaceState === "function") {
        try {
          window.history.replaceState(null, "", `#${targetId}`);
        } catch {
          // Ignore restricted history state errors.
        }
      }

      const prefersReduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      cancelPendingScrollRef.current?.();
      const scrollId = ++scrollRequestIdRef.current;

      const { promise, cancel } = scrollIntoViewAndWait(target, {
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
      cancelPendingScrollRef.current = cancel;

      await promise;

      if (scrollId !== scrollRequestIdRef.current) return;
      cancelPendingScrollRef.current = null;
      target.focus?.({ preventScroll: true });
    },
    [],
  );

  if (!doc) return <Navigate to={REGULATIONS_BASE_PATH} replace />;

  const docIndex = REGULATION_DOCS.indexOf(doc);
  const prevDoc = docIndex > 0 ? REGULATION_DOCS[docIndex - 1] : undefined;
  const nextDoc = docIndex < REGULATION_DOCS.length - 1 ? REGULATION_DOCS[docIndex + 1] : undefined;
  const candidateTocId = scrollPositionId ?? spyActiveId;
  const currentTocId =
    (candidateTocId && tocIds.includes(candidateTocId) ? candidateTocId : null) ??
    tocHeadings[0]?.id ??
    null;
  const loginHref = loginEntryPath();

  return (
    <div className="iris-home-theme flex min-h-dvh flex-col overflow-x-clip bg-[var(--home-bg)] text-[var(--home-ink)]">
      <a
        href="#sadrzaj"
        className="iris-focusable sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--home-ink)] focus:px-4 focus:py-2.5 focus:text-[length:var(--home-text-sm)] focus:font-semibold focus:text-[#FFFFFF]"
      >
        Preskoči na sadržaj
      </a>

      <header className="fixed inset-x-0 top-0 z-40 h-[4.25rem] border-b border-[var(--home-border)] bg-[#F6F5F1]/95 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-2 px-3.5 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <Link
              to="/home"
              className="iris-focusable inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg py-1 text-[var(--home-ink)] sm:min-h-[36px] sm:gap-2.5"
            >
              <IrisMark className="h-7 w-7" aria-hidden />
              <span className="home-wordmark text-[1.375rem] font-bold tracking-[-0.03em]">Iris</span>
            </Link>
            <span aria-hidden="true" className="select-none text-[1.125rem] font-light text-[var(--home-border-strong)]">
              /
            </span>
            <Link
              to={REGULATIONS_BASE_PATH}
              className="iris-focusable inline-flex min-h-[44px] items-center rounded-md px-1.5 text-[length:var(--home-text-sm)] font-semibold text-[var(--home-ink)] transition-[color] duration-150 hover:text-[var(--home-accent-ink)] sm:min-h-[36px]"
            >
              Propisi
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              to="/home"
              className="iris-focusable inline-flex min-h-[44px] items-center gap-1 rounded-lg px-1.5 py-2 text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)] sm:min-h-[36px] sm:gap-1.5 sm:px-2.5"
            >
              <ArrowLeft aria-hidden className="h-4 w-4 shrink-0" />
              Početna
            </Link>
            <Link
              to={loginHref}
              className="iris-focusable iris-home-btn inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-3 py-2 text-[length:var(--home-text-sm)] font-semibold text-[#FFFFFF] hover:bg-[var(--home-btn-hover,#252830)] active:translate-y-px sm:min-h-[36px] sm:px-4"
            >
              Prijava
              <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </header>

      <div className="min-w-0 flex-1 pt-[4.25rem] lg:grid lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)_248px]">
        <aside className="min-w-0 px-5 pt-5 sm:px-8 lg:border-r lg:border-[var(--home-border)] lg:bg-[#F3F1EC] lg:p-0">
          <div className="lg:sticky lg:top-[4.25rem] lg:max-h-[calc(100dvh-4.25rem)] lg:overflow-y-auto lg:px-4 lg:py-7">
            <nav
              aria-label="Propisi"
              className="min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)]/80 p-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
            >
              <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--home-ink-muted)] lg:mb-3 lg:px-3">
                Poglavlja
              </div>
              <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
                {REGULATION_DOCS.map((item, index) => (
                  <li key={item.file}>
                    <NavLink
                      to={regulationDocPath(item)}
                      end
                      className={({ isActive }) =>
                        cn(
                          "iris-focusable relative inline-flex min-h-[40px] items-center gap-2 rounded-md px-3 py-2 text-[length:var(--home-text-sm)] leading-[1.35] transition-[color,background-color] duration-150 lg:flex lg:min-h-[36px] lg:w-full",
                          isActive
                            ? "bg-[var(--home-surface)] font-semibold text-[var(--home-ink)] ring-1 ring-[#111215]/10"
                            : "bg-[var(--home-surface-recessed)]/70 font-medium text-[var(--home-ink-muted)] hover:bg-[var(--home-surface)]/80 hover:text-[var(--home-ink)] lg:bg-transparent",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute bottom-1.5 left-0 top-1.5 hidden w-[2px] rounded-full bg-[var(--home-accent)] transition-opacity duration-150 lg:block",
                              isActive ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span
                            aria-hidden="true"
                            className={cn(
                              "tnum shrink-0 font-mono text-[0.75rem]",
                              isActive ? "text-[var(--home-accent-ink)]" : "text-[var(--home-ink-subtle)]",
                            )}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="lg:whitespace-nowrap">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <main id="sadrzaj" tabIndex={-1} className="min-w-0 outline-none">
          <div className="mx-auto w-full min-w-0 max-w-[78ch] px-5 pb-16 pt-6 sm:px-8 lg:px-12 lg:py-8">
            <div className="border-b border-[var(--home-border)] pb-6">
              <p className="tnum text-[length:var(--home-text-sm)] font-medium text-[var(--home-accent-ink)]">
                Vodič kroz propise · Poglavlje {docIndex + 1} od {REGULATION_DOCS.length}
              </p>
              <h1 className="mt-2.5 text-[clamp(1.65rem,2.8vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.025em] text-[var(--home-ink)] [text-wrap:balance]">
                {doc.title}
              </h1>
            </div>

            {tocHeadings.length >= 2 && (
              <details className="group mt-6 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)]/80 xl:hidden">
                <summary className="iris-focusable flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[length:var(--home-text-sm)] font-semibold text-[var(--home-ink)] [&::-webkit-details-marker]:hidden">
                  <span>Na ovoj stranici</span>
                  <ChevronDown
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-[var(--home-ink-muted)] transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <ul className="space-y-0.5 border-t border-[var(--home-border)] px-3 py-2.5">
                  {tocHeadings.map((item) => {
                    const isCurrent = currentTocId === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          aria-current={isCurrent ? "location" : undefined}
                          onClick={(event) => void handleTocClick(event, item.id)}
                          className={cn(
                            "iris-focusable flex min-h-[40px] items-center rounded-md px-2.5 py-2 text-[length:var(--home-text-sm)] leading-[1.4] transition-[color,background-color] duration-150",
                            isCurrent
                              ? "bg-[var(--home-surface-recessed)]/80 font-medium text-[var(--home-ink)]"
                              : "text-[var(--home-ink-muted)] hover:bg-[var(--home-surface-recessed)]/50 hover:text-[var(--home-ink)]",
                          )}
                        >
                          {item.text}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}

            <article className="mt-6 min-w-0 xl:mt-8 [&>*:first-child]:mt-0">
              <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {doc.markdown}
              </Markdown>
            </article>

            {(prevDoc || nextDoc) && (
              <nav
                aria-label="Prethodno i sledeće poglavlje"
                className="mt-14 grid gap-4 border-t border-[var(--home-border)] pt-8 sm:grid-cols-2"
              >
                {prevDoc ? (
                  <Link
                    to={regulationDocPath(prevDoc)}
                    className="iris-focusable group flex flex-col justify-between rounded-xl bg-[var(--home-surface)] p-5 shadow-[0_2px_12px_-6px_rgba(17,18,21,0.06)] ring-1 ring-[#111215]/[0.08] transition-[box-shadow,color] duration-150 hover:shadow-[0_6px_20px_-8px_rgba(17,18,21,0.12)]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)]">
                      <ArrowLeft
                        aria-hidden
                        className="h-4 w-4 shrink-0 transition-[transform] duration-150 group-hover:-translate-x-0.5 motion-reduce:transition-none"
                      />
                      Prethodno poglavlje
                    </span>
                    <span className="home-display mt-2 text-[length:var(--home-text-body)] font-semibold tracking-[-0.015em] text-[var(--home-ink)] group-hover:text-[var(--home-accent-ink)]">
                      {prevDoc.label}
                    </span>
                  </Link>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {nextDoc && (
                  <Link
                    to={regulationDocPath(nextDoc)}
                    className="iris-focusable group flex flex-col justify-between rounded-xl bg-[var(--home-surface)] p-5 shadow-[0_2px_12px_-6px_rgba(17,18,21,0.06)] ring-1 ring-[#111215]/[0.08] transition-[box-shadow,color] duration-150 hover:shadow-[0_6px_20px_-8px_rgba(17,18,21,0.12)] sm:items-end sm:text-right"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)]">
                      Sledeće poglavlje
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 transition-[transform] duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      />
                    </span>
                    <span className="home-display mt-2 text-[length:var(--home-text-body)] font-semibold tracking-[-0.015em] text-[var(--home-ink)] group-hover:text-[var(--home-accent-ink)]">
                      {nextDoc.label}
                    </span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </main>

        <div className="hidden min-w-0 xl:block">
          {tocHeadings.length >= 2 && (
            <nav
              aria-label="Na ovoj stranici"
              data-spy-active="true"
              className="iris-home-spy-nav sticky top-[4.25rem] max-h-[calc(100dvh-4.25rem)] overflow-y-auto px-6 py-7"
            >
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--home-ink-muted)]">
                Na ovoj stranici
              </div>
              <ul className="space-y-0.5 border-l border-[var(--home-border)]">
                {tocHeadings.map((item) => {
                  const isCurrent = currentTocId === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        aria-current={isCurrent ? "location" : undefined}
                        onClick={(event) => void handleTocClick(event, item.id)}
                        className={cn(
                          "iris-focusable iris-wiki-toc-link -ml-px block border-l-2 py-1.5 pl-3.5 text-[0.8125rem] leading-[1.45]",
                          isCurrent
                            ? "border-[var(--home-accent)] font-medium text-[var(--home-ink)]"
                            : "border-transparent font-normal text-[var(--home-ink-muted)] hover:border-[var(--home-border-strong)] hover:text-[var(--home-ink)]",
                        )}
                      >
                        {item.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <footer className="iris-home-carbon w-full shrink-0 bg-[#101216] text-[var(--home-ink)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-10 px-5 py-12 sm:px-8 md:flex-row md:items-start lg:px-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-[var(--home-ink)]">
              <IrisMark className="h-7 w-7" aria-hidden />
              <span className="home-wordmark text-[1.25rem] font-bold tracking-[-0.03em]">Iris</span>
            </div>
            <p className="mt-3 text-[length:var(--home-text-sm)] leading-[1.6] text-[var(--home-ink-muted)]">
              Radni nalozi, magacin, procesi i planiranje za proizvodnju i usluge.
            </p>
            <p className="mt-3 text-[length:var(--home-text-sm)] text-[var(--home-ink-subtle)] tnum">
              Verzija {APP_VERSION}
            </p>
          </div>

          <nav aria-label="Podnožje" className="grid grid-cols-2 gap-x-12 gap-y-2 sm:gap-x-16">
            <ul className="space-y-1.5 text-[length:var(--home-text-sm)]">
              {REGULATION_DOCS.map((item) => (
                <li key={item.file}>
                  <Link
                    to={regulationDocPath(item)}
                    className="iris-focusable inline-block py-1 text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="space-y-1.5 text-[length:var(--home-text-sm)]">
              <li>
                <Link
                  to="/home"
                  className="iris-focusable inline-block py-1 text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)]"
                >
                  Početna
                </Link>
              </li>
              <li>
                <Link
                  to={loginHref}
                  className="iris-focusable inline-block py-1 font-semibold text-[var(--home-ink)] underline-offset-4 transition-[color] duration-150 hover:text-[var(--home-accent-ink)] hover:underline"
                >
                  Prijava
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}

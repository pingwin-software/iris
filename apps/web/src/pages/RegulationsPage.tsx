import { Children, isValidElement, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, Navigate, NavLink, useLocation, useParams } from "react-router-dom";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IrisMark } from "@/components/brand/IrisMark";
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
 * The public regulations guide (/home/propisi, /home/propisi/:slug): what
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

function heading(level: 2 | 3 | 4) {
  const Tag = `h${level}` as const;
  const style = {
    2: "mt-12 border-t border-[var(--home-border)]/80 pt-8 text-[clamp(1.35rem,2.2vw,1.65rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[var(--home-ink)] first:mt-0 first:border-t-0 first:pt-0",
    3: "mt-8 text-[1.125rem] font-semibold tracking-[-0.015em] text-[var(--home-ink)]",
    4: "mt-6 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)]",
  }[level];
  return function Heading({ children }: { children?: ReactNode }): React.JSX.Element {
    return (
      <Tag id={headingId(textOf(Children.toArray(children)))} className={cn("scroll-mt-24", style)}>
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
    <div className="mt-6 overflow-x-auto rounded-xl bg-[var(--home-surface)] shadow-[0_6px_24px_-12px_rgba(17,18,21,0.08)] ring-1 ring-[#111215]/[0.08]">
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
    <pre className="mt-5 overflow-x-auto rounded-xl bg-[var(--home-surface)] p-4 text-[length:var(--home-text-sm)] leading-[1.55] text-[var(--home-ink)] ring-1 ring-[#111215]/[0.08] [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="mt-10 border-[var(--home-border)]" />,
};

export default function RegulationsPage(): React.JSX.Element {
  const { slug } = useParams();
  const { hash } = useLocation();
  const doc = findRegulationDoc(slug);
  const [scrolled, setScrolled] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-iris-document-scroll", "true");
    return () => {
      document.documentElement.removeAttribute("data-iris-document-scroll");
    };
  }, []);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      target.scrollIntoView();
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

  if (!doc) return <Navigate to={REGULATIONS_BASE_PATH} replace />;

  const docIndex = REGULATION_DOCS.indexOf(doc);
  const prevDoc = docIndex > 0 ? REGULATION_DOCS[docIndex - 1] : undefined;
  const nextDoc = docIndex < REGULATION_DOCS.length - 1 ? REGULATION_DOCS[docIndex + 1] : undefined;
  const tocHeadings = extractTocHeadings(doc.markdown);
  const loginHref = loginEntryPath();

  return (
    <div className="iris-home-theme min-h-dvh overflow-x-clip bg-[var(--home-bg)] text-[var(--home-ink)]">
      <a
        href="#sadrzaj"
        className="iris-focusable sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--home-ink)] focus:px-4 focus:py-2.5 focus:text-[length:var(--home-text-sm)] focus:font-semibold focus:text-[#FFFFFF]"
      >
        Preskoči na sadržaj
      </a>

      <header
        className={cn(
          "iris-home-header fixed inset-x-0 top-0 z-40",
          scrolled
            ? "bg-[#F6F5F1]/92 shadow-[0_1px_16px_rgba(17,18,21,0.06)] backdrop-blur-md"
            : "bg-[#F6F5F1]/75 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link
            to="/home"
            className="iris-focusable inline-flex shrink-0 items-center gap-2.5 rounded-lg py-1 text-[var(--home-ink)]"
          >
            <IrisMark className="h-7 w-7" aria-hidden />
            <span className="home-wordmark text-[1.375rem] font-bold tracking-[-0.03em]">Iris</span>
          </Link>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link
              to="/home"
              className="iris-focusable inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-2 text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)]"
            >
              <ArrowLeft aria-hidden className="h-4 w-4 shrink-0" />
              Početna
            </Link>
            <Link
              to={loginHref}
              className="iris-focusable iris-home-btn inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-4 py-2 text-[length:var(--home-text-sm)] font-semibold text-[#FFFFFF] hover:bg-[var(--home-btn-hover,#252830)] active:translate-y-px sm:min-h-[36px]"
            >
              Prijava
              <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </header>

      <main id="sadrzaj" tabIndex={-1} className="outline-none">
        <section className="relative overflow-hidden bg-[var(--home-bg)] pb-10 pt-24 sm:pb-12 sm:pt-28">
          <div
            aria-hidden="true"
            data-testid="regulations-hero-grid"
            className="iris-home-grid-bg pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
            style={{
              background:
                "radial-gradient(ellipse 72% 58% at 50% 0%, rgba(212, 72, 29, 0.085) 0%, rgba(212, 72, 29, 0.02) 48%, transparent 76%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <p className="tnum text-[length:var(--home-text-sm)] font-medium text-[var(--home-accent-ink)]">
              Vodič kroz propise · Poglavlje {docIndex + 1} od {REGULATION_DOCS.length}
            </p>
            <h1 className="mt-3 max-w-[26ch] text-[clamp(2rem,4vw,3.15rem)] font-bold leading-[1.06] tracking-[-0.03em] text-[var(--home-ink)] [text-wrap:balance]">
              {doc.title}
            </h1>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-8 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pt-8">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Propisi" className="min-w-0">
              <div className="mb-2.5 text-[length:var(--home-text-sm)] font-semibold text-[var(--home-ink)]">
                Poglavlja
              </div>
              <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {REGULATION_DOCS.map((item) => (
                  <li key={item.file} className="shrink-0">
                    <NavLink
                      to={regulationDocPath(item)}
                      end
                      className={({ isActive }) =>
                        cn(
                          "iris-focusable inline-flex min-h-[44px] items-center whitespace-nowrap rounded-lg px-3.5 py-2 text-[length:var(--home-text-sm)] transition-[color,background-color,box-shadow] duration-150 lg:flex lg:min-h-[40px] lg:w-full lg:whitespace-normal lg:rounded-l-none lg:rounded-r-lg lg:border-l-2",
                          isActive
                            ? "bg-[var(--home-surface)] font-semibold text-[var(--home-ink)] shadow-[0_1px_3px_rgba(17,18,21,0.06)] ring-1 ring-[var(--home-accent)] lg:border-[var(--home-accent)] lg:ring-0"
                            : "bg-[var(--home-surface-recessed)]/70 font-medium text-[var(--home-ink-muted)] hover:bg-[var(--home-surface)]/80 hover:text-[var(--home-ink)] lg:border-transparent lg:bg-transparent",
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {tocHeadings.length >= 2 && (
              <nav
                aria-label="Na ovoj stranici"
                data-spy-active="true"
                className="iris-home-spy-nav mt-8 hidden lg:block"
              >
                <div className="mb-2.5 text-[length:var(--home-text-sm)] font-semibold text-[var(--home-ink)]">
                  Na ovoj stranici
                </div>
                <ul className="space-y-1.5 border-l border-[var(--home-border)] pl-3.5">
                  {tocHeadings.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="iris-focusable iris-home-nav-link inline-block rounded-sm py-1 text-[length:var(--home-text-sm)] leading-[1.45] text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>

          <div className="min-w-0">
            <article className="max-w-[74ch]">
              <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {doc.markdown}
              </Markdown>
            </article>

            {(prevDoc || nextDoc) && (
              <nav
                aria-label="Prethodno i sledeće poglavlje"
                className="mt-14 grid max-w-[74ch] gap-4 border-t border-[var(--home-border)] pt-8 sm:grid-cols-2"
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
        </div>
      </main>

      <footer className="iris-home-carbon bg-[#101216] px-5 py-12 text-[var(--home-ink)] sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row md:items-start">
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

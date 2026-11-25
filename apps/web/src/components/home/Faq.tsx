import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "./ScrollReveal";

export interface FaqItem {
  q: string;
  a: string;
  /** Optional in-app link shown after the answer. */
  link?: { to: string; label: string };
}

/** Native disclosure accordion: keyboard and screen-reader friendly without any state. */
export function Faq({ items }: { items: FaqItem[] }): React.JSX.Element {
  return (
    <div className="iris-home-faq space-y-3">
      {items.map((item, index) => (
        <ScrollReveal key={item.q} delay={index * 55}>
          <details
            open={index === 0}
            className="group rounded-xl bg-[var(--home-bg,#F6F5F1)] px-5 transition-[background-color] duration-150 open:bg-[var(--home-surface-recessed,#EEECE6)]/75 sm:px-6 motion-reduce:transition-none"
          >
            <summary className="flex cursor-pointer list-none items-center justify-start gap-3 py-5 text-[length:var(--home-text-body,1rem)] font-semibold tracking-[-0.015em] text-[var(--home-ink,#111215)] transition-[color] duration-150 hover:text-[var(--home-accent,#D4481D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-accent,#D4481D)] motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
              <ChevronDown
                aria-hidden
                className="h-5 w-5 shrink-0 -rotate-90 rtl:rotate-90 text-[var(--home-ink-subtle,#646872)] transition-[rotate,color] duration-200 ease-out group-open:rotate-0 group-open:text-[var(--home-accent,#D4481D)] motion-reduce:transition-none"
              />
              <span>{item.q}</span>
            </summary>
            <div className="pb-6 pl-8 pr-4">
              <p className="max-w-[65ch] text-[length:var(--home-text-body,1rem)] leading-[1.65] text-[var(--home-ink-muted,#4A4D55)]">
                {item.a}
                {item.link ? (
                  <>
                    {" "}
                    <Link
                      to={item.link.to}
                      className="font-medium text-[var(--home-ink,#111215)] underline decoration-[var(--home-border-strong,#B5B0A4)] underline-offset-4 transition-[color,text-decoration-color] duration-150 hover:text-[var(--home-accent,#D4481D)] hover:decoration-[var(--home-accent,#D4481D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-accent,#D4481D)] motion-reduce:transition-none"
                    >
                      {item.link.label}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </details>
        </ScrollReveal>
      ))}
    </div>
  );
}

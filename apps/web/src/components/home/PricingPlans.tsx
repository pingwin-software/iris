import { useState } from "react";
import { Check, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICE_LIST_PDF_PATH, PRICING } from "@/lib/home/pricing";
import { ScrollReveal } from "./ScrollReveal";

/**
 * The public price list: the three subscription plans with a monthly/annual
 * switch, the one-time onboarding price of each, and the terms for the
 * adoption period, support and paid changes, plus a link to the same list as
 * a PDF. The numbers come from lib/home/pricing.json, shared with the PDF.
 */

export type Billing = "monthly" | "annual";

const { plans: PLANS, adoption: ADOPTION, support: SUPPORT_POINTS, changes: CHANGE_POINTS } = PRICING;

const RSD = new Intl.NumberFormat("sr-Latn-RS", { maximumFractionDigits: 0 });

/** "8.900 RSD": dinars with a dot as the thousands separator. */
export function formatRsd(amount: number): string {
  return `${RSD.format(amount)} RSD`;
}

export function PricingPlans(): React.JSX.Element {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div>
      <div
        role="group"
        aria-label="Način plaćanja"
        className="inline-flex flex-wrap rounded-lg border border-[var(--home-border,#D8D5CD)] bg-[var(--home-surface-recessed,#EEECE6)] p-1"
      >
        <BillingButton active={billing === "monthly"} onClick={() => setBilling("monthly")}>
          Mesečno
        </BillingButton>
        <BillingButton active={billing === "annual"} onClick={() => setBilling("annual")}>
          Godišnje · 2 meseca gratis
        </BillingButton>
      </div>

      <ul className="mt-8 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, index) => (
          <li key={plan.name} aria-label={`Paket ${plan.name}`} className="flex">
            <ScrollReveal
              as="div"
              delay={index * 80}
              className={cn(
                "flex h-full w-full flex-col overflow-hidden rounded-xl bg-[var(--home-surface,#FFFFFF)]",
                plan.highlighted
                  ? "border border-[var(--home-border-strong,#B5B0A4)] shadow-[0_14px_36px_-16px_rgba(17,18,21,0.16)]"
                  : "border border-[var(--home-border,#D8D5CD)]",
              )}
            >
              <div
                className={cn(
                  "border-b px-6 py-5 sm:px-7 sm:py-6",
                  plan.highlighted
                    ? "border-[#111215] border-t-2 border-t-[var(--home-accent,#D4481D)] bg-[#111215] text-[#F2F2F4]"
                    : "border-[var(--home-border,#D8D5CD)] border-t-2 border-t-transparent bg-[var(--home-surface,#FFFFFF)] text-[var(--home-ink,#111215)]",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className={cn(
                      "home-display text-[length:var(--home-text-body,1rem)] font-semibold tracking-[-0.015em]",
                      plan.highlighted ? "text-[#F2F2F4]" : "text-[var(--home-ink,#111215)]",
                    )}
                    style={{ fontFamily: "var(--home-font-display, 'Bricolage Grotesque', sans-serif)" }}
                  >
                    {plan.name}
                  </h3>
                  {plan.highlighted ? (
                    <span className="text-[length:var(--home-text-sm,0.875rem)] font-semibold text-[#FF7A4D]">
                      Najčešći izbor
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "mt-2 min-h-[3.125rem] text-[length:var(--home-text-body,1rem)] leading-[1.55]",
                    plan.highlighted ? "text-[#C2C5CE]" : "text-[var(--home-ink-muted,#4A4D55)]",
                  )}
                >
                  {plan.tagline}
                </p>
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-baseline gap-2" aria-live="polite">
                  <span
                    className="home-display text-[clamp(1.85rem,3vw,2.5rem)] font-bold leading-none tracking-[-0.03em] text-[var(--home-ink,#111215)] tnum"
                    style={{ fontFamily: "var(--home-font-display, 'Bricolage Grotesque', sans-serif)" }}
                  >
                    {RSD.format(billing === "monthly" ? plan.monthly : plan.annual)}
                  </span>
                  <span className="text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-subtle,#646872)]">
                    RSD {billing === "monthly" ? "mesečno" : "godišnje"}
                  </span>
                </div>
                <p className="mt-2 text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink-muted,#4A4D55)] tnum">
                  Do {plan.users} korisnika
                </p>
                <ul className="mt-6 space-y-2.5 border-t border-[var(--home-border,#D8D5CD)] pt-5 text-[length:var(--home-text-body,1rem)] leading-[1.5] text-[var(--home-ink,#111215)]">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden
                        className="mt-1 h-4 w-4 shrink-0 text-[var(--iris-status-done,#15803D)]"
                        strokeWidth={2.25}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <div className="flex items-baseline justify-between gap-3 border-t border-[var(--home-border,#D8D5CD)] pt-4 text-[length:var(--home-text-sm,0.875rem)]">
                    <span className="text-[var(--home-ink-muted,#4A4D55)]">Uvođenje, jednokratno</span>
                    <span className="font-semibold text-[var(--home-ink,#111215)] tnum">
                      {formatRsd(plan.onboarding)}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-[65ch] text-[length:var(--home-text-sm,0.875rem)] leading-[1.6] text-[var(--home-ink-muted,#4A4D55)]">
        {PRICING.terms}
      </p>
      <a
        href={PRICE_LIST_PDF_PATH}
        download
        className="iris-focusable mt-3 inline-flex min-h-[44px] items-center gap-2 text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink,#111215)] underline decoration-[var(--home-border-strong,#B5B0A4)] underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:text-[var(--home-accent,#D4481D)] hover:decoration-[var(--home-accent,#D4481D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-accent,#D4481D)] sm:min-h-0 motion-reduce:transition-none"
      >
        <FileDown aria-hidden className="h-4 w-4 shrink-0" />
        Preuzmite ceo cenovnik (PDF)
      </a>

      <div className="mt-12 grid gap-8 border-t border-[var(--home-border,#D8D5CD)] pt-10 md:grid-cols-3">
        <TermsColumn
          delay={0}
          title="Period usvajanja"
          lead="Posle početka rada manje izmene radimo besplatno, u okviru fonda sati."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[length:var(--home-text-sm,0.875rem)]">
              <caption className="sr-only">Period usvajanja po paketu</caption>
              <thead>
                <tr className="border-b border-[var(--home-border,#D8D5CD)] text-left text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-subtle,#646872)]">
                  <th scope="col" className="pb-2.5 font-medium">
                    Paket
                  </th>
                  <th scope="col" className="pb-2.5 font-medium">
                    Trajanje
                  </th>
                  <th scope="col" className="pb-2.5 text-right font-medium">
                    Sati
                  </th>
                </tr>
              </thead>
              <tbody>
                {ADOPTION.map((row) => (
                  <tr
                    key={row.plan}
                    className="border-t border-[var(--home-border,#D8D5CD)] first:border-t-0"
                  >
                    <th
                      scope="row"
                      className="py-2 text-left font-medium text-[var(--home-ink,#111215)]"
                    >
                      {row.plan}
                    </th>
                    <td className="py-2 text-[var(--home-ink-muted,#4A4D55)] tnum">
                      {row.days} dana
                    </td>
                    <td className="py-2 text-right font-medium text-[var(--home-ink,#111215)] tnum">
                      {row.hours} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TermsColumn>

        <TermsColumn delay={80} title="Podrška" lead="Uključena u svaki paket.">
          <ul className="space-y-2.5 text-[length:var(--home-text-body,1rem)] leading-[1.55] text-[var(--home-ink,#111215)]">
            {SUPPORT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <Check
                  aria-hidden
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--iris-status-done,#15803D)]"
                  strokeWidth={2.25}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </TermsColumn>

        <TermsColumn
          delay={160}
          title="Dorade i usluge"
          lead="Za veće dorade dajemo fiksnu ponudu pre početka rada."
        >
          <dl className="text-[length:var(--home-text-sm,0.875rem)]">
            {CHANGE_POINTS.map((point) => (
              <div
                key={point.label}
                className="flex items-baseline justify-between gap-4 border-t border-[var(--home-border,#D8D5CD)] py-2 first:border-t-0"
              >
                <dt className="text-[var(--home-ink-muted,#4A4D55)]">{point.label}</dt>
                <dd className="shrink-0 font-medium text-[var(--home-ink,#111215)] tnum">
                  {point.price}
                </dd>
              </div>
            ))}
          </dl>
        </TermsColumn>
      </div>
    </div>
  );
}

function BillingButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-md px-4 py-1.5 text-[length:var(--home-text-sm,0.875rem)] font-medium transition-[background-color,color,box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-accent,#D4481D)] sm:min-h-[36px] motion-reduce:transition-none",
        active
          ? "bg-[var(--home-surface,#FFFFFF)] text-[var(--home-ink,#111215)] shadow-[0_1px_2px_rgba(17,18,21,0.08)]"
          : "text-[var(--home-ink-muted,#4A4D55)] hover:text-[var(--home-ink,#111215)]",
      )}
    >
      {children}
    </button>
  );
}

function TermsColumn({
  delay = 0,
  title,
  lead,
  children,
}: {
  delay?: number;
  title: string;
  lead: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <ScrollReveal delay={delay}>
      <h3
        className="home-display text-[length:var(--home-text-body,1rem)] font-semibold tracking-[-0.015em] text-[var(--home-ink,#111215)]"
        style={{ fontFamily: "var(--home-font-display, 'Bricolage Grotesque', sans-serif)" }}
      >
        {title}
      </h3>
      <p className="mt-1.5 text-[length:var(--home-text-body,1rem)] leading-[1.6] text-[var(--home-ink-muted,#4A4D55)]">
        {lead}
      </p>
      <div className="mt-5">{children}</div>
    </ScrollReveal>
  );
}

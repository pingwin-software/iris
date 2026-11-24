import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Link2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/home/format";

/**
 * The hero's work order: a live sample the visitor moves through the real
 * lifecycle with the same one-button step the app has, cancels, resets, and
 * flips to "what the client sees" on the public link. No API, all local.
 */

interface Step {
  key: "new" | "assigned" | "inProgress" | "completed" | "invoiced";
  label: string;
  color: string;
  /** The timeline entry the step adds. */
  event: string;
}

const STEPS: Step[] = [
  {
    key: "new",
    label: "Nov",
    color: "var(--iris-status-draft, #4A4D55)",
    event: "Nalog otvoren, broj rezervisan",
  },
  {
    key: "assigned",
    label: "Dodeljen",
    color: "var(--iris-status-active, #B45309)",
    event: "Ana preuzela posao",
  },
  {
    key: "inProgress",
    label: "U toku",
    color: "var(--iris-status-active, #B45309)",
    event: "Rad u radionici započet",
  },
  {
    key: "completed",
    label: "Završen",
    color: "var(--iris-status-done, #15803D)",
    event: "Posao završen, datum upisan automatski",
  },
  {
    key: "invoiced",
    label: "Fakturisan",
    color: "var(--iris-status-done, #15803D)",
    event: "Faktura izdata, kraj puta",
  },
];

const CANCELLED_COLOR = "var(--iris-status-cancelled, #C82828)";

const LINES: Array<{ name: string; quantity: string; cost: number; price: number }> = [
  { name: "Vizit karte 4/4", quantity: "1.000 kom", cost: 3200, price: 6500 },
  { name: "Mat plastifikacija", quantity: "1.000 kom", cost: 700, price: 1800 },
];

const ORDER = {
  number: "RN-2026-00042",
  publicPath: "iris.rs/javni/rn-2026-00042",
  client: "Pekara Zlatno Zrno d.o.o.",
  description: "Vizit karte, 4/4, mat plastifikacija",
  paper: "Kunstdruk 350 g, 85 × 55 mm",
  due: "24.10.2026.",
  completed: "22.10.2026.",
  clientNotes: "Preuzimanje u radnji posle 14 h.",
};

export function WorkOrderDemo(): React.JSX.Element {
  const [step, setStep] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [clientView, setClientView] = useState(false);

  const current = STEPS[step];
  const next = STEPS[step + 1];
  const terminal = cancelled || !next;
  const statusLabel = cancelled ? "Otkazan" : current.label;
  const statusColor = cancelled ? CANCELLED_COLOR : current.color;
  const events = [
    ...STEPS.slice(0, step + 1).map((entry) => entry.event),
    ...(cancelled ? ["Nalog otkazan, ostaje zapisan"] : []),
  ];
  const total = LINES.reduce((sum, line) => sum + line.price, 0);

  const reset = (): void => {
    setStep(0);
    setCancelled(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div
        data-testid="work-order-demo"
        className="overflow-hidden rounded-2xl bg-[var(--home-surface,#FFFFFF)] text-left shadow-[0_20px_56px_-18px_rgba(17,18,21,0.12),0_2px_10px_-2px_rgba(17,18,21,0.05)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--home-surface-recessed,#EEECE6)] px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink-muted,#4A4D55)]">
              {clientView ? "Iris · javni status" : "Radni nalog"}
            </span>
            <span className="font-[family-name:var(--home-font-display)] text-[length:var(--home-text-body,1rem)] font-semibold tracking-[-0.015em] text-[var(--home-ink,#111215)] tnum">
              {ORDER.number}
            </span>
            <span
              key={statusLabel}
              role="status"
              aria-label={`Status: ${statusLabel}`}
              className="animate-iris-pop inline-flex items-center gap-1.5 rounded-md bg-[var(--home-surface,#FFFFFF)] px-2.5 py-1 text-[length:var(--home-text-sm,0.875rem)] font-medium leading-none shadow-[0_1px_2px_rgba(17,18,21,0.06)]"
              style={{
                color: statusColor,
              }}
            >
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} />
              {statusLabel}
            </span>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {terminal ? (
                <button
                  type="button"
                  onClick={reset}
                  className="iris-focusable iris-press inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--home-ink,#111215)] px-3.5 py-1.5 text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-surface,#FFFFFF)] transition-[opacity,background-color,transform] duration-150 ease-out hover:opacity-90 sm:min-h-[36px] sm:flex-initial"
                >
                  <RotateCcw aria-hidden className="h-4 w-4 shrink-0" />
                  Počni ispočetka
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((value) => value + 1)}
                  className="iris-focusable iris-press inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--home-ink,#111215)] px-3.5 py-1.5 text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-surface,#FFFFFF)] transition-[opacity,background-color,transform] duration-150 ease-out hover:opacity-90 sm:min-h-[36px] sm:flex-initial"
                >
                  Pomeri u „{next.label}“
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
                </button>
              )}

              {!terminal && step < 3 && (
                <button
                  type="button"
                  onClick={() => setCancelled(true)}
                  className="iris-focusable iris-press inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--home-surface,#FFFFFF)]/80 px-3 py-1.5 text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink-muted,#4A4D55)] transition-[color,background-color,transform] duration-150 ease-out hover:bg-[var(--home-surface,#FFFFFF)] hover:text-[var(--home-ink,#111215)] sm:min-h-[36px]"
                >
                  <X aria-hidden className="h-4 w-4 shrink-0" />
                  Otkaži nalog
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Prikaz naloga"
              className="inline-flex w-full items-center rounded-lg bg-[var(--home-surface,#FFFFFF)]/80 p-1 sm:w-auto"
            >
              <button
                type="button"
                aria-pressed={!clientView}
                onClick={() => setClientView(false)}
                className={cn(
                  "iris-focusable inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-[length:var(--home-text-sm,0.875rem)] font-medium transition-[color,background-color] duration-150 ease-out sm:min-h-[32px] sm:flex-initial",
                  !clientView
                    ? "bg-[var(--home-ink,#111215)] text-[var(--home-surface,#FFFFFF)]"
                    : "text-[var(--home-ink-muted,#4A4D55)] hover:text-[var(--home-ink,#111215)]",
                )}
              >
                {clientView ? (
                  <>
                    <ArrowLeft aria-hidden className="h-4 w-4 shrink-0" />
                    Nazad na nalog
                  </>
                ) : (
                  "U radionici"
                )}
              </button>
              <button
                type="button"
                aria-pressed={clientView}
                onClick={() => setClientView(true)}
                className={cn(
                  "iris-focusable inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-[length:var(--home-text-sm,0.875rem)] font-medium transition-[color,background-color] duration-150 ease-out sm:min-h-[32px] sm:flex-initial",
                  clientView
                    ? "bg-[var(--home-accent,#D4481D)] text-white"
                    : "text-[var(--home-ink-muted,#4A4D55)] hover:text-[var(--home-ink,#111215)]",
                )}
              >
                {clientView ? (
                  <Link2 aria-hidden className="h-4 w-4 shrink-0" />
                ) : (
                  <Eye aria-hidden className="h-4 w-4 shrink-0" />
                )}
                Pogledaj kao klijent
              </button>
            </div>
          </div>
        </div>

        {clientView ? (
          <ClientView statusLabel={statusLabel} />
        ) : (
          <InternalView
            step={step}
            cancelled={cancelled}
            total={total}
            events={events}
            statusColor={statusColor}
          />
        )}
      </div>

      <p className="mt-3.5 text-center text-[length:var(--home-text-sm,0.875rem)] leading-[1.5] text-[var(--home-ink-muted,#4A4D55)]">
        Probajte sami: kao i u aplikaciji, nalog ide samo napred. Ništa od ovoga se ne čuva.
      </p>
    </div>
  );
}

function InternalView({
  step,
  cancelled,
  total,
  events,
  statusColor,
}: {
  step: number;
  cancelled: boolean;
  total: number;
  events: string[];
  statusColor: string;
}): React.JSX.Element {
  const rows: Array<{ label: string; value: string; numeric?: boolean }> = [
    { label: "Klijent", value: ORDER.client },
    { label: "Opis posla", value: ORDER.description },
    { label: "Papir", value: ORDER.paper },
    { label: "Izvršilac", value: step >= 1 ? "Ana" : "—" },
    { label: "Rok", value: ORDER.due, numeric: true },
    ...(step >= 3 ? [{ label: "Završeno", value: ORDER.completed, numeric: true }] : []),
  ];

  return (
    <div>
      <div
        aria-hidden="true"
        className="bg-[var(--home-surface,#FFFFFF)] px-4 pt-4 pb-1 sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:grid sm:grid-cols-5 sm:gap-3">
          {STEPS.map((entry, index) => {
            const reached = !cancelled && index <= step;
            const isCurrent = !cancelled && index === step;
            const stoppedHere = cancelled && index === step;
            const beforeStop = cancelled && index < step;
            return (
              <div key={entry.key} className="min-w-0">
                <div className="hidden h-1 w-full overflow-hidden rounded-full bg-[var(--home-surface-recessed,#EEECE6)] sm:block">
                  <div
                    className="h-full rounded-full transition-[width,background-color] duration-300 ease-out"
                    style={{
                      width: reached || beforeStop || stoppedHere ? "100%" : "0%",
                      backgroundColor: stoppedHere
                        ? CANCELLED_COLOR
                        : isCurrent
                          ? entry.color
                          : reached || beforeStop
                            ? "var(--home-ink,#111215)"
                            : "transparent",
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:mt-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: stoppedHere
                        ? CANCELLED_COLOR
                        : isCurrent
                          ? entry.color
                          : reached || beforeStop
                            ? "var(--home-ink,#111215)"
                            : "var(--home-border-strong,#B5B0A4)",
                    }}
                  />
                  <span
                    className={cn(
                      "truncate text-[length:var(--home-text-sm,0.875rem)]",
                      isCurrent || stoppedHere
                        ? "font-semibold text-[var(--home-ink,#111215)]"
                        : reached || beforeStop
                          ? "font-medium text-[var(--home-ink-muted,#4A4D55)]"
                          : "text-[var(--home-ink-subtle,#646872)]",
                    )}
                  >
                    {entry.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {cancelled ? (
          <p
            className="mt-2 flex items-center gap-1.5 text-[length:var(--home-text-sm,0.875rem)] font-medium"
            style={{ color: CANCELLED_COLOR }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CANCELLED_COLOR }} />
            Otkazan na koraku „{STEPS[step].label}“
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 p-5 sm:p-7">
          <dl className="space-y-2.5">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-0.5 text-[length:var(--home-text-sm,0.875rem)]"
              >
                <dt className="text-[var(--home-ink-muted,#4A4D55)]">{row.label}</dt>
                <dd className={cn("text-right font-medium text-[var(--home-ink,#111215)]", row.numeric && "tnum")}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-xl bg-[var(--home-bg,#F6F5F1)]/80 p-4 sm:p-5">
            <div tabIndex={0} role="region" aria-label="Stavke naloga" className="iris-focusable overflow-x-auto">
              <table className="w-full border-collapse text-[length:var(--home-text-sm,0.875rem)]">
                <caption className="mb-3 text-left font-[family-name:var(--home-font-display)] text-[length:var(--home-text-sm,0.875rem)] font-semibold text-[var(--home-ink,#111215)]">
                  Stavke
                </caption>
                <thead>
                  <tr className="text-[var(--home-ink-muted,#4A4D55)]">
                    <th scope="col" className="pb-2 pr-3 text-left font-medium">
                      Stavka
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2 pb-2 text-right font-medium">
                      Količina
                    </th>
                    <th scope="col" className="whitespace-nowrap pb-2 pl-2 text-right font-medium">
                      Iznos
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[var(--home-ink,#111215)]">
                  {LINES.map((line) => (
                    <tr key={line.name}>
                      <td className="py-2 pr-3">{line.name}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-right text-[var(--home-ink-muted,#4A4D55)] tnum">
                        {line.quantity}
                      </td>
                      <td className="whitespace-nowrap py-2 pl-2 text-right font-medium tnum">
                        {formatMoney(line.price).replace(" RSD", "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-[var(--home-ink,#111215)]">
                    <th scope="row" colSpan={2} className="pt-3.5 text-left font-semibold">
                      Ukupno (neto)
                    </th>
                    <td className="whitespace-nowrap pt-3.5 pl-2 text-right font-semibold tnum">
                      {formatMoney(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="min-w-0 bg-[var(--home-bg,#F6F5F1)]/85 p-5 sm:p-7">
          <div className="font-[family-name:var(--home-font-display)] text-[length:var(--home-text-sm,0.875rem)] font-semibold text-[var(--home-ink,#111215)]">
            Istorija naloga
          </div>
          <ol aria-label="Istorija naloga" className="mt-4 space-y-3.5">
            {events.map((event, index) => {
              const isLatest = index === events.length - 1;
              return (
                <li
                  key={event}
                  className="animate-iris-rise relative flex items-start gap-3 text-[length:var(--home-text-sm,0.875rem)] leading-[1.5]"
                >
                  {!isLatest && (
                    <span
                      aria-hidden
                      className="absolute left-[4.5px] top-4 h-[calc(100%+4px)] w-px bg-[var(--home-border-strong,#B5B0A4)]/70"
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-[var(--home-bg,#F6F5F1)]"
                    style={{
                      backgroundColor: isLatest ? statusColor : "var(--home-border-strong,#B5B0A4)",
                    }}
                  />
                  <span
                    className={
                      isLatest
                        ? "font-medium text-[var(--home-ink,#111215)]"
                        : "text-[var(--home-ink-muted,#4A4D55)]"
                    }
                  >
                    {event}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ClientView({ statusLabel }: { statusLabel: string }): React.JSX.Element {
  const rows: Array<{ label: string; value: string; numeric?: boolean }> = [
    { label: "Opis posla", value: ORDER.description },
    { label: "Status", value: statusLabel },
    { label: "Rok", value: ORDER.due, numeric: true },
    { label: "Napomene za klijenta", value: ORDER.clientNotes },
  ];

  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--home-surface-recessed,#EEECE6)] px-3.5 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-2 text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink,#111215)] tnum">
          <Link2 aria-hidden className="h-4 w-4 shrink-0 text-[var(--home-accent,#D4481D)]" />
          <span className="truncate">{ORDER.publicPath}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-muted,#4A4D55)]">
          <EyeOff aria-hidden className="h-4 w-4 shrink-0" />
          Bez cena i prijave
        </span>
      </div>

      <p className="mt-5 font-[family-name:var(--home-font-display)] text-[length:var(--home-text-body,1rem)] font-semibold text-[var(--home-ink,#111215)]">
        {ORDER.client}
      </p>
      <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink-muted,#4A4D55)]">
              {row.label}
            </dt>
            <dd
              className={cn(
                "mt-1 text-[length:var(--home-text-body,1rem)] font-medium text-[var(--home-ink,#111215)]",
                row.numeric && "tnum",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 rounded-lg bg-[var(--home-bg,#F6F5F1)] px-4 py-3 text-[length:var(--home-text-sm,0.875rem)] leading-[1.6] text-[var(--home-ink-muted,#4A4D55)]">
        Ovako klijent vidi nalog kad otvori javni link: bez prijave, bez cena i bez internih napomena.
      </p>
    </div>
  );
}

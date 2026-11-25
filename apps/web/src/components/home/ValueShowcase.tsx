import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FeatureCard, type Feature } from "@/components/home/FeatureScene";
import { ScrollReveal, useInViewOnce } from "./ScrollReveal";
import { formatPercent, formatWhole } from "@/lib/home/format";

/**
 * "What you get": the two things Iris tells an owner that a spreadsheet
 * doesn't, each as a small sample of the real report, plus the smaller wins
 * underneath. The money panel mirrors the dashboard's profit by customer and
 * by catalog item (`companyProfit` / `itemProfit`); the production panel
 * mirrors the planner's calibration report (planned vs measured minutes per
 * step) and workstation load (planned vs available minutes). All sample data.
 */

interface ProfitRow {
  name: string;
  revenue: number;
  profit: number;
  /** The row the insight under the chart is about. */
  flag?: boolean;
}

const PROFIT_BY_CLIENT: ProfitRow[] = [
  { name: "Apoteka Lipa", revenue: 640_000, profit: 211_000 },
  { name: "Pekara Zlatno Zrno", revenue: 1_240_000, profit: 186_000, flag: true },
  { name: "Studio Kvadrat", revenue: 410_000, profit: 168_000 },
  { name: "Hotel Morava", revenue: 280_000, profit: 59_000 },
];

const PROFIT_BY_ITEM: ProfitRow[] = [
  { name: "Mat plastifikacija", revenue: 320_000, profit: 195_000 },
  { name: "Vizit karte 4/4", revenue: 540_000, profit: 189_000 },
  { name: "Katalozi A4", revenue: 880_000, profit: 158_000, flag: true },
  { name: "Nalepnice", revenue: 210_000, profit: 92_000 },
];

const PROFIT_VIEWS = {
  client: {
    label: "Po klijentu",
    rows: PROFIT_BY_CLIENT,
    insight: "Najveći klijent Vam donosi najmanju maržu. Vreme je za novi cenovnik.",
  },
  item: {
    label: "Po artiklu",
    rows: PROFIT_BY_ITEM,
    insight: "Katalozi donose najviše prometa, a plastifikacija najviše zarade.",
  },
} as const;

/** `reference` is the plan (steps) or the shift's available minutes (machines); `measured` is what happened or what is booked. */
interface ProductionRow {
  label: string;
  reference: number;
  measured: number;
}

const STEP_TIMES: ProductionRow[] = [
  { label: "Priprema za štampu", reference: 30, measured: 34 },
  { label: "Štampa", reference: 120, measured: 126 },
  { label: "Sečenje", reference: 40, measured: 88 },
  { label: "Plastifikacija", reference: 60, measured: 55 },
  { label: "Pakovanje", reference: 20, measured: 22 },
];

const MACHINE_LOAD: ProductionRow[] = [
  { label: "Heidelberg SM 52", reference: 450, measured: 420 },
  { label: "Giljotina Polar", reference: 450, measured: 500 },
  { label: "Plastifikator", reference: 450, measured: 190 },
  { label: "Digitalna mašina", reference: 450, measured: 330 },
];

const PRODUCTION_VIEWS = {
  steps: {
    label: "Vreme po koraku",
    legend: ["Plan", "Stvarno"],
    insight: "Sečenje traje duplo duže od plana, nalog za nalogom. Tu je usko grlo.",
  },
  load: {
    label: "Zauzetost mašina",
    legend: ["Raspoloživo", "Zakazano"],
    insight: "Giljotina je zakazana preko smene, a plastifikator stoji pola dana.",
  },
} as const;

const MORE_WINS: Feature[] = [
  {
    scene: "deadlines",
    title: "Rokovi pod kontrolom",
    body: "Nalozi koji kasne ili dospevaju danas vidite pre nego što klijent pozove.",
  },
  {
    scene: "stock",
    title: "Materijal na vreme",
    body: "Završen korak sam skida materijal sa stanja, a niske zalihe stižu na kontrolnu tablu.",
  },
  {
    scene: "calls",
    title: "Manje poziva",
    body: "Klijent prati posao preko linka, pa ne zove da pita dokle se stiglo.",
  },
  {
    scene: "frozen",
    title: "Zarada po tadašnjoj ceni",
    body: "Nalog pamti nabavnu cenu iz dana kad je rađen, pa poskupljenje ne kvari staru računicu.",
  },
];

export function ValueShowcase(): React.JSX.Element {
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal as="div" delay={0} className="flex">
          <ProfitPanel />
        </ScrollReveal>
        <ScrollReveal as="div" delay={90} className="flex">
          <ProductionPanel />
        </ScrollReveal>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MORE_WINS.map((win, index) => (
          <FeatureCard key={win.title} feature={win} index={index} variant="cell" />
        ))}
      </ul>
    </div>
  );
}

function ProfitPanel(): React.JSX.Element {
  const [view, setView] = useState<keyof typeof PROFIT_VIEWS>("client");
  const listRef = useRef<HTMLUListElement>(null);
  const inView = useInViewOnce(listRef);
  const { rows, insight } = PROFIT_VIEWS[view];
  const maxRevenue = Math.max(...rows.map((row) => row.revenue));

  return (
    <Panel
      title="Ko i šta Vam donosi zaradu"
      body="Iris od svakog naloga računa zaradu i maržu, pa vidite koji klijenti i artikli Vas hrane, a koji samo prave promet."
      toggle={
        <Toggle
          label="Prikaz zarade"
          options={PROFIT_VIEWS}
          value={view}
          onChange={setView}
        />
      }
      legend={[
        { label: "Promet", swatch: "rounded-[2px] bg-[var(--home-border-strong,#B5B0A4)]/65" },
        { label: "Zarada", swatch: "rounded-[2px] bg-[var(--home-accent,#D4481D)]" },
      ]}
      insight={insight}
    >
      <ul
        ref={listRef}
        aria-label={PROFIT_VIEWS[view].label}
        className="space-y-4"
      >
        {rows.map((row) => {
          const margin = (row.profit / row.revenue) * 100;
          return (
            <li key={row.name}>
              <div className="flex items-baseline justify-between gap-3 text-[length:var(--home-text-sm,0.875rem)]">
                <span className="truncate font-medium text-[var(--home-ink,#111215)]">{row.name}</span>
                <span
                  className={cn(
                    "shrink-0 tnum",
                    row.flag
                      ? "font-semibold text-[color:var(--iris-status-cancelled,#C82828)]"
                      : "font-medium text-[var(--home-ink-muted,#4A4D55)]",
                  )}
                >
                  marža {formatPercent(margin)}
                </span>
              </div>
              <div
                aria-hidden
                className="mt-2 h-3 overflow-hidden rounded-[4px] bg-[var(--home-surface-recessed,#EEECE6)]"
              >
                <div
                  className="relative h-full rounded-[3px] bg-[var(--home-border-strong,#B5B0A4)]/60 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: inView ? `${(row.revenue / maxRevenue) * 100}%` : "0%" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-[3px] bg-[var(--home-accent,#D4481D)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: inView ? `${(row.profit / row.revenue) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div className="mt-1.5 text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-muted,#4A4D55)] tnum">
                zarada {formatWhole(row.profit)} od {formatWhole(row.revenue)} RSD
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function ProductionPanel(): React.JSX.Element {
  const [view, setView] = useState<keyof typeof PRODUCTION_VIEWS>("steps");
  const listRef = useRef<HTMLUListElement>(null);
  const inView = useInViewOnce(listRef);
  const { legend, insight } = PRODUCTION_VIEWS[view];
  const rows = view === "steps" ? STEP_TIMES : MACHINE_LOAD;
  const max = Math.max(...rows.flatMap((row) => [row.reference, row.measured]));

  return (
    <Panel
      title="Gde radionica gubi vreme"
      body="Operateri štikliraju korake, a Iris meri koliko su stvarno trajali i koliko je koja mašina zauzeta. Usko grlo se vidi samo."
      toggle={
        <Toggle
          label="Prikaz proizvodnje"
          options={PRODUCTION_VIEWS}
          value={view}
          onChange={setView}
        />
      }
      legend={[
        {
          label: legend[0],
          swatch: "rounded-[2px] bg-[var(--home-border-strong,#B5B0A4)]/55",
        },
        { label: legend[1], swatch: "rounded-[2px] bg-[color:var(--iris-proc-step,#2563EB)]" },
      ]}
      insight={insight}
      note="Uz module Procesi rada i Planiranje"
    >
      <ul
        ref={listRef}
        aria-label={PRODUCTION_VIEWS[view].label}
        className="space-y-4"
      >
        {rows.map((row) => {
          const { reference, measured } = row;
          const over = measured > reference * 1.25 || (view === "load" && measured > reference);
          const under = view === "load" && measured < reference * 0.5;
          const detail =
            view === "steps"
              ? `${measured} min umesto ${reference}`
              : `${formatPercent((measured / reference) * 100)} smene`;
          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-[length:var(--home-text-sm,0.875rem)]">
                <span className="truncate font-medium text-[var(--home-ink,#111215)]">{row.label}</span>
                <span
                  className={cn(
                    "shrink-0 tnum",
                    over
                      ? "font-semibold text-[color:var(--iris-status-cancelled,#C82828)]"
                      : under
                        ? "font-semibold text-[color:var(--iris-status-active,#B45309)]"
                        : "font-medium text-[var(--home-ink-muted,#4A4D55)]",
                  )}
                >
                  {detail}
                </span>
              </div>
              <div aria-hidden className="relative mt-2 h-3.5">
                <div
                  className="absolute inset-y-0 left-0 rounded-[4px] bg-[var(--home-border-strong,#B5B0A4)]/45 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: inView ? `${(reference / max) * 100}%` : "0%" }}
                />
                <div
                  className={cn(
                    "absolute left-0 top-[3px] h-2 rounded-[2px] transition-[width] duration-500 ease-out motion-reduce:transition-none",
                    over
                      ? "bg-[color:var(--iris-status-cancelled,#C82828)]"
                      : "bg-[color:var(--iris-proc-step,#2563EB)]",
                  )}
                  style={{ width: inView ? `${(measured / max) * 100}%` : "0%" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Panel({
  title,
  body,
  toggle,
  legend,
  insight,
  note,
  children,
}: {
  title: string;
  body: string;
  toggle: ReactNode;
  legend: Array<{ label: string; swatch: string }>;
  insight: string;
  note?: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <article className="flex h-full w-full flex-col rounded-xl bg-[var(--home-bg,#F6F5F1)] p-6 sm:p-8">
      <h3 className="text-balance font-[family-name:var(--home-font-display)] text-[length:var(--home-text-body,1rem)] font-semibold tracking-[-0.015em] text-[var(--home-ink,#111215)]">
        {title}
      </h3>
      <p className="mt-2 text-pretty text-[length:var(--home-text-body,1rem)] leading-[1.6] text-[var(--home-ink-muted,#4A4D55)]">
        {body}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {toggle}
        <div aria-hidden className="flex flex-wrap gap-3 text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-muted,#4A4D55)]">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              <span className={cn("inline-block h-2.5 w-3.5", item.swatch)} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6">{children}</div>
      <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-[var(--home-surface,#FFFFFF)] px-4 py-3">
        <span
          aria-hidden
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--home-accent,#D4481D)]"
        />
        <p className="text-[length:var(--home-text-sm,0.875rem)] font-medium leading-[1.55] text-[var(--home-ink,#111215)]">
          {insight}
        </p>
      </div>
      {note ? (
        <p className="mt-auto pt-4 text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-muted,#4A4D55)]">
          {note}
        </p>
      ) : null}
    </article>
  );
}

function Toggle<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Record<K, { label: string }>;
  value: K;
  onChange: (next: K) => void;
}): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap rounded-lg bg-[var(--home-surface-recessed,#EEECE6)] p-1 text-[length:var(--home-text-sm,0.875rem)]"
    >
      {(Object.keys(options) as K[]).map((key) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={cn(
              "iris-focusable min-h-[44px] rounded-md px-3 py-1.5 font-medium transition-[color,background-color,box-shadow] duration-150 ease-out sm:min-h-[34px]",
              active
                ? "bg-[var(--home-surface,#FFFFFF)] text-[var(--home-ink,#111215)] shadow-[0_1px_2px_rgba(17,18,21,0.06)]"
                : "text-[var(--home-ink-muted,#4A4D55)] hover:text-[var(--home-ink,#111215)]",
            )}
          >
            {options[key].label}
          </button>
        );
      })}
    </div>
  );
}

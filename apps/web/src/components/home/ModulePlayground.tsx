import { useId, useRef, useState, type CSSProperties } from "react";
import { CalendarRange, Check, UserCheck, Warehouse, Workflow, type LucideIcon } from "lucide-react";
import { IrisMark } from "@/components/brand/IrisMark";
import { cn } from "@/lib/utils";
import { ScrollReveal, useInViewOnce } from "./ScrollReveal";
import {
  countEnabled,
  MODULE_EFFECTS,
  MODULE_LABELS,
  MODULE_ORDER,
  MODULE_REQUIREMENTS,
  moduleAvailable,
  NO_MODULES,
  setModule,
  visibleNav,
  type ModuleKey,
} from "@/lib/home/modules";
import type { OrganizationModules } from "@/types/settings";

/**
 * "Build your Iris": the four optional modules as switches that obey the real
 * dependency rules, beside a mock of the app's sidebar that gains and loses
 * entries as they go on and off. Lives inside the dark `.iris-home-carbon`
 * stage on /home and carries carbon fallbacks so isolated renders match.
 */

interface ModuleCopy {
  icon: LucideIcon;
  body: string;
  points: string[];
}

const MODULE_COPY: Record<ModuleKey, ModuleCopy> = {
  stock: {
    icon: Warehouse,
    body: "Koliko čega imate: stanje, rezervisano i raspoloživo po artiklu, uz istoriju svake promene.",
    points: [
      "Prijem robe i popis, početno stanje iz tabele",
      "Svaka promena ostaje trajno zapisana",
      "Niske zalihe na kontrolnoj tabli",
    ],
  },
  processes: {
    icon: Workflow,
    body: "Kako se posao radi korak po korak: koraci, ulazi i proizvodi, kao šablon za svaku vrstu posla i kao kopija na svakom nalogu.",
    points: [
      "Operater završava korake i upisuje stvarne količine",
      "Završen korak automatski skida materijal iz magacina i knjiži proizvod",
      "Makulatura i nusproizvodi se vode posebno",
    ],
  },
  attendance: {
    icon: UserCheck,
    body: "Ko je danas na poslu. Jednostavna evidencija prisustva, koju koristi i planiranje.",
    points: ["Dnevni pregled po osobi", "Izuzeci za smene i odsustva", "Radi i bez drugih modula"],
  },
  planning: {
    icon: CalendarRange,
    body: "Iris predlaže dnevni raspored: koji korak, na kojoj mašini, ko ga radi i kada. Administrator ga doteruje i objavljuje, a radionica prati svoj red.",
    points: [
      "Mašine, tipovi mašina, kvalifikacije i radno vreme",
      "Nacrt, objava i „Moj red“ za svakog operatera",
      "Prognoza rokova, potrebe materijala, zauzetost, štampani raspored",
    ],
  },
};

export function ModulePlayground(): React.JSX.Element {
  const [modules, setModules] = useState<OrganizationModules>(NO_MODULES);
  const asideRef = useRef<HTMLElement>(null);
  const asideVisible = useInViewOnce(asideRef);
  const enabled = countEnabled(modules);
  const nav = visibleNav(modules, "admin");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="grid gap-5 md:grid-cols-2">
        {MODULE_ORDER.map((key, index) => (
          <ScrollReveal key={key} as="li" delay={index * 75} className="flex">
            <ModuleCard
              moduleKey={key}
              modules={modules}
              onChange={(on) => setModules((current) => setModule(current, key, on))}
            />
          </ScrollReveal>
        ))}
      </ul>

      <aside
        ref={asideRef}
        aria-label="Pregled menija"
        data-reveal={asideVisible ? "shown" : "hidden"}
        data-reveal-variant="up"
        style={
          {
            "--reveal-delay": "140ms",
            "--iris-accent": "var(--home-accent, #E85A2D)",
          } as CSSProperties
        }
        className="iris-reveal overflow-hidden rounded-xl border border-[var(--home-border,#262932)] bg-[var(--home-surface,#121418)] lg:sticky lg:top-24 lg:self-start"
      >
        <div className="border-b border-[var(--home-border,#262932)] bg-[var(--home-surface-recessed,#191C22)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <IrisMark className="h-5 w-5 shrink-0 text-[var(--home-ink,#F2F2F4)]" />
              <span
                className="home-display text-[length:var(--home-text-body,1rem)] font-bold tracking-[-0.02em] text-[var(--home-ink,#F2F2F4)]"
                style={{ fontFamily: "var(--home-font-display, 'Bricolage Grotesque', sans-serif)" }}
              >
                Iris
              </span>
            </div>
            <span className="text-[length:var(--home-text-sm,0.875rem)] font-medium text-[var(--home-ink-subtle,#7E8390)]">
              Meni aplikacije
            </span>
          </div>
          <p
            className="mt-2 text-[length:var(--home-text-sm,0.875rem)] text-[var(--home-ink-muted,#A6AAB5)] tnum"
            aria-live="polite"
          >
            {enabled === 0
              ? "Osnovni Iris, bez modula."
              : `${enabled} od 4 modula uključeno.`}
          </p>
        </div>

        <ul
          aria-label="Stavke menija"
          className="space-y-1 px-4 py-4 text-[length:var(--home-text-sm,0.875rem)]"
        >
          {nav.map((item) => (
            <li
              key={item.label}
              className={cn(
                "animate-iris-rise flex items-center justify-between gap-2 rounded-r-md border-l-2 py-1.5 pl-3 pr-2.5",
                item.module
                  ? "border-[var(--home-accent,#E85A2D)] bg-[rgba(232,90,45,0.1)] font-medium text-[var(--home-ink,#F2F2F4)]"
                  : "border-transparent text-[var(--home-ink-muted,#A6AAB5)]",
              )}
            >
              {item.label}
              {item.module && MODULE_LABELS[item.module] !== item.label ? (
                <span className="font-normal text-[var(--home-accent-ink,#FF7A4D)]">
                  {MODULE_LABELS[item.module]}
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        {enabled > 0 && (
          <ul className="space-y-2.5 border-t border-[var(--home-border,#262932)] bg-[var(--home-surface-recessed,#191C22)] px-5 py-4 text-[length:var(--home-text-sm,0.875rem)] leading-[1.55] text-[var(--home-ink-muted,#A6AAB5)]">
            {MODULE_ORDER.filter((key) => modules[key]).map((key) => (
              <li key={key} className="animate-iris-rise">
                <span className="font-semibold text-[var(--home-ink,#F2F2F4)]">
                  {MODULE_LABELS[key]}:{" "}
                </span>
                {MODULE_EFFECTS[key]}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function ModuleCard({
  moduleKey,
  modules,
  onChange,
}: {
  moduleKey: ModuleKey;
  modules: OrganizationModules;
  onChange: (on: boolean) => void;
}): React.JSX.Element {
  const id = useId();
  const copy = MODULE_COPY[moduleKey];
  const on = modules[moduleKey];
  const available = moduleAvailable(modules, moduleKey);
  const requirements = MODULE_REQUIREMENTS[moduleKey].map((key) => MODULE_LABELS[key]);
  const missing = MODULE_REQUIREMENTS[moduleKey].filter((key) => !modules[key]).map((key) => MODULE_LABELS[key]);

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-xl border p-5 transition-[border-color,background-color,box-shadow] duration-200 ease-out sm:p-6 motion-reduce:transition-none",
        on
          ? "border-[var(--home-accent,#E85A2D)] bg-[rgba(232,90,45,0.06)] shadow-[0_0_0_1px_rgba(232,90,45,0.22)]"
          : available
            ? "border-[var(--home-border,#262932)] bg-[var(--home-surface,#121418)] hover:border-[var(--home-border-strong,#3A3F4D)]"
            : "border-[var(--home-border,#262932)] bg-[#0F1115]",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={id}
          className={cn(
            "flex min-w-0 items-center gap-3",
            available ? "cursor-pointer" : "cursor-not-allowed",
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-[background-color,border-color,color] duration-200 motion-reduce:transition-none",
              on
                ? "border-[rgba(232,90,45,0.45)] bg-[rgba(232,90,45,0.14)] text-[var(--home-accent-ink,#FF7A4D)]"
                : available
                  ? "border-[var(--home-border,#262932)] bg-[var(--home-surface-recessed,#191C22)] text-[var(--home-ink,#F2F2F4)]"
                  : "border-[var(--home-border,#262932)] bg-[var(--home-surface,#121418)] text-[var(--home-ink-subtle,#7E8390)]",
            )}
          >
            <copy.icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span
            className={cn(
              "home-display text-[length:var(--home-text-body,1rem)] font-semibold tracking-[-0.015em]",
              available ? "text-[var(--home-ink,#F2F2F4)]" : "text-[var(--home-ink-muted,#A6AAB5)]",
            )}
            style={{ fontFamily: "var(--home-font-display, 'Bricolage Grotesque', sans-serif)" }}
          >
            {MODULE_LABELS[moduleKey]}
          </span>
        </label>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={on}
          disabled={!available}
          aria-describedby={`${id}-req`}
          onChange={(event) => onChange(event.target.checked)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer appearance-none items-center rounded-full border p-[3px] transition-[background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-accent-ink,#FF7A4D)]",
            "after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']",
            "before:block before:h-5 before:w-5 before:rounded-full before:shadow-[0_1px_2px_rgba(0,0,0,0.4)] before:transition-[translate,background-color] before:duration-200 before:ease-out before:content-[''] motion-reduce:before:transition-none",
            on
              ? "border-transparent bg-[var(--home-accent,#E85A2D)] before:translate-x-5 before:bg-[#FFFFFF]"
              : "border-[var(--home-border-strong,#3A3F4D)] bg-[var(--home-surface-recessed,#191C22)] hover:border-[var(--home-ink-subtle,#7E8390)] before:translate-x-0 before:bg-[var(--home-ink,#F2F2F4)]",
            !available &&
              "cursor-not-allowed border-[var(--home-border,#262932)] bg-[#14161B] hover:border-[var(--home-border,#262932)] before:bg-[var(--home-ink-subtle,#7E8390)]",
          )}
        />
      </div>
      <p
        id={`${id}-req`}
        className={cn(
          "mt-2.5 text-[length:var(--home-text-sm,0.875rem)] leading-[1.5]",
          available
            ? "text-[var(--home-ink-subtle,#7E8390)]"
            : "font-medium text-[var(--home-ink-muted,#A6AAB5)]",
        )}
      >
        {requirements.length === 0
          ? "Radi samostalno, bez drugih modula."
          : available
            ? `Zahteva: ${requirements.join(" i ")}`
            : `Prvo uključite: ${missing.join(" i ")}`}
      </p>
      <p className="mt-3 text-[length:var(--home-text-body,1rem)] leading-[1.6] text-[var(--home-ink-muted,#A6AAB5)]">
        {copy.body}
      </p>
      <ul className="mt-4 space-y-2 text-[length:var(--home-text-body,1rem)] leading-[1.5] text-[var(--home-ink,#F2F2F4)]">
        {copy.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5">
            <Check
              aria-hidden
              className="mt-1 h-4 w-4 shrink-0 text-[var(--iris-status-done,#52C48A)]"
              strokeWidth={2.25}
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

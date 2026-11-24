import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Menu, X } from "lucide-react";
import { IrisMark } from "@/components/brand/IrisMark";
import { Faq, type FaqItem } from "@/components/home/Faq";
import { FeatureCard, type Feature } from "@/components/home/FeatureScene";
import { ModulePlayground } from "@/components/home/ModulePlayground";
import { PricingPlans } from "@/components/home/PricingPlans";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { useScrollSpy } from "@/components/home/useScrollSpy";
import { ValueShowcase } from "@/components/home/ValueShowcase";
import { WorkOrderDemo } from "@/components/home/WorkOrderDemo";
import "@/components/home/home.css";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/app-version";
import { loginEntryPath } from "@/lib/organization-login";
import { REGULATIONS_BASE_PATH } from "@/lib/regulations/paths";

/**
 * The public landing page (/home): what Iris is, for whom, and everything it
 * does, written for a small production or service business that is
 * considering it. Reachable signed out and signed in, needs no API call, and
 * uses formal Serbian ("Vi").
 */

const PAGE_TITLE = "Iris · radni nalozi za proizvodnju i usluge";

const DEFAULT_CONTACT_EMAIL = "vladbatocanin@gmail.com";

const CONTACT_EMAIL: string =
  (import.meta.env.VITE_HOME_CONTACT_EMAIL as string | undefined)?.trim() || DEFAULT_CONTACT_EMAIL;

interface HomePageProps {
  /** True when an organization session is open, so the main call to action opens the app. */
  signedIn?: boolean;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const CORE_FEATURES: Feature[] = [
  {
    scene: "orders",
    title: "Radni nalozi",
    body: "Klijent, posao, materijal, rok i izvršilac na jednom mestu, uz štampani nalog za radionicu.",
  },
  {
    scene: "clients",
    title: "Klijenti",
    body: "Firme sa PIB-om, matičnim brojem, kontaktima i više adresa za isporuku.",
  },
  {
    scene: "catalog",
    title: "Katalog",
    body: "Usluge i roba sa nabavnom i prodajnom cenom. Nove cene važe od datuma koji odredite.",
  },
  {
    scene: "dashboard",
    title: "Kontrolna tabla",
    body: "Nalozi koji kasne, dospevaju ili čekaju izvršioca, uz prihod i maržu po mesecu.",
  },
  {
    scene: "tracking",
    title: "Praćenje za klijenta",
    body: "Vaš klijent proverava status posla preko linka, bez prijave i bez uvida u cene.",
  },
  {
    scene: "devices",
    title: "Svi uređaji",
    body: "Računar, tablet ili telefon, bez ikakve instalacije.",
  },
];

const ROLES: Array<{ title: string; body: string }> = [
  {
    title: "Administrator",
    body: "Upravlja korisnicima, katalogom, cenama i podešavanjima i vidi sve finansijske podatke.",
  },
  {
    title: "Operater",
    body: "Radi sa nalozima i vidi prodajne cene. Nabavne cene, zaradu i maržu ne vidi, jer mu ih server i ne šalje.",
  },
];

const SECURITY_POINTS: Feature[] = [
  {
    scene: "isolation",
    title: "Odvojeni podaci",
    body: "Svaka firma ima zasebnu organizaciju i niko izvan nje ne vidi Vaše podatke.",
  },
  {
    scene: "server",
    title: "Provera na serveru",
    body: "Svaku radnju server proverava prema ulozi korisnika.",
  },
  {
    scene: "audit",
    title: "Zabeležen pristup",
    body: "Vašoj organizaciji pristupamo samo kad nam zatražite pomoć, i svaki pristup se beleži.",
  },
  {
    scene: "export",
    title: "Izvoz podataka",
    body: "Potpun izvoz svih podataka dobijate kad god ga zatražite.",
  },
];

const START_STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Javite nam se",
    body: "Dogovaramo koji delovi sistema su Vam potrebni.",
  },
  {
    title: "Pripremamo organizaciju",
    body: "Uvozimo Vaše klijente, artikle i postojeće naloge.",
  },
  {
    title: "Počinjete sa radom",
    body: "Obučavamo Vaš tim, a uputstvo je uvek dostupno u aplikaciji.",
  },
];

const FAQ: FaqItem[] = [
  {
    q: "Koliko košta Iris?",
    a: "Od 3.375 RSD mesečno za firmu do 5 korisnika, uz jednokratno uvođenje. Prvih 30 dana Iris možete probati besplatno.",
  },
  {
    q: "Šta ako prestanemo da koristimo Iris?",
    a: "Dobijate potpun izvoz svojih podataka, a mi ih zatim brišemo po dogovorenoj proceduri.",
  },
  {
    q: "Šta zakon propisuje za e-fakture, e-otpremnice i fiskalne račune?",
    a: "Pripremili smo pregled propisa na srpskom, sa izvorom uz svaku tvrdnju. Pregled služi za snalaženje i ne zamenjuje pravni savet.",
    link: { to: REGULATIONS_BASE_PATH, label: "Pročitajte pregled propisa →" },
  },
  {
    q: "Na kom jeziku je aplikacija?",
    a: "Na srpskom, a svaki korisnik je može prebaciti na engleski.",
  },
];

const DESKTOP_NAV_LINKS: Array<{ id: string; label: string }> = [
  { id: "vrednost", label: "Šta dobijate" },
  { id: "mogucnosti", label: "Mogućnosti" },
  { id: "moduli", label: "Moduli" },
  { id: "bezbednost", label: "Bezbednost" },
  { id: "cenovnik", label: "Cenovnik" },
  { id: "pocetak", label: "Kako da počnete" },
];

const DRAWER_LINKS: Array<{ id: string; label: string }> = [
  { id: "vrednost", label: "Šta dobijate" },
  { id: "mogucnosti", label: "Mogućnosti" },
  { id: "moduli", label: "Moduli" },
  { id: "uloge", label: "Uloge" },
  { id: "bezbednost", label: "Bezbednost" },
  { id: "cenovnik", label: "Cenovnik" },
  { id: "pocetak", label: "Kako da počnete" },
  { id: "pitanja", label: "Česta pitanja" },
];

const SECTION_IDS = DRAWER_LINKS.map((link) => link.id);

const FOOTER_LINKS_LEFT = DRAWER_LINKS.slice(0, 5);
const FOOTER_LINKS_RIGHT: Array<{ id: string; label: string }> = [
  { id: "cenovnik", label: "Cenovnik" },
  { id: "pocetak", label: "Kako da počnete" },
  { id: "pitanja", label: "Pitanja" },
];

type SectionClickHandler = (
  event: MouseEvent<HTMLAnchorElement>,
  targetId: string,
  beforeScroll?: () => void,
) => Promise<void>;

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

function useSectionScroller(): SectionClickHandler {
  const scrollRequestIdRef = useRef(0);
  const cancelPendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      scrollRequestIdRef.current += 1;
      cancelPendingRef.current?.();
      cancelPendingRef.current = null;
    };
  }, []);

  return useCallback(
    async (
      event: MouseEvent<HTMLAnchorElement>,
      targetId: string,
      beforeScroll?: () => void,
    ): Promise<void> => {
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
      beforeScroll?.();

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

      cancelPendingRef.current?.();
      const scrollId = ++scrollRequestIdRef.current;

      const { promise, cancel } = scrollIntoViewAndWait(target, {
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
      cancelPendingRef.current = cancel;

      await promise;

      if (scrollId !== scrollRequestIdRef.current) return;
      cancelPendingRef.current = null;
      target.focus?.({ preventScroll: true });
    },
    [],
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function HomePage({ signedIn = false }: HomePageProps): React.JSX.Element {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-iris-document-scroll", "true");
    return () => {
      document.documentElement.removeAttribute("data-iris-document-scroll");
    };
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  const navigateToSection = useSectionScroller();
  const primaryHref = signedIn ? "/" : loginEntryPath();
  const primaryLabel = signedIn ? "Otvori aplikaciju" : "Prijavite se";

  return (
    <div className="iris-home-theme min-h-screen overflow-x-clip bg-[var(--home-bg)] text-[var(--home-ink)]">
      <a
        href="#sadrzaj"
        onClick={(event) => void navigateToSection(event, "sadrzaj")}
        className="iris-focusable sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--home-ink)] focus:px-4 focus:py-2.5 focus:text-[length:var(--home-text-sm)] focus:font-semibold focus:text-[#FFFFFF]"
      >
        Preskoči na sadržaj
      </a>

      <TopBar
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        onNavigateSection={navigateToSection}
      />

      <main id="sadrzaj" tabIndex={-1} className="outline-none">
        <Hero primaryHref={primaryHref} primaryLabel={primaryLabel} />

        {/* #vrednost: Crisp #FFFFFF sheet with asymmetric header */}
        <section
          id="vrednost"
          tabIndex={-1}
          aria-labelledby="vrednost-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal
              as="div"
              variant="up"
              className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-10"
            >
              <h2
                id="vrednost-title"
                className="home-heading font-bold text-[var(--home-ink)] lg:col-span-6"
              >
                Vidite gde se zarađuje, a gde gubi vreme
              </h2>
              <p className="max-w-[54ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)] [text-wrap:pretty] lg:col-span-6">
                Iz naloga koje ionako vodite Iris sklapa sliku firme: koji klijenti i artikli donose novac i gde proizvodnja zapinje.
              </p>
            </ScrollReveal>
            <div className="mt-10 sm:mt-12">
              <ValueShowcase />
            </div>
          </div>
        </section>

        {/* #mogucnosti: #F6F5F1 stone band with shared-hairline architectural blueprint matrix */}
        <section
          id="mogucnosti"
          tabIndex={-1}
          aria-labelledby="mogucnosti-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-bg)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal as="div" variant="up">
              <h2
                id="mogucnosti-title"
                className="home-heading max-w-[26ch] font-bold text-[var(--home-ink)]"
              >
                Sve što Vaša firma radi svaki dan
              </h2>
              <p className="mt-4 max-w-[65ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)] [text-wrap:pretty]">
                Od upita i naloga do isporuke i naplate.
              </p>
            </ScrollReveal>
            <div className="mt-10 sm:mt-12">
              <PointGrid points={CORE_FEATURES} columns="three" />
            </div>
          </div>
        </section>

        {/* #moduli: Full-bleed dark carbon workbench stage */}
        <section
          id="moduli"
          tabIndex={-1}
          aria-labelledby="moduli-title"
          className="iris-home-carbon scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-bg)] px-5 py-16 text-[var(--home-ink)] outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal as="div" variant="up">
              <h2
                id="moduli-title"
                className="home-heading max-w-[26ch] font-bold text-[var(--home-ink)]"
              >
                Sastavite svoj Iris
              </h2>
              <p className="mt-4 max-w-[65ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)] [text-wrap:pretty]">
                Osnovni Iris čine nalozi, klijenti, katalog i kontrolna tabla. Ostale module uključujemo kad Vam zatrebaju.
              </p>
            </ScrollReveal>
            <div className="mt-10 sm:mt-12">
              <ModulePlayground />
            </div>
          </div>
        </section>

        {/* #uloge: #FFFFFF asymmetric split with Order Line Visibility Specimen */}
        <section
          id="uloge"
          tabIndex={-1}
          aria-labelledby="uloge-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            <div className="lg:col-span-5">
              <ScrollReveal as="div" variant="up">
                <h2
                  id="uloge-title"
                  className="home-heading max-w-[18ch] font-bold text-[var(--home-ink)]"
                >
                  Administrator vidi sve, operater ono što mu treba
                </h2>
              </ScrollReveal>
              <dl className="mt-8 space-y-7">
                {ROLES.map((item, index) => (
                  <ScrollReveal
                    key={item.title}
                    as="div"
                    delay={index * 90}
                    variant="up"
                    className="iris-rule-draw pt-4"
                  >
                    <dt className="home-display text-[length:var(--home-text-body)] font-semibold tracking-[-0.015em] text-[var(--home-ink)]">
                      {item.title}
                    </dt>
                    <dd className="mt-1.5 max-w-[46ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)]">
                      {item.body}
                    </dd>
                  </ScrollReveal>
                ))}
              </dl>
            </div>

            <ScrollReveal as="div" delay={120} variant="up" className="lg:col-span-7">
              <RoleVisibilitySpecimen />
            </ScrollReveal>
          </div>
        </section>

        {/* #bezbednost: #F6F5F1 sticky asymmetric split with 2x2 shared-hairline matrix */}
        <section
          id="bezbednost"
          tabIndex={-1}
          aria-labelledby="bezbednost-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-bg)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
            <ScrollReveal as="div" variant="up" className="lg:sticky lg:top-24 lg:col-span-4">
              <h2
                id="bezbednost-title"
                className="home-heading font-bold text-[var(--home-ink)]"
              >
                Vaši podaci su Vaši
              </h2>
              <p className="mt-4 max-w-[40ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)] [text-wrap:pretty]">
                Podaci svake firme stoje odvojeno, svaka radnja prolazi proveru uloge na serveru, a kompletan izvoz dobijate kad god želite.
              </p>
            </ScrollReveal>
            <div className="lg:col-span-8">
              <PointGrid points={SECURITY_POINTS} columns="two" />
            </div>
          </div>
        </section>

        {/* #cenovnik: #FFFFFF editorial pricing ledger band */}
        <section
          id="cenovnik"
          tabIndex={-1}
          aria-labelledby="cenovnik-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal as="div" variant="up">
              <h2
                id="cenovnik-title"
                className="home-heading max-w-[26ch] font-bold text-[var(--home-ink)]"
              >
                Jasna cena, bez iznenađenja
              </h2>
              <p className="mt-4 max-w-[65ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)] [text-wrap:pretty]">
                Pretplata je po firmi i uključuje korisnike, podršku i nove verzije. Uvođenje se plaća jednom.
              </p>
            </ScrollReveal>
            <div className="mt-10 sm:mt-12">
              <PricingPlans />
            </div>
          </div>
        </section>

        {/* #pocetak: #F6F5F1 horizontal step sequence + live-demo contact bar */}
        <section
          id="pocetak"
          tabIndex={-1}
          aria-labelledby="pocetak-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-bg)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <ScrollReveal as="div" variant="up">
              <h2
                id="pocetak-title"
                className="home-heading max-w-[26ch] font-bold text-[var(--home-ink)]"
              >
                Od prvog razgovora do prvog naloga
              </h2>
            </ScrollReveal>
            <div className="mt-10 sm:mt-12">
              <OnboardingSteps />
            </div>
          </div>
        </section>

        {/* #pitanja: #FFFFFF 5/7 split */}
        <section
          id="pitanja"
          tabIndex={-1}
          aria-labelledby="pitanja-title"
          className="scroll-mt-20 border-t border-[var(--home-border)] bg-[var(--home-surface)] px-5 py-16 outline-none sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:items-start lg:gap-12">
            <ScrollReveal as="div" variant="up" className="lg:sticky lg:top-24 lg:col-span-5">
              <h2
                id="pitanja-title"
                className="home-heading max-w-[16ch] font-bold text-[var(--home-ink)]"
              >
                Ono što nas najčešće pitaju
              </h2>
            </ScrollReveal>
            <ScrollReveal as="div" variant="up" delay={100} className="mt-8 lg:col-span-7 lg:mt-0">
              <Faq items={FAQ} />
            </ScrollReveal>
          </div>
        </section>

        {/* Unified dark carbon closing stage: Closing CTA + Footer */}
        <div className="iris-home-carbon border-t border-[var(--home-border)] bg-[var(--home-bg)] text-[var(--home-ink)]">
          <ClosingCta primaryHref={primaryHref} primaryLabel={primaryLabel} />
          <Footer
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
            onNavigateSection={navigateToSection}
          />
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function TopBar({
  primaryHref,
  primaryLabel,
  onNavigateSection,
}: {
  primaryHref: string;
  primaryLabel: string;
  onNavigateSection: SectionClickHandler;
}): React.JSX.Element {
  const active = useScrollSpy(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeButtonRef.current?.setAttribute("autofocus", "");
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent): void => {
      if (!event.matches) return;
      const dialog = dialogRef.current;
      setDrawerOpen(false);
      if (dialog?.open) {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const openDrawer = useCallback((): void => {
    const dialog = dialogRef.current;
    setDrawerOpen(true);
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    closeButtonRef.current?.focus({ preventScroll: true });
  }, []);

  const closeDrawer = useCallback((): void => {
    const dialog = dialogRef.current;
    setDrawerOpen(false);
    if (dialog?.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    openButtonRef.current?.focus({ preventScroll: true });
  }, []);

  const handleDrawerLinkClick = useCallback((): void => {
    const dialog = dialogRef.current;
    setDrawerOpen(false);
    if (dialog?.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, []);

  const scrollToSection = useCallback(
    (
      event: MouseEvent<HTMLAnchorElement>,
      targetId: string,
      closeDrawerFirst = false,
    ): void => {
      void onNavigateSection(
        event,
        targetId,
        closeDrawerFirst ? handleDrawerLinkClick : undefined,
      );
    },
    [onNavigateSection, handleDrawerLinkClick],
  );

  return (
    <>
      <header
        className={cn(
          "iris-home-header fixed inset-x-0 top-0 z-40 border-b",
          scrolled
            ? "border-[var(--home-border)] bg-[#F6F5F1]/92 shadow-[0_1px_12px_rgba(17,18,21,0.05)] backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <a
            href="#sadrzaj"
            onClick={(event) => scrollToSection(event, "sadrzaj")}
            className="iris-focusable inline-flex shrink-0 items-center gap-2.5 rounded-lg py-1 text-[var(--home-ink)]"
          >
            <IrisMark className="h-7 w-7" />
            <span className="home-wordmark text-[1.375rem] font-bold tracking-[-0.03em]">Iris</span>
          </a>

          <nav aria-label="Sekcije" className="hidden items-center gap-5 whitespace-nowrap lg:flex xl:gap-7">
            {DESKTOP_NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={active === link.id ? "location" : undefined}
                onClick={(event) => scrollToSection(event, link.id)}
                className="iris-focusable iris-home-nav-link shrink-0 rounded-sm py-1 text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)] hover:text-[var(--home-ink)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={primaryHref}
              className="iris-focusable iris-home-btn hidden items-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-4 py-2 text-[length:var(--home-text-sm)] font-semibold text-[#FFFFFF] hover:bg-[#23262E] active:translate-y-px sm:inline-flex"
            >
              {primaryLabel}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>

            <button
              ref={openButtonRef}
              type="button"
              aria-label="Meni"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={openDrawer}
              className="iris-focusable inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--home-ink)] transition-[color,background-color] duration-150 hover:bg-[var(--home-surface-recessed)] lg:hidden"
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "iris-home-scroll-progress pointer-events-none absolute inset-x-0 -bottom-px h-[2px]",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        />
      </header>

      <dialog
        ref={dialogRef}
        id={drawerId}
        aria-label="Navigacija"
        className="iris-home-drawer"
        onClose={() => setDrawerOpen(false)}
        onClick={(event) => {
          if (!sheetRef.current?.contains(event.target as Node)) {
            closeDrawer();
          }
        }}
      >
        <div ref={sheetRef} className="iris-home-drawer-sheet">
          <div className="flex items-center justify-between border-b border-[var(--home-border)] px-5 py-3.5">
            <a
              href="#sadrzaj"
              onClick={(event) => scrollToSection(event, "sadrzaj", true)}
              className="iris-focusable inline-flex min-h-[44px] items-center gap-2.5 rounded-lg text-[var(--home-ink)]"
            >
              <IrisMark className="h-7 w-7" />
              <span className="home-wordmark text-[1.375rem] font-bold tracking-[-0.03em]">Iris</span>
            </a>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Zatvori meni"
              onClick={closeDrawer}
              className="iris-focusable inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--home-ink)] transition-[color,background-color] duration-150 hover:bg-[var(--home-surface-recessed)]"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Mobilna navigacija" className="flex flex-1 flex-col gap-1 px-4 py-4">
            {DRAWER_LINKS.map((link) => {
              const isCurrent = active === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  aria-current={isCurrent ? "location" : undefined}
                  onClick={(event) => scrollToSection(event, link.id, true)}
                  className={cn(
                    "iris-focusable flex min-h-[44px] items-center rounded-lg border-l-2 px-3 py-2 text-[length:var(--home-text-body)] transition-[color,background-color] duration-150",
                    isCurrent
                      ? "border-[var(--home-accent)] bg-[var(--home-surface-recessed)] font-semibold text-[var(--home-ink)]"
                      : "border-transparent font-medium text-[var(--home-ink-muted)] hover:bg-[var(--home-surface-recessed)] hover:text-[var(--home-ink)]",
                  )}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="my-2 border-t border-[var(--home-border)]" />

            <Link
              to={REGULATIONS_BASE_PATH}
              onClick={handleDrawerLinkClick}
              className="iris-focusable flex min-h-[44px] items-center rounded-lg px-3 py-2 text-[length:var(--home-text-body)] font-medium text-[var(--home-ink-muted)] transition-[color,background-color] duration-150 hover:bg-[var(--home-surface-recessed)] hover:text-[var(--home-ink)]"
            >
              Propisi
            </Link>

            <div className="mt-auto pt-4">
              <Link
                to={primaryHref}
                onClick={handleDrawerLinkClick}
                className="iris-focusable iris-home-btn flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--home-ink)] px-5 py-3 text-[length:var(--home-text-body)] font-semibold text-[#FFFFFF] hover:bg-[#23262E]"
              >
                {primaryLabel}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}

function Hero({ primaryHref, primaryLabel }: { primaryHref: string; primaryLabel: string }): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-[var(--home-bg)] px-5 pb-14 pt-24 sm:px-8 sm:pb-20 sm:pt-32 lg:px-10">
      <div aria-hidden className="iris-home-grid-bg pointer-events-none absolute inset-x-0 top-0 h-[44rem]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem]"
        style={{
          background:
            "radial-gradient(ellipse 72% 58% at 50% 0%, rgba(212, 72, 29, 0.085) 0%, rgba(212, 72, 29, 0.02) 48%, transparent 76%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <div
          className="mx-auto max-w-4xl text-center"
          style={{ animation: "iris-fade-up var(--iris-dur-page) var(--iris-ease-out-decisive) both" }}
        >
          <h1 className="home-hero-title mx-auto max-w-[15ch] font-bold text-[var(--home-ink)]">
            Znajte šta Vam donosi novac.
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-[length:var(--home-text-body)] leading-[1.65] text-[var(--home-ink-muted)] [text-wrap:pretty]">
            Iris vodi radne naloge od upita do fakture i pokazuje zaradu po klijentu i artiklu, uz magacin, procese i planiranje.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryLink to={primaryHref}>{primaryLabel}</PrimaryLink>
          </div>
        </div>

        <div
          className="mx-auto mt-10 flex w-full max-w-5xl justify-center sm:mt-12"
          style={{ animation: "iris-fade-up var(--iris-dur-page) var(--iris-ease-out-decisive) both 120ms" }}
        >
          <WorkOrderDemo />
        </div>
      </div>
    </section>
  );
}

function PointGrid({ points, columns }: { points: Feature[]; columns: "two" | "three" }): React.JSX.Element {
  return (
    <ul
      className={cn(
        "grid border-t border-l border-[var(--home-border)] bg-[var(--home-surface)] sm:grid-cols-2",
        columns === "three" && "lg:grid-cols-3",
      )}
    >
      {points.map((point, index) => (
        <FeatureCard key={point.title} feature={point} index={index} variant="cell" />
      ))}
    </ul>
  );
}

/**
 * Read-only Order Line Visibility Specimen for #uloge.
 * Uses <div>/<span> only so `<dt>Administrator</dt>` and `<dt>Operater</dt>` remain unique in `#uloge`.
 */
function RoleVisibilitySpecimen(): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--home-bg)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--home-border)] bg-[var(--home-surface-recessed)] px-5 py-3.5 sm:px-6">
        <span className="text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)]">
          Primer stavke naloga
        </span>
        <span className="text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)] tnum">
          Vizit karte 4/4 · 6.500 RSD
        </span>
      </div>

      <div className="divide-y divide-[var(--home-border)]">
        <div className="bg-[var(--home-surface)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)]">
              <Eye aria-hidden className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />
              <span>Pogled administratora</span>
            </div>
            <span className="text-[length:var(--home-text-sm)] font-medium text-[var(--iris-status-done)]">
              Pun finansijski uvid
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[var(--iris-border-soft)] pt-4 sm:grid-cols-4">
            <div>
              <div className="text-[length:var(--home-text-sm)] text-[var(--home-ink-subtle)]">Prodajna</div>
              <div className="mt-0.5 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)] tnum">
                6.500 RSD
              </div>
            </div>
            <div>
              <div className="text-[length:var(--home-text-sm)] text-[var(--home-ink-subtle)]">Nabavna</div>
              <div className="mt-0.5 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)] tnum">
                3.200 RSD
              </div>
            </div>
            <div>
              <div className="text-[length:var(--home-text-sm)] text-[var(--home-ink-subtle)]">Zarada</div>
              <div className="mt-0.5 text-[length:var(--home-text-body)] font-semibold text-[var(--iris-status-done)] tnum">
                +3.300 RSD
              </div>
            </div>
            <div>
              <div className="text-[length:var(--home-text-sm)] text-[var(--home-ink-subtle)]">Marža</div>
              <div className="mt-0.5 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)] tnum">
                51%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--home-bg)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)]">
              <EyeOff aria-hidden className="h-4 w-4 shrink-0 text-[var(--home-ink-subtle)]" />
              <span>Pogled operatera</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[length:var(--home-text-sm)] font-medium text-[var(--home-ink-muted)]">
              <Lock aria-hidden className="h-3.5 w-3.5 shrink-0 text-[var(--home-ink-subtle)]" />
              Samo prodajna cena
            </span>
          </div>
          <div className="mt-4 grid gap-4 border-t border-[var(--home-border)] pt-4 sm:grid-cols-12 sm:items-center">
            <div className="sm:col-span-4">
              <div className="text-[length:var(--home-text-sm)] text-[var(--home-ink-subtle)]">Prodajna</div>
              <div className="mt-0.5 text-[length:var(--home-text-body)] font-semibold text-[var(--home-ink)] tnum">
                6.500 RSD
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-[var(--home-border-strong)] bg-[var(--home-surface-recessed)] px-3.5 py-2.5 text-[length:var(--home-text-sm)] text-[var(--home-ink-muted)] sm:col-span-8">
              <Lock aria-hidden className="h-4 w-4 shrink-0 text-[var(--home-ink-subtle)]" />
              <span>Nabavna i marža nisu u odgovoru servera</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingSteps(): React.JSX.Element {
  return (
    <>
      <ol className="relative grid gap-8 md:grid-cols-3 md:gap-10">
        {START_STEPS.map((step, index) => (
          <ScrollReveal
            key={step.title}
            as="li"
            delay={index * 90}
            variant="up"
            className="relative flex gap-4 md:block"
          >
            {index < START_STEPS.length - 1 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute left-11 -right-8 top-[1.125rem] hidden h-px bg-[var(--home-border)] md:block"
              />
            ) : null}
            <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--home-border-strong)] bg-[var(--home-surface)] text-[length:var(--home-text-sm)] font-semibold text-[var(--home-ink)] tnum">
              {index + 1}
            </div>
            <div className="md:mt-5">
              <h3 className="text-[length:var(--home-text-body)] font-semibold tracking-[-0.015em] text-[var(--home-ink)]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[length:var(--home-text-body)] leading-[1.6] text-[var(--home-ink-muted)]">
                {step.body}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </ol>

      <ScrollReveal
        as="div"
        delay={120}
        variant="up"
        className="mt-12 flex flex-col items-start gap-5 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <p className="home-display text-[length:var(--home-text-body)] font-semibold tracking-[-0.015em] text-[var(--home-ink)]">
            Želite da vidite Iris na svojim primerima?
          </p>
          <p className="mt-1 text-[length:var(--home-text-body)] text-[var(--home-ink-muted)]">
            Pišite nam i dogovorićemo prikaz uživo.
          </p>
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Iris: prikaz uživo")}`}
          className="iris-focusable iris-home-btn inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg bg-[var(--home-ink)] px-5 py-2.5 text-[length:var(--home-text-sm)] font-semibold text-[#FFFFFF] hover:bg-[#23262E] active:translate-y-px"
        >
          <Mail aria-hidden className="h-4 w-4" />
          {CONTACT_EMAIL}
        </a>
      </ScrollReveal>
    </>
  );
}

function ClosingCta({ primaryHref, primaryLabel }: { primaryHref: string; primaryLabel: string }): React.JSX.Element {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
      <ScrollReveal
        as="div"
        variant="up"
        className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
      >
        <div>
          <h2 className="home-heading font-bold text-[var(--home-ink)]">
            Spremni za prvi nalog?
          </h2>
          <p className="mt-2 max-w-[48ch] text-[length:var(--home-text-body)] text-[var(--home-ink-muted)]">
            Prvih 30 dana Iris možete probati besplatno.
          </p>
        </div>
        <PrimaryLink to={primaryHref}>{primaryLabel}</PrimaryLink>
      </ScrollReveal>
    </section>
  );
}

function Footer({
  primaryHref,
  primaryLabel,
  onNavigateSection,
}: {
  primaryHref: string;
  primaryLabel: string;
  onNavigateSection: SectionClickHandler;
}): React.JSX.Element {
  return (
    <footer className="border-t border-[var(--home-border)] px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row md:items-start">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 text-[var(--home-ink)]">
            <IrisMark className="h-7 w-7" />
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
            {FOOTER_LINKS_LEFT.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(event) => void onNavigateSection(event, link.id)}
                  className="iris-focusable inline-block py-1 text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <ul className="space-y-1.5 text-[length:var(--home-text-sm)]">
            {FOOTER_LINKS_RIGHT.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(event) => void onNavigateSection(event, link.id)}
                  className="iris-focusable inline-block py-1 text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to={REGULATIONS_BASE_PATH}
                className="iris-focusable inline-block py-1 text-[var(--home-ink-muted)] transition-[color] duration-150 hover:text-[var(--home-ink)]"
              >
                Propisi
              </Link>
            </li>
            <li>
              <Link
                to={primaryHref}
                className="iris-focusable inline-block py-1 font-semibold text-[var(--home-ink)] underline-offset-4 transition-[color] duration-150 hover:text-[var(--home-accent-ink)] hover:underline"
              >
                {primaryLabel}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function PrimaryLink({ to, children }: { to: string; children: ReactNode }): React.JSX.Element {
  return (
    <Link
      to={to}
      className="iris-focusable iris-home-btn group inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--home-ink)] px-6 py-3 text-[length:var(--home-text-body)] font-semibold text-[var(--home-bg)] shadow-[0_1px_2px_rgba(17,18,21,0.08)] hover:opacity-92 active:translate-y-px"
    >
      {children}
      <ArrowRight
        aria-hidden
        className="h-4 w-4 transition-[transform] duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
}

export default HomePage;

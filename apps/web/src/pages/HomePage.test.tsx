// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { FontScaleProvider } from "@/components/providers/FontScaleProvider";
import HomePage from "./HomePage";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/home");
  document.documentElement.removeAttribute("data-iris-document-scroll");
  document.documentElement.style.removeProperty("--iris-font-scale");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-iris-document-scroll");
  document.documentElement.style.removeProperty("--iris-font-scale");
});

function renderHome(props: { signedIn?: boolean } = {}) {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <HomePage {...props} />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("presents the product and every section a prospective organization needs", () => {
    renderHome();

    const heroHeading = screen.getByRole("heading", { level: 1 });
    expect(heroHeading).toHaveTextContent("Znajte šta Vam donosi novac.");
    const heroSection = heroHeading.closest("section");
    expect(heroSection).not.toBeNull();
    const heroGrid = screen.getByTestId("hero-grid");
    expect(heroGrid).toBeInTheDocument();
    expect(heroGrid).toHaveClass("iris-home-grid-bg");
    expect(heroGrid).toHaveAttribute("aria-hidden", "true");
    expect(heroSection).toContainElement(heroGrid);
    for (const name of [
      "Vidite gde se zarađuje, a gde gubi vreme",
      "Sve što Vaša firma radi svaki dan",
      "Sastavite svoj Iris",
      "Administrator vidi sve, operater ono što mu treba",
      "Vaši podaci su Vaši",
      "Jasna cena, bez iznenađenja",
      "Od prvog razgovora do prvog naloga",
      "Ono što nas najčešće pitaju",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    // The role section is a short term list.
    for (const term of ["Administrator", "Operater"]) {
      expect(screen.getByText(term, { selector: "dt" })).toBeInTheDocument();
    }
    // Every optional module is a switch, with its requirements spelled out.
    for (const module of ["Magacin", "Procesi rada", "Prisustvo", "Planiranje"]) {
      expect(screen.getByRole("switch", { name: module })).toBeInTheDocument();
    }
    expect(screen.getByText("Prvo uključite: Magacin")).toBeInTheDocument();
    expect(screen.getByText("Prvo uključite: Procesi rada i Prisustvo")).toBeInTheDocument();
    // The value section sits right under the hero, before the feature list.
    const value = screen.getByRole("region", { name: "Vidite gde se zarađuje, a gde gubi vreme" });
    const features = screen.getByRole("region", { name: "Sve što Vaša firma radi svaki dan" });
    expect(value.compareDocumentPosition(features) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(value).getByRole("heading", { level: 3, name: "Ko i šta Vam donosi zaradu" })).toBeInTheDocument();
    expect(within(value).getByRole("heading", { level: 3, name: "Gde radionica gubi vreme" })).toBeInTheDocument();
    // The contact address is the product owner's by default.
    expect(screen.getByRole("link", { name: "vladbatocanin@gmail.com" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:vladbatocanin@gmail\.com/),
    );
  });

  it("sends a signed-out visitor to the organization picker", () => {
    renderHome();
    const links = screen.getAllByRole("link", { name: /Prijavite se/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /Otvori aplikaciju/ })).not.toBeInTheDocument();
  });

  it("sends a device that remembers its organization straight to its sign-in page", () => {
    window.localStorage.setItem("iris.rememberedOrg", "demo");
    renderHome();
    for (const link of screen.getAllByRole("link", { name: /Prijavite se/ })) {
      expect(link).toHaveAttribute("href", "/login/demo");
    }
  });

  it("offers to open the app instead when a session is already open", () => {
    renderHome({ signedIn: true });
    const links = screen.getAllByRole("link", { name: /Otvori aplikaciju/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: /Prijavite se/ })).not.toBeInTheDocument();
  });

  it("sets the document title while mounted and restores it after", () => {
    document.title = "Iris";
    const { unmount } = renderHome();
    expect(document.title).toBe("Iris · radni nalozi za proizvodnju i usluge");
    unmount();
    expect(document.title).toBe("Iris");
  });

  it("marks the document root for document scrolling while mounted and cleans up on unmount", () => {
    expect(document.documentElement).not.toHaveAttribute("data-iris-document-scroll");
    const { unmount } = renderHome();
    expect(document.documentElement).toHaveAttribute("data-iris-document-scroll", "true");
    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-iris-document-scroll");
  });

  it("suspends FontScaleProvider scaling on /home and restores it when leaving", () => {
    window.localStorage.setItem("iris-font-scale", "1.3");

    const { rerender } = render(
      <FontScaleProvider>
        <MemoryRouter initialEntries={["/home"]}>
          <HomePage />
        </MemoryRouter>
      </FontScaleProvider>,
    );

    const scaleRoot = document.querySelector<HTMLElement>("[data-iris-scale-root]");
    expect(scaleRoot).not.toBeNull();
    expect(scaleRoot!.style.transform).toBe("");
    expect(scaleRoot!.style.height).toBe("");
    expect(scaleRoot!.style.overflow).toBe("");
    expect(document.documentElement.style.getPropertyValue("--iris-font-scale")).toBe("1");

    rerender(
      <FontScaleProvider>
        <div>App shell</div>
      </FontScaleProvider>,
    );

    expect(document.documentElement).not.toHaveAttribute("data-iris-document-scroll");
    return waitFor(() => {
      expect(scaleRoot!.style.transform).toBe("scale(1.3)");
      expect(scaleRoot!.style.overflow).toBe("hidden");
      expect(document.documentElement.style.getPropertyValue("--iris-font-scale")).toBe("1.3");
    });
  });

  it("smooth-scrolls to a section on header nav click and ignores modified clicks", async () => {
    const user = userEvent.setup();
    renderHome();

    const target = document.getElementById("cenovnik");
    expect(target).not.toBeNull();
    const scrollIntoView = vi.fn(() => Promise.resolve());
    Object.defineProperty(target!, "scrollIntoView", {
      value: scrollIntoView,
      configurable: true,
    });

    const nav = screen.getByRole("navigation", { name: "Sekcije" });
    expect(nav).toHaveClass("iris-home-spy-nav");
    expect(nav).toHaveAttribute("data-spy-active", "false");
    for (const navLink of within(nav).getAllByRole("link")) {
      expect(navLink).not.toHaveAttribute("aria-current", "location");
    }
    Object.defineProperty(window, "scrollY", { value: 80, configurable: true });
    fireEvent.scroll(window);
    expect(nav).toHaveAttribute("data-spy-active", "true");
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    fireEvent.scroll(window);
    expect(nav).toHaveAttribute("data-spy-active", "false");
    const link = within(nav).getByRole("link", { name: "Cenovnik" });

    // Modified click should fall back to default browser behavior without intercepting.
    await user.keyboard("{Control>}");
    await user.click(link);
    await user.keyboard("{/Control}");
    expect(scrollIntoView).not.toHaveBeenCalled();

    await user.click(link);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(window.location.hash).toBe("#cenovnik");
    await waitFor(() => {
      expect(document.activeElement).toBe(target);
    });
  });

  it("closes the mobile drawer and scrolls without throwing when scrollIntoView returns void", async () => {
    const user = userEvent.setup();
    renderHome();

    const target = document.getElementById("uloge");
    expect(target).not.toBeNull();
    const scrollIntoView = vi.fn();
    Object.defineProperty(target!, "scrollIntoView", {
      value: scrollIntoView,
      configurable: true,
    });

    await user.click(screen.getByRole("button", { name: "Meni" }));
    const dialog = screen.getByRole("dialog", { name: "Navigacija" });
    expect(dialog).toHaveAttribute("open");

    await user.click(within(dialog).getByRole("link", { name: "Uloge" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(window.location.hash).toBe("#uloge");
  });

  it("closes the mobile drawer on close button, backdrop click, and cancelable Escape", async () => {
    const user = userEvent.setup();
    renderHome();

    const menuButton = screen.getByRole("button", { name: "Meni" });
    await user.click(menuButton);

    const dialog = screen.getByRole("dialog", { name: "Navigacija" });
    expect(dialog).toHaveAttribute("open");
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(dialog.querySelector(".iris-home-drawer-scroller > .iris-home-drawer-sheet")).not.toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Zatvori meni" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();

    await user.click(menuButton);
    expect(dialog).toHaveAttribute("open");
    const scroller = dialog.querySelector<HTMLElement>(".iris-home-drawer-scroller");
    expect(scroller).not.toBeNull();
    await user.click(scroller!);
    expect(dialog).not.toHaveAttribute("open");
    expect(menuButton).toHaveFocus();

    await user.click(menuButton);
    expect(dialog).toHaveAttribute("open");
    const cancelEvent = new Event("cancel", { cancelable: true });
    act(() => {
      dialog.dispatchEvent(cancelEvent);
    });
    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dialog).not.toHaveAttribute("open");
    expect(menuButton).toHaveFocus();
  });

  it("animates drawer slide-in/out with IntersectionObserver and scroll backdrop fallback", async () => {
    const user = userEvent.setup();
    const rafQueue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    vi.stubGlobal("CSS", { supports: vi.fn(() => false) });

    const callbacksByTarget = new Map<Element, IntersectionObserverCallback>();
    class MockIntersectionObserver {
      private cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe(target: Element): void {
        callbacksByTarget.set(target, this.cb);
      }
      disconnect(): void {}
      unobserve(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    renderHome();

    const dialog = document.querySelector<HTMLDialogElement>("dialog.iris-home-drawer")!;
    expect(dialog).not.toBeNull();
    const scroller = dialog.querySelector<HTMLElement>(".iris-home-drawer-scroller")!;
    const sheet = dialog.querySelector<HTMLElement>(".iris-home-drawer-sheet")!;
    Object.defineProperty(sheet, "offsetWidth", { value: 320, configurable: true });
    const scrollTo = vi.fn();
    Object.defineProperty(scroller, "scrollTo", { value: scrollTo, configurable: true });

    const observerCb = callbacksByTarget.get(sheet);
    expect(observerCb).toBeDefined();

    const menuButton = screen.getByRole("button", { name: "Meni" });
    await user.click(menuButton);

    expect(dialog).toHaveAttribute("open");
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "instant" });
    expect(scrollTo).toHaveBeenCalledTimes(1);

    // An initial ratio=0 observation before entering must not prematurely close the dialog.
    act(() => {
      observerCb!([{ intersectionRatio: 0, target: sheet } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(dialog).toHaveAttribute("open");

    // Flush the two requestAnimationFrame steps to trigger the slide-in scroll.
    act(() => {
      rafQueue.shift()?.(0);
      rafQueue.shift()?.(16);
    });
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 320, behavior: "auto" });

    // Scroll fallback updates --drawer-backdrop while animation-timeline is unsupported.
    Object.defineProperty(scroller, "scrollLeft", { value: 160, configurable: true });
    fireEvent.scroll(scroller);
    expect(dialog.style.getPropertyValue("--drawer-backdrop")).toBe("0.5");

    act(() => {
      observerCb!([{ intersectionRatio: 1, target: sheet } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    // Clicking close scrolls back to 0 and waits for IntersectionObserver to close once off-screen.
    await user.click(within(dialog).getByRole("button", { name: "Zatvori meni" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "auto" });
    expect(dialog).toHaveAttribute("open");

    act(() => {
      observerCb!([{ intersectionRatio: 0, target: sheet } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(dialog).not.toHaveAttribute("open");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(dialog.style.getPropertyValue("--drawer-backdrop")).toBe("");
  });
});

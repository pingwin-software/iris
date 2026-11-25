// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Znajte šta Vam donosi novac.",
    );
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
});

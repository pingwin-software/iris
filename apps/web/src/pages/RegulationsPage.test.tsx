// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import RegulationsPage from './RegulationsPage'

beforeEach(() => {
  window.history.replaceState(null, '', '/home/propisi')
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('data-iris-document-scroll')
})

function renderAt(path: string): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/home/propisi/:slug?" element={<RegulationsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RegulationsPage', () => {
  it('shows the overview as a clean wiki shell without hero grid, with chapter nav, header breadcrumb and footer', () => {
    const { container } = renderAt('/home/propisi')
    expect(container.querySelector('.iris-home-theme')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-iris-document-scroll', 'true')

    expect(screen.queryByTestId('regulations-hero-grid')).not.toBeInTheDocument()
    expect(container.querySelector('.iris-home-grid-bg')).not.toBeInTheDocument()

    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Iris' })).toHaveAttribute('href', '/home')
    expect(within(banner).getByRole('link', { name: 'Propisi' })).toHaveAttribute('href', '/home/propisi')
    expect(within(banner).getByRole('link', { name: 'Početna' })).toHaveAttribute('href', '/home')
    expect(within(banner).getByRole('link', { name: 'Prijava' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Iris' })).not.toBeInTheDocument()

    expect(screen.getByText('Vodič kroz propise · Poglavlje 1 od 5')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled' }),
    ).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Propisi' })
    expect(within(nav).getByText('Poglavlja')).toBeInTheDocument()
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/home/propisi',
      '/home/propisi/elektronske-fakture',
      '/home/propisi/elektronske-otpremnice',
      '/home/propisi/fiskalizacija',
      '/home/propisi/izvori',
    ])
    expect(within(nav).getByRole('link', { name: 'Pregled' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Fiskalizacija' })).toHaveAttribute('href', '/home/propisi/fiskalizacija')

    const chapterNav = screen.getByRole('navigation', { name: 'Prethodno i sledeće poglavlje' })
    expect(within(chapterNav).queryByText('Prethodno poglavlje')).not.toBeInTheDocument()
    expect(within(chapterNav).getByRole('link', { name: /Sledeće poglavlje/ })).toHaveAttribute(
      'href',
      '/home/propisi/elektronske-fakture',
    )

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('iris-home-carbon')
    const footerNav = within(footer).getByRole('navigation', { name: 'Podnožje' })
    expect(within(footerNav).getByRole('link', { name: 'Početna' })).toHaveAttribute('href', '/home')
    expect(within(footerNav).getByRole('link', { name: 'Prijava' })).toBeInTheDocument()
    expect(within(footerNav).getByRole('link', { name: 'Fiskalizacija' })).toHaveAttribute(
      'href',
      '/home/propisi/fiskalizacija',
    )
  })

  it('renders a document with in-page TOC scrollspy, keyboard-scrollable tables, prev/next links and external links in a new tab', async () => {
    const user = userEvent.setup()
    renderAt('/home/propisi/fiskalizacija')
    expect(screen.getByText('Vodič kroz propise · Poglavlje 4 od 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Fiskalizacija (fiskalne kase)' })).toBeInTheDocument()

    const openQuestionsHeading = screen.getByRole('heading', { name: 'Otvorena pitanja' })
    expect(openQuestionsHeading).toHaveAttribute('id', 'otvorena-pitanja')
    const scrollIntoView = vi.fn(() => Promise.resolve())
    Object.defineProperty(openQuestionsHeading, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
    })

    const tocNav = screen.getByRole('navigation', { name: 'Na ovoj stranici' })
    expect(tocNav).toHaveClass('iris-home-spy-nav')
    expect(tocNav).toHaveAttribute('data-spy-active', 'true')
    const tocLinks = within(tocNav).getAllByRole('link')
    expect(tocLinks.length).toBeGreaterThanOrEqual(2)
    expect(tocLinks[0]).toHaveAttribute('aria-current', 'location')
    expect(tocLinks[0]).toHaveClass('iris-wiki-toc-link')
    expect(tocLinks[0]).not.toHaveClass('iris-home-nav-link')

    const openQuestionsLink = within(tocNav).getByRole('link', { name: 'Otvorena pitanja' })
    expect(openQuestionsLink).toHaveAttribute('href', '#otvorena-pitanja')
    for (const link of tocLinks) {
      const targetId = link.getAttribute('href')?.slice(1) ?? ''
      expect(document.getElementById(targetId)).not.toBeNull()
    }

    await user.click(openQuestionsLink)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(window.location.hash).toBe('#otvorena-pitanja')
    await waitFor(() => {
      expect(document.activeElement).toBe(openQuestionsHeading)
    })

    const chapterNav = screen.getByRole('navigation', { name: 'Prethodno i sledeće poglavlje' })
    expect(within(chapterNav).getByRole('link', { name: /Prethodno poglavlje/ })).toHaveAttribute(
      'href',
      '/home/propisi/elektronske-otpremnice',
    )
    expect(within(chapterNav).getByRole('link', { name: /Sledeće poglavlje/ })).toHaveAttribute(
      'href',
      '/home/propisi/izvori',
    )

    const tableRegions = screen.getAllByRole('region', { name: 'Tabela' })
    expect(tableRegions.length).toBeGreaterThan(0)
    for (const region of tableRegions) {
      expect(region).toHaveAttribute('tabindex', '0')
      expect(within(region).getByRole('table')).toBeInTheDocument()
    }

    const external = screen.getAllByRole('link').find((link) => link.getAttribute('href')?.startsWith('https://'))
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByText(/Šta ovo znači za Iris/)).not.toBeInTheDocument()
  })

  it('sends an unknown document back to the overview', () => {
    renderAt('/home/propisi/nepostoji')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled' }),
    ).toBeInTheDocument()
  })

  it('ignores malformed hash fragments and restores document.title and scroll attribute on unmount', () => {
    const previousTitle = document.title
    document.title = 'Prethodni naslov'
    try {
      const { unmount } = renderAt('/home/propisi#%E0%A4%A')
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled',
        }),
      ).toBeInTheDocument()
      expect(document.title).toBe('Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled · Iris')
      expect(document.documentElement).toHaveAttribute('data-iris-document-scroll', 'true')
      unmount()
      expect(document.title).toBe('Prethodni naslov')
      expect(document.documentElement).not.toHaveAttribute('data-iris-document-scroll')
    } finally {
      document.title = previousTitle
    }
  })
})

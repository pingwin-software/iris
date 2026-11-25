// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '@testing-library/jest-dom/vitest'
import RegulationsPage from './RegulationsPage'

beforeEach(() => {
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
  it('shows the overview with the editorial theme, hero grid, chapter nav and footer', () => {
    const { container } = renderAt('/home/propisi')
    expect(container.querySelector('.iris-home-theme')).toBeInTheDocument()

    const heroGrid = screen.getByTestId('regulations-hero-grid')
    expect(heroGrid).toHaveClass('iris-home-grid-bg')
    expect(heroGrid).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Vodič kroz propise · Poglavlje 1 od 5')).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 1, name: 'Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Propisi' })
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/home/propisi',
      '/home/propisi/elektronske-fakture',
      '/home/propisi/elektronske-otpremnice',
      '/home/propisi/fiskalizacija',
      '/home/propisi/izvori',
    ])
    // Links to the other documents point at their routes, not at .md files.
    expect(screen.getAllByRole('link', { name: 'Fiskalizacija' })[0]).toHaveAttribute('href', '/home/propisi/fiskalizacija')
    expect(screen.getByRole('link', { name: 'Iris' })).toHaveAttribute('href', '/home')
    expect(screen.queryByRole('img', { name: 'Iris' })).not.toBeInTheDocument()

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

  it('renders a document with in-page TOC, prev/next links, tables, anchors and external links in a new tab', () => {
    renderAt('/home/propisi/fiskalizacija')
    expect(screen.getByText('Vodič kroz propise · Poglavlje 4 od 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Fiskalizacija (fiskalne kase)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Otvorena pitanja' })).toHaveAttribute('id', 'otvorena-pitanja')

    const tocNav = screen.getByRole('navigation', { name: 'Na ovoj stranici' })
    expect(tocNav).toHaveClass('iris-home-spy-nav')
    expect(tocNav).toHaveAttribute('data-spy-active', 'true')
    const tocLinks = within(tocNav).getAllByRole('link')
    expect(tocLinks.length).toBeGreaterThanOrEqual(2)
    expect(within(tocNav).getByRole('link', { name: 'Otvorena pitanja' })).toHaveAttribute('href', '#otvorena-pitanja')
    for (const link of tocLinks) {
      const targetId = link.getAttribute('href')?.slice(1) ?? ''
      expect(document.getElementById(targetId)).not.toBeNull()
    }

    const chapterNav = screen.getByRole('navigation', { name: 'Prethodno i sledeće poglavlje' })
    expect(within(chapterNav).getByRole('link', { name: /Prethodno poglavlje/ })).toHaveAttribute(
      'href',
      '/home/propisi/elektronske-otpremnice',
    )
    expect(within(chapterNav).getByRole('link', { name: /Sledeće poglavlje/ })).toHaveAttribute(
      'href',
      '/home/propisi/izvori',
    )

    expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
    const external = screen.getAllByRole('link').find((link) => link.getAttribute('href')?.startsWith('https://'))
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByText(/Šta ovo znači za Iris/)).not.toBeInTheDocument()
  })

  it('sends an unknown document back to the overview', () => {
    renderAt('/home/propisi/nepostoji')
    expect(screen.getByRole('heading', { level: 1, name: 'Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled' })).toBeInTheDocument()
  })

  it('ignores malformed hash fragments and restores document.title on unmount', () => {
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
      expect(document.title).toBe(
        'Propisi o e-fakturama, e-otpremnicama i fiskalizaciji: pregled · Iris',
      )
      unmount()
      expect(document.title).toBe('Prethodni naslov')
    } finally {
      document.title = previousTitle
    }
  })
})

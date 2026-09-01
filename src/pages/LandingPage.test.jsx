import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingPage from './LandingPage.jsx'

describe('LandingPage', () => {
  it('renders marketing content and links to the login section', () => {
    render(<LandingPage onGoogleLogin={vi.fn()} />)

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings.some((h) => h.textContent.includes('ゲームのバグ報告を'))).toBe(true)
    expect(screen.getByText('ホットキー1つで報告')).toBeInTheDocument()

    const headerLink = screen.getByRole('link', { name: 'ログイン' })
    const heroLink = screen.getByRole('link', { name: 'はじめる' })
    expect(headerLink).toHaveAttribute('href', '#login')
    expect(heroLink).toHaveAttribute('href', '#login')
  })

  it('embeds the real Google login button and calls onGoogleLogin when clicked', async () => {
    const user = userEvent.setup()
    const onGoogleLogin = vi.fn().mockResolvedValue({ email: 'a@example.com', displayName: 'A' })
    render(<LandingPage onGoogleLogin={onGoogleLogin} />)

    await user.click(screen.getByRole('button', { name: 'Googleでログイン' }))
    expect(onGoogleLogin).toHaveBeenCalledTimes(1)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingPage from './LandingPage.jsx'

describe('LandingPage', () => {
  it('renders marketing content', () => {
    render(<LandingPage onGoogleLogin={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ゲームのバグ報告を')
    expect(screen.getByText('ホットキー1つで報告')).toBeInTheDocument()
  })

  it('calls onGoogleLogin when the header button is clicked', async () => {
    const user = userEvent.setup()
    const onGoogleLogin = vi.fn().mockResolvedValue({ email: 'a@example.com', displayName: 'A' })
    render(<LandingPage onGoogleLogin={onGoogleLogin} />)

    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(onGoogleLogin).toHaveBeenCalledTimes(1)
  })

  it('calls onGoogleLogin when the hero CTA is clicked', async () => {
    const user = userEvent.setup()
    const onGoogleLogin = vi.fn().mockResolvedValue({ email: 'a@example.com', displayName: 'A' })
    render(<LandingPage onGoogleLogin={onGoogleLogin} />)

    await user.click(screen.getByRole('button', { name: 'Googleではじめる' }))
    expect(onGoogleLogin).toHaveBeenCalledTimes(1)
  })

  it('shows an error message when the login promise rejects', async () => {
    const user = userEvent.setup()
    const onGoogleLogin = vi.fn().mockRejectedValue(new Error('接続に失敗しました'))
    render(<LandingPage onGoogleLogin={onGoogleLogin} />)

    await user.click(screen.getByRole('button', { name: 'Googleではじめる' }))
    expect(await screen.findByText('接続に失敗しました')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Googleではじめる' })).not.toBeDisabled()
  })

  it('disables both buttons while the login is in flight', async () => {
    const user = userEvent.setup()
    let resolveLogin
    const onGoogleLogin = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        })
    )
    render(<LandingPage onGoogleLogin={onGoogleLogin} />)

    await user.click(screen.getByRole('button', { name: 'Googleではじめる' }))
    const buttons = screen.getAllByRole('button', { name: '接続中...' })
    expect(buttons).toHaveLength(2)
    buttons.forEach((btn) => expect(btn).toBeDisabled())

    resolveLogin({ email: 'a@example.com', displayName: 'A' })
    await vi.waitFor(() => expect(onGoogleLogin).toHaveBeenCalledTimes(1))
  })
})

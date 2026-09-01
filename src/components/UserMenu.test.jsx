import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UserMenu from './UserMenu.jsx'

const user1 = { email: 'demo@example.com', displayName: 'デモユーザー', imageUrl: null }

function renderMenu(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/projects']}>
      <Routes>
        <Route path="/projects" element={<UserMenu user={user1} onLogout={vi.fn()} {...props} />} />
        <Route path="/account" element={<div>アカウント設定ページ</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('UserMenu', () => {
  it('shows the display name on the toggle, and the email only once opened', async () => {
    const user = userEvent.setup()
    renderMenu()

    expect(screen.getByText('デモユーザー')).toBeInTheDocument()
    expect(screen.queryByText('demo@example.com')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /デモユーザー/ }))
    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.getByText('アカウント設定')).toBeInTheDocument()
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
  })

  it('navigates to /account when "アカウント設定" is clicked', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: /デモユーザー/ }))
    await user.click(screen.getByText('アカウント設定'))

    expect(await screen.findByText('アカウント設定ページ')).toBeInTheDocument()
  })

  it('calls onLogout and closes when "ログアウト" is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    renderMenu({ onLogout })

    await user.click(screen.getByRole('button', { name: /デモユーザー/ }))
    await user.click(screen.getByText('ログアウト'))

    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('アカウント設定')).not.toBeInTheDocument()
  })

  it('shows the avatar image instead of the initial when imageUrl is set', async () => {
    renderMenu({ user: { ...user1, imageUrl: 'https://example.com/avatar.png' } })
    const img = document.querySelector('.user-menu-avatar-image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })
})

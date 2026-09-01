import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserMenu from './UserMenu.jsx'

const user1 = { email: 'demo@example.com', displayName: 'デモユーザー' }

describe('UserMenu', () => {
  it('shows the display name on the toggle, and the email only once opened', async () => {
    const user = userEvent.setup()
    render(<UserMenu user={user1} onEditName={vi.fn()} onLogout={vi.fn()} />)

    expect(screen.getByText('デモユーザー')).toBeInTheDocument()
    expect(screen.queryByText('demo@example.com')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /デモユーザー/ }))
    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.getByText('表示名を変更')).toBeInTheDocument()
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
  })

  it('calls onEditName and closes when "表示名を変更" is clicked', async () => {
    const user = userEvent.setup()
    const onEditName = vi.fn()
    render(<UserMenu user={user1} onEditName={onEditName} onLogout={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /デモユーザー/ }))
    await user.click(screen.getByText('表示名を変更'))

    expect(onEditName).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('ログアウト')).not.toBeInTheDocument()
  })

  it('calls onLogout and closes when "ログアウト" is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<UserMenu user={user1} onEditName={vi.fn()} onLogout={onLogout} />)

    await user.click(screen.getByRole('button', { name: /デモユーザー/ }))
    await user.click(screen.getByText('ログアウト'))

    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('表示名を変更')).not.toBeInTheDocument()
  })
})

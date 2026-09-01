import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../api/index.js', () => ({
  updateDisplayName: vi.fn(),
  updateUserAvatar: vi.fn(),
  removeUserAvatar: vi.fn(),
}))

const { default: AccountSettingsPage } = await import('./AccountSettingsPage.jsx')
const { updateDisplayName, updateUserAvatar, removeUserAvatar } = await import('../api/index.js')

const baseUser = { email: 'demo@example.com', displayName: 'デモユーザー', imageUrl: null }

describe('AccountSettingsPage', () => {
  it('shows the fallback initial when there is no avatar image, and the email', () => {
    render(<AccountSettingsPage user={baseUser} onUserChange={vi.fn()} />)
    expect(screen.getByText('デ')).toBeInTheDocument()
    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.queryByText('アイコンを削除')).not.toBeInTheDocument()
  })

  it('shows the avatar image and a remove button when imageUrl is set', () => {
    render(<AccountSettingsPage user={{ ...baseUser, imageUrl: 'https://example.com/a.png' }} onUserChange={vi.fn()} />)
    const img = document.querySelector('.account-avatar-preview')
    expect(img).toHaveAttribute('src', 'https://example.com/a.png')
    expect(screen.getByText('アイコンを削除')).toBeInTheDocument()
  })

  it('saves a new display name and calls onUserChange', async () => {
    const user = userEvent.setup()
    const updated = { ...baseUser, displayName: '改名後' }
    updateDisplayName.mockResolvedValue(updated)
    const onUserChange = vi.fn()
    render(<AccountSettingsPage user={baseUser} onUserChange={onUserChange} />)

    const input = screen.getByDisplayValue('デモユーザー')
    await user.clear(input)
    await user.type(input, '改名後')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByText('保存しました')).toBeInTheDocument()
    expect(updateDisplayName).toHaveBeenCalledWith('改名後')
    expect(onUserChange).toHaveBeenCalledWith(updated)
  })

  it('removes the avatar and calls onUserChange', async () => {
    const user = userEvent.setup()
    const updated = { ...baseUser, imageUrl: null }
    removeUserAvatar.mockResolvedValue(updated)
    const onUserChange = vi.fn()
    render(
      <AccountSettingsPage user={{ ...baseUser, imageUrl: 'https://example.com/a.png' }} onUserChange={onUserChange} />
    )

    await user.click(screen.getByText('アイコンを削除'))
    expect(removeUserAvatar).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(onUserChange).toHaveBeenCalledWith(updated))
  })
})

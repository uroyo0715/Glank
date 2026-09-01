import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NavMenu from './NavMenu.jsx'

function renderMenu(initialPath = '/projects') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavMenu />
    </MemoryRouter>
  )
}

describe('NavMenu', () => {
  it('is closed by default and opens when the hamburger button is clicked', async () => {
    const user = userEvent.setup()
    renderMenu()
    expect(screen.queryByText('プロジェクト一覧')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'メニュー' }))
    expect(screen.getByText('プロジェクト一覧')).toBeInTheDocument()
    expect(screen.getByText('SDK連携の使い方')).toBeInTheDocument()
    expect(screen.getByText('詳細セットアップガイド')).toBeInTheDocument()
  })

  it('highlights the item matching the current path', async () => {
    const user = userEvent.setup()
    renderMenu('/help')
    await user.click(screen.getByRole('button', { name: 'メニュー' }))
    expect(screen.getByText('SDK連携の使い方')).toHaveClass('active')
    expect(screen.getByText('プロジェクト一覧')).not.toHaveClass('active')
  })

  it('closes after selecting an item', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'メニュー' }))
    await user.click(screen.getByText('詳細セットアップガイド'))
    expect(screen.queryByText('プロジェクト一覧')).not.toBeInTheDocument()
  })

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <div>
          <NavMenu />
          <div data-testid="outside">outside</div>
        </div>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: 'メニュー' }))
    expect(screen.getByText('プロジェクト一覧')).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByText('プロジェクト一覧')).not.toBeInTheDocument()
  })
})

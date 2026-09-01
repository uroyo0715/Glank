import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputLogStrip from './InputLogStrip.jsx'

const bug = {
  id: 1,
  fps: 60,
  durationFrames: 120,
  inputs: [{ frame: 30, key: '←', label: '左移動', holdFrames: 0 }],
}

describe('InputLogStrip', () => {
  it('shows the timeline/text toggle and defaults to the timeline view when video-synced', () => {
    render(<InputLogStrip bug={bug} elapsed={0} onSelectFrame={vi.fn()} videoSynced />)
    expect(screen.getByRole('button', { name: 'タイムライン' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'テキスト' })).toBeInTheDocument()
    expect(screen.queryByText(/正確に対応していません/)).not.toBeInTheDocument()
  })

  it('forces the text view and shows a notice when the video is not synced with the input log', () => {
    render(<InputLogStrip bug={bug} elapsed={0} onSelectFrame={vi.fn()} videoSynced={false} />)
    expect(screen.queryByRole('button', { name: 'タイムライン' })).not.toBeInTheDocument()
    expect(screen.getByText(/正確に対応していません/)).toBeInTheDocument()
    // テキスト一覧の中身（キー入力）が見えている
    expect(screen.getByText('左移動')).toBeInTheDocument()
  })

  it('disables click-to-seek on the text rows when not synced', async () => {
    const user = userEvent.setup()
    const onSelectFrame = vi.fn()
    render(<InputLogStrip bug={bug} elapsed={0} onSelectFrame={onSelectFrame} videoSynced={false} />)

    await user.click(screen.getByText('左移動'))
    expect(onSelectFrame).not.toHaveBeenCalled()
  })

  it('keeps click-to-seek enabled on the text rows when synced', async () => {
    const user = userEvent.setup()
    const onSelectFrame = vi.fn()
    render(<InputLogStrip bug={bug} elapsed={0} onSelectFrame={onSelectFrame} videoSynced />)

    await user.click(screen.getByRole('button', { name: 'テキスト' }))
    await user.click(screen.getByText('左移動'))
    expect(onSelectFrame).toHaveBeenCalledWith(30)
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SetupGuidePage from './SetupGuidePage.jsx'

describe('SetupGuidePage', () => {
  it('renders the main sections', () => {
    render(<SetupGuidePage />)
    expect(screen.getByText('Unity SDK 詳細セットアップガイド')).toBeInTheDocument()
    expect(screen.getByText('1. コンポーネントの配線全体図')).toBeInTheDocument()
    expect(screen.getByText('2. どちらのInputLogRecorderを使うか')).toBeInTheDocument()
    expect(screen.getByText('6. GlankReportPromptUI（入力フォーム）の作り方')).toBeInTheDocument()
    expect(screen.getByText('7. うまく動かないときのチェックリスト')).toBeInTheDocument()
  })

  it('shows the component wiring diagram with the key components', () => {
    render(<SetupGuidePage />)
    expect(screen.getAllByText('BugReportTrigger').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/GlankNewInputSystemBridge/).length).toBeGreaterThan(0)
  })
})

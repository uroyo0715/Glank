import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/projects', label: 'プロジェクト一覧' },
  { path: '/help', label: 'SDK連携の使い方' },
  { path: '/setup-guide', label: '詳細セットアップガイド' },
]

export default function NavMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef(null)

  // メニュー外をクリックしたら閉じる。
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function handleNavigate(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="nav-menu" ref={rootRef}>
      <button
        type="button"
        className="nav-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="メニュー"
        aria-expanded={open}
      >
        ☰
      </button>
      {open && (
        <div className="nav-menu-dropdown">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

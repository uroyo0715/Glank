import React, { useEffect, useRef, useState } from 'react'

export default function UserMenu({ user, onEditName, onLogout }) {
  const [open, setOpen] = useState(false)
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

  function handleEditName() {
    setOpen(false)
    onEditName()
  }

  function handleLogout() {
    setOpen(false)
    onLogout()
  }

  const initial = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="user-menu-avatar">{initial}</span>
        <span className="user-menu-name">{user.displayName}</span>
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-identity">
            <div className="user-menu-display-name">{user.displayName}</div>
            <div className="user-menu-email">{user.email}</div>
          </div>
          <div className="user-menu-divider" />
          <button type="button" className="user-menu-item" onClick={handleEditName}>
            表示名を変更
          </button>
          <div className="user-menu-divider" />
          <button type="button" className="user-menu-item user-menu-item-danger" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      )}
    </div>
  )
}

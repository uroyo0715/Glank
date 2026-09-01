import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const navigate = useNavigate()

  // メニュー外をクリックしたら閉じる。
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function handleOpenSettings() {
    setOpen(false)
    navigate('/account')
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
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="user-menu-avatar user-menu-avatar-image" />
        ) : (
          <span className="user-menu-avatar">{initial}</span>
        )}
        <span className="user-menu-name">{user.displayName}</span>
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-identity">
            <div className="user-menu-display-name">{user.displayName}</div>
            <div className="user-menu-email">{user.email}</div>
          </div>
          <div className="user-menu-divider" />
          <button type="button" className="user-menu-item" onClick={handleOpenSettings}>
            アカウント設定
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

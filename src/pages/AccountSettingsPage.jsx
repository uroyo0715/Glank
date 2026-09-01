import React, { useState } from 'react'
import { updateDisplayName, updateUserAvatar, removeUserAvatar } from '../api/index.js'

export default function AccountSettingsPage({ user, onUserChange }) {
  const [nameInput, setNameInput] = useState(user.displayName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState(null)
  const [nameSaved, setNameSaved] = useState(false)

  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState(null)

  function handleNameSubmit(e) {
    e.preventDefault()
    if (!nameInput.trim()) return
    setNameSaving(true)
    setNameError(null)
    setNameSaved(false)
    updateDisplayName(nameInput.trim())
      .then((updated) => {
        onUserChange(updated)
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 1500)
      })
      .catch((err) => setNameError(err.message ?? String(err)))
      .finally(() => setNameSaving(false))
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!file) return
    setAvatarSaving(true)
    setAvatarError(null)
    updateUserAvatar(file)
      .then(onUserChange)
      .catch((err) => setAvatarError(err.message ?? String(err)))
      .finally(() => setAvatarSaving(false))
  }

  function handleAvatarRemove() {
    setAvatarSaving(true)
    setAvatarError(null)
    removeUserAvatar()
      .then(onUserChange)
      .catch((err) => setAvatarError(err.message ?? String(err)))
      .finally(() => setAvatarSaving(false))
  }

  const initial = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <main className="help-page account-settings-page">
      <div className="list-header">
        <div className="list-header-row">
          <h1>アカウント設定</h1>
        </div>
      </div>

      <div className="help-body">
        <section className="setup-section account-avatar-section">
          <h2>アイコン</h2>
          <div className="account-avatar-row">
            <label className="account-avatar-picker">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="" className="account-avatar-preview" />
              ) : (
                <span className="account-avatar-fallback">{initial}</span>
              )}
              <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={avatarSaving} hidden />
              <span className="account-avatar-edit-badge">変更</span>
            </label>
            <div className="account-avatar-actions">
              <p className="account-avatar-hint">
                クリックして画像をアップロードしてください。Googleアカウントでログインした際は、
                初回のみGoogleのプロフィール画像が初期値として設定されます。
              </p>
              {user.imageUrl && (
                <button type="button" onClick={handleAvatarRemove} disabled={avatarSaving} className="account-avatar-remove">
                  アイコンを削除
                </button>
              )}
              {avatarSaving && <span className="account-avatar-status">保存中...</span>}
              {avatarError && <div className="project-form-error">{avatarError}</div>}
            </div>
          </div>
        </section>

        <section className="setup-section">
          <h2>表示名</h2>
          <form className="account-name-form" onSubmit={handleNameSubmit}>
            <input
              className="account-name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button type="submit" disabled={nameSaving || !nameInput.trim()}>
              {nameSaving ? '保存中...' : '保存'}
            </button>
            {nameSaved && <span className="account-name-saved">保存しました</span>}
          </form>
          {nameError && <div className="project-form-error">{nameError}</div>}
        </section>

        <section className="setup-section">
          <h2>メールアドレス</h2>
          <p className="account-email">{user.email}</p>
        </section>
      </div>
    </main>
  )
}

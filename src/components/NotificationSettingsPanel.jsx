import React, { useEffect, useState } from 'react'

// Slack/Discordへの通知連携（Pro限定）。新規報告時にタイトル・タグ・報告者・詳細ページへの
// リンクだけを通知する（動画・操作ログの中身は含めない、実際の送信はserver/src/notify.js）。
export default function NotificationSettingsPanel({ projectId, onFetchStatus, onUpdateNotifications }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [slackInput, setSlackInput] = useState('')
  const [slackSaving, setSlackSaving] = useState(false)
  const [slackError, setSlackError] = useState(null)

  const [discordInput, setDiscordInput] = useState('')
  const [discordSaving, setDiscordSaving] = useState(false)
  const [discordError, setDiscordError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    onFetchStatus(projectId)
      .then((result) => {
        if (!cancelled) setStatus(result)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message ?? String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, onFetchStatus])

  function handleSlackSubmit(e) {
    e.preventDefault()
    setSlackSaving(true)
    setSlackError(null)
    onUpdateNotifications(projectId, { slackWebhookUrl: slackInput.trim() })
      .then((result) => {
        setStatus((s) => ({ ...s, ...result }))
        setSlackInput('')
      })
      .catch((err) => setSlackError(err.message ?? String(err)))
      .finally(() => setSlackSaving(false))
  }

  function handleSlackRemove() {
    setSlackSaving(true)
    setSlackError(null)
    onUpdateNotifications(projectId, { slackWebhookUrl: null })
      .then((result) => setStatus((s) => ({ ...s, ...result })))
      .catch((err) => setSlackError(err.message ?? String(err)))
      .finally(() => setSlackSaving(false))
  }

  function handleDiscordSubmit(e) {
    e.preventDefault()
    setDiscordSaving(true)
    setDiscordError(null)
    onUpdateNotifications(projectId, { discordWebhookUrl: discordInput.trim() })
      .then((result) => {
        setStatus((s) => ({ ...s, ...result }))
        setDiscordInput('')
      })
      .catch((err) => setDiscordError(err.message ?? String(err)))
      .finally(() => setDiscordSaving(false))
  }

  function handleDiscordRemove() {
    setDiscordSaving(true)
    setDiscordError(null)
    onUpdateNotifications(projectId, { discordWebhookUrl: null })
      .then((result) => setStatus((s) => ({ ...s, ...result })))
      .catch((err) => setDiscordError(err.message ?? String(err)))
      .finally(() => setDiscordSaving(false))
  }

  if (loading) {
    return (
      <div className="storage-panel">
        <div className="members-panel-hint">読み込み中...</div>
      </div>
    )
  }
  if (loadError) {
    return (
      <div className="storage-panel">
        <div className="project-form-error">{loadError}</div>
      </div>
    )
  }

  if (!status.proFeatures) {
    return (
      <div className="storage-panel">
        <div className="members-panel-label">通知連携（Slack・Discord）</div>
        <div className="storage-blocking-hint">
          Slack/Discordへの通知連携はProプラン限定の機能です。アップグレードが必要です。
        </div>
      </div>
    )
  }

  return (
    <div className="storage-panel">
      <div className="members-panel-label">通知連携（Slack・Discord）</div>
      <p className="storage-panel-hint">
        新規報告のたびに、タイトル・タグ・報告者・詳細ページへのリンクだけを通知します
        （動画・操作ログの中身は含めません）。
      </p>

      <div className="storage-config-forms">
        <form className="storage-config-form" onSubmit={handleSlackSubmit}>
          <div className="storage-config-form-head">
            <span>Slack</span>
            <span className={`storage-status-badge ${status.slackConfigured ? 'ok' : ''}`}>
              {status.slackConfigured ? '設定済み' : '未設定'}
            </span>
          </div>
          <input
            type="text"
            placeholder="Incoming Webhook URL"
            value={slackInput}
            onChange={(e) => setSlackInput(e.target.value)}
          />
          {slackError && <div className="project-form-error">{slackError}</div>}
          <button type="submit" disabled={slackSaving || !slackInput.trim()}>
            {slackSaving ? '保存中...' : 'Slackの接続情報を保存'}
          </button>
          {status.slackConfigured && (
            <button type="button" className="help-link" onClick={handleSlackRemove} disabled={slackSaving}>
              解除
            </button>
          )}
        </form>

        <form className="storage-config-form" onSubmit={handleDiscordSubmit}>
          <div className="storage-config-form-head">
            <span>Discord</span>
            <span className={`storage-status-badge ${status.discordConfigured ? 'ok' : ''}`}>
              {status.discordConfigured ? '設定済み' : '未設定'}
            </span>
          </div>
          <input
            type="text"
            placeholder="Webhook URL"
            value={discordInput}
            onChange={(e) => setDiscordInput(e.target.value)}
          />
          {discordError && <div className="project-form-error">{discordError}</div>}
          <button type="submit" disabled={discordSaving || !discordInput.trim()}>
            {discordSaving ? '保存中...' : 'Discordの接続情報を保存'}
          </button>
          {status.discordConfigured && (
            <button type="button" className="help-link" onClick={handleDiscordRemove} disabled={discordSaving}>
              解除
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

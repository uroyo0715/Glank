import React, { useState } from 'react'

// server/src/plans.jsのミラー（表示用）。数値・機能が変わったら両方直すこと。
const PLANS = [
  {
    key: 'free',
    label: 'Free',
    cta: 'Freeで始める',
    maxProjects: '2',
    maxMembersPerProject: '3',
    videoRetentionDays: '14日',
    customFields: true,
    notifications: false,
    export: false,
    managedStorage: false,
  },
  {
    key: 'basic',
    label: 'Basic',
    cta: 'Basicで始める',
    maxProjects: '5',
    maxMembersPerProject: '10',
    videoRetentionDays: '30日',
    customFields: true,
    notifications: false,
    export: false,
    managedStorage: false,
  },
  {
    key: 'pro',
    label: 'Pro',
    cta: 'Proで始める',
    maxProjects: '無制限',
    maxMembersPerProject: '無制限',
    videoRetentionDays: '90日',
    customFields: true,
    notifications: true,
    export: true,
    managedStorage: true,
  },
]

const PLAN_ROWS = [
  { label: 'プロジェクト数', key: 'maxProjects' },
  { label: 'メンバー数（1プロジェクトあたり）', key: 'maxMembersPerProject' },
  { label: '動画の保存期間', key: 'videoRetentionDays' },
  { label: '検索項目のカスタマイズ', key: 'customFields', boolean: true },
  { label: 'Slack・Discord通知連携', key: 'notifications', boolean: true },
  { label: 'CSV・PDFエクスポート', key: 'export', boolean: true },
  { label: 'managedストレージ（Turso/R2の個別設定が不要）', key: 'managedStorage', boolean: true },
]

const FEATURES = [
  {
    title: 'ホットキー1つで報告',
    desc: 'ゲーム内でホットキー（既定 F12）を押すだけで、直近のプレイ映像と入力ログがそのまま送信されます。バグ報告フォームを開いて記入する手間がありません。',
  },
  {
    title: '動画と入力ログを同時に記録',
    desc: '「何を押したときに何が起きたか」がタイムラインで一目で分かるため、再現手順を文章で書き起こす必要がありません。',
  },
  {
    title: 'Unity・Godot両対応',
    desc: 'どちらのゲームエンジンでも、同じ考え方のSDKでバグ報告機能を導入できます。',
  },
  {
    title: 'チームで管理できるダッシュボード',
    desc: 'ステータス管理・担当者アサイン・コメントでのやり取りまで、Web上でチームメンバーと完結できます。',
  },
]

export default function LandingPage({ onGoogleLogin }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function handleLogin() {
    setSubmitting(true)
    setError(null)
    onGoogleLogin().catch((err) => {
      setError(err.message ?? String(err))
      setSubmitting(false)
    })
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand">
          <div className="brand-dot" />
          <span>Glank</span>
        </div>
        <button type="button" className="landing-header-cta" onClick={handleLogin} disabled={submitting}>
          {submitting ? '接続中...' : 'ログイン'}
        </button>
      </header>

      <section className="landing-hero">
        <h1>
          ゲームのバグ報告を、
          <br />
          プレイしたその瞬間に。
        </h1>
        <p>
          Glankは、Unity・Godotで作ったゲームにホットキーひとつで導入できるバグ報告SDKと、
          チームで確認・管理できるWebダッシュボードです。プレイ中に気づいたバグを、
          動画と入力ログ付きでそのまま送信できます。
        </p>
        <button type="button" className="landing-hero-cta" onClick={handleLogin} disabled={submitting}>
          {submitting ? '接続中...' : 'Googleではじめる'}
        </button>
        <p className="landing-notice">
          サーバーの都合上、しばらく使われていないと起動に時間がかかることがあります
          （初回アクセス時は数十秒ほどお待ちください）。
        </p>
        {error && <div className="landing-error">{error}</div>}
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div className="landing-feature" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="landing-pricing">
        <h2>料金プラン</h2>
        <div className="landing-pricing-table-wrap">
          <table className="landing-pricing-table">
            <thead>
              <tr>
                <th></th>
                {PLANS.map((p) => (
                  <th key={p.key}>
                    <div className="landing-pricing-col-name">{p.label}</div>
                    <button
                      type="button"
                      className="landing-pricing-col-cta"
                      onClick={handleLogin}
                      disabled={submitting}
                    >
                      {submitting ? '接続中...' : p.cta}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="landing-pricing-row-label">{row.label}</td>
                  {PLANS.map((p) => (
                    <td key={p.key}>
                      {row.boolean ? (
                        p[row.key] ? (
                          <span className="landing-pricing-check">○</span>
                        ) : (
                          <span className="landing-pricing-dash">—</span>
                        )
                      ) : (
                        p[row.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

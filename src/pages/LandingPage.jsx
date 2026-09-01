import React, { useState } from 'react'

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
    </div>
  )
}

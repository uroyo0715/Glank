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

function IconBolt(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}
function IconFilm(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M9 5v14M15 5v14" />
    </svg>
  )
}
function IconLayers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  )
}
function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}
function IconSpark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: IconBolt,
    title: 'ホットキー1つで報告',
    desc: 'ゲーム内でホットキー（既定 F12）を押すだけで、直近のプレイ映像と入力ログがそのまま送信されます。バグ報告フォームを開いて記入する手間がありません。',
  },
  {
    icon: IconFilm,
    title: '動画と入力ログを同時に記録',
    desc: '「何を押したときに何が起きたか」がタイムラインで一目で分かるため、再現手順を文章で書き起こす必要がありません。',
  },
  {
    icon: IconLayers,
    title: 'Unity・Godot両対応',
    desc: 'どちらのゲームエンジンでも、同じ考え方のSDKでバグ報告機能を導入できます。',
  },
  {
    icon: IconGrid,
    title: 'チームで管理できるダッシュボード',
    desc: 'ステータス管理・担当者アサイン・コメントでのやり取りまで、Web上でチームメンバーと完結できます。',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Googleでログイン',
    desc: '面倒な登録手続きは不要。ワンクリックですぐにあなた専用のプロジェクトが作成されます。',
  },
  {
    number: '02',
    title: 'ゲームにSDKを導入',
    desc: 'Unity・GodotどちらでもOK。SDKを取り込み、発行されたAPIキーを設定するだけで準備完了です。',
  },
  {
    number: '03',
    title: 'ホットキーで報告するだけ',
    desc: 'プレイ中にバグへ気づいたらホットキーを押すだけ。動画と入力ログ付きの報告がチームのダッシュボードに届きます。',
  },
]

const FAQS = [
  {
    q: '無料で使えますか？',
    a: 'はい。Freeプランなら、プロジェクト数や動画保存期間などに一定の制限はありますが無料でご利用いただけます。チーム規模や必要な機能に応じて、Basic・Proプランへのアップグレードも可能です。',
  },
  {
    q: 'Unity以外のゲームエンジンにも対応していますか？',
    a: 'はい。UnityとGodot、両方に対応したSDKを提供しています。どちらも同じ考え方（ホットキー1つで動画と入力ログを送信）で導入できます。',
  },
  {
    q: '報告された動画・入力ログはどこに保存されますか？',
    a: '既定では、チーム自身のデータベース・ストレージに保存する構成です。Proプランでは、個別の接続設定が不要な共有ストレージも選べます。',
  },
  {
    q: '入力ログを見れば、バグの再現手順を書き起こさなくていいのですか？',
    a: 'はい。「何を押したときに何が起きたか」が動画と同じタイムライン上で確認できるため、多くの場合、文章での再現手順の記述が不要になります。',
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

  function scrollToFeatures(e) {
    e.preventDefault()
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
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
        <div className="landing-hero-eyebrow">
          <IconSpark />
          BUG REPORT SDK FOR UNITY / GODOT
        </div>
        <h1>
          ゲームのバグ報告を、
          <br />
          <span className="landing-hero-highlight">プレイしたその瞬間に</span>。
        </h1>
        <p>
          Glankは、Unity・Godotで作ったゲームにホットキーひとつで導入できるバグ報告SDKと、
          チームで確認・管理できるWebダッシュボードです。プレイ中に気づいたバグを、
          動画と入力ログ付きでそのまま送信できます。
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-hero-cta" onClick={handleLogin} disabled={submitting}>
            {submitting ? '接続中...' : 'Googleではじめる'}
          </button>
          <a href="#features" className="landing-hero-cta-secondary" onClick={scrollToFeatures}>
            機能を見る
          </a>
        </div>
        <p className="landing-notice">
          サーバーの都合上、しばらく使われていないと起動に時間がかかることがあります
          （初回アクセス時は数十秒ほどお待ちください）。
        </p>
        {error && <div className="landing-error">{error}</div>}
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">FEATURES</div>
          <h2>ゲームのバグ報告に、ちょうどいい形を。</h2>
          <p>押して、送るだけ。チームで確認できるところまでを1つにまとめました。</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature" key={f.title}>
              <div className="landing-feature-icon">
                <f.icon />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-steps">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">HOW IT WORKS</div>
          <h2>かんたん3ステップ</h2>
          <p>導入から報告までを、迷わず進められます。</p>
        </div>
        <div className="landing-steps-grid">
          {STEPS.map((s) => (
            <div className="landing-step" key={s.number}>
              <div className="landing-step-number">{s.number}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-pricing">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">PRICING</div>
          <h2>料金プラン</h2>
          <p>チーム規模に合わせて選べます。</p>
        </div>
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

      <section className="landing-faq">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">FAQ</div>
          <h2>よくある質問</h2>
        </div>
        <div className="landing-faq-list">
          {FAQS.map((f) => (
            <details className="landing-faq-item" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="landing-final-cta-panel">
          <h2>今日から、バグ報告をもっとスムーズに。</h2>
          <p>プレイして気づいた瞬間を、そのままチームに届けましょう。</p>
          <button type="button" className="landing-hero-cta" onClick={handleLogin} disabled={submitting}>
            {submitting ? '接続中...' : 'Googleではじめる'}
          </button>
        </div>
      </section>
    </div>
  )
}

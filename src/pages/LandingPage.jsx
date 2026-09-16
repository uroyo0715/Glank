import React, { useState } from 'react'
import ImagePlaceholder from '../components/ImagePlaceholder'

// server/src/plans.jsのミラー（表示用）。数値・機能が変わったら両方直すこと。
const PLANS = [
  {
    key: 'free',
    label: 'Free',
    cta: 'Freeプランを試す',
    price: '¥0',
    priceNote: '月額 / 税抜き',
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
    cta: 'Basicプランを比較',
    price: '¥未定',
    priceNote: '価格未定 / 月額 / 税抜き',
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
    cta: 'Proプランを比較',
    price: '¥未定',
    priceNote: '価格未定 / 月額 / 税抜き',
    maxProjects: '無制限',
    maxMembersPerProject: '無制限',
    videoRetentionDays: '90日',
    customFields: true,
    notifications: true,
    export: true,
    managedStorage: true,
    highlighted: true,
  },
]

// 各プランカードの箇条書きは、上のPLANS配列の値からここで整形する
// （数値そのものをここに書き写さない。表記だけを決める）。
const PLAN_ROWS = [
  { key: 'maxProjects', format: (v) => `プロジェクト${v}` },
  { key: 'maxMembersPerProject', format: (v) => `メンバー${v}人/プロジェクト` },
  { key: 'videoRetentionDays', format: (v) => `動画保存${v}` },
  { key: 'notifications', boolean: true, label: 'Slack・Discord通知連携' },
  { key: 'export', boolean: true, label: 'CSV・PDFエクスポート' },
  { key: 'managedStorage', boolean: true, label: 'managedストレージ対応' },
]

function planFeatureLines(plan) {
  return PLAN_ROWS.filter((row) => (row.boolean ? plan[row.key] : true)).map((row) =>
    row.boolean ? row.label : row.format(plan[row.key])
  )
}

function IconSpark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
  )
}
function IconVideo(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
    </svg>
  )
}
function IconLayoutDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
function IconGamepad2(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="6" x2="10" y1="11" y2="11" />
      <line x1="8" x2="8" y1="9" y2="13" />
      <line x1="15" x2="15.01" y1="12" y2="12" />
      <line x1="18" x2="18.01" y1="10" y2="10" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </svg>
  )
}
function IconLink2(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  )
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function IconChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="7 4 20 12 7 20 7 4" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: IconVideo,
    title: '自動キャプチャ',
    desc: 'ホットキーを押した瞬間に、直近数十秒のゲームプレイ動画とプレイヤーの入力操作ログを自動で記録します。',
  },
  {
    icon: IconLayoutDashboard,
    title: 'ダッシュボード管理',
    desc: '集まったバグレポートは一覧で確認可能。ステータス更新、担当者のアサイン、開発者同士の議論も容易に。',
  },
  {
    icon: IconGamepad2,
    title: 'Unity対応（Godotは今後対応予定）',
    desc: 'Unity向けの軽量なSDKを提供。Godot対応は今後実装予定です。インストールはパッケージを追加するだけです。',
  },
  {
    icon: IconLink2,
    title: 'ワンクリック共有',
    desc: 'バグレポートは自動で一意の共有URLを発行。SlackやDiscordに即座に通知、共有が可能です。',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'ログイン & 新規登録',
    desc: 'Googleアカウントで即座にサインイン。1分以内に新しいプロジェクト環境が用意されます。',
  },
  {
    number: '02',
    title: 'SDKの組み込み',
    desc: 'UnityPackageを追加。APIキーを設定するだけの簡単セットアップです。（Godotは今後対応予定）',
  },
  {
    number: '03',
    title: 'F12を押すだけ',
    desc: 'プレイ中にF12を押すだけ。自動で動画・ログの付いた詳細レポートがダッシュボードへ届きます。',
  },
]

const LOG_ROWS = [
  { time: '[00:02.14]', text: 'KEY_DOWN: W (Move Forward)' },
  { time: '[00:02.45]', text: 'KEY_DOWN: Space (Jump)' },
  { time: '[00:03.10]', text: 'TRIGGER: F12 (Capture Bug)', variant: 'trigger' },
  { time: '[00:03.11]', text: 'SDK_SEND: Payload compiled. Video size: 1.4MB', variant: 'muted' },
  { time: '[00:03.20]', text: 'SUCCESS: ID: #GLK-4091 uploaded to Cloud', variant: 'success' },
]

const FAQS = [
  {
    q: '無料プランに制限はありますか？',
    a: 'はい。2つのプロジェクトまで登録可能で、各チケット内のビデオおよびログデータの保存期間は14日間までとなっています。',
  },
  {
    q: 'どのバージョンのUnityに対応していますか？Godotは？',
    a: 'Unity 2021.3 LTS以降に対応しています。Godotへの対応は今後実装予定です。詳細な動作環境はドキュメントで公開しています。',
  },
  {
    q: '動画データはどこに保存されますか？',
    a: 'キャプチャされたデータは暗号化され、弊社の安全なクラウドストレージ（Proプランは独自ストレージ連携も可能）に保存されます。',
  },
  {
    q: 'チームメンバーの追加方法は？',
    a: 'ダッシュボードの「メンバー管理」より、招待メールを送るだけで、同じプロジェクトを安全に共同管理できます。',
  },
  {
    q: 'SDKの導入にどれくらい時間がかかりますか？',
    a: 'SDKパッケージのダウンロード、ゲームプロジェクトへの配置、APIの設定(コピー＆ペースト)で設定が完了します。約5分で最初のレポート送信が可能です。',
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

  function scrollTo(id) {
    return (e) => {
      e.preventDefault()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <img src="/Glank_icon.png" alt="" />
          <span>GLANK</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#features" onClick={scrollTo('features')}>Features</a>
          <a href="#how-it-works" onClick={scrollTo('how-it-works')}>How it works</a>
          <a href="#pricing" onClick={scrollTo('pricing')}>Pricing</a>
          <a href="#faq" onClick={scrollTo('faq')}>FAQ</a>
        </nav>
        <div className="landing-header-actions">
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogin() }}>ログイン</a>
          <button type="button" className="landing-header-cta" onClick={handleLogin} disabled={submitting}>
            {submitting ? '接続中...' : 'Get Started'}
          </button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-eyebrow">
          <IconSpark />
          UNITY / GODOT SDK 対応
        </div>
        <h1>
          ホットキー1つで、
          <br />
          <span className="landing-hero-highlight">バグ報告が完了する</span>
        </h1>
        <p>
          ゲームをプレイ中にキーを押すだけで、直近のビデオキャプチャとキーストロークログを自動送信。
          面倒なバグ報告フォームや再現手順の手書きは、もう不要です。
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-hero-cta" onClick={handleLogin} disabled={submitting}>
            {submitting ? '接続中...' : 'Googleアカウントで始める'}
          </button>
        </div>
        <p className="landing-notice">
          サーバーの都合上、しばらく使われていないと起動に時間がかかることがあります
          （初回アクセス時は数十秒ほどお待ちください）。
        </p>
        {error && <div className="landing-error">{error}</div>}

        <div className="landing-mockup">
          <div className="landing-mockup-header">
            <div className="landing-mockup-meta">
              <div className="landing-mockup-dots">
                <span /><span /><span />
              </div>
              <div className="landing-mockup-title">
                glank-dashboard // Ticket: GLK-4091 (Character clipping physics)
              </div>
            </div>
            <div className="landing-mockup-tag">status: active</div>
          </div>
          <div className="landing-mockup-body">
            <div className="landing-mockup-video-panel">
              <div className="landing-mockup-panel-title-row">
                <strong>CAPTURED VIDEO (Last 15s)</strong>
                <span>Format: WebM / 1080p</span>
              </div>
              <div className="landing-mockup-video-thumb">
                <ImagePlaceholder caption="ゲームプレイのキャプチャ動画サムネイル" />
                <div className="landing-mockup-play">
                  <IconPlay />
                </div>
              </div>
            </div>
            <div className="landing-mockup-log-panel">
              <strong>KEYSTROKE &amp; SIGNAL LOG</strong>
              <div className="landing-mockup-log-timeline">
                {LOG_ROWS.map((row) => (
                  <div
                    className={`landing-mockup-log-row${row.variant ? ` is-${row.variant}` : ''}`}
                    key={row.time}
                  >
                    <time>{row.time}</time>
                    <span>{row.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">FEATURES</div>
          <h2>主な機能</h2>
          <p>バグ報告にまつわる一切のストレスを取り除き、開発スピードを圧倒的に高速化</p>
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

      <section className="landing-steps" id="how-it-works">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">WORKFLOW</div>
          <h2>使い方</h2>
          <p>一度設定すれば、テストプレイはいつものゲーム進行のままでOK。</p>
        </div>
        <div className="landing-steps-grid">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="landing-step">
                <div className="landing-step-number">{s.number}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <IconArrowRight className="landing-step-arrow" width={18} height={18} />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">PRICING</div>
          <h2>料金プラン</h2>
          <p>※ 料金プランは今後変更される可能性があります</p>
        </div>
        <div className="landing-pricing-grid">
          {PLANS.map((p) => (
            <div className={`landing-pricing-card${p.highlighted ? ' is-highlighted' : ''}`} key={p.key}>
              <div className="landing-pricing-card-header">
                <h3>{p.label}</h3>
                <p className="landing-pricing-card-price">{p.price}</p>
                <p className="landing-pricing-card-price-note">{p.priceNote}</p>
              </div>
              <div className="landing-pricing-card-features">
                {planFeatureLines(p).map((line) => (
                  <div className="landing-pricing-card-feature" key={line}>
                    <IconCheck />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="landing-pricing-card-cta"
                onClick={handleLogin}
                disabled={submitting}
              >
                {submitting ? '接続中...' : p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-faq" id="faq">
        <div className="landing-section-header">
          <div className="landing-section-eyebrow">FAQ</div>
          <h2>よくある質問</h2>
        </div>
        <div className="landing-faq-list">
          {FAQS.map((f) => (
            <details className="landing-faq-item" key={f.q}>
              <summary>
                {f.q}
                <IconChevronDown />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="landing-final-cta-panel">
          <div>
            <h2>バグ報告を、もっとラクに</h2>
            <p>Glankの軽量SDKで、デベロッパーとテスター間のギャップを完全に解消。今すぐチームのデバッグサイクルを革新させましょう。</p>
          </div>
          <div>
            <button type="button" className="landing-hero-cta" onClick={handleLogin} disabled={submitting}>
              {submitting ? '接続中...' : 'Googleアカウントで始める →'}
            </button>
            <p className="landing-notice" style={{ marginTop: 12 }}>
              ※ クレジットカード登録不要。いつでもフリープランに切り替え可能です。
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo">
              <img src="/Glank_icon.png" alt="" />
              <span>GLANK</span>
            </div>
            <p>ゲーム開発チーム向け自動ビデオキャプチャ &amp; バグ再現ログシステム。効率的なゲームテスト環境を提供します。</p>
          </div>
          <div className="landing-footer-engines">
            <div className="landing-footer-engines-label">Supported Engines</div>
            <div className="landing-footer-badges">
              <span className="landing-footer-badge">Unity Engine</span>
              <span className="landing-footer-badge">Godot（対応予定）</span>
            </div>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-link-col">
              <p className="landing-footer-link-col-label">Product</p>
              <span>Features</span>
              <span>How It Works</span>
              <span>Pricing</span>
            </div>
            <div className="landing-footer-link-col">
              <p className="landing-footer-link-col-label">Legal &amp; Support</p>
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
              <span>Contact Us</span>
            </div>
          </div>
        </div>
        <div className="landing-footer-divider" />
        <div className="landing-footer-bottom">
          <span>© 2026 Glank SDK Inc. All rights reserved.</span>
          <span>Made for Game Developers.</span>
        </div>
      </footer>
    </div>
  )
}

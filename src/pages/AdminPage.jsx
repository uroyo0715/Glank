import React, { useEffect, useState } from 'react'
import { fetchAdminStats } from '../api/index.js'
import { LineChart, BarChart } from '../components/AdminCharts.jsx'

function gameEngineLabel(key) {
  if (key === 'unity') return 'Unity'
  if (key === 'godot') return 'Godot'
  if (key === 'other') return 'その他'
  return '未設定'
}

function storageModeLabel(key) {
  if (key === 'self_hosted') return '自前（Turso/R2）'
  if (key === 'managed') return 'managed'
  return key
}

function statusLabel(key) {
  if (key === 'todo') return '未対応'
  if (key === 'in_progress') return '対応中'
  if (key === 'review') return '確認待ち'
  if (key === 'done') return '完了'
  return key
}

function toBarData(record, labelFn = (k) => k) {
  return Object.entries(record).map(([key, value]) => ({ label: labelFn(key), value }))
}

// 通常のナビゲーションからはどこにもリンクしていない（URLを直接知っている必要がある）うえ、
// サーバー側もGLANK_ADMIN_EMAILSに含まれるアカウントのみ通す（see server/src/auth.js requireAdmin）。
// このページ自体は「見た目を隠す」以上の意味を持たず、実際のアクセス制御はサーバー側の403で行う。
// メールアドレス・プロジェクト名等は個人・機密情報になるため、件数の集計のみを表示する
// （サーバー側のgetAdminStatsも生データは返さない）。
export default function AdminPage() {
  const [state, setState] = useState('loading') // 'loading' | 'ready' | 'forbidden' | 'error'
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAdminStats()
      .then((data) => {
        setStats(data)
        setState('ready')
      })
      .catch((err) => {
        const message = err.message ?? String(err)
        if (message === 'forbidden' || message === 'login required') {
          setState('forbidden')
        } else {
          setError(message)
          setState('error')
        }
      })
  }, [])

  if (state === 'loading') {
    return <div className="state-panel">読み込み中...</div>
  }

  if (state === 'forbidden') {
    return (
      <div className="state-panel state-panel-error">
        <p>このページを見る権限がありません。</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="state-panel state-panel-error">
        <p>取得に失敗しました: {error}</p>
      </div>
    )
  }

  return (
    <main className="admin-page">
      <h1>管理者ページ</h1>

      <div className="admin-summary-row">
        <div className="admin-summary-card">
          <div className="admin-summary-value">{stats.totalUsers}</div>
          <div className="admin-summary-label">登録ユーザー数</div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-value">{stats.totalProjects}</div>
          <div className="admin-summary-label">プロジェクト数</div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-value">{stats.totalBugs}</div>
          <div className="admin-summary-label">バグ報告数</div>
        </div>
      </div>

      <section className="admin-section">
        <h2>月別の新規登録ユーザー数</h2>
        <LineChart data={stats.usersBySignupMonth} color="var(--accent-cyan)" />
      </section>

      <section className="admin-section">
        <h2>月別のバグ報告数</h2>
        <LineChart data={stats.bugsByMonth} color="var(--accent-amber)" />
      </section>

      <section className="admin-section">
        <h2>エンジン別プロジェクト数</h2>
        <BarChart data={toBarData(stats.projectsByEngine, (k) => gameEngineLabel(k === 'unset' ? '' : k))} />
      </section>

      <section className="admin-section">
        <h2>ストレージ方式別プロジェクト数</h2>
        <BarChart data={toBarData(stats.projectsByStorageMode, storageModeLabel)} />
      </section>

      <section className="admin-section">
        <h2>ステータス別バグ報告数</h2>
        <BarChart data={toBarData(stats.bugsByStatus, statusLabel)} color="var(--accent-amber)" />
      </section>

      <section className="admin-section">
        <h2>プラットフォーム別バグ報告数</h2>
        <BarChart data={toBarData(stats.bugsByPlatform)} color="var(--accent-amber)" />
      </section>

      <section className="admin-section">
        <h2>タグ別バグ報告数</h2>
        <p className="admin-section-note">
          「quick」はホットキー即送信、「crash」「softlock」は自動検知（CrashDetector/FreezeWatchdog）
          経由の報告を示す。SDKの自動検知機能がどれだけ使われているかの目安になる。
        </p>
        <BarChart data={toBarData(stats.bugsByTag)} />
      </section>
    </main>
  )
}

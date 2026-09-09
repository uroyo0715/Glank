import React, { useEffect, useState } from 'react'
import { fetchAdminStats } from '../api/index.js'

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
        <table className="admin-table">
          <thead>
            <tr>
              <th>月</th>
              <th>登録数</th>
            </tr>
          </thead>
          <tbody>
            {stats.usersBySignupMonth.map((row) => (
              <tr key={row.month}>
                <td>{row.month === 'unknown' ? '不明（登録日時未記録）' : row.month}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-section">
        <h2>エンジン別プロジェクト数</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>エンジン</th>
              <th>プロジェクト数</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.projectsByEngine).map(([engine, count]) => (
              <tr key={engine}>
                <td>{gameEngineLabel(engine === 'unset' ? '' : engine)}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-section">
        <h2>ストレージ方式別プロジェクト数</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ストレージ方式</th>
              <th>プロジェクト数</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.projectsByStorageMode).map(([mode, count]) => (
              <tr key={mode}>
                <td>{storageModeLabel(mode)}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

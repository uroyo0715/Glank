import React, { useEffect, useState } from 'react'
import { fetchAdminStats } from '../api/index.js'
import { formatCreatedAt } from '../utils/formatDate.js'

function gameEngineLabel(key) {
  if (key === 'unity') return 'Unity'
  if (key === 'godot') return 'Godot'
  if (key === 'other') return 'その他'
  return '未設定'
}

// 通常のナビゲーションからはどこにもリンクしていない（URLを直接知っている必要がある）うえ、
// サーバー側もGLANK_ADMIN_EMAILSに含まれるアカウントのみ通す（see server/src/auth.js requireAdmin）。
// このページ自体は「見た目を隠す」以上の意味を持たず、実際のアクセス制御はサーバー側の403で行う。
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
        <h2>ユーザー一覧</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>表示名</th>
              <th>登録日時</th>
            </tr>
          </thead>
          <tbody>
            {stats.users.map((u) => (
              <tr key={u.email}>
                <td>{u.email}</td>
                <td>{u.displayName}</td>
                <td>{u.createdAt ? formatCreatedAt(u.createdAt) : '不明'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-section">
        <h2>プロジェクト一覧</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名前</th>
              <th>エンジン</th>
              <th>ストレージ</th>
              <th>バグ報告数</th>
              <th>メンバー数</th>
            </tr>
          </thead>
          <tbody>
            {stats.projects.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{gameEngineLabel(p.gameEngine)}</td>
                <td>{p.storageMode}</td>
                <td>{p.bugCount}</td>
                <td>{p.memberCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

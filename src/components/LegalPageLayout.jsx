import React from 'react'
import { Link } from 'react-router-dom'

export default function LegalPageLayout({ title, updatedAt, children }) {
  return (
    <div className="legal-page">
      <header className="legal-page-header">
        <Link to="/" className="legal-page-brand">
          <img src="/Glank_icon.png" alt="" />
          <span>GLANK</span>
        </Link>
        <Link to="/" className="legal-page-back">
          ← トップページへ戻る
        </Link>
      </header>
      <main className="help-page legal-page-body">
        <div className="list-header">
          <div className="list-header-row">
            <h1>{title}</h1>
          </div>
          <p className="help-lead">最終更新日: {updatedAt}</p>
        </div>
        {children}
      </main>
    </div>
  )
}

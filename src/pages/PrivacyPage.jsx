import React from 'react'
import LegalPageLayout from '../components/LegalPageLayout.jsx'

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="プライバシーポリシー" updatedAt="2026年9月16日">
      <div className="help-body">
        <section className="legal-section">
          <p className="help-lead">
            Glank SDK Inc.（以下「運営者」）は、バグ報告・管理サービス「Glank」（以下「本サービス」）
            において、以下の方針に基づき利用者の情報を取り扱います。
          </p>

          <h2>1. 取得する情報</h2>
          <ul className="legal-list">
            <li>Googleアカウントによるログイン時に取得するメールアドレス・表示名・プロフィール画像</li>
            <li>
              利用者が作成するバグ報告の内容（タイトル、説明文、プレイ動画、入力操作ログ、スクリーンショット、
              コメント等）
            </li>
            <li>プロジェクト・チームメンバー管理に関する情報（招待したメールアドレス等）</li>
            <li>アクセスログ・エラーログ等、サービス運用上必要な技術情報</li>
          </ul>

          <h2>2. 利用目的</h2>
          <ul className="legal-list">
            <li>本サービスの提供・維持・改善のため</li>
            <li>アカウント認証、プロジェクト・チーム管理機能の提供のため</li>
            <li>障害対応・お問い合わせ対応のため</li>
            <li>Slack・Discord通知連携など、利用者が設定した機能の実行のため</li>
          </ul>

          <h2>3. 第三者提供・委託先</h2>
          <p className="help-lead">
            運営者は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供しません。
            本サービスは、以下の外部サービスを利用しています。
          </p>
          <ul className="legal-list">
            <li>Google（ログイン認証のため。Googleのプライバシーポリシーが別途適用されます）</li>
            <li>
              Turso（データベース）・Cloudflare R2等（動画・画像ストレージ）— self_hosted方式の
              プロジェクトでは、利用者自身が契約したアカウントに保存されるため、運営者はその保存内容に
              アクセスする手段を持ちません。導入用プロジェクト「GlankSampleGame」のみ、運営者が
              管理するTurso・R2アカウントを既定値として使用します
            </li>
          </ul>

          <h2>4. Cookie・セッション情報</h2>
          <p className="help-lead">
            本サービスは、ログイン状態を維持するためにセッションCookieを使用します。このCookieは
            認証目的以外には使用せず、広告目的のトラッキングは行いません。
          </p>

          <h2>5. データの保存期間</h2>
          <p className="help-lead">
            バグ報告に添付された動画は、契約プランに応じた保存期間（Freeプランは14日等）を経過すると
            自動的に削除されます。報告本体（タイトル・説明文等）は、プロジェクトまたはアカウントが
            削除されるまで保持されます。
          </p>

          <h2>6. 安全管理措置</h2>
          <p className="help-lead">
            Turso・R2等の接続情報やAPIキーといった秘匿情報は、暗号化（AES-256-GCM）した上でデータベースに
            保存しており、平文のまま外部から参照できない設計としています。通信はHTTPSにより暗号化されます。
          </p>

          <h2>7. 開示・訂正・削除等のご請求</h2>
          <p className="help-lead">
            利用者は、自身に関する個人情報の開示・訂正・削除を求めることができます。
            プロジェクト・アカウントの削除は、本サービスの管理画面から行うことができます。
          </p>

          <h2>8. 本ポリシーの改定</h2>
          <p className="help-lead">
            運営者は、必要に応じて本ポリシーを改定することがあります。改定後の内容は、本ページに
            掲載した時点から効力を生じるものとします。
          </p>
        </section>
      </div>
    </LegalPageLayout>
  )
}

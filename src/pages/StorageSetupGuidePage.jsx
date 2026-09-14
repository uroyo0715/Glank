import React from 'react'

export default function StorageSetupGuidePage() {
  return (
    <main className="help-page">
      <div className="list-header">
        <div className="list-header-row">
          <h1>ストレージ設定（Turso・Cloudflare R2）の手順</h1>
        </div>
      </div>

      <div className="help-body">
        <section className="help-storage-section">
          <p className="help-lead">
            プロジェクトごとの報告データベースと動画・画像の保存先には、自分のアカウントを使う
            （<span className="mono">self_hosted</span>）方式を使います。プロジェクトのバグ一覧画面の
            「ストレージ設定」から設定してください（Glank共有の<span className="mono">managed</span>方式は
            今後提供予定で、現時点では選択できません）。
          </p>
          <p className="help-lead">
            データベースはlibsql互換のサーバーであれば、動画・画像ストレージはS3互換のAPIを持つ
            サービスであれば、Turso・Cloudflare R2以外でも使えます（AWS S3・Backblaze B2・MinIO等）。
            ここでは一番手順が簡単な組み合わせとして、Turso・Cloudflare R2を使う手順を案内します。
          </p>

          <ol className="help-steps">
            <li>
              <h2>1. データベース・ストレージを用意する</h2>
              <p>
                報告機能を使うには、下記の手順でTurso（データベース）とCloudflare R2（動画・画像）を
                用意し、ストレージ設定フォームに接続情報を入力してください。
              </p>
            </li>

            <li>
              <h2>2. Turso（データベース）を用意する</h2>
              <p>
                <a href="https://turso.tech/" target="_blank" rel="noreferrer" className="help-external-link">
                  Tursoのダッシュボード
                </a>
                にアクセスし、アカウント作成後「Create Database」から新しいデータベースを1つ作成します。
              </p>
              <p>
                Windows環境ではTurso CLIのインストーラーが対応していないため、Webダッシュボードでの
                作成を推奨します。作成したデータベースの詳細ページで、以下の2つを取得して
                ストレージ設定フォームに入力してください。
              </p>
              <p>
                自前でホストしているlibsql互換サーバー（<span className="mono">sqld</span>等）を使う場合は、
                そのサーバーのURL・トークンを同じ欄に入力すれば動きます。
              </p>
              <table className="help-table">
                <tbody>
                  <tr>
                    <td className="mono">Database URL</td>
                    <td>
                      データベース詳細ページに表示される<span className="mono">libsql://xxx.turso.io</span>
                      形式のURL
                    </td>
                  </tr>
                  <tr>
                    <td className="mono">Auth Token</td>
                    <td>
                      同じページの「Create Token」（または「Generate Token」）で発行したトークン。
                      発行直後しか表示されないので、その場でコピーしてください
                    </td>
                  </tr>
                </tbody>
              </table>
            </li>

            <li>
              <h2>3. Cloudflare R2（動画・画像ストレージ）を用意する</h2>
              <p>
                <a
                  href="https://dash.cloudflare.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="help-external-link"
                >
                  Cloudflareダッシュボード
                </a>
                の「R2」からバケットを1つ作成し、バケットの設定でパブリックアクセス
                （<span className="mono">r2.dev</span>のサブドメイン、または独自ドメイン）を有効にします。
              </p>
              <p>
                続けて「R2 API トークン」を発行し、以下をストレージ設定フォームに入力してください。
              </p>
              <p>
                R2以外のS3互換ストレージを使う場合は、そのサービスが案内するエンドポイントURL・
                アクセスキー・バケット名・公開URLを同じ欄に入力すれば動きます。
              </p>
              <table className="help-table">
                <tbody>
                  <tr>
                    <td className="mono">エンドポイントURL</td>
                    <td>
                      R2の場合は
                      <span className="mono">https://&lt;Account ID&gt;.r2.cloudflarestorage.com</span>
                      （Account IDはCloudflareダッシュボードの右側などに表示されている）
                    </td>
                  </tr>
                  <tr>
                    <td className="mono">Access Key ID / Secret Access Key</td>
                    <td>R2 APIトークン発行時に表示される値（Secretは発行直後しか表示されません）</td>
                  </tr>
                  <tr>
                    <td className="mono">Bucket名</td>
                    <td>作成したR2バケットの名前</td>
                  </tr>
                  <tr>
                    <td className="mono">公開URL</td>
                    <td>
                      バケット設定で有効にしたパブリックアクセスのURL（例:{' '}
                      <span className="mono">https://pub-xxx.r2.dev</span>）。
                      <strong>末尾に「/」を付けないでください</strong>（付けると画像・動画のURLが
                      二重スラッシュになり、正しく表示されないことがあります）
                    </td>
                  </tr>
                </tbody>
              </table>
              <p>
                値をコピー&amp;ペーストする際、全角スペースや全角記号が誤って混ざると接続エラーの原因に
                なるため、貼り付けた後に文字化けや余分な文字が入っていないか確認してください。
              </p>
            </li>
          </ol>
        </section>
      </div>
    </main>
  )
}

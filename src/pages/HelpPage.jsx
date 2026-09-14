import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import SegmentedToggle from '../components/SegmentedToggle.jsx'
import ImagePlaceholder from '../components/ImagePlaceholder.jsx'
import { sdkDownloadUrl } from '../api/index.js'

function SdkDownloadButton({ engine, label }) {
  const url = sdkDownloadUrl(engine)
  if (!url) return null
  return (
    <a className="sdk-download-button" href={url} download>
      {label}をダウンロード（zip）
    </a>
  )
}

function UnityGuide() {
  return (
    <ol className="help-steps">
      <li>
        <h2>1. このWebアプリでプロジェクトを作成する</h2>
        <p>
          プロジェクト一覧画面の「新規プロジェクト」から、タイトル・ティザー画像（任意）・
          使用ゲームエンジン（Unity）を指定して作成します。作成したプロジェクトを開き、
          右上の「管理」メニューから「SDK接続情報を表示」を選ぶと、Unity側の設定で使う
          プロジェクトID・API Key・バックエンドURLがまとめて確認できます。
        </p>
        <img
          src="/help/SDKinfo_place.png"
          alt="「管理」メニューの「SDK接続情報を表示」でProject ID等が確認できる画面のスクリーンショット"
          className="help-screenshot"
        />
      </li>

      <li>
        <h2>2. Unity側にGlank SDKを導入する</h2>
        <p>
          下のボタンからSDK一式をダウンロードし、展開してできる<span className="mono">Glank</span>
          フォルダごと、対象UnityプロジェクトのAssetsフォルダ内の
          <span className="mono">Packages/</span> フォルダの下に置きます。または、Unityの
          Package Managerで「Add package from disk...」を選び、フォルダ内の
          <span className="mono">package.json</span> を指定しても導入できます。外部パッケージへの
          依存はないため、これだけで組み込み完了です。
        </p>
        <SdkDownloadButton engine="unity" label="Unity SDK" />
      </li>

      <li>
        <h2>3. セットアップする</h2>
        <p>
          Unityメニューの<span className="mono">Tools &gt; Glank &gt; Setup Wizard</span>を開きます。
        </p>
        <p>
          API Key・プロジェクトIDを入力して「セットアップ」ボタンを押すだけです。
        </p>
        <p>
          この2つは、プロジェクトを開いた画面の「管理」メニューの「SDK接続情報を表示」から
          まとめて確認できます。
        </p>
        <p>
          バックエンドURLは既定値が本番URLなので、通常は入力不要です。
          自前で別環境を使う場合のみ「詳細設定」を開いて変更します。
        </p>
        <p>
          接続設定（<span className="mono">GlankSettings</span>アセット）の生成、
          必要なコンポーネント一式が配線された<span className="mono">GlankManager</span>という
          GameObjectのシーンへの配置、新Input System
          （<span className="mono">com.unity.inputsystem</span>）を使っているかどうかの自動判定まで、
          まとめて行われます。
        </p>
        <img
          src="/help/SetupWizard_setting.png"
          alt="Setup Wizardのウィンドウ（Tools &gt; Glank &gt; Setup Wizard、API Key / Project ID入力欄とセットアップボタン）"
          className="help-screenshot"
        />
      </li>

      <li>
        <h2>4. 動画の取得方法を選ぶ</h2>
        <p>
          <strong>推奨:</strong> <span className="mono">InstantReplayVideoRecorder</span>を追加すると、
          ゲーム自身が直近n秒のプレイをリングバッファで保持しておき、バグ報告のタイミングで
          プラットフォームネイティブのハードウェアエンコーダーでmp4として書き出します。
        </p>
        <p>
          プレイヤーがOSの録画機能を事前に有効化していなくても動画が残るのが利点です。
          導入手順は<span className="mono">unity-sdk/README.md</span>の「動画録画について」を
          参照してください。
        </p>
        <p>
          これを追加しない場合でも、Windowsの<strong>Xbox Game Bar</strong>（背景録画）や
          <strong>NVIDIA ShadowPlay</strong>、<strong>AMD ReLive</strong>
          といったOS標準のインスタントリプレイ機能を利用する
          <span className="mono">ReplayFolderWatcher</span>がフォールバックとして標準で組み込まれており、
          追加コードは不要です。
        </p>
        <p>
          ただしこの場合、プレイヤー側で事前にOSの録画機能を有効にしておく必要があります。
        </p>
      </li>

      <li>
        <h2>5. バグを見つけたらホットキーを押す</h2>
        <p>
          <span className="mono">BugReportTrigger</span>のホットキー（既定は
          <span className="mono">F12</span>）を押すと、直近の入力ログと動画がまとめて自動送信され、
          このWebアプリのプロジェクト内バグ一覧に「未対応」として表示されます。
        </p>
        <p>
          <span className="mono">ReplayFolderWatcher</span>のみを使っている場合は、ホットキーを押す前に
          <span className="mono">Win + Alt + G</span>を押してOS側に直近の録画を保存しておいてください。
        </p>
        <p>
          タイトルやタグをQA担当者に入力させてから送信したい場合は、
          <span className="mono">GlankReportPromptUI</span>を使うと、ホットキー即送信の代わりに
          簡易フォームを開けます。
        </p>
        <p>
          Setup Wizardで導入した場合、送信に失敗しても<span className="mono">GlankOfflineQueue</span>
          が自動で退避・再送してくれます（最初から組み込み済みです）。
        </p>
        <ImagePlaceholder caption="ホットキーを押した後、Webアプリのバグ一覧に報告が表示された状態のスクリーンショット" />
      </li>

      <li>
        <h2>6. 報告者名・プレイ中のプラットフォームを設定する</h2>
        <p>
          <span className="mono">GlankManager</span>には<span className="mono">GlankReporterNamePrompt</span>
          が最初から付いており、報告者名が未設定の間はゲーム起動時に自動で入力欄（名前・プレイ中の
          プラットフォーム）が表示されます。一度設定すると、以後の報告の「誰が」「プラットフォーム」欄に
          その内容が使われます。
        </p>
        <p>
          <strong>この入力欄は既定で<span className="mono">F9</span>キーを押せばいつでも開き直せます</strong>
          （名前やプラットフォームを間違えた・変更したい場合も、この入力欄自体からは再度開く方法が
          分からないため、覚えておいてください）。キーは<span className="mono">GlankReporterNamePrompt</span>
          の<span className="mono">reopenHotkey</span>で変更できます。
        </p>
      </li>

      <li>
        <h2>7. 各コンポーネントの役割と設定項目</h2>
        <p>
          Setup Wizardが配置する<span className="mono">GlankManager</span>には、
          役割の異なるコンポーネントがまとめてアタッチされています。動作を変更したい場合は、
          対応するコンポーネントのInspectorで下記の項目を編集してください。
        </p>

        <h3 className="help-substep-title">
          <span className="mono">GlankSettings</span>（接続設定）
        </h3>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">baseUrl</td>
              <td>接続先のバックエンドURL。既定値は本番URLで、通常は変更不要</td>
            </tr>
            <tr>
              <td className="mono">apiKey / projectId</td>
              <td>プロジェクトを開いた画面の「管理」メニューの「SDK接続情報を表示」で確認できる</td>
            </tr>
            <tr>
              <td className="mono">autoDetectionEnabled</td>
              <td>
                下記<span className="mono">CrashDetector</span>・
                <span className="mono">FreezeWatchdog</span>による自動検知/自動報告のON/OFF。既定OFF
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="help-substep-title">
          <span className="mono">BugReportTrigger</span>（ホットキーでの報告送信）
        </h3>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">reportHotkey</td>
              <td>バグ報告を送信するときに押すキー。既定は<span className="mono">F12</span></td>
            </tr>
            <tr>
              <td className="mono">promptUI</td>
              <td>
                設定すると、ホットキーを押した際に仮タイトルで即送信する代わりに、
                <span className="mono">GlankReportPromptUI</span>のフォームを開くようになる
              </td>
            </tr>
            <tr>
              <td className="mono">offlineQueue</td>
              <td>
                設定すると、送信に失敗した報告を<span className="mono">GlankOfflineQueue</span>が
                自動で退避・再送する
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="help-substep-title">
          <span className="mono">CrashDetector</span>（クラッシュの自動検知）
        </h3>
        <p>
          <span className="mono">GlankSettings.autoDetectionEnabled</span>がONの間だけ動作する
          （既定OFF）。
        </p>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">treatAllErrorsAsFatal</td>
              <td>
                通常はUnityの未処理例外だけを検知するが、ONにすると<span className="mono">
                Debug.LogError</span>等のエラーログもすべて致命的として自動報告する。既定OFF
              </td>
            </tr>
            <tr>
              <td className="mono">cooldownSeconds</td>
              <td>連続クラッシュで自動報告が乱発しないための最短間隔（秒）。既定30秒</td>
            </tr>
          </tbody>
        </table>

        <h3 className="help-substep-title">
          <span className="mono">FreezeWatchdog</span>（フリーズの自動検知）
        </h3>
        <p>
          こちらも<span className="mono">autoDetectionEnabled</span>がONの間だけ動作する。
        </p>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">freezeThresholdSeconds</td>
              <td>この秒数フレームが進まなかったらフリーズとみなす。既定10秒</td>
            </tr>
            <tr>
              <td className="mono">pollIntervalSeconds</td>
              <td>フリーズを監視する間隔（秒）。既定1秒</td>
            </tr>
            <tr>
              <td className="mono">cooldownSeconds</td>
              <td>連続フリーズで自動報告が乱発しないための最短間隔（秒）。既定60秒</td>
            </tr>
          </tbody>
        </table>

        <h3 className="help-substep-title">
          <span className="mono">GlankOfflineQueue</span>（送信失敗時の再送）
        </h3>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">retryIntervalSeconds</td>
              <td>送信に失敗した報告の再送を試みる間隔（秒）。既定60秒</td>
            </tr>
          </tbody>
        </table>

        <h3 className="help-substep-title">
          <span className="mono">InputLogRecorder</span>（入力ログの記録）
        </h3>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">watchedKeys</td>
              <td>入力ログに残したいキーの一覧（キー・表示グリフ・ラベル）</td>
            </tr>
            <tr>
              <td className="mono">bufferSeconds</td>
              <td>何秒分の入力履歴を保持するか。既定10秒</td>
            </tr>
          </tbody>
        </table>

        <h3 className="help-substep-title">
          <span className="mono">GlankReporterNamePrompt</span>（報告者名の入力欄）
        </h3>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">showOnStartIfUnset</td>
              <td>報告者名が未設定の間、ゲーム起動時に自動で入力欄を表示するかどうか。既定ON</td>
            </tr>
            <tr>
              <td className="mono">reopenHotkey</td>
              <td>入力欄をいつでも開き直せるキー。既定は<span className="mono">F9</span></td>
            </tr>
            <tr>
              <td className="mono">pauseGameWhileOpen</td>
              <td>入力欄が開いている間、<span className="mono">Time.timeScale</span>を0にするかどうか。既定ON</td>
            </tr>
          </tbody>
        </table>
      </li>
    </ol>
  )
}

function GodotGuide() {
  return (
    <div className="help-coming-soon">
      <h2>Godot連携は準備中です</h2>
      <p>
        Godot向けのGlank SDKは現在開発中で、まだ一般提供していません（SDKのダウンロードも
        現時点ではご利用いただけません）。対応が完了次第、こちらのページで導入手順を案内します。
      </p>
      <p>
        Unityでの導入をお急ぎの場合は、上のトグルから「Unity」に切り替えてください。
      </p>
    </div>
  )
}

function StorageGuide() {
  return (
    <section id="storage-setup" className="help-storage-section">
      <h1>ストレージ設定（Turso・Cloudflare R2）の手順</h1>
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
            <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer" className="help-external-link">
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
                  R2の場合は<span className="mono">https://&lt;Account ID&gt;.r2.cloudflarestorage.com</span>
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
  )
}

export default function HelpPage({ defaultEngine = 'unity' }) {
  const [engine, setEngine] = useState(defaultEngine === 'godot' ? 'godot' : 'unity')
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  return (
    <main className="help-page">
      <div className="list-header">
        <div className="list-header-row">
          <h1>SDK連携の使い方</h1>
          <SegmentedToggle
            value={engine}
            onChange={setEngine}
            options={[
              { value: 'unity', label: 'Unity' },
              { value: 'godot', label: 'Godot' },
            ]}
          />
        </div>
      </div>

      <div className="help-body">
        {engine === 'godot' ? (
          <GodotGuide />
        ) : (
          <>
            <p className="help-lead">
              Glankは「Webアプリ側のプロジェクト」と「Unityで作っているゲーム」を
              <strong>プロジェクトID</strong>で紐付けます。ゲーム内でホットキーを押すと、
              直近の録画動画と入力ログが自動でこのWebアプリに送信され、一覧に表示されます。
            </p>

            <UnityGuide />

            <p className="help-setup-guide-callout">
              Setup Wizard・プレハブを使ってもうまく動かない場合は、
              <Link to="/setup-guide">詳細セットアップガイド</Link>
              のトラブルシューティングを参照してください（配線図・原因の切り分け付き）。
            </p>

            <p className="help-footer-note">
              より詳しい技術仕様は <span className="mono">unity-sdk/README.md</span> と
              <span className="mono"> docs/api-spec.md</span> を参照してください。
            </p>
          </>
        )}

        <StorageGuide />
      </div>
    </main>
  )
}

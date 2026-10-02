import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import SegmentedToggle from '../components/SegmentedToggle.jsx'
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

const UNITY_TOC_GROUPS = [
  {
    title: '導入手順',
    items: [
      { id: 'unity-step-1', label: 'Glankでプロジェクトを作成する' },
      { id: 'unity-step-2', label: 'Unity側にGlank SDKを導入する' },
      { id: 'unity-step-3', label: '動画の記録方法を決める' },
      { id: 'unity-step-4', label: 'バグ報告機能をセットアップする' },
    ],
  },
  {
    title: '使い方・カスタマイズ',
    items: [
      { id: 'unity-step-5', label: 'バグ報告の手順' },
      { id: 'unity-step-6', label: '報告者名・プラットフォームの設定' },
      { id: 'unity-step-7', label: '各コンポーネントの役割と設定項目' },
    ],
  },
]

// TOCリンクを普通の<a href="#...">にすると、クリックのたびにブラウザ履歴が1件積まれてしまい、
// 右上の「戻る」ボタン（history.back相当）を押しても前のページに戻らず、目次間を
// 行ったり来たりするだけになる（実際にこの不具合が起きた）。履歴を汚さないよう、
// クリック自体はJSで処理してスクロールし、URLのハッシュはreplaceState（履歴を積まない）で更新する。
function handleTocClick(e, id) {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

function UnityToc() {
  let counter = 0
  return (
    <nav className="help-toc" aria-label="目次">
      <div className="help-toc-title">目次</div>
      {UNITY_TOC_GROUPS.map((group) => (
        <div className="help-toc-group" key={group.title}>
          <div className="help-toc-group-title">{group.title}</div>
          <ol>
            {group.items.map((item) => {
              counter += 1
              return (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={(e) => handleTocClick(e, item.id)}>
                    {counter}. {item.label}
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </nav>
  )
}

function UnityGuide() {
  return (
    <>
      <h2 className="help-group-title">導入手順</h2>
      <ol className="help-steps">
      <li id="unity-step-1">
        <h2>1. Glankでプロジェクトを作成する</h2>
        <p>
          プロジェクト一覧の「新規プロジェクト」からプロジェクトを作成します。作成後、
          プロジェクトを開いて右上の「管理」→「SDK接続情報を表示」を選ぶと、
          Unity側で使うAPI KeyとバックエンドURLが確認できます。
        </p>
        <img
          src="/help/SDKinfo_place.png"
          alt="「管理」メニューの「SDK接続情報を表示」でAPI Key等が確認できる画面のスクリーンショット"
          className="help-screenshot"
        />
      </li>

      <li id="unity-step-2">
        <h2>2. Unity側にGlank SDKを導入する</h2>
        <p>
          下のボタンからSDKをダウンロードし、展開してできる<span className="mono">Glank</span>
          フォルダを、Unityプロジェクトの<span className="mono">Assets/Packages/</span>の下に
          置くだけです（Package Managerの「Add package from disk...」から
          <span className="mono">package.json</span>を指定しても導入できます）。
          他のパッケージへの依存はありません。
        </p>
        <SdkDownloadButton engine="unity" label="Unity SDK" />
      </li>

      <li id="unity-step-3">
        <h2>3. 動画の記録方法を決める</h2>
        <p>
          <strong><span className="mono">InstantReplayVideoRecorder</span>の導入を推奨します。</strong>
          ゲーム自身が直近のプレイを保持しておき、ホットキーを押したタイミングでmp4として
          書き出すため、プレイヤー側の事前設定なしで必ず動画が残ります。導入する場合は、
          次の手順4（Setup Wizard）より先に、下記の手順を済ませてください。
        </p>
        <details className="help-details">
          <summary>InstantReplayVideoRecorderの導入手順</summary>
          <div className="help-details-body">
            <ol>
              <li>
                Unity Package Managerで、下のgit URLから
                <span className="mono">InstantReplay</span>本体を追加します
                （<span className="mono">Window &gt; Package Manager &gt; + &gt; Add package from git URL...</span>）。
                <div className="help-code">
                  https://github.com/CyberAgentGameEntertainment/InstantReplay.git?path=Packages/jp.co.cyberagent.instant-replay#release
                </div>
              </li>
              <li>
                <span className="mono">Project Settings &gt; Player &gt; Scripting Define Symbols</span>に
                <span className="mono">GLANK_INSTANT_REPLAY</span>を追加します。
              </li>
            </ol>
            <p style={{ marginTop: 10, fontSize: 12 }}>
              これだけで準備完了です。次の手順4でSetup Wizardを実行すると、
              このシンボルを検出して<span className="mono">InstantReplayVideoRecorder</span>の
              配置・配線まで自動で行われます。
            </p>
          </div>
        </details>
        <p>
          導入しない場合は、Windowsの録画機能（Xbox Game Bar・NVIDIA ShadowPlay・AMD ReLiveなど）
          を使う<span className="mono">ReplayFolderWatcher</span>が既定で動作しますが、
          プレイヤー側でその機能を事前にオンにしておく必要があります。何もせず次の手順に
          進んでも問題ありません（後からいつでも導入できます）。
        </p>
      </li>

      <li id="unity-step-4">
        <h2>4. バグ報告機能をセットアップする</h2>
        <p>
          Unityメニューの<span className="mono">Tools &gt; Glank &gt; Setup Wizard</span>を開き、
          手順1で確認したAPI Keyを入力して「セットアップ」を押すだけです。
          バックエンドURLは既定ですので、通常は変更不要です。
        </p>
        <p>
          これだけで、接続設定の作成・必要なコンポーネントのシーンへの配置・
          Input Systemの種類の判定までまとめて行われます（手順3を済ませていれば、
          <span className="mono">InstantReplayVideoRecorder</span>の配線もここで一緒に行われます）。
        </p>
        <img
          src="/help/SetupWizard_setting.png"
          alt="Setup Wizardのウィンドウ（Tools &gt; Glank &gt; Setup Wizard、API Key入力欄とセットアップボタン）"
          className="help-screenshot"
        />
      </li>
      </ol>

      <h2 className="help-group-title">使い方・カスタマイズ</h2>
      <ol className="help-steps">

      <li id="unity-step-5">
        <h2>5. バグ報告の手順</h2>
        <p>
          既定のホットキー<span className="mono">F12</span>を押すと、直近の入力ログと動画が
          まとめて自動送信され、Webアプリのバグ一覧に「未対応」として表示されます。
        </p>
        <p>
          OS標準の録画機能だけを使っている場合は、ホットキーを押す前に
          <span className="mono">Win + Alt + G</span>で直近の録画を保存しておいてください。
        </p>
        <p>
          送信前にタイトルなどを入力させたい場合は<span className="mono">GlankReportPromptUI</span>を
          使うと、即送信の代わりに簡易フォームを開けます。送信に失敗した場合も
          <span className="mono">GlankOfflineQueue</span>が自動で再送します。
        </p>
      </li>

      <li id="unity-step-6">
        <h2>6. 報告者名・プラットフォームの設定</h2>
        <p>
          報告者名が未設定の間は、ゲーム起動時に自動で名前とプレイ中のプラットフォームを
          入力する画面が表示されます。一度設定すれば、以後の報告にその内容が使われます。
        </p>
        <p>
          入力欄は既定で<span className="mono">F9</span>キーからいつでも開き直せます。
        </p>
      </li>

      <li id="unity-step-7">
        <h2>7. 各コンポーネントの役割と設定項目</h2>
        <p>
          <span className="mono">GlankManager</span>には役割の異なるコンポーネントが
          まとめてアタッチされています。動作を変更したい場合は、対応するコンポーネントの
          Inspectorで下記の項目を編集してください。
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
              <td className="mono">apiKey</td>
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
    </>
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
              GlankはAPIキーで、Webアプリのプロジェクトとゲームをつなぎます。
              ゲーム内でホットキーを押すだけで、直近の録画と入力ログが自動でこのWebアプリに届きます。
            </p>

            <UnityToc />

            <UnityGuide />

            <p className="help-setup-guide-callout">
              Setup Wizardを使ってもうまく動かない場合は、
              <Link to="/setup-guide">詳細セットアップガイド</Link>
              のトラブルシューティングを参照してください（配線図・原因の切り分け付き）。
            </p>
          </>
        )}
      </div>
    </main>
  )
}

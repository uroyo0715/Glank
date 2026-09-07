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
          使用ゲームエンジン（Unity）を指定して作成します。作成されたプロジェクトカードに表示される
          <span className="mono">ID: 3</span> のような番号が、Unity側の設定で使うプロジェクトIDです。
        </p>
        <ImagePlaceholder caption="プロジェクトカードに表示されるIDの位置がわかるスクリーンショット" />
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
        <h2>3. セットアップ方法を選ぶ</h2>
        <p>
          導入後のセットアップは3通りあります。基本的には<strong>方法A（Setup Wizard）</strong>が一番簡単です。
        </p>

        <h3 className="help-substep-title">方法A（推奨）: Setup Wizardを使う</h3>
        <p>
          Unityメニューの <span className="mono">Tools &gt; Glank &gt; Setup Wizard</span> を開き、
          バックエンドURL・API Key・プロジェクトID（この3つは、プロジェクトカードの「管理」から
          まとめて確認できます）を入力して「セットアップ」ボタンを押すだけです。接続設定（
          <span className="mono">GlankSettings</span>アセット）の生成と、必要なコンポーネント一式が
          配線された<span className="mono">GlankManager</span> というGameObjectのシーンへの配置、
          新Input System（<span className="mono">com.unity.inputsystem</span>）を使っているかどうかの
          自動判定まで、まとめて行われます。
        </p>
        <ImagePlaceholder caption="Setup Wizardのウィンドウ（バックエンドURL / API Key / Project ID入力欄とセットアップボタン）のスクリーンショット" />

        <h3 className="help-substep-title">方法B: プレハブをドラッグ&ドロップする</h3>
        <p>
          ウィザードを使わず導入したい場合は、SDKに同梱されている
          <span className="mono"> Packages/Glank/Runtime/Prefabs/GlankManager.prefab</span>
          （方法Aと同じ構成が組まれたプレハブ）をシーンにドラッグ&ドロップします。ただし、
          このプレハブが参照している<span className="mono">GlankSettings</span>は
          <strong>APIキー・プロジェクトIDが空のプレースホルダー</strong>です。プレースホルダーの
          アセットを右クリック→複製し、複製した方に自分のAPIキー・プロジェクトIDを入力したうえで、
          <strong>シーンに置いたインスタンス側</strong>の<span className="mono">BugReportTrigger</span>
          ・<span className="mono">CrashDetector</span>・<span className="mono">FreezeWatchdog</span>
          ・<span className="mono">GlankOfflineQueue</span>それぞれの<span className="mono">Config</span>
          欄を、複製したアセットに差し替えてください（プレハブアセット自体を直接編集しないよう注意）。
          設定を入力し忘れたまま実行すると、「projectIdが未設定です」という分かりやすいエラーが
          Consoleに出て送信が中止されるので、実際の値が入っているかどうかはすぐに気付けます。
        </p>
        <ImagePlaceholder caption="プレハブをHierarchyにドラッグした直後と、GlankSettingsを複製して差し替えた後のInspectorの比較スクリーンショット" />

        <h3 className="help-substep-title">方法C: 手動でコンポーネントを配置する</h3>
        <p>
          細かくカスタマイズしたい場合向けの、従来通りの方法です。Unityのメニューから
          <span className="mono"> Assets &gt; Create &gt; Glank &gt; Settings</span>{' '}
          でScriptableObjectを作成し、次の3項目を設定します。
        </p>
        <table className="help-table">
          <tbody>
            <tr>
              <td className="mono">baseUrl</td>
              <td>
                このアプリのAPIサーバーのURL。ローカル開発なら
                <span className="mono"> http://localhost:8787/api/v1</span>
              </td>
            </tr>
            <tr>
              <td className="mono">apiKey</td>
              <td>
                このプロジェクト専用のAPIキー。プロジェクトカードの「APIキーを表示」で確認できる
                （プロジェクトごとに別の値が発行されるため、他のプロジェクトのキーは使えない）
              </td>
            </tr>
            <tr>
              <td className="mono">projectId</td>
              <td>手順1で確認したプロジェクトID</td>
            </tr>
          </tbody>
        </table>
        <p>
          続けて、シーン内の任意のGameObjectに <span className="mono">InputLogRecorder</span> と
          <span className="mono"> BugReportTrigger</span> の2つをアタッチします。
          <span className="mono">BugReportTrigger</span> の <span className="mono">config</span>{' '}
          欄に、上で作った設定を割り当ててください。
          <span className="mono">InputLogRecorder</span> の <span className="mono">watchedKeys</span>{' '}
          には、ログに残したい入力キーを登録します。
        </p>
      </li>

      <li>
        <h2>4. 動画の取得方法を選ぶ</h2>
        <p>
          <strong>推奨: </strong>
          <span className="mono">InstantReplayVideoRecorder</span> を追加すると、ゲーム自身が
          直近n秒のプレイをリングバッファで保持しておき、バグ報告のタイミングで
          プラットフォームネイティブのハードウェアエンコーダーでmp4として書き出します。
          プレイヤーがOSの録画機能を事前に有効化していなくても動画が残るのが利点です。導入手順は
          <span className="mono">unity-sdk/README.md</span>の「動画録画について」を参照してください。
        </p>
        <p>
          これを追加しない場合でも、Windowsの<strong>Xbox Game Bar</strong>（背景録画）や
          <strong>NVIDIA ShadowPlay</strong>、<strong>AMD ReLive</strong>
          といったOS標準のインスタントリプレイ機能を利用する
          <span className="mono">ReplayFolderWatcher</span>
          がフォールバックとして標準で組み込まれており、追加コードは不要です。ただしこの場合、
          プレイヤー側で事前にOSの録画機能を有効にしておく必要があります。
        </p>
      </li>

      <li>
        <h2>5. バグを見つけたらホットキーを押す</h2>
        <p>
          <span className="mono">BugReportTrigger</span>のホットキー（既定は
          <span className="mono"> F12</span>）を押すと、直近の入力ログと動画がまとめて自動送信され、
          このWebアプリのプロジェクト内バグ一覧に「未対応」として表示されます。
          <span className="mono">ReplayFolderWatcher</span>のみを使っている場合は、ホットキーを押す前に
          <span className="mono">Win + Alt + G</span>を押してOS側に直近の録画を保存しておいてください。
        </p>
        <p>
          タイトルやタグをQA担当者に入力させてから送信したい場合は、
          <span className="mono">GlankReportPromptUI</span>を使うと、ホットキー即送信の代わりに
          簡易フォームを開けます。方法A・Bで導入した場合、送信に失敗しても
          <span className="mono">GlankOfflineQueue</span>が自動で退避・再送してくれます
          （最初から組み込み済みです）。
        </p>
        <ImagePlaceholder caption="ホットキーを押した後、Webアプリのバグ一覧に報告が表示された状態のスクリーンショット" />
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
      <h1>ストレージ設定（Turso・R2）の手順</h1>
      <p className="help-lead">
        プロジェクトごとの報告データベースと動画・画像の保存先には、自分のTurso・Cloudflare R2アカウントを
        使う（<span className="mono">self_hosted</span>）方式を使います。プロジェクトのバグ一覧画面の
        「ストレージ設定」から設定してください（Glank共有の<span className="mono">managed</span>方式は
        今後提供予定で、現時点では選択できません）。
      </p>

      <ol className="help-steps">
        <li>
          <h2>1. Turso・R2を用意する</h2>
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
            にアクセスし、アカウント作成後「Create Database」から新しいデータベースを1つ作成します
            （Windows環境ではTurso CLIのインストーラーが対応していないため、Webダッシュボードでの
            作成を推奨します）。作成したデータベースの詳細ページで、以下の2つを取得して
            ストレージ設定フォームに入力してください。
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
            の「R2」からバケットを1つ作成し、バケットの設定でパブリックアクセス（
            <span className="mono">r2.dev</span> のサブドメイン、または独自ドメイン）を有効にします。
            続けて「R2 API トークン」を発行し、以下をストレージ設定フォームに入力してください。
          </p>
          <table className="help-table">
            <tbody>
              <tr>
                <td className="mono">Account ID</td>
                <td>Cloudflareダッシュボードの右側などに表示されるアカウントID</td>
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
                  <span className="mono">https://pub-xxx.r2.dev</span>）
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

import React from 'react'
import ImagePlaceholder from '../components/ImagePlaceholder.jsx'

function WiringDiagram() {
  return (
    <div className="wiring-diagram">
      <div className="wiring-go">
        <div className="wiring-go-label">1つのGameObject（例: "GlankBugReporter"）</div>

        <div className="wiring-component">
          <div className="wiring-component-title">InputLogRecorder<span className="wiring-optional">（または NewInputSystem 版）</span></div>
          <div className="wiring-field-row">Watched Keys / Fps / Buffer Seconds を設定</div>
        </div>

        <div className="wiring-component wiring-component-main">
          <div className="wiring-component-title">BugReportTrigger</div>
          <div className="wiring-field-row">
            <span className="wiring-field-name">Config</span>
            <span className="wiring-arrow">→</span>
            <span className="wiring-target wiring-target-external">GlankSettings（プロジェクトのアセット）</span>
          </div>
          <div className="wiring-field-row">
            <span className="wiring-field-name">Input Log Recorder</span>
            <span className="wiring-arrow">→</span>
            <span className="wiring-target">
              レガシー版<span className="wiring-optional">（InputLogRecorder）</span>を使う場合のみここに割り当てる
            </span>
          </div>
          <div className="wiring-field-row">
            <span className="wiring-field-name">Report Hotkey</span>
            <span className="wiring-arrow">→</span>
            <span className="wiring-target">送信キー（既定 F12。反応しなければ他のキーで試す）</span>
          </div>
          <div className="wiring-field-row">
            <span className="wiring-field-name">Offline Queue</span>
            <span className="wiring-arrow">→</span>
            <span className="wiring-target wiring-target-optional">GlankOfflineQueue（任意）</span>
          </div>
          <div className="wiring-field-row">
            <span className="wiring-field-name">Prompt UI</span>
            <span className="wiring-arrow">→</span>
            <span className="wiring-target wiring-target-optional">GlankReportPromptUI（任意）</span>
          </div>
        </div>

        <div className="wiring-component wiring-component-optional">
          <div className="wiring-component-title">GlankOfflineQueue<span className="wiring-optional">（任意）</span></div>
        </div>

        <div className="wiring-component wiring-component-optional">
          <div className="wiring-component-title">
            GlankReporterNamePrompt<span className="wiring-optional">（他コンポーネントとの配線不要）</span>
          </div>
          <div className="wiring-field-row">
            報告者名が未設定なら起動時に自動で入力欄を表示する（既定F9キーで開き直せる）
          </div>
        </div>

        <div className="wiring-component wiring-component-conditional">
          <div className="wiring-component-title">
            GlankNewInputSystemBridge<span className="wiring-optional">（新Input System単体のプロジェクトのみ）</span>
          </div>
          <div className="wiring-field-row">
            <span className="wiring-field-name">Input Log Recorder</span>
            <span className="wiring-arrow">→</span>
            <span className="wiring-target wiring-target-loop">同じGameObjectの InputLogRecorderNewInputSystem を指す</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function InputSystemFlowchart() {
  return (
    <div className="flowchart">
      <div className="flowchart-question">
        <code>Edit &gt; Project Settings &gt; Player &gt; Active Input Handling</code> は何になっていますか？
      </div>
      <div className="flowchart-branches">
        <div className="flowchart-branch">
          <div className="flowchart-branch-label">Input Manager (Old)</div>
          <div className="flowchart-branch-result">
            <code>InputLogRecorder</code>（レガシー版）をそのまま使う。追加の配線は不要。
          </div>
        </div>
        <div className="flowchart-branch">
          <div className="flowchart-branch-label">Both</div>
          <div className="flowchart-branch-result">
            どちらでも動く。特別な理由がなければ配線がシンプルな<code>InputLogRecorder</code>（レガシー版）を推奨。
          </div>
        </div>
        <div className="flowchart-branch flowchart-branch-warn">
          <div className="flowchart-branch-label">Input System Package (New)</div>
          <div className="flowchart-branch-result">
            <code>InputLogRecorderNewInputSystem</code>を使う必要がある。<code>BugReportTrigger</code>のホットキー判定も
            自動でこちらに対応するが、<strong>入力ログの取得だけは自動で繋がらない</strong>ため、
            同じGameObjectに<code>GlankNewInputSystemBridge</code>を追加し、その
            <code>Input Log Recorder</code>欄に<code>InputLogRecorderNewInputSystem</code>を割り当てる必要がある
            （上の図を参照）。
          </div>
        </div>
      </div>
    </div>
  )
}

const TRIGGER_FIELDS = [
  { name: 'Config', desc: 'GlankSettingsアセット（baseUrl / apiKey / projectId）。必須。projectIdが0（未設定）のままだと、送信時にエラーログを出して中止される。' },
  {
    name: 'Input Log Recorder',
    desc: 'レガシー版InputLogRecorderを使う場合のみ割り当てる。新Input System版を使う場合は空のままでよい（GlankNewInputSystemBridge経由でCaptureInputLogに配線されるため）。',
  },
  { name: 'Report Hotkey', desc: '送信のホットキー（既定 F12）。反応しない場合はFnキーが必要な環境の可能性があるため、英字キー等で試すと切り分けやすい。' },
  { name: 'Replay Watcher', desc: 'ReplayFolderWatcherの設定（監視フォルダ・対象拡張子・有効期限秒数）。既定でWindowsのXbox Game Bar保存先を見る。' },
  { name: 'Offline Queue', desc: '任意。設定すると送信失敗時に自動で退避・再送する（GlankOfflineQueueをアタッチして割り当てる。Setup Wizard・プレハブ経由なら最初から配線済み）。' },
  { name: 'Prompt UI', desc: '任意。設定すると、ホットキー押下時に即送信の代わりに入力フォームを開く（GlankReportPromptUIを使う）。' },
]

export default function SetupGuidePage() {
  return (
    <main className="help-page setup-guide-page">
      <div className="list-header">
        <div className="list-header-row">
          <h1>Unity SDK 詳細セットアップガイド</h1>
        </div>
      </div>

      <div className="help-body">
        <p className="help-lead">
          通常のセットアップは<strong>Setup Wizard</strong>（Unityメニューの
          <span className="mono"> Tools &gt; Glank &gt; Setup Wizard</span>）か、同梱の
          <span className="mono"> GlankManager.prefab</span>
          をドラッグ&ドロップするだけで完了し、このページの内容を読む必要はありません
          （手順は「SDK連携の使い方」を参照）。
        </p>
        <p className="help-lead">
          このページは、<strong>ウィザード・プレハブを使ってもうまく動かないときの原因切り分け</strong>、
          および<strong>ロジックのみ提供されるオプション機能（QA向け入力フォーム等）を自分で組み立てる
          場合の手順</strong>のためのリファレンスです。
        </p>

        <section className="setup-section">
          <h2>1. うまく動かないときのチェックリスト</h2>
          <ul className="setup-checklist">
            <li>
              <strong>「GlankSettings.projectIdが未設定です」というエラーが出る</strong> —
              <span className="mono">GlankManager.prefab</span>をそのままドラッグ&ドロップしただけの状態。
              このプレハブが参照している<span className="mono">GlankSettings</span>はAPIキー・
              プロジェクトIDが空のプレースホルダーになっているため、意図的にこのエラーで止まる。
              プレースホルダーを複製し、値を入力したうえで、シーン上の<strong>インスタンス側</strong>の
              各コンポーネントの<span className="mono">Config</span>欄を差し替える（詳しくは
              「SDK連携の使い方」の「方法B」を参照）。
            </li>
            <li>
              <strong>送信失敗（401・invalid or missing X-Glank-Key）というエラーが出る</strong> —
              APIキーはプロジェクトごとに発行される値で、他のプロジェクトのAPIキーや空文字では
              認証が通らない。Webアプリのプロジェクトカードの「APIキーを表示」から、
              このプロジェクト専用の値を確認して<span className="mono">GlankSettings.apiKey</span>に
              設定し直す。「再発行」した場合は、古いキーを設定したままのSDKは以後このエラーになる点にも注意。
            </li>
            <li>
              <strong>ホットキーを押しても何も起きない・Consoleにも何も出ない</strong> —
              Play Modeが一時停止のままになっていないか、「ゲーム」タブをクリックしてフォーカスしてから
              押しているかを確認する。それでも反応しない場合、ノートPCの環境では
              <span className="mono">F12</span>が<span className="mono">Fn</span>キー同時押しでないと
              反応しないことがあるため、一度英字キーなど別のキーで試す。
            </li>
            <li>
              <strong>「you have switched active Input handling to Input System package」という例外</strong> —
              <span className="mono">Active Input Handling</span>が新Input System単体になっているのに、
              レガシー版のコンポーネント（<span className="mono">InputLogRecorder</span>）が
              レガシーInputを呼んでいる状態。Setup Wizard/プレハブは自動判定するため通常は起きないが、
              手動で組んだ・後からプロジェクトのInput設定を変更した場合に起こりうる。
              新Input System版のコンポーネントに差し替えるか、設定を<span className="mono">Both</span>に変更する。
            </li>
            <li>
              <strong>Add Componentの候補にスクリプトが出てこない・Setup Wizardのメニューが出ない</strong> —
              プロジェクト内のどこか（SDK以外でも）にコンパイルエラーが1件でも残っていると、
              プロジェクト全体のコンパイルが止まり、どのスクリプトも新規追加できなくなる。
              Consoleで赤いエラーが無いかを先に確認する。
            </li>
            <li>
              <strong>動画が「見つかりません」と出る</strong> — <span className="mono">ReplayFolderWatcher</span>を
              使っている場合、<span className="mono">Win + Alt + G</span>で先に録画を保存してから、
              その後にホットキーを押す順番を守る（先にホットキーを押しても、まだ動画ファイルが存在しない）。
            </li>
            <li>
              <strong>入力ログが空、またはフレーム番号が変な値になる</strong> —
              古いバージョンのSDKでは、実際のフレームレートが高い環境（Unity Editor等）で
              入力ログのバッファがほぼ即座に空になる既知の不具合があった。ヘルプページから
              最新版のSDKを再ダウンロードして入れ替える。
            </li>
          </ul>
        </section>

        <section className="setup-section">
          <h2>2. コンポーネントの配線全体図（参考）</h2>
          <p>
            Setup Wizard・プレハブは内部的にこの構成を自動で組み立てています。中身をカスタマイズしたい、
            または期待通りに配線されているか見比べて確認したい場合の参考図です。
          </p>
          <WiringDiagram />
          <ImagePlaceholder caption="実際にUnity Inspectorで配線された状態（GlankManagerのHierarchy・各コンポーネントのフィールド）のスクリーンショット" />
        </section>

        <section className="setup-section">
          <h2>3. どちらのInputLogRecorderが選ばれるか</h2>
          <p>
            Setup Wizard・プレハブは、プロジェクトのInput System設定を見て自動でどちらか一方を選ぶ
            （手動で選ぶ必要はない）。判定の仕組みを知りたい場合の参考。
          </p>
          <InputSystemFlowchart />
        </section>

        <section className="setup-section">
          <h2>4. BugReportTriggerの各フィールド（リファレンス）</h2>
          <table className="help-table setup-fields-table">
            <tbody>
              {TRIGGER_FIELDS.map((f) => (
                <tr key={f.name}>
                  <td className="mono">{f.name}</td>
                  <td>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="setup-section">
          <h2>5. 動画の取得方法と入力ログの同期</h2>
          <p>
            動画の取得方法によって、Web UI側でタイムライン表示が使えるかどうかが変わります。
          </p>
          <table className="help-table">
            <tbody>
              <tr>
                <td className="mono">InstantReplayVideoRecorder</td>
                <td>
                  ホットキーと同じ瞬間に動画を書き出すため、入力ログと正確に対応する
                  （タイムライン表示・クリックでの動画シークが使える）。外部OSSパッケージの追加導入が必要。
                </td>
              </tr>
              <tr>
                <td className="mono">ReplayFolderWatcher（既定）</td>
                <td>
                  OS側の録画機能（Win+Alt+G等）が独立して保存した動画を検出するだけのため、
                  動画の終端とホットキーを押した瞬間がズレることがある。この場合、Web UI側は
                  自動でタイムライン表示を無効にし、テキスト一覧のみを表示する
                  （<span className="mono">inputLogVideoSynced: false</span>）。
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="setup-section">
          <h2>6. 報告者名を設定できるようにする（GlankReporterIdentity）</h2>
          <p>
            既定では報告の「報告者」欄に端末名が入るだけです。ゲーム内のどこか（設定画面や初回起動時など）
            から次のように呼び出せば、以後の報告すべてにその名前が使われます（<span className="mono">PlayerPrefs</span>に
            保存され、ゲームを再起動しても保持されます）。
          </p>
          <pre className="help-code">{`using Glank;

GlankReporterIdentity.SetReporterName("田中QA");`}</pre>
        </section>

        <section className="setup-section">
          <h2>7. GlankReportPromptUI（入力フォーム）の作り方</h2>
          <p>
            ホットキーを押した瞬間に仮タイトルで即送信する代わりに、タイトルや種類・報告者名を
            QA担当者に入力させてから送信したい場合に使います。<strong>ロジックのみを提供するスクリプト</strong>
            なので、見た目（Canvas上のUI部品）は自分でUnity Editor上に組む必要があります
            （この機能だけはSetup Wizard・プレハブでも自動化できません）。
          </p>
          <ol className="help-steps setup-steps">
            <li>
              <h2>① Canvasを1つ用意する</h2>
              <p>
                Hierarchyを右クリック → <span className="mono">UI &gt; Canvas</span>。無ければ自動で
                EventSystemも一緒に作られます。
              </p>
            </li>
            <li>
              <h2>② 入力フォームのパネルを作る</h2>
              <p>
                Canvasの子として空のGameObject（またはImage）を1つ作り、名前を
                <span className="mono"> ReportPromptPanel</span> などにします。この中に、以下のUI部品を配置します。
              </p>
              <table className="help-table">
                <tbody>
                  <tr>
                    <td className="mono">TitleInputField</td>
                    <td>InputField。<span className="mono">GlankReportPromptUI.titleField</span>に割り当てる</td>
                  </tr>
                  <tr>
                    <td className="mono">TagDropdown</td>
                    <td>
                      Dropdown（選択肢: crash / visual / softlock の順）。
                      <span className="mono">tagDropdown</span>に割り当てる
                    </td>
                  </tr>
                  <tr>
                    <td className="mono">DescInputField</td>
                    <td>InputField（Multi Line）。<span className="mono">descField</span>に割り当てる</td>
                  </tr>
                  <tr>
                    <td className="mono">PriorityDropdown</td>
                    <td>
                      Dropdown（選択肢: high / medium / low の順）。<span className="mono">priorityDropdown</span>に割り当てる
                    </td>
                  </tr>
                  <tr>
                    <td className="mono">ReporterNameInputField</td>
                    <td>
                      InputField（任意）。<span className="mono">reporterNameField</span>に割り当てると、
                      報告者名をこのフォームからその場で設定・更新できるようになる
                    </td>
                  </tr>
                  <tr>
                    <td className="mono">SubmitButton / CancelButton</td>
                    <td>Button。それぞれ<span className="mono">submitButton</span> / <span className="mono">cancelButton</span>に割り当てる</td>
                  </tr>
                </tbody>
              </table>
            </li>
            <li>
              <h2>③ GlankReportPromptUIをアタッチして配線する</h2>
              <p>
                <span className="mono">ReportPromptPanel</span>（または任意のGameObject）に
                <span className="mono"> GlankReportPromptUI</span>をAdd Componentし、
                <span className="mono"> Panel Root</span>にステップ②のパネルを、
                <span className="mono"> Trigger</span>に<span className="mono">BugReportTrigger</span>を割り当てます。
                最後に、<span className="mono">BugReportTrigger</span>側の<span className="mono">Prompt UI</span>欄に、
                この<span className="mono">GlankReportPromptUI</span>を割り当てれば完成です。
              </p>
            </li>
          </ol>
        </section>
      </div>
    </main>
  )
}

using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;

namespace Glank
{
    /// <summary>
    /// バグ報告のトリガーからAPI送信までを繋ぐサンプル実装。
    /// 動画の取得元は次の優先順で決まる。
    ///   1. <see cref="GetLatestClipPathAsync"/>（例: <see cref="InstantReplayVideoRecorder"/> のような、
    ///      ゲーム自身がリングバッファで保持している映像をその場でmp4に書き出す方式。OS側の設定に依存しない）
    ///   2. <see cref="GetLatestClipPath"/>（同期版。自前の取得処理を差し込みたい場合用）
    ///   3. <see cref="replayWatcher"/>（既定値。OSのインスタントリプレイ機能の出力フォルダから
    ///      最新の録画ファイルを探すフォールバック。プレイヤー側でXbox Game Bar等を有効化している場合のみ機能する）
    /// </summary>
    public class BugReportTrigger : MonoBehaviour
    {
        [SerializeField] private GlankSettings config;
        [SerializeField] private InputLogRecorder inputLogRecorder;
        [SerializeField] private KeyCode reportHotkey = KeyCode.F12;

        [Tooltip("OSのインスタントリプレイ機能の出力フォルダから最新の録画を探す既定の実装。")]
        [SerializeField] private ReplayFolderWatcher replayWatcher = new ReplayFolderWatcher();

        [Tooltip("送信に失敗した場合の退避先（任意）。設定しておくと、ネットワーク断やサーバー" +
            "一時停止などで送信できなかった報告を自動で再送してくれる。未設定なら失敗時は諦めてログを出すだけ。")]
        [SerializeField] private GlankOfflineQueue offlineQueue;

        [Tooltip("設定すると、ホットキーを押した際に仮タイトルで即送信する代わりにこのフォームを開き、" +
            "QA担当がタイトル・種類・詳細・発生頻度を入力してから送信できるようになる（任意）。")]
        [SerializeField] private GlankReportPromptUI promptUI;

        /// <summary>
        /// 直近の録画クリップのファイルパスを非同期に返す関数（優先度最高）。
        /// <see cref="InstantReplayVideoRecorder.GetLatestClipPathAsync"/> のように、リングバッファから
        /// その場でmp4を書き出すような、完了までフレームをまたぐ処理を差し込む場合に使う。
        /// </summary>
        public Func<Task<string>> GetLatestClipPathAsync;

        /// <summary>
        /// 直近の録画クリップのファイルパスを返す関数（同期版）。<see cref="GetLatestClipPathAsync"/>が
        /// 未設定の場合に使う。どちらも未設定なら <see cref="replayWatcher"/> を使う。
        /// </summary>
        public Func<string> GetLatestClipPath;

        /// <summary>
        /// 入力ログのキャプチャ処理を差し込んで上書きする（未設定なら<see cref="inputLogRecorder"/>を使う）。
        /// 新Input System（com.unity.inputsystem）を使うプロジェクトでは、ここに
        /// InputLogRecorderNewInputSystem.Capture を渡す。
        /// </summary>
        public Func<InputLogSnapshot> CaptureInputLog;

        // 送信中に何が起きているか画面上で分からないと、反応が無いように見えて連打され、
        // 同じ内容の報告が複数件送られてしまう（実際に起きた問題）。それを防ぐため、
        // 送信中は新規の送信を受け付けない（IsSendingガード）のに加えて、
        // 送信中/成功/失敗の3パターンだけの簡易通知を画面に出す（OnGUI。Canvas不要でどのプロジェクトでも
        // 追加設定なしに動く）。パターンを増やしすぎると逆に分かりにくくなるため、この3つに絞っている。
        private enum NotificationKind { Sending, Success, Failure }
        private bool _isSending;
        private NotificationKind _notificationKind;
        private string _notificationText;
        private float _notificationHideAtUnscaledTime = float.NegativeInfinity;

        /// <summary>送信処理の最中かどうか。連打防止のガードと同じ値をUI側からも参照できるよう公開している。</summary>
        public bool IsSending => _isSending;

        private void Update()
        {
            if (!GlankInputCompat.GetKeyDown(reportHotkey)) return;

            if (promptUI != null)
            {
                promptUI.Show();
                return;
            }

            // ホットキー即送信は「クラッシュを検知した」わけではなく、プレイヤーが気づいた
            // 何らかの違和感（スタック・見た目のミス等、内容は様々）を仮タイトルのまま送るだけの
            // 経路。以前は"crash"タグ固定だったため、テクスチャ崩れやスタックまで全部
            // クラッシュ扱いで検索に埋もれてしまっていた。「即時報告」であること自体を示す
            // 専用タグにして、Web UI側でquick report経由の報告だけを絞り込めるようにする。
            SubmitReport(
                title: "(quick report)",
                tags: new[] { "quick" },
                desc: "",
                who: GlankReporterIdentity.GetReporterName(),
                build: Application.version,
                platform: GlankPlayerPlatform.GetPlatform(),
                priority: "medium");
        }

        public void SubmitReport(string title, string[] tags, string desc, string who, string build, string platform, string priority)
        {
            if (_isSending)
            {
                // 連打対策: 前の送信がまだ終わっていない間は新しい送信を受け付けない
                // （受け付けてしまうと、同じ内容の報告が複数件生成されてしまう）。
                // 「無視された」ことが分かるよう、送信中通知を出し直して気付けるようにする。
                ShowNotification(NotificationKind.Sending, "送信中です。しばらくお待ちください…", 2f);
                return;
            }

            if (config == null || (inputLogRecorder == null && CaptureInputLog == null))
            {
                Debug.LogError("[Glank] config / inputLogRecorder（またはCaptureInputLog）が設定されていません。");
                return;
            }

            // projectId未設定（0）のまま送信すると、サーバー側に存在しないプロジェクトへの報告や、
            // 意図しない他プロジェクトへの誤爆になりかねない。配布用プレハブ（GlankManager.prefab）は
            // apiKey/projectIdが空のプレースホルダーGlankSettingsを参照しているため、導入しただけで
            // 中身を設定し忘れた場合にここで気付けるようにする。
            if (config.projectId <= 0)
            {
                Debug.LogError(
                    "[Glank] GlankSettings.projectIdが未設定です（0のまま）。報告を送信しませんでした。" +
                    "Setup Wizard（Tools > Glank > Setup Wizard）を実行するか、GlankSettingsアセットに" +
                    "Web側のプロジェクト画面で確認できるプロジェクトIDを入力してください。" +
                    "GlankManagerプレハブをそのまま導入した場合、参照先はAPIキー・プロジェクトID未設定の" +
                    "プレースホルダーです。"
                );
                return;
            }

            // 入力ログはトリガーの瞬間（この時点）でキャプチャする。動画の書き出し待ち（非同期の場合）の間に
            // リングバッファが進んでしまい、動画と噛み合わなくなるのを防ぐため。
            var snapshot = CaptureInputLog != null ? CaptureInputLog.Invoke() : inputLogRecorder.Capture();
            var metadata = new ReportMetadata
            {
                projectId = config.projectId,
                title = title,
                tags = tags,
                desc = desc,
                who = who,
                build = build,
                platform = platform,
                priority = priority,
                fps = snapshot.fps,
                durationFrames = snapshot.durationFrames,
                inputs = snapshot.inputs,
            };

            _isSending = true;
            ShowNotification(NotificationKind.Sending, "報告を送信中…", 30f); // 完了/失敗時に上書きされる想定の暫定値
            StartCoroutine(SubmitReportCoroutine(metadata));
        }

        private IEnumerator SubmitReportCoroutine(ReportMetadata metadata)
        {
            string videoPath = null;

            if (GetLatestClipPathAsync != null)
            {
                var task = GetLatestClipPathAsync.Invoke();
                while (!task.IsCompleted) yield return null;

                if (task.IsFaulted)
                {
                    Debug.LogError($"[Glank] 動画の書き出しに失敗しました: {task.Exception?.GetBaseException().Message}");
                    _isSending = false;
                    ShowNotification(NotificationKind.Failure, "送信失敗: 動画の書き出しに失敗しました", 5f);
                    yield break;
                }
                videoPath = task.Result;
                // GetLatestClipPathAsyncはトリガーと同じタイミングで動画を書き出す方式
                // （InstantReplayVideoRecorder等）を想定しているため、入力ログと対応している。
                metadata.inputLogVideoSynced = true;
            }
            else if (GetLatestClipPath != null)
            {
                videoPath = GetLatestClipPath.Invoke();
                metadata.inputLogVideoSynced = true;
            }
            else
            {
                // ReplayFolderWatcherはOS側で独立に録画されたファイルを検出するだけなので、
                // 動画の終端（OSの録画停止タイミング）と入力ログの終端（ホットキーを押した
                // タイミング）が別々に決まる。フレーム単位で対応しているとは限らないため、
                // Web UI側にその旨を伝える。
                videoPath = replayWatcher.FindLatestClip();
                metadata.inputLogVideoSynced = false;
            }

            if (string.IsNullOrEmpty(videoPath))
            {
                Debug.LogWarning(
                    "[Glank] 録画ファイルが見つかりません。OSのインスタントリプレイ機能（Xbox Game Bar等）で" +
                    "直近の録画を保存してから再度お試しください。送信を中止しました。"
                );
                _isSending = false;
                ShowNotification(NotificationKind.Failure, "送信失敗: 録画ファイルが見つかりません", 5f);
                yield break;
            }

            yield return GlankClient.SubmitReport(config, metadata, videoPath, (outcome, message) =>
            {
                _isSending = false;
                switch (outcome)
                {
                    case GlankSubmitOutcome.Success:
                        Debug.Log($"[Glank] report submitted: {message}");
                        ShowNotification(NotificationKind.Success, "報告を送信しました", 3f);
                        break;
                    case GlankSubmitOutcome.RetryableFailure when offlineQueue != null:
                        // ネットワーク断・サーバー一時停止等。オフラインキューに退避して後で再送する。
                        offlineQueue.Enqueue(metadata, videoPath);
                        ShowNotification(NotificationKind.Failure, "送信できませんでした（自動で再送します）", 5f);
                        break;
                    default:
                        Debug.LogError($"[Glank] report submission failed: {message}");
                        ShowNotification(NotificationKind.Failure, "送信に失敗しました（詳細はConsole参照）", 5f);
                        break;
                }
            });
        }

        private void ShowNotification(NotificationKind kind, string text, float durationSeconds)
        {
            _notificationKind = kind;
            _notificationText = text;
            _notificationHideAtUnscaledTime = Time.unscaledTime + durationSeconds;
        }

        /// <summary>
        /// 送信中/成功/失敗の状態を画面右上に簡易表示する。Canvasを組む手間を無くすため、
        /// あえてUnityEngine.UIではなくOnGUI（IMGUI）を使っている
        /// （GlankReportPromptUIのような凝ったUIが要る機能ではないため）。
        /// </summary>
        private void OnGUI()
        {
            if (Time.unscaledTime >= _notificationHideAtUnscaledTime) return;

            Color boxColor = _notificationKind switch
            {
                NotificationKind.Sending => new Color(0.25f, 0.45f, 0.85f, 0.9f),
                NotificationKind.Success => new Color(0.20f, 0.6f, 0.3f, 0.9f),
                _ => new Color(0.75f, 0.2f, 0.2f, 0.9f),
            };

            const float width = 320f;
            const float height = 40f;
            const float margin = 16f;
            var rect = new Rect(Screen.width - width - margin, margin, width, height);

            var prevColor = GUI.color;
            GUI.color = boxColor;
            GUI.Box(rect, GUIContent.none);
            GUI.color = Color.white;
            GUI.Label(rect, _notificationText, new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 14,
            });
            GUI.color = prevColor;
        }
    }
}

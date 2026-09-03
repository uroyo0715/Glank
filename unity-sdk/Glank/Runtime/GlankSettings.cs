using UnityEngine;

namespace Glank
{
    /// <summary>
    /// Glank APIサーバーへの接続設定。docs/api-spec.md の Base URL / X-Glank-Key に対応する。
    /// BugReportTrigger・CrashDetector・FreezeWatchdog・GlankOfflineQueue はすべてこの1つの
    /// アセットを共有する（Setup Wizardを使えば自動生成・自動配線される）。
    /// </summary>
    [CreateAssetMenu(fileName = "GlankSettings", menuName = "Glank/Settings")]
    public class GlankSettings : ScriptableObject
    {
        [Tooltip("例: http://localhost:8787/api/v1 （末尾に /reports は付けない）")]
        public string baseUrl = "http://localhost:8787/api/v1";

        [Tooltip("POST /reports に付与する X-Glank-Key ヘッダー。サーバー側で GLANK_API_KEY が未設定なら空でよい")]
        public string apiKey = "";

        [Tooltip("報告先のGlankプロジェクトID。Web側のプロジェクト画面で確認できる。" +
            "0は未設定を意味し、その状態ではBugReportTriggerは送信を行わずエラーログを出す " +
            "（配布用プレハブが参照するプレースホルダーの既定値もこれ）")]
        public int projectId;

        [Header("自動検知(任意)")]
        [Tooltip("CrashDetector/FreezeWatchdogによるクラッシュ・フリーズの自動検知/自動報告を有効にする。" +
            "既定でfalse。配布ビルドに含める場合、意図せず大量の自動報告が飛ぶのを防ぐため、" +
            "有効化する前に自動検知の挙動を十分確認すること。")]
        public bool autoDetectionEnabled = false;
    }
}

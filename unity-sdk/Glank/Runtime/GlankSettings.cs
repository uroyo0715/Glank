using UnityEngine;

namespace Glank
{
    /// <summary>
    /// Glank APIサーバーへの接続設定。docs/api-spec.md の バックエンドURL / X-Glank-Key に対応する。
    /// BugReportTrigger・CrashDetector・FreezeWatchdog・GlankOfflineQueue はすべてこの1つの
    /// アセットを共有する（Setup Wizardを使えば自動生成・自動配線される）。
    /// </summary>
    [CreateAssetMenu(fileName = "GlankSettings", menuName = "Glank/Settings")]
    public class GlankSettings : ScriptableObject
    {
        // フィールド名自体（baseUrl）は既存の保存済みアセットとの互換性のため変更していない
        // （変えるとInspectorの表示名だけでなく、シリアライズされた値の対応付けも壊れる）。
        // Inspector上の見た目のラベルだけ[InspectorName]で分かりやすい名前に変えている。
        [InspectorName("バックエンドURL")]
        [Tooltip("Glank APIサーバー（バックエンド）のURL（末尾に /reports は付けない）。" +
            "フロントエンド（Webアプリの見た目のURL）とは別物で、フロントエンドのドメインを" +
            "変更してもこの値の変更は不要。既定値は本番バックエンドのURLなので、自前で別環境" +
            "（ステージング・自前デプロイ等）を使う場合以外は変更不要")]
        public string baseUrl = "https://glank.onrender.com/api/v1";

        [Tooltip("POST /reports に付与する X-Glank-Key ヘッダー。プロジェクトごとに発行される値で、" +
            "Webアプリのプロジェクトカードの「APIキーを表示」から確認できる")]
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

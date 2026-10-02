using UnityEngine;

namespace Glank
{
    /// <summary>
    /// 報告の<c>platform</c>欄に使うプラットフォーム名の保存・取得。
    ///
    /// <see cref="Application.platform"/>は"WindowsEditor"や"PS5"のようなUnity内部の値になり、
    /// Web側のプラットフォーム選択肢（PC/PlayStation/Switch/Switch2/Xbox/iOS/Android）と
    /// 表記が揃わない・実機とエディタで値が変わる等の問題があるため、
    /// <see cref="GlankReporterNamePrompt"/>から明示的に選んでもらう方式にしている。
    ///
    /// <see cref="PlayerPrefs"/>に保存するため、ゲームを再起動しても一度選んだ値は保持される。
    /// 一度も選んでいない間は<see cref="Application.platform"/>にフォールバックするため、
    /// この機能を使わないプロジェクトの挙動は変わらない。
    /// </summary>
    public static class GlankPlayerPlatform
    {
        private const string PrefsKey = "Glank.Platform";

        /// <summary>Web側のプラットフォーム選択肢（PLATFORM_OPTIONS）と揃えている。</summary>
        public static readonly string[] Options =
        {
            "PC", "PlayStation", "Switch", "Switch2", "Xbox", "iOS", "Android",
        };

        /// <summary>現在のプラットフォーム名。未選択なら<see cref="Application.platform"/>を返す。</summary>
        public static string GetPlatform()
        {
            string stored = PlayerPrefs.GetString(PrefsKey, "");
            return string.IsNullOrWhiteSpace(stored) ? Application.platform.ToString() : stored;
        }

        /// <summary>プラットフォームを設定して保存する。空文字/nullを渡すと未選択状態に戻る。</summary>
        public static void SetPlatform(string platform)
        {
            PlayerPrefs.SetString(PrefsKey, platform ?? "");
            PlayerPrefs.Save();
        }

        /// <summary>ユーザーが明示的にプラットフォームを選択済みかどうか。</summary>
        public static bool HasPlatform()
        {
            return !string.IsNullOrWhiteSpace(PlayerPrefs.GetString(PrefsKey, ""));
        }
    }
}

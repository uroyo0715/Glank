using System.IO;
using UnityEditor;
using UnityEngine;

namespace Glank.Editor
{
    /// <summary>
    /// SDK同梱の配布用プレハブ（&lt;パッケージルート&gt;/Runtime/Prefabs/GlankManager.prefab）を
    /// 再生成する。GlankSetupUtility.CreateGlankManagerと全く同じ配線ロジックを使うため、
    /// ウィザードで生成したGlankManagerと構成が食い違うことはない。
    ///
    /// SDK利用者向けの機能ではなく、SDK自体（コンポーネント構成や配線ロジック）を変更した際に、
    /// 同梱プレハブへ変更を反映するためのメンテナンス用メニュー。プレハブの参照・GUIDはUnity
    /// Editor上でしか正しく生成できないため、このメニューを実際にUnity Editorで一度実行し、
    /// 生成された.prefab/.assetファイル（と対応する.metaファイル）をリポジトリにコミットする必要がある。
    ///
    /// 重要: プレハブが参照するGlankSettings（<see cref="PlaceholderSettingsFileName"/>）は、
    /// 実行するたびにapiKey/projectIdを必ず空にリセットする。動作確認等で実際のAPIキーを
    /// 入力したGlankSettingsアセットを誤ってプレハブに紐付けたまま配布してしまう事故を防ぐため、
    /// 「既存のアセットがあれば使い回す」ことは絶対にしない。
    /// </summary>
    internal static class GlankPrefabGenerator
    {
        private const string PrefabFileName = "GlankManager.prefab";

        // ファイル名だけで「これはプレースホルダーであって実運用の設定ではない」と分かるようにする。
        private const string PlaceholderSettingsFileName = "GlankSettings_PLACEHOLDER_DO_NOT_FILL_IN.asset";

        [MenuItem("Tools/Glank/SDK開発者向け/配布用GlankManagerプレハブを再生成")]
        private static void Regenerate()
        {
            string runtimeFolder;
            try
            {
                runtimeFolder = ResolveRuntimeFolder();
            }
            catch (System.Exception e)
            {
                EditorUtility.DisplayDialog("Glank", $"Runtimeフォルダの特定に失敗しました: {e.Message}", "OK");
                return;
            }

            string prefabFolder = runtimeFolder + "/Prefabs";
            string prefabPath = prefabFolder + "/" + PrefabFileName;
            string placeholderSettingsPath = prefabFolder + "/" + PlaceholderSettingsFileName;
            Debug.Log($"[Glank] 解決したRuntimeフォルダ: {runtimeFolder}");

            if (!EditorUtility.DisplayDialog(
                "Glank",
                $"{prefabPath} を再生成します。\n\n" +
                "これはSDK利用者向けの機能ではなく、SDK自体のコンポーネント構成・配線ロジックを" +
                "変更した開発者が、同梱の配布用プレハブへ変更を反映するためのものです。\n\n" +
                "プレハブが参照するGlankSettingsは、このメニューを実行するたびに必ず空（プレースホルダー）に" +
                "リセットされます。動作確認用に実際のAPIキーを入力した別のGlankSettingsを使っていた場合でも、" +
                "配布物には影響しません。続行しますか？",
                "実行", "キャンセル"))
            {
                return;
            }

            if (!AssetDatabase.IsValidFolder(prefabFolder) && !EnsureFolderExists(prefabFolder))
            {
                EditorUtility.DisplayDialog("Glank", $"{prefabFolder} の作成に失敗しました。", "OK");
                return;
            }

            var placeholder = CreateOrResetPlaceholder(placeholderSettingsPath);

            var go = GlankSetupUtility.CreateGlankManager(placeholder);
            try
            {
                PrefabUtility.SaveAsPrefabAsset(go, prefabPath);
                AssetDatabase.SaveAssets();
                EditorUtility.DisplayDialog(
                    "Glank",
                    $"{prefabPath} を再生成しました。\n" +
                    $"参照先の{placeholderSettingsPath}はapiKey/projectIdともに空の状態です。\n\n" +
                    "このプレハブをそのままドラッグ&ドロップしただけでは動作しません" +
                    "（BugReportTriggerがprojectId未設定を検知してエラーログを出し、送信を中止します）。" +
                    "利用者は参照先のGlankSettingsに自分のAPIキー・プロジェクトIDを入力する必要があります。",
                    "OK");
            }
            finally
            {
                Object.DestroyImmediate(go);
            }
        }

        /// <summary>
        /// このスクリプトが属するGlank.RuntimeパッケージのRuntimeフォルダを、AssetDatabase上の
        /// 仮想パスとして解決する。package.jsonのname（com.glank.sdk）を使ったUPMパッケージとして
        /// 導入されている場合、Unity上の仮想パスは実際のフォルダ名（Packages/Glank/...）ではなく
        /// Packages/com.glank.sdk/...になる（プロジェクトによってフォルダ名が異なりうる）ため、
        /// 決め打ちせずPackageInfoから動的に解決する。
        /// </summary>
        private static string ResolveRuntimeFolder()
        {
            var packageInfo = UnityEditor.PackageManager.PackageInfo.FindForAssembly(typeof(GlankSettings).Assembly);
            if (packageInfo != null)
            {
                return packageInfo.assetPath + "/Runtime";
            }

            // フォールバック: PackageInfoで解決できない場合（UPMパッケージとして認識されていない
            // 単なるAssetsフォルダ配置等）、GlankSettings.cs自身のAssetDatabase上の実パスから逆算する。
            const string scriptFileName = "GlankSettings.cs";
            foreach (var guid in AssetDatabase.FindAssets("GlankSettings t:MonoScript"))
            {
                var path = AssetDatabase.GUIDToAssetPath(guid);
                if (path.EndsWith("/" + scriptFileName))
                {
                    return path.Substring(0, path.Length - scriptFileName.Length - 1);
                }
            }

            throw new System.InvalidOperationException("GlankSettings.csの場所を特定できませんでした。");
        }

        /// <summary>
        /// 仮想パス（例: "Packages/Glank/Runtime/Prefabs"）のフォルダを作成する。
        /// <see cref="AssetDatabase.CreateFolder"/>はUPM組み込みパッケージ配下では期待通りに
        /// フォルダを作成できないことがある（Unityバージョン・パッケージ種別依存の既知の癖）ため、
        /// embedded/localパッケージであれば仮想パス＝プロジェクトルートからの相対物理パスと
        /// 一致することを利用して、直接ディレクトリを作成してから<see cref="AssetDatabase.Refresh"/>で
        /// 取り込む方式にフォールバックする。
        /// </summary>
        private static bool EnsureFolderExists(string virtualFolderPath)
        {
            var folderGuid = AssetDatabase.CreateFolder(
                virtualFolderPath.Substring(0, virtualFolderPath.LastIndexOf('/')),
                virtualFolderPath.Substring(virtualFolderPath.LastIndexOf('/') + 1));
            if (!string.IsNullOrEmpty(folderGuid) && AssetDatabase.IsValidFolder(virtualFolderPath))
            {
                return true;
            }

            Debug.LogWarning($"[Glank] AssetDatabase.CreateFolderで{virtualFolderPath}を作成できなかったため、" +
                "物理フォルダを直接作成してAssetDatabase.Refresh()で取り込みます。");

            var projectRootInfo = Directory.GetParent(Application.dataPath);
            if (projectRootInfo == null)
            {
                Debug.LogError("[Glank] プロジェクトルートの特定に失敗しました。");
                return false;
            }
            string physicalPath = Path.Combine(projectRootInfo.FullName, virtualFolderPath.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(physicalPath);
            AssetDatabase.Refresh();

            return AssetDatabase.IsValidFolder(virtualFolderPath);
        }

        /// <summary>
        /// プレースホルダー用GlankSettingsを、既存アセットの中身に関わらず必ず空の状態にして返す。
        /// 「既にあるものを使い回す」実装にしてしまうと、動作確認で誰かが実際の値を書き込んだ
        /// アセットをそのまま配布してしまう事故があり得るため、毎回明示的にリセットする。
        /// </summary>
        private static GlankSettings CreateOrResetPlaceholder(string placeholderSettingsPath)
        {
            var placeholder = AssetDatabase.LoadAssetAtPath<GlankSettings>(placeholderSettingsPath);
            if (placeholder == null)
            {
                placeholder = ScriptableObject.CreateInstance<GlankSettings>();
                AssetDatabase.CreateAsset(placeholder, placeholderSettingsPath);
            }

            placeholder.baseUrl = "http://localhost:8787/api/v1";
            placeholder.apiKey = "";
            placeholder.projectId = 0;
            placeholder.autoDetectionEnabled = false;
            EditorUtility.SetDirty(placeholder);
            AssetDatabase.SaveAssets();

            // 上記の代入自体がバグっていた場合に配布物へ実値が紛れ込むことがないよう、
            // 保存前の最終防衛ラインとして明示的に検証する。
            if (!string.IsNullOrEmpty(placeholder.apiKey) || placeholder.projectId != 0)
            {
                Debug.LogError("[Glank] プレースホルダーGlankSettingsのリセットに失敗しました。プレハブの再生成を中止してください。");
            }

            return placeholder;
        }
    }
}

using UnityEditor;
using UnityEngine;

namespace Glank.Editor
{
    /// <summary>
    /// GlankSettingsアセットの生成・GlankManager GameObjectの生成と配線ロジック。
    /// <see cref="GlankSetupWizard"/>（Tools &gt; Glank &gt; Setup Wizard）と、
    /// 配布用プレハブの再生成メニューの両方から共通で使う。
    /// </summary>
    internal static class GlankSetupUtility
    {
        private const string DefaultSettingsFolder = "Assets/Glank";
        private const string DefaultSettingsAssetName = "GlankSettings.asset";

        /// <summary>
        /// プロジェクト内に既存のGlankSettingsがあればそれを更新し、無ければ
        /// <see cref="DefaultSettingsFolder"/> に新規作成する。
        /// </summary>
        public static GlankSettings CreateOrUpdateSettings(string baseUrl, string apiKey, int projectId)
        {
            GlankSettings settings = FindExistingSettings();

            if (settings == null)
            {
                settings = ScriptableObject.CreateInstance<GlankSettings>();
                if (!AssetDatabase.IsValidFolder(DefaultSettingsFolder))
                {
                    AssetDatabase.CreateFolder("Assets", "Glank");
                }
                var path = AssetDatabase.GenerateUniqueAssetPath($"{DefaultSettingsFolder}/{DefaultSettingsAssetName}");
                AssetDatabase.CreateAsset(settings, path);
            }

            Undo.RecordObject(settings, "Update Glank Settings");
            settings.baseUrl = baseUrl;
            settings.apiKey = apiKey;
            settings.projectId = projectId;
            EditorUtility.SetDirty(settings);
            AssetDatabase.SaveAssets();
            return settings;
        }

        public static GlankSettings FindExistingSettings()
        {
            var guids = AssetDatabase.FindAssets("t:GlankSettings");
            if (guids.Length == 0) return null;
            var path = AssetDatabase.GUIDToAssetPath(guids[0]);
            return AssetDatabase.LoadAssetAtPath<GlankSettings>(path);
        }

        /// <summary>
        /// BugReportTrigger・InputLogRecorder(またはNewInputSystem版)・CrashDetector・
        /// FreezeWatchdogが配線済みの"GlankManager" GameObjectを生成する。
        /// <paramref name="settings"/>にnullを渡すと配線先のGlankSettingsは未設定のまま作る
        /// （配布用プレハブ生成時など、あとから利用者側でアサインしてもらう場合に使う）。
        /// </summary>
        public static GameObject CreateGlankManager(GlankSettings settings)
        {
            var go = new GameObject("GlankManager");
            Undo.RegisterCreatedObjectUndo(go, "Create GlankManager");

            var trigger = Undo.AddComponent<BugReportTrigger>(go);
            SetField(trigger, "config", settings);

#if ENABLE_INPUT_SYSTEM
            // 新Input Systemを検出したプロジェクトでは、レガシーInputLogRecorderの代わりに
            // NewInputSystem版 + 橋渡し役のGlankNewInputSystemBridgeを使う
            // （BugReportTrigger.inputLogRecorderは型がInputLogRecorder固定のため、
            // NewInputSystem版はデリゲート経由でしか配線できないことによる）。
            var newRecorder = Undo.AddComponent<InputLogRecorderNewInputSystem>(go);
            var bridge = Undo.AddComponent<GlankNewInputSystemBridge>(go);
            SetField(bridge, "inputLogRecorder", newRecorder);
#else
            var recorder = Undo.AddComponent<InputLogRecorder>(go);
            SetField(trigger, "inputLogRecorder", recorder);
#endif

            var crashDetector = Undo.AddComponent<CrashDetector>(go);
            SetField(crashDetector, "config", settings);
            SetField(crashDetector, "trigger", trigger);

            var freezeWatchdog = Undo.AddComponent<FreezeWatchdog>(go);
            SetField(freezeWatchdog, "config", settings);
            SetField(freezeWatchdog, "trigger", trigger);

#if GLANK_INSTANT_REPLAY
            // GLANK_INSTANT_REPLAY導入済みのプロジェクトでは、ReplayFolderWatcherフォールバックより
            // 優先してInstantReplayVideoRecorderを使う（詳細はREADME「動画録画について」参照）。
            var instantReplay = Undo.AddComponent<InstantReplayVideoRecorder>(go);
            var replayBridge = Undo.AddComponent<GlankInstantReplayBridge>(go);
            SetField(replayBridge, "recorder", instantReplay);
#endif

            var offlineQueue = Undo.AddComponent<GlankOfflineQueue>(go);
            SetField(offlineQueue, "config", settings);
            SetField(trigger, "offlineQueue", offlineQueue);

            return go;
        }

        private static void SetField(Object target, string fieldName, Object value)
        {
            var so = new SerializedObject(target);
            var prop = so.FindProperty(fieldName);
            if (prop == null)
            {
                Debug.LogError($"[Glank] {target.GetType().Name}にフィールド'{fieldName}'が見つかりませんでした。" +
                    "SDK側のリファクタリングでフィールド名が変わった可能性があります。");
                return;
            }
            prop.objectReferenceValue = value;
            so.ApplyModifiedProperties();
        }
    }
}

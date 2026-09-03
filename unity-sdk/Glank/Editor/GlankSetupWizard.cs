using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace Glank.Editor
{
    /// <summary>
    /// Tools &gt; Glank &gt; Setup Wizard。APIキー・プロジェクトIDを入力して「セットアップ」を押すと、
    /// GlankSettingsアセットの生成と、配線済みの"GlankManager"のシーンへの配置を自動で行う。
    /// 新Input Systemを使っているかどうかの判定は、GlankSetupUtility側の
    /// <c>#if ENABLE_INPUT_SYSTEM</c>（プロジェクト全体に自動設定されるスクリプティング定義）で行う。
    /// </summary>
    public class GlankSetupWizard : EditorWindow
    {
        private string _baseUrl = "http://localhost:8787/api/v1";
        private string _apiKey = "";
        private int _projectId;

        [MenuItem("Tools/Glank/Setup Wizard")]
        private static void Open()
        {
            var window = GetWindow<GlankSetupWizard>(true, "Glank Setup Wizard");
            window.minSize = new Vector2(440, 260);

            var existing = GlankSetupUtility.FindExistingSettings();
            if (existing != null)
            {
                window._baseUrl = existing.baseUrl;
                window._apiKey = existing.apiKey;
                window._projectId = existing.projectId;
            }
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(8);
            EditorGUILayout.LabelField("Glank セットアップ", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "APIキーとプロジェクトIDを入力して「セットアップ」を押すと、GlankSettingsアセットの生成と、" +
                "必要なコンポーネント一式が配線されたGlankManagerのシーンへの配置を自動で行います。" +
                "既にGlankSettingsが存在する場合は、それを更新します。",
                MessageType.Info);

            EditorGUILayout.Space(12);
            _baseUrl = EditorGUILayout.TextField(
                new GUIContent("Base URL", "Glank APIサーバーのURL（末尾に/reportsは付けない）"), _baseUrl);
            _apiKey = EditorGUILayout.TextField(
                new GUIContent("API Key", "POST /reportsに付与するX-Glank-Keyヘッダー。サーバー側でGLANK_API_KEYが未設定なら空でよい"),
                _apiKey);
            _projectId = EditorGUILayout.IntField(
                new GUIContent("Project ID", "報告先のGlankプロジェクトID。Web側のプロジェクト画面で確認できる"), _projectId);

            EditorGUILayout.Space(8);
#if ENABLE_INPUT_SYSTEM
            EditorGUILayout.HelpBox(
                "新Input System（com.unity.inputsystem）を検出しました。InputLogRecorderNewInputSystemを使用します。",
                MessageType.None);
#else
            EditorGUILayout.HelpBox("レガシーInputを使用します（InputLogRecorder）。", MessageType.None);
#endif
#if GLANK_INSTANT_REPLAY
            EditorGUILayout.HelpBox(
                "GLANK_INSTANT_REPLAYを検出しました。InstantReplayVideoRecorderも合わせて配線します。",
                MessageType.None);
#endif

            EditorGUILayout.Space(12);
            if (_projectId <= 0)
            {
                EditorGUILayout.HelpBox("Project IDを1以上で入力してください。", MessageType.Warning);
            }

            using (new EditorGUI.DisabledScope(_projectId <= 0))
            {
                if (GUILayout.Button("セットアップ", GUILayout.Height(32)))
                {
                    RunSetup();
                }
            }
        }

        private void RunSetup()
        {
            var settings = GlankSetupUtility.CreateOrUpdateSettings(_baseUrl, _apiKey, _projectId);
            var manager = GlankSetupUtility.CreateGlankManager(settings);
            EditorSceneManager.MarkSceneDirty(manager.scene);
            Selection.activeGameObject = manager;

            EditorUtility.DisplayDialog(
                "Glank",
                "セットアップが完了しました。GlankManagerをシーンに追加しました。\n" +
                "シーンを保存するのを忘れないでください。",
                "OK");
            Close();
        }
    }
}
